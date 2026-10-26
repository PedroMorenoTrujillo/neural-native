import { cleanup, render } from '@ng-native/testing';
import { afterEach, expect, test, vi } from 'vitest';
import { getDocumentAsync } from 'expo-document-picker';
import { NEU_FILE_PICKER } from './foundation/file-picker.ts';
import { NeuUploaderComponent } from './uploader/uploader.ts';

// The platform boundary is mocked; the actual default provider and result
// conversion run unchanged. Native system-panel tests are recorded separately.
vi.mock('expo-document-picker', () => ({ getDocumentAsync: vi.fn() }));
afterEach(() => { cleanup(); vi.resetAllMocks(); });

test('default picker forwards MIME types, multiple selection and cache copying', async () => {
  const assets = [{ uri: 'file:///note.txt', name: 'note.txt', size: 20, mimeType: 'text/plain' }];
  vi.mocked(getDocumentAsync).mockResolvedValue({ canceled: false, assets: assets.map(file => ({ ...file, lastModified: 0 })) });
  const r = await render(NeuUploaderComponent, { inputs: { label: 'Files' } });
  const picker = r.componentRef.injector.get(NEU_FILE_PICKER);
  expect(await picker.pick({ type: ['text/plain'], multiple: true })).toEqual(assets);
  expect(getDocumentAsync).toHaveBeenCalledExactlyOnceWith({ type: ['text/plain'], multiple: true, copyToCacheDirectory: true });
});

test('default picker treats platform cancellation as no selection and permits reopening', async () => {
  vi.mocked(getDocumentAsync).mockResolvedValue({ canceled: true, assets: null });
  const r = await render(NeuUploaderComponent, { inputs: { label: 'Files' } });
  const picker = r.componentRef.injector.get(NEU_FILE_PICKER);
  expect(await picker.pick({ type: ['*/*'], multiple: false })).toBeNull();
  expect(await picker.pick({ type: ['*/*'], multiple: false })).toBeNull();
  expect(getDocumentAsync).toHaveBeenCalledTimes(2);
});

test('default picker propagates a platform error rather than returning a selected file', async () => {
  vi.mocked(getDocumentAsync).mockRejectedValue(new Error('Picker unavailable'));
  const r = await render(NeuUploaderComponent, { inputs: { label: 'Files' } });
  await expect(r.componentRef.injector.get(NEU_FILE_PICKER).pick({ type: ['*/*'], multiple: false })).rejects.toThrow('Picker unavailable');
});
