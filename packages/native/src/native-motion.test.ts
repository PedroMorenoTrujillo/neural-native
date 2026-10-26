import { signal, type Type } from '@angular/core';
import { Accessibility, StatusBar } from '@ng-native/device';
import { cleanup, fireEvent, render, screen, settle, userEvent, type FakeFabricNode } from '@ng-native/testing';
import { afterEach, expect, test, vi } from 'vitest';
import { NeuAlertComponent } from './alert/alert.ts';
import { NeuModalComponent } from './modal/modal.ts';
import { NeuBottomSheetComponent } from './bottom-sheet/bottom-sheet.ts';
import { NeuImageViewerComponent } from './image-viewer/image-viewer.ts';
import { NeuGalleryComponent } from './gallery/gallery.ts';
import { NeuCarouselComponent } from './carousel/carousel.ts';
import { NeuSelectComponent } from './select/select.ts';
import { NeuSpeedDialComponent } from './speed-dial/speed-dial.ts';
import { NeuSidebarComponent } from './sidebar/sidebar.ts';
import type { LayoutEvent } from '@ng-native/components';
import { NEU_LIGHT_TOKENS, NEU_THEME } from './foundation/index.ts';

afterEach(cleanup);
const photos = [
  { id: 'a', label: 'Workspace', uri: 'file:///a.jpg' },
  { id: 'b', label: 'Meeting room', uri: 'file:///b.jpg' },
  { id: 'c', label: 'Team', uri: 'file:///c.jpg' },
];
const motionTheme = (duration: number) => ({ provide: NEU_THEME, useValue: signal({ ...NEU_LIGHT_TOKENS, duration }) });
const nodes = (node: FakeFabricNode | undefined): FakeFabricNode[] => node ? [node, ...node.children.flatMap(nodes)] : [];
const pause = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

test('full-width sidebar accepts layout changes, keeps selection and closes through its public controls', async () => {
  const r = await render(NeuSidebarComponent, { inputs: {
    title: 'Workspace', open: true, fullWidth: true, value: 'projects',
    items: [{ id: 'projects', label: 'Projects' }, { id: 'team', label: 'Team' }],
  }, providers: [motionTheme(0)] });
  const component = r.fixture.componentInstance as unknown as { measure(event: LayoutEvent): void };
  const layout = (width: number) => ({ nativeEvent: { layout: { x: 0, y: 0, width, height: 800 } } }) as LayoutEvent;
  component.measure(layout(1024));
  await settle();
  expect(nodes(r.fabric.find('ModalHostView')).some(node => node.props.maxWidth === '100%' && node.props.width === '100%')).toBe(true);
  expect(screen.getByRole('radio', { name: 'Projects' })).toBeDefined();
  await r.rerender({ inputs: { fullWidth: false } });
  component.measure(layout(360));
  await settle();
  expect(nodes(r.fabric.find('ModalHostView')).some(node => node.props.maxWidth === 360 && node.props.width === '86%')).toBe(true);
  expect(r.fixture.componentInstance.value()).toBe('projects');
  await userEvent.press(screen.getByRole('radio', { name: 'Team' }));
  expect(r.fixture.componentInstance.value()).toBe('team');
  expect(r.fixture.componentInstance.open()).toBe(false);
  await r.rerender({ inputs: { open: false } });
  await r.rerender({ inputs: { open: true, fullWidth: true } });
  component.measure(layout(640));
  await settle();
  await userEvent.press(screen.getByRole('button', { name: 'Close navigation' }));
  expect(r.fixture.componentInstance.open()).toBe(false);
});

test('gallery forwards reactive consumer labels to its internal viewer and restores defaults', async () => {
  const r = await render(NeuGalleryComponent, {
    inputs: { items: photos, open: true, viewerLabels: {
      closeLabel: 'Cerrar visor', previousLabel: 'Imagen anterior', nextLabel: 'Imagen siguiente',
      zoomLabel: 'Ampliar imagen', zoomOutLabel: 'Reducir imagen',
    } }, providers: [motionTheme(0)],
  });
  for (const name of ['Cerrar visor', 'Imagen anterior', 'Imagen siguiente', 'Ampliar imagen', 'Reducir imagen']) {
    expect(screen.getByRole('button', { name })).toBeDefined();
  }
  await r.rerender({ inputs: { viewerLabels: { closeLabel: 'Dismiss collection' } } });
  expect(screen.getByRole('button', { name: 'Dismiss collection' })).toBeDefined();
  expect(screen.getByRole('button', { name: 'Next image' })).toBeDefined();
  await userEvent.press(screen.getByRole('button', { name: 'Next image' }));
  expect(r.fixture.componentInstance.index()).toBe(1);
  await userEvent.press(screen.getByRole('button', { name: 'Dismiss collection' }));
  expect(r.fixture.componentInstance.open()).toBe(false);
});

test.each([
  ['modal', NeuModalComponent],
  ['bottom sheet', NeuBottomSheetComponent],
  ['image viewer', NeuImageViewerComponent],
] as const)('%s keeps only an inaccessible outgoing surface and cancels stale dismissal on reopen', async (name, component) => {
  const r = await render(component as Type<unknown>, {
    inputs: name === 'image viewer' ? { open: true, items: photos } : { open: true, title: 'Motion' },
    providers: [motionTheme(80)],
  });
  expect(r.fabric.find('ModalHostView')?.props.animationType).toBe('none');
  await pause(180);
  await r.rerender({ inputs: { open: false } });
  expect(r.fabric.find('ModalHostView')?.props.visible).toBe(true);
  expect(nodes(r.fabric.find('ModalHostView')).some(node => node.props.pointerEvents === 'none' && node.props.accessibilityElementsHidden === true)).toBe(true);
  await r.rerender({ inputs: { open: true } });
  await pause(180);
  expect(r.fabric.find('ModalHostView')?.props.visible).toBe(true);
  await r.rerender({ inputs: { open: false } });
  await vi.waitFor(() => expect(r.fabric.find('ModalHostView')).toBeUndefined());
});

test('a bottom sheet first opened from closed becomes opaque and can close and reopen', async () => {
  const r = await render(NeuBottomSheetComponent, {
    inputs: { open: false, title: 'Preferences' }, providers: [motionTheme(40)],
  });
  expect(r.fabric.find('ModalHostView')).toBeUndefined();
  for (let opening = 0; opening < 2; opening++) {
    await r.rerender({ inputs: { open: true } });
    await vi.waitFor(() => {
      const backdrop = nodes(r.fabric.find('ModalHostView')).find(node =>
        node.props.pointerEvents === 'auto' && node.props.accessibilityElementsHidden === false);
      expect(backdrop?.props.opacity).toBeCloseTo(1);
    });
    await userEvent.press(screen.getByRole('button', { name: 'Close', exact: true }));
    expect(r.instance.open()).toBe(false);
    await r.rerender({ inputs: { open: false } });
    await vi.waitFor(() => expect(r.fabric.find('ModalHostView')).toBeUndefined());
  }
});

test('modal emits close intent immediately while its native exit is still present', async () => {
  const closed = vi.fn(), dismissed = vi.fn();
  const r = await render(NeuModalComponent, {
    inputs: { open: true, title: 'Motion' }, providers: [motionTheme(80)], on: { closed, dismissed },
  });
  await pause(180);
  await userEvent.setup().press(screen.getByRole('button', { name: 'Close', exact: true }));
  expect(r.instance.open()).toBe(false);
  expect(closed).toHaveBeenCalledOnce();
  expect(dismissed).not.toHaveBeenCalled();
  expect(r.fabric.find('ModalHostView')).toBeTruthy();
  await vi.waitFor(() => expect(dismissed).toHaveBeenCalledOnce());
});

test('a zero duration theme presents and removes the native overlay without an animation tail', async () => {
  const r = await render(NeuBottomSheetComponent, {
    inputs: { open: true, title: 'Instant' }, providers: [motionTheme(0)],
  });
  expect(r.fabric.find('ModalHostView')?.props.animationType).toBe('none');
  await r.rerender({ inputs: { open: false } });
  expect(r.fabric.find('ModalHostView')).toBeUndefined();
});

test('changing reduced motion during an exit cancels the remaining overlay animation', async () => {
  let preference: ((state: { reduceMotion: boolean; screenReader: boolean; boldText: boolean; fontScale: number }) => void) | undefined;
  const r = await render(NeuModalComponent, {
    inputs: { open: true, title: 'Preferences' }, providers: [motionTheme(80), {
      provide: Accessibility.SOURCE,
      useValue: {
        current: async () => ({ reduceMotion: false, screenReader: false, boldText: false, fontScale: 1 }),
        subscribe: (callback: typeof preference) => { preference = callback; return () => {}; }, announce: () => {},
      },
    }],
  });
  await pause(180);
  await r.rerender({ inputs: { open: false } });
  expect(r.fabric.find('ModalHostView')).toBeTruthy();
  preference?.({ reduceMotion: true, screenReader: false, boldText: false, fontScale: 1 });
  await r.rerender({ inputs: {} });
  expect(r.fabric.find('ModalHostView')).toBeUndefined();
});

test('alert dismissal updates its model and output before the measured collapse finishes', async () => {
  const closed = vi.fn();
  const r = await render(NeuAlertComponent, { inputs: { message: 'Saved', closable: true }, on: { closed }, providers: [motionTheme(80)] });
  await userEvent.setup().press(screen.getByRole('button', { name: 'Close', exact: true }));
  expect(r.instance.visible()).toBe(false);
  expect(closed).toHaveBeenCalledOnce();
  expect(screen.queryByRole('alert')).toBeNull();
  await pause(180);
  expect(screen.queryByText('Saved')).toBeNull();
});

test('image viewer crossfades only the latest image and clears outgoing layers when motion is disabled', async () => {
  const theme = signal({ ...NEU_LIGHT_TOKENS, duration: 80 });
  const r = await render(NeuImageViewerComponent, { inputs: { open: true, items: photos }, providers: [{ provide: NEU_THEME, useValue: theme }] });
  await pause(180);
  await r.rerender({ inputs: { index: 1 } });
  expect(nodes(r.fabric.find('ModalHostView')).some(node => node.props.accessible === false && (JSON.stringify(node.props.source) ?? '').includes('a.jpg'))).toBe(true);
  await r.rerender({ inputs: { index: 2 } });
  expect(screen.getByRole('image', { name: 'Team' })).toBeTruthy();
  theme.set({ ...NEU_LIGHT_TOKENS, duration: 0 });
  await r.rerender({ inputs: {} });
  expect(nodes(r.fabric.find('ModalHostView')).some(node => node.props.accessible === false && (JSON.stringify(node.props.source) ?? '').includes('.jpg'))).toBe(false);
  await r.rerender({ inputs: { index: 1 } });
  r.unmount();
  await pause(180);
  expect(r.componentRef.hostView.destroyed).toBe(true);
});

test('viewer keeps the settled photo until the latest requested photo loads', async () => {
  const r = await render(NeuImageViewerComponent, { inputs: { open: true, items: photos }, providers: [motionTheme(40)] });
  await pause(110);
  await r.rerender({ inputs: { index: 1 } });
  await pause(160);
  const oldPhoto = () => nodes(r.fabric.find('ModalHostView')).find(node => node.props.accessible === false && JSON.stringify(node.props.source)?.includes('a.jpg'));
  expect(oldPhoto()).toBeTruthy();
  expect(oldPhoto()?.props.opacity).toBe(1);
  await r.rerender({ inputs: { index: 2 } });
  await fireEvent(screen.getByRole('image', { name: 'Team' }), 'load', {});
  await vi.waitFor(() => expect(oldPhoto()).toBeUndefined());
  expect(screen.getByRole('image', { name: 'Team' })).toBeTruthy();
});

test('carousel keeps an opaque settled image until the latest slide has loaded', async () => {
  const r = await render(NeuCarouselComponent, { inputs: { items: photos }, providers: [motionTheme(40)] });
  await r.rerender({ inputs: { index: 1 } });
  const previous = () => screen.getByRole('image', { name: r.instance.items()[r.instance.index()]!.label, exact: true }).parent!.children.find(node => node.props.accessible === false && JSON.stringify(node.props.source)?.includes('a.jpg'));
  await pause(160);
  expect(previous()?.props.opacity).toBe(1);
  await r.rerender({ inputs: { index: 2 } });
  await fireEvent(screen.getByRole('image', { name: 'Team', exact: true }), 'load', {});
  await vi.waitFor(() => expect(previous()).toBeUndefined());
  expect(screen.getByRole('button', { name: 'Team', exact: true })).toBeTruthy();
});

test('gallery keeps its previous layout inaccessible during a fade and settles after rapid changes', async () => {
  const r = await render(NeuGalleryComponent, { inputs: { items: photos, layout: 'grid' }, providers: [motionTheme(40)] });
  await r.rerender({ inputs: { layout: 'mosaic' } });
  const tile = screen.getByRole('button', { name: 'Workspace', exact: true });
  const stage = tile.parent!.parent!.parent!;
  expect(stage.children).toHaveLength(2);
  expect(stage.children[0]!.props.pointerEvents).toBe('none');
  expect(stage.children[0]!.props.accessibilityElementsHidden).toBe(true);
  await r.rerender({ inputs: { layout: 'grid' } });
  await r.rerender({ inputs: { layout: 'mosaic' } });
  await vi.waitFor(() => expect(screen.getByRole('button', { name: 'Workspace', exact: true }).parent!.parent!.parent!.children).toHaveLength(1));
  expect(screen.getAllByRole('button', { name: 'Workspace', exact: true })).toHaveLength(1);
  await userEvent.setup().press(screen.getByRole('button', { name: 'Team', exact: true }));
  expect(r.instance.index()).toBe(2);
  expect(r.instance.open()).toBe(true);
});

test('gallery switches layout immediately when motion is disabled', async () => {
  await render(NeuGalleryComponent, { inputs: { items: photos }, providers: [motionTheme(0)] }).then(async r => {
    await r.rerender({ inputs: { layout: 'mosaic' } });
    const tile = screen.getByRole('button', { name: 'Workspace', exact: true });
    expect(tile.parent!.parent!.parent!.children).toHaveLength(1);
  });
});

test('select commits a selection immediately and makes its outgoing options inaccessible', async () => {
  const r = await render(NeuSelectComponent, { inputs: { label: 'Team', options: [{ id: 'a', label: 'Design' }] }, providers: [motionTheme(80)] });
  await userEvent.setup().press(screen.getByRole('button', { name: /Team/ }));
  await pause(180);
  await userEvent.setup().press(screen.getByRole('radio', { name: 'Design', exact: true }));
  expect(r.instance.value()).toBe('a');
  expect(r.fabric.find('ModalHostView')).toBeTruthy();
  expect(nodes(r.fabric.find('ModalHostView')).some(node => node.props.accessibilityElementsHidden === true)).toBe(true);
  await vi.waitFor(() => expect(r.fabric.find('ModalHostView')).toBeUndefined());
});

test('speed dial uses native interpolation and never exposes hidden or disabled actions', async () => {
  const activated = vi.fn();
  const r = await render(NeuSpeedDialComponent, { inputs: { actions: [{ id: 'a', label: 'Create' }] }, providers: [motionTheme(0)], on: { activated } });
  expect(screen.queryByRole('button', { name: 'Create', exact: true })).toBeNull();
  await userEvent.setup().press(screen.getByRole('button', { name: 'Quick actions', exact: true }));
  const action = screen.getByRole('button', { name: 'Create', exact: true });
  await userEvent.setup().press(action);
  expect(activated).toHaveBeenCalledWith('a');
  expect(r.instance.open()).toBe(false);
  await r.rerender({ inputs: { disabled: true } });
  await userEvent.setup().press(screen.getByRole('button', { name: 'Quick actions', exact: true }));
  expect(r.instance.open()).toBe(false);
});

test('image viewer owns a reversible status bar claim and supports a custom light canvas', async () => {
  const release = vi.fn();
  const push = vi.fn(() => release);
  const theme = signal({ ...NEU_LIGHT_TOKENS, duration: 0 });
  const r = await render(NeuImageViewerComponent, {
    inputs: { open: false, items: photos },
    providers: [{ provide: NEU_THEME, useValue: theme }, { provide: StatusBar, useValue: { push } }],
  });
  expect(push).not.toHaveBeenCalled();
  await r.rerender({ inputs: { open: true } });
  expect(push).toHaveBeenLastCalledWith({ style: 'light' });
  theme.update(t => ({ ...t, mediaCanvas: '#ffffff', mediaText: '#172033', mediaBarStyle: 'dark' }));
  await settle();
  expect(release).toHaveBeenCalledTimes(1);
  expect(push).toHaveBeenLastCalledWith({ style: 'dark' });
  await r.rerender({ inputs: { open: false } });
  expect(release).toHaveBeenCalledTimes(2);
  await r.rerender({ inputs: { open: true } });
  cleanup();
  expect(release).toHaveBeenCalledTimes(3);
});
