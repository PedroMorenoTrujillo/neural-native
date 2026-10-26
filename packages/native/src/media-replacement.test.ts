import { cleanup, fireEvent, render, screen, userEvent } from '@ng-native/testing';
import { NeuImageViewerComponent } from './image-viewer/image-viewer.ts';
import { afterEach, expect, test, vi } from 'vitest';

afterEach(cleanup);
const images = [
  { id: 'one', label: 'First photo', uri: 'file:///first.jpg' },
  { id: 'two', label: 'Second photo', uri: 'file:///second.jpg' },
];

test('viewer has separate bounded zoom actions and resets zoom after navigation and reopening', async () => {
  const r = await render(NeuImageViewerComponent, { inputs: { items: images, open: true } });
  const press = async (name: string) => userEvent.setup().press(screen.getByRole('button', { name, exact: true }));
  const scale = () => screen.getByRole('image').props.transform;
  expect(screen.getByRole('button', { name: 'Zoom out' }).props.accessibilityState).toMatchObject({ disabled: true });
  await press('Zoom out');
  await vi.waitFor(() => expect(scale()).toEqual([{ scale: 1 }]));
  await press('Zoom in');
  await press('Zoom in');
  await press('Zoom in');
  await vi.waitFor(() => expect(scale()).toEqual([{ scale: 4 }]));
  expect(screen.getByText('400%')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Zoom in' }).props.accessibilityState).toMatchObject({ disabled: true });
  await press('Zoom in');
  await vi.waitFor(() => expect(scale()).toEqual([{ scale: 4 }]));
  await press('Zoom out');
  await vi.waitFor(() => expect(scale()).toEqual([{ scale: 3 }]));
  await press('Next image');
  expect(r.instance.index()).toBe(1);
  await vi.waitFor(() => expect(scale()).toEqual([{ scale: 1 }]));
  await press('Zoom in');
  await press('Close viewer');
  await r.rerender({ inputs: { open: false } });
  await r.rerender({ inputs: { open: true } });
  await vi.waitFor(() => expect(scale()).toEqual([{ scale: 1 }]));
});

test('viewer zoom actions coexist with pinch and stop when the image fails or is removed', async () => {
  const r = await render(NeuImageViewerComponent, { inputs: { items: images, open: true } });
  const press = async (name: string) => userEvent.setup().press(screen.getByRole('button', { name, exact: true }));
  await press('Zoom in');
  await vi.waitFor(() => expect(screen.getByRole('image').props.transform).toEqual([{ scale: 2 }]));
  const viewport = screen.getByRole('image').parent!;
  await fireEvent(viewport, 'touchStart', { touches: [{ pageX: 0, pageY: 0 }, { pageX: 100, pageY: 0 }] });
  await fireEvent(viewport, 'touchMove', { touches: [{ pageX: 0, pageY: 0 }, { pageX: 150, pageY: 0 }] });
  expect(screen.getByRole('image').props.transform).toEqual([{ scale: 3 }]);
  await press('Zoom out');
  await vi.waitFor(() => expect(screen.getByRole('image').props.transform).toEqual([{ scale: 2 }]));
  await fireEvent(screen.getByRole('image'), 'error', { error: 'Missing' });
  for (const name of ['Zoom in', 'Zoom out']) expect(screen.getByRole('button', { name }).props.accessibilityState).toMatchObject({ disabled: true });
  await r.rerender({ inputs: { items: [] } });
  for (const name of ['Zoom in', 'Zoom out']) expect(screen.getByRole('button', { name }).props.accessibilityState).toMatchObject({ disabled: true });
});

test('viewer contains its transformed image inside the gesture viewport', async () => {
  await render(NeuImageViewerComponent, { inputs: { items: images, open: true } });
  await userEvent.setup().press(screen.getByRole('button', { name: 'Zoom in' }));
  await vi.waitFor(() => expect(screen.getByRole('image', { name: 'First photo' }).props['transform']).toEqual([{ scale: 2 }]));
  const image = screen.getByRole('image', { name: 'First photo' });
  expect(image.parent!.props['overflow']).toBe('hidden');
  expect(screen.getByRole('button', { name: 'Close viewer' })).toBeTruthy();
});

test('viewer clears a failed image and zoom when its URI changes at the same index', async () => {
  const r = await render(NeuImageViewerComponent, { inputs: { items: images, open: true } });
  await userEvent.setup().press(screen.getByRole('button', { name: 'Zoom in' }));
  await fireEvent(screen.getByRole('image', { name: 'First photo' }), 'error', { error: 'Missing' });
  const renamed = [{ ...images[0]!, label: 'Renamed photo' }, images[1]!];
  await r.rerender({ inputs: { items: renamed } });
  expect(screen.getByText('Image could not be loaded')).toBeTruthy();
  // A full-height failed image would clip the alert beneath the viewport.
  expect(screen.queryByRole('image', { name: 'Renamed photo' })).toBeNull();
  await r.rerender({ inputs: { items: [{ ...renamed[0]!, uri: 'file:///replacement.jpg' }, renamed[1]!] } });
  expect(screen.queryByText('Image could not be loaded')).toBeNull();
  expect(screen.getByRole('image', { name: 'Renamed photo' }).props['transform']).toEqual([{ scale: 1 }]);
  expect(r.instance.index()).toBe(0);
  expect(r.instance.open()).toBe(true);
  await fireEvent(screen.getByRole('image', { name: 'Renamed photo' }), 'error', { error: 'Missing again' });
  await r.rerender({ inputs: { items: [] } });
  expect(screen.queryByText('Image could not be loaded')).toBeNull();
});

test('viewer cancels a pending swipe when the parent replaces the displayed image', async () => {
  const r = await render(NeuImageViewerComponent, { inputs: { items: images, open: true } });
  const surface = screen.getByRole('image', { name: 'First photo' }).parent!;
  await fireEvent(surface, 'touchStart', { pageX: 200, touches: [{ pageX: 200, pageY: 100 }] });
  await r.rerender({ inputs: { items: [{ ...images[0]!, uri: 'file:///replacement.jpg' }, images[1]!] } });
  await fireEvent(surface, 'touchEnd', { pageX: 20, touches: [] });
  expect(r.instance.index()).toBe(0);
  expect(screen.getByRole('image', { name: 'First photo' }).props['transform']).toEqual([{ scale: 1 }]);
});
