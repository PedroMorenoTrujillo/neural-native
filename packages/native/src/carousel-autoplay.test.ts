import { signal } from '@angular/core';
import { Accessibility } from '@ng-native/device';
import { cleanup, fireEvent, render, screen, settle } from '@ng-native/testing';
import { afterEach, expect, test, vi } from 'vitest';
import { NeuCarouselComponent } from './carousel/carousel.ts';
import { NEU_LIGHT_TOKENS, NEU_THEME } from './foundation/index.ts';

afterEach(cleanup);
afterEach(() => vi.useRealTimers());
const items = Array.from({ length: 3 }, (_, index) => ({ id: String(index), label: `Photo ${index + 1}`, uri: `file:///photo-${index}.png` }));
const providers = [{ provide: NEU_THEME, useValue: signal({ ...NEU_LIGHT_TOKENS, duration: 0 }) }];
// The Fabric test host settles through 0/16ms timeouts; advance those as well.
const flush = async <T>(operation: Promise<T>) => { await vi.advanceTimersByTimeAsync(50); return operation; };
const advance = async (milliseconds: number) => { await vi.advanceTimersByTimeAsync(milliseconds); await flush(settle()); };

test('carousel opens the current image in a localized viewer and shares navigation back to the slide', async () => {
  const r = await render(NeuCarouselComponent, { inputs: { items, index: 1, viewerLabels: { closeLabel: 'Cerrar visor', nextLabel: 'Siguiente original' } }, providers });
  await fireEvent(screen.getByRole('button', { name: 'Photo 2', exact: true }), 'press', {});
  expect(r.instance.open()).toBe(true);
  expect(r.fabric.find('ModalHostView')?.props.visible).toBe(true);
  await fireEvent(screen.getByRole('button', { name: 'Siguiente original' }), 'press', {});
  expect(r.instance.index()).toBe(2);
  await fireEvent(screen.getByRole('button', { name: 'Cerrar visor' }), 'press', {});
  expect(r.instance.open()).toBe(false);
  await r.rerender({ inputs: { preview: false } });
  expect(screen.queryByRole('button', { name: 'Photo 3', exact: true })).toBeNull();
  expect(screen.getByRole('image', { name: 'Photo 3', exact: true })).toBeTruthy();
});

test('carousel suspends automatic advances while its viewer is open and restarts after close', async () => {
  const r = await render(NeuCarouselComponent, { inputs: { items, loop: true }, providers });
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
  await flush(r.rerender({ inputs: { autoplay: true, autoplayInterval: 1000 } }));
  await flush(fireEvent(screen.getByRole('button', { name: 'Photo 1', exact: true }), 'press', {}));
  await advance(5000);
  expect(r.instance.index()).toBe(0);
  await flush(fireEvent(screen.getByRole('button', { name: 'Close viewer' }), 'press', {}));
  await advance(1000);
  expect(r.instance.index()).toBe(1);
});

test('a swipe changes slides without opening the viewer and a fresh tap opens immediately', async () => {
  const r = await render(NeuCarouselComponent, { inputs: { items }, providers });
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(1000);
  const surface = screen.getByRole('image', { name: 'Photo 1', exact: true }).parent!.parent!;
  await fireEvent(surface, 'touchStart', { pageX: 200, pageY: 100 });
  await fireEvent(surface, 'touchEnd', { pageX: 100, pageY: 110 });
  expect(r.instance.index()).toBe(1);
  expect(r.instance.open()).toBe(false);
  await fireEvent(screen.getByRole('button', { name: 'Photo 2', exact: true }), 'press', {});
  expect(r.instance.open()).toBe(true);
});

test('carousel autoplay stops without loop, wraps with loop and cleans up when disabled or destroyed', async () => {
  const r = await render(NeuCarouselComponent, { inputs: { items }, providers });
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
  await flush(r.rerender({ inputs: { autoplay: true, autoplayInterval: 1000 } }));
  await advance(1000);
  expect(r.instance.index()).toBe(1);
  await advance(1000);
  expect(r.instance.index()).toBe(2);
  await advance(5000);
  expect(r.instance.index()).toBe(2);
  await flush(r.rerender({ inputs: { loop: true } }));
  await advance(1000);
  expect(r.instance.index()).toBe(0);
  await flush(r.rerender({ inputs: { autoplay: false } }));
  await advance(5000);
  expect(r.instance.index()).toBe(0);
  await flush(r.rerender({ inputs: { autoplay: true } }));
  r.unmount();
  expect(vi.getTimerCount()).toBe(0);
});

test('carousel pauses playback during user pause and touch gestures and handles cancellation', async () => {
  const r = await render(NeuCarouselComponent, { inputs: { items, loop: true }, providers });
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
  await flush(r.rerender({ inputs: { autoplay: true, autoplayInterval: 1000 } }));
  await flush(fireEvent(screen.getByRole('button', { name: 'Pause slideshow' }), 'press', {}));
  await advance(3000);
  expect(r.instance.index()).toBe(0);
  await flush(fireEvent(screen.getByRole('button', { name: 'Play slideshow' }), 'press', {}));
  await advance(1000);
  expect(r.instance.index()).toBe(1);
  const surface = screen.getByRole('image', { name: 'Photo 2' }).parent!.parent!;
  await flush(fireEvent(surface, 'touchStart', { pageX: 100 }));
  await advance(3000);
  expect(r.instance.index()).toBe(1);
  await flush(fireEvent(surface, 'touchCancel', {}));
  await advance(1000);
  expect(r.instance.index()).toBe(2);
  await flush(r.rerender({ inputs: { autoplayInterval: 0 } }));
  await advance(5000);
  expect(r.instance.index()).toBe(2);
});

test('carousel suppresses autoplay for reduced motion, an empty collection and a single image', async () => {
  const r = await render(NeuCarouselComponent, {
    inputs: { items },
    providers: [...providers, { provide: Accessibility.SOURCE, useValue: {
      current: async () => ({ reduceMotion: true, screenReader: false, boldText: false, fontScale: 1 }),
      subscribe: () => () => {}, announce: () => {},
    } }],
  });
  await settle();
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
  await flush(r.rerender({ inputs: { autoplay: true, autoplayInterval: 1000 } }));
  await advance(3000);
  expect(r.instance.index()).toBe(0);
  await flush(r.rerender({ inputs: { items: items.slice(0, 1), loop: true } }));
  expect(screen.getByRole('button', { name: 'Next image' }).props.accessibilityState).toMatchObject({ disabled: true });
  await flush(r.rerender({ inputs: { items: [] } }));
  expect(screen.getByText('No images')).toBeTruthy();
  expect(vi.getTimerCount()).toBe(0);
});
