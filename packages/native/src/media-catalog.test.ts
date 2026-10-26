import {
  cleanup,
  render,
  screen,
  userEvent,
  fireEvent,
  settle,
  waitFor,
} from '@ng-native/testing';
import { afterEach, expect, test, vi } from 'vitest';
import { SafeArea } from '@ng-native/device';
import { NeuCarouselComponent } from './carousel/carousel.ts';
import { NeuGalleryComponent } from './gallery/gallery.ts';
import { NeuImageViewerComponent } from './image-viewer/image-viewer.ts';
import { NeuUploaderComponent } from './uploader/uploader.ts';
import { NEU_FILE_PICKER, type NeuFile } from './foundation/file-picker.ts';
import { NEU_LIGHT_TOKENS } from './foundation/index.ts';
import { neuTonePalette } from './foundation/tone.ts';
afterEach(cleanup);
const images = [
  { id: 'one', label: 'First photo', uri: 'file:///first.jpg' },
  { id: 'two', label: 'Second photo', uri: 'file:///second.jpg' },
];
const press = async (name: string) =>
  userEvent.setup().press(screen.getByRole('button', { name }));
const file = {
  uri: 'file:///report.pdf',
  name: 'report.pdf',
  size: 20,
  mimeType: 'application/pdf',
};
test('carousel moves between images, clamps and optionally wraps', async () => {
  const r = await render(NeuCarouselComponent, { inputs: { items: images } });
  await press('Next image');
  expect(r.instance.index()).toBe(1);
  await press('Next image');
  expect(r.instance.index()).toBe(1);
  await r.rerender({ inputs: { loop: true } });
  await press('Next image');
  expect(r.instance.index()).toBe(0);
  await press('Previous image');
  expect(r.instance.index()).toBe(1);
});
test('gallery opens the selected image and the native viewer closes', async () => {
  const r = await render(NeuGalleryComponent, { inputs: { items: images } });
  await press('Second photo');
  expect(r.instance.index()).toBe(1);
  expect(r.instance.open()).toBe(true);
  await press('Close viewer');
  expect(r.instance.open()).toBe(false);
});
test('gallery reflows grid and mosaic columns while opening the original item index', async () => {
  const photos = Array.from({ length: 7 }, (_, i) => ({ id: `photo-${i}`, label: `Photo ${i + 1}`, uri: `file:///photo-${i}.png` }));
  const r = await render(NeuGalleryComponent, { inputs: { items: photos, columns: 3 } });
  const firstTile = () => screen.getByRole('button', { name: 'Photo 1', exact: true });
  let gallery = firstTile().parent!.parent!;
  expect(gallery.children).toHaveLength(3);
  expect(gallery.children[0]!.children).toHaveLength(3);
  // The last grid row retains two blank cells instead of stretching its photo.
  expect(gallery.children[2]!.children).toHaveLength(3);
  await r.rerender({ inputs: { layout: 'mosaic', showCaptions: false } });
  gallery = firstTile().parent!.parent!;
  expect(gallery.children).toHaveLength(3);
  expect(gallery.children.map(column => column.children.length)).toEqual([3, 2, 2]);
  await press('Photo 6');
  expect(r.instance.index()).toBe(5);
  expect(screen.getByRole('image', { name: 'Photo 6', exact: true })).toBeTruthy();
  await press('Close viewer');
  gallery = firstTile().parent!.parent!;
  await fireEvent(gallery.parent!, 'layout', { layout: { width: 100, height: 600, x: 0, y: 0 } });
  expect(firstTile().parent!.parent!.children).toHaveLength(1);
  await fireEvent(firstTile().parent!.parent!.parent!, 'layout', { layout: { width: 400, height: 600, x: 0, y: 0 } });
  expect(firstTile().parent!.parent!.children).toHaveLength(3);
  await press('Photo 7');
  expect(r.instance.index()).toBe(6);
});

test('gallery normalizes invalid layout sizes and keeps an empty message without cells', async () => {
  const r = await render(NeuGalleryComponent, { inputs: { items: [], columns: Number.NaN, gap: -1, aspectRatio: 0, borderRadius: -3, layout: 'mosaic' } });
  expect(screen.getByText('No images')).toBeTruthy();
  expect(screen.queryAllByRole('button')).toHaveLength(0);
  await r.rerender({ inputs: { items: images, layout: 'grid' } });
  expect(screen.queryByText('No images')).toBeNull();
  await press('Second photo');
  expect(r.instance.index()).toBe(1);
});
test('image viewer changes images, increases zoom and reports load failures', async () => {
  const r = await render(NeuImageViewerComponent, {
    inputs: { items: images, open: true },
  });
  const surface = screen.getByRole('image', { name: 'First photo' }).parent
    ?.parent;
  expect(surface?.props).toMatchObject({
    maxHeight: '100%',
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  });
  const provider = surface?.parent;
  expect(provider?.viewName).toBe('RNCSafeAreaProvider');
  const appArea = r.componentRef.injector.get(SafeArea);
  const insets = appArea.insets();
  await fireEvent(provider!, 'insetsChange', {
    insets: { top: 62, right: 0, bottom: 34, left: 0 },
    frame: { x: 0, y: 0, width: 393, height: 852 },
  });
  expect(appArea.insets()).toEqual(insets);
  await press('Zoom in');
  await vi.waitFor(() => expect(screen.getByRole('image', { name: 'First photo' }).props['transform']).toEqual([{ scale: 2 }]));
  const image = screen.getByRole('image', { name: 'First photo' });
  await fireEvent(image, 'error', { error: 'Missing' });
  expect(screen.getByText('Image could not be loaded')).toBeTruthy();
  await press('Next image');
  expect(r.instance.index()).toBe(1);
  expect(screen.queryByText('Image could not be loaded')).toBeNull();
  expect(
    screen.getByRole('image', { name: 'Second photo' }).props['transform'],
  ).toEqual([{ scale: 1 }]);
});
test('uploader cancellation leaves selection untouched', async () => {
  const picker = { pick: vi.fn(async () => null) };
  const cb = vi.fn();
  const r = await render(NeuUploaderComponent, {
    providers: [{ provide: NEU_FILE_PICKER, useValue: picker }],
    on: { selected: cb },
  });
  await press('Choose files');
  await settle();
  expect(picker.pick).toHaveBeenCalledWith({ type: ['*/*'], multiple: true });
  expect(r.instance.files()).toEqual([]);
  expect(cb).not.toHaveBeenCalled();
});
test('uploader opens only one pending picker and recovers after an opening failure', async () => {
  let reject!: (reason: Error) => void;
  const picker = {
    pick: vi
      .fn()
      .mockImplementationOnce(
        () =>
          new Promise((_resolve, fail) => {
            reject = fail;
          }),
      )
      .mockResolvedValueOnce([file]),
  };
  const r = await render(NeuUploaderComponent, {
    providers: [{ provide: NEU_FILE_PICKER, useValue: picker }],
  });
  await press('Choose files');
  await press('Choose files');
  expect(picker.pick).toHaveBeenCalledTimes(1);
  expect(
    screen.getByRole('button', { name: 'Choose files' }).props
      .accessibilityState,
  ).toMatchObject({ busy: true });
  reject(new Error('Picker unavailable'));
  await waitFor(() =>
    expect(screen.getByText('Picker unavailable')).toBeTruthy(),
  );
  expect(
    screen.getByRole('button', { name: 'Choose files' }).props
      .accessibilityState,
  ).toMatchObject({ busy: false });
  await press('Choose files');
  await settle();
  expect(picker.pick).toHaveBeenCalledTimes(2);
  expect(r.instance.files()[0]?.file).toEqual(file);
});
test('uploader ignores results if disabled while the picker is open and can reopen later', async () => {
  let finish!: (files: readonly NeuFile[]) => void;
  const picker = {
    pick: vi
      .fn()
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            finish = resolve;
          }),
      )
      .mockResolvedValueOnce([file]),
  };
  const selected = vi.fn();
  const r = await render(NeuUploaderComponent, {
    providers: [{ provide: NEU_FILE_PICKER, useValue: picker }],
    on: { selected },
  });
  await press('Choose files');
  await r.rerender({ inputs: { disabled: true } });
  finish([file]);
  await settle();
  expect(r.instance.files()).toEqual([]);
  expect(selected).not.toHaveBeenCalled();
  await r.rerender({ inputs: { disabled: false } });
  await press('Choose files');
  await settle();
  expect(r.instance.files()).toHaveLength(1);
  expect(selected).toHaveBeenCalledOnce();
});
test('uploader selects cached URIs, prevents duplicates and rejects oversized files', async () => {
  const picker = {
    pick: vi.fn(async () => [
      file,
      file,
      { ...file, uri: 'file:///large.pdf', name: 'large.pdf', size: 200 },
    ]),
  };
  const cb = vi.fn();
  const r = await render(NeuUploaderComponent, {
    inputs: { maxBytes: 100 },
    providers: [{ provide: NEU_FILE_PICKER, useValue: picker }],
    on: { selected: cb },
  });
  await press('Choose files');
  await settle();
  expect(r.instance.files()).toHaveLength(1);
  expect(r.instance.files()[0]?.file.uri).toBe(file.uri);
  expect(cb.mock.calls).toEqual([[[file]]]);
  expect(screen.getByText('File rejected: large.pdf')).toBeTruthy();
});
test('uploader preserves first URI order and avoids parent-owned generated IDs', async () => {
  const second = { ...file, uri: 'file:///second.pdf', name: 'second.pdf' };
  const third = { ...file, uri: 'file:///third.pdf', name: 'third.pdf' };
  const picker = { pick: vi.fn(async () => [file, second, second, third]) };
  const selected = vi.fn();
  const r = await render(NeuUploaderComponent, {
    inputs: { files: [{ id: 'file-1', file, state: 'selected', progress: 0 }] },
    providers: [{ provide: NEU_FILE_PICKER, useValue: picker }],
    on: { selected },
  });
  await press('Choose files');
  await settle();
  expect(r.instance.files().map((item) => [item.id, item.file.uri])).toEqual([
    ['file-1', file.uri],
    ['file-2', second.uri],
    ['file-3', third.uri],
  ]);
  expect(selected.mock.calls).toEqual([[[second, third]]]);
});
test('uploader keeps file actions short while naming the file to assistive technology', async () => {
  const name = 'Informe de facturación con un nombre muy largo 中文 🚀.pdf';
  const r = await render(NeuUploaderComponent, {
    inputs: {
      upload: vi.fn(async () => undefined),
      files: [
        { id: 'long', file: { ...file, name }, state: 'selected', progress: 0 },
      ],
    },
  });
  expect(screen.getByText('Upload')).toBeTruthy();
  expect(screen.getByText('Remove')).toBeTruthy();
  expect(screen.getByRole('button', { name: `Upload ${name}` })).toBeTruthy();
  await press(`Remove ${name}`);
  expect(r.instance.files()).toEqual([]);
});

test.each(['selected', 'uploading', 'complete', 'error'] as const)(
  'uploader displays the consumer translation for its %s state', async state => {
    const stateLabels = { selected: 'Archivo seleccionado', uploading: 'Subiendo', complete: 'Subida completada', error: 'Error de subida' };
    await render(NeuUploaderComponent, { inputs: {
      stateLabels, files: [{ id: 'translated', file, state, progress: state === 'complete' ? 100 : 0 }],
    } });
    expect(screen.getByText(stateLabels[state])).toBeTruthy();
    expect(screen.queryByText(state)).toBeNull();
  },
);

test('uploader solid action keeps contrasting text inside its outlined file surface', async () => {
  await render(NeuUploaderComponent, {
    inputs: {
      files: [{ id: 'one', file, state: 'selected', progress: 0 }],
      upload: async () => {},
    },
  });
  expect(screen.getByText('Upload').props['color']).toBe('#ffffff');
  expect(screen.getByText('Remove').props['color']).toBe(
    neuTonePalette(NEU_LIGHT_TOKENS, 'brand').ink,
  );
});
test('uploader completes a supplied transport and reports progress', async () => {
  const cb = vi.fn();
  const upload = vi.fn(
    async (_file: NeuFile, progress: (n: number) => void) => {
      progress(125);
    },
  );
  const r = await render(NeuUploaderComponent, {
    inputs: { upload },
    providers: [
      { provide: NEU_FILE_PICKER, useValue: { pick: async () => [file] } },
    ],
    on: { completed: cb },
  });
  await press('Choose files');
  await settle();
  await press('Upload report.pdf');
  await settle();
  expect(upload).toHaveBeenCalledOnce();
  expect(r.instance.files()[0]).toMatchObject({
    state: 'complete',
    progress: 100,
  });
  expect(cb.mock.calls).toEqual([[file]]);
});
test('uploader removal aborts an upload and ignores a late completion', async () => {
  let complete!: () => void;
  let aborted: AbortSignal | undefined;
  const upload = async (
    _file: NeuFile,
    _progress: (n: number) => void,
    signal: AbortSignal,
  ) => {
    aborted = signal;
    await new Promise<void>((resolve) => {
      complete = resolve;
    });
  };
  const cb = vi.fn();
  const r = await render(NeuUploaderComponent, {
    inputs: { upload },
    providers: [
      { provide: NEU_FILE_PICKER, useValue: { pick: async () => [file] } },
    ],
    on: { completed: cb },
  });
  await press('Choose files');
  await settle();
  await press('Upload report.pdf');
  expect(r.instance.files()[0]?.state).toBe('uploading');
  await press('Remove report.pdf');
  expect(aborted?.aborted).toBe(true);
  complete();
  await settle();
  expect(r.instance.files()).toEqual([]);
  expect(cb).not.toHaveBeenCalled();
});
test('uploader ignores picker results after destruction', async () => {
  let selected!: (files: readonly NeuFile[]) => void;
  const picker = {
    pick: () =>
      new Promise<readonly NeuFile[]>((resolve) => {
        selected = resolve;
      }),
  };
  const cb = vi.fn();
  const r = await render(NeuUploaderComponent, {
    providers: [{ provide: NEU_FILE_PICKER, useValue: picker }],
    on: { selected: cb },
  });
  await press('Choose files');
  r.unmount();
  selected([file]);
  await settle();
  expect(cb).not.toHaveBeenCalled();
});
test('uploader exposes transport failure and allows a retry', async () => {
  const upload = vi
    .fn()
    .mockRejectedValueOnce(new Error('Offline'))
    .mockResolvedValueOnce(undefined);
  const r = await render(NeuUploaderComponent, {
    inputs: { upload },
    providers: [
      { provide: NEU_FILE_PICKER, useValue: { pick: async () => [file] } },
    ],
  });
  await press('Choose files');
  await settle();
  await press('Upload report.pdf');
  await settle();
  expect(r.instance.files()[0]).toMatchObject({
    state: 'error',
    error: 'Offline',
  });
  await press('Upload report.pdf');
  await settle();
  expect(r.instance.files()[0]?.state).toBe('complete');
});
test('uploader external selection changes abort old work without touching a replacement', async () => {
  for (const replace of [false, true]) {
    let complete!: () => void;
    let aborted!: AbortSignal;
    let report!: (progress: number) => void;
    const cb = vi.fn();
    const replacement = {
      ...file,
      uri: 'file:///replacement.pdf',
      name: 'replacement.pdf',
    };
    const r = await render(NeuUploaderComponent, {
      inputs: {
        files: [{ id: 'stable', file, state: 'selected', progress: 0 }],
        upload: async (
          _file: NeuFile,
          progress: (n: number) => void,
          signal: AbortSignal,
        ) => {
          aborted = signal;
          report = progress;
          await new Promise<void>((resolve) => {
            complete = resolve;
          });
        },
      },
      providers: [
        { provide: NEU_FILE_PICKER, useValue: { pick: async () => null } },
      ],
      on: { completed: cb },
    });
    await press('Upload report.pdf');
    await r.rerender({
      inputs: {
        files: replace
          ? [
              {
                id: 'stable',
                file: replacement,
                state: 'selected',
                progress: 0,
              },
            ]
          : [],
      },
    });
    report(90);
    complete();
    await settle();
    expect(aborted.aborted).toBe(true);
    expect(cb).not.toHaveBeenCalled();
    if (replace)
      expect(r.instance.files()[0]).toMatchObject({
        file: replacement,
        state: 'selected',
        progress: 0,
      });
    else expect(r.instance.files()).toEqual([]);
    r.unmount();
  }
});
test('late completion of a removed upload preserves a new upload cancellation handle', async () => {
  const completions: Array<() => void> = [];
  const signals: AbortSignal[] = [];
  const item = { id: 'stable', file, state: 'selected', progress: 0 };
  const r = await render(NeuUploaderComponent, {
    inputs: {
      files: [item],
      upload: async (
        _file: NeuFile,
        _progress: (n: number) => void,
        signal: AbortSignal,
      ) => {
        signals.push(signal);
        await new Promise<void>((resolve) => {
          completions.push(resolve);
        });
      },
    },
    providers: [
      { provide: NEU_FILE_PICKER, useValue: { pick: async () => null } },
    ],
  });
  await press('Upload report.pdf');
  await press('Remove report.pdf');
  await r.rerender({ inputs: { files: [item] } });
  await press('Upload report.pdf');
  completions[0]!();
  await settle();
  await press('Remove report.pdf');
  expect(signals[1]!.aborted).toBe(true);
  completions[1]!();
  await settle();
});
