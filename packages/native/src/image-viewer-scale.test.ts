import { signal } from '@angular/core';
import { Accessibility } from '@ng-native/device';
import { cleanup, fireEvent, render, screen, userEvent } from '@ng-native/testing';
import { afterEach, expect, test, vi } from 'vitest';
import { NeuImageViewerComponent } from './image-viewer/image-viewer.ts';
import { NEU_LIGHT_TOKENS, NEU_THEME } from './foundation/index.ts';

afterEach(cleanup);
const photos = [{ id: 'one', label: 'Coast', uri: 'file:///coast.jpg' }];
const theme = (duration: number) => ({ provide: NEU_THEME, useValue: signal({ ...NEU_LIGHT_TOKENS, duration }) });
const press = (name: string) => userEvent.setup().press(screen.getByRole('button', { name, exact: true }));
const scale = () => Number((screen.getByRole('image', { name: 'Coast' }).props.transform as { scale: number }[])[0]!.scale);

test('the full-screen native window paints the media canvas beneath both system bars', async () => {
  const r = await render(NeuImageViewerComponent, {
    inputs: { open: true, items: photos },
    providers: [{ provide: NEU_THEME, useValue: signal({ ...NEU_LIGHT_TOKENS, duration: 0, mediaCanvas: '#071020' }) }],
  });
  const modal = r.fabric.find('ModalHostView')!;
  expect(modal.props.statusBarTranslucent).toBe(true);
  expect(modal.props.navigationBarTranslucent).toBe(true);
  expect(modal.children[0]?.props.backgroundColor).toBe('#071020');
});

test('opening enlarges the image viewport before settling at its full size', async () => {
  await render(NeuImageViewerComponent, { inputs: { open: true, items: photos }, providers: [theme(120)] });
  const entryScale = () => Number((screen.getByRole('image', { name: 'Coast' }).parent!.props.transform as { scale: number }[])[0]!.scale);
  expect(entryScale()).toBeGreaterThanOrEqual(0.92);
  expect(entryScale()).toBeLessThan(1);
  await new Promise(resolve => setTimeout(resolve, 280));
  expect(entryScale()).toBeLessThan(1);
  await fireEvent(screen.getByRole('image', { name: 'Coast' }), 'load', {});
  await vi.waitFor(() => expect(entryScale()).toBe(1));
});

test('a cached image stays visible when reopening without another load event', async () => {
  const r = await render(NeuImageViewerComponent, { inputs: { open: true, items: photos }, providers: [theme(0)] });
  await fireEvent(screen.getByRole('image', { name: 'Coast' }), 'load', {});
  const viewportOpacity = () => screen.getByRole('image', { name: 'Coast' }).parent!.props.opacity;
  expect(viewportOpacity()).toBe(1);
  await press('Close viewer');
  await r.rerender({ inputs: { open: false } });
  await r.rerender({ inputs: { open: true } });
  expect(viewportOpacity()).toBe(1);
});

test('zoom animates through intermediate scales and retargets to the latest button action', async () => {
  await render(NeuImageViewerComponent, { inputs: { open: true, items: photos }, providers: [theme(160)] });
  await press('Zoom in');
  await vi.waitFor(() => { expect(scale()).toBeGreaterThan(1); expect(scale()).toBeLessThan(2); });
  await press('Zoom in');
  await press('Zoom out');
  await vi.waitFor(() => expect(scale()).toBe(2));
  expect(screen.getByText('200%')).toBeTruthy();
  await press('Zoom out');
  await vi.waitFor(() => { expect(scale()).toBeGreaterThan(1); expect(scale()).toBeLessThan(2); });
  await vi.waitFor(() => expect(scale()).toBe(1));
});

test('a pinch takes over the current animated scale and tracks the fingers without easing', async () => {
  const r = await render(NeuImageViewerComponent, { inputs: { open: true, items: photos }, providers: [theme(160)] });
  await press('Zoom in');
  await vi.waitFor(() => { expect(scale()).toBeGreaterThan(1); expect(scale()).toBeLessThan(2); });
  const viewport = screen.getByRole('image', { name: 'Coast' }).parent!;
  await fireEvent(viewport, 'touchStart', { touches: [{ pageX: 0, pageY: 0 }, { pageX: 100, pageY: 0 }] });
  const starting = scale();
  await fireEvent(viewport, 'touchMove', { touches: [{ pageX: 0, pageY: 0 }, { pageX: 120, pageY: 0 }] });
  expect(scale()).toBeCloseTo(starting * 1.2, 4);
  await fireEvent(viewport, 'touchCancel', { touches: [] });
  const target = Math.min(4, scale() + 1);
  await press('Zoom in');
  await vi.waitFor(() => expect(scale()).toBeCloseTo(target, 4));
  r.unmount();
});

test('zoom is immediate with reduced motion and can be disabled while an animation is running', async () => {
  let update: ((state: { reduceMotion: boolean; screenReader: boolean; boldText: boolean; fontScale: number }) => void) | undefined;
  const r = await render(NeuImageViewerComponent, {
    inputs: { open: true, items: photos }, providers: [theme(160), {
      provide: Accessibility.SOURCE,
      useValue: {
        current: async () => ({ reduceMotion: false, screenReader: false, boldText: false, fontScale: 1 }),
        subscribe: (callback: typeof update) => { update = callback; return () => {}; }, announce: () => {},
      },
    }],
  });
  await press('Zoom in');
  await vi.waitFor(() => { expect(scale()).toBeGreaterThan(1); expect(scale()).toBeLessThan(2); });
  update?.({ reduceMotion: true, screenReader: false, boldText: false, fontScale: 1 });
  await r.rerender({ inputs: {} });
  expect(scale()).toBe(2);
  await press('Zoom out');
  expect(scale()).toBe(1);
});

test('a zero-duration theme preserves zoom bounds and reset on reopening', async () => {
  const r = await render(NeuImageViewerComponent, { inputs: { open: true, items: photos }, providers: [theme(0)] });
  await press('Zoom in');
  expect(scale()).toBe(2);
  await press('Close viewer');
  await r.rerender({ inputs: { open: false } });
  await r.rerender({ inputs: { open: true } });
  expect(scale()).toBe(1);
});
