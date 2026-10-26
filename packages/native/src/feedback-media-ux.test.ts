import { signal } from '@angular/core';
import { Accessibility } from '@ng-native/device';
import { cleanup, render, screen, userEvent } from '@ng-native/testing';
import { afterEach, expect, test, vi } from 'vitest';
import { NeuSkeletonComponent } from './skeleton/skeleton.ts';
import { NeuCarouselComponent } from './carousel/carousel.ts';
import { NeuNotificationCenterComponent } from './notification-center/notification-center.ts';
import { NEU_LIGHT_TOKENS, NEU_THEME } from './foundation/index.ts';

afterEach(cleanup);
const photos = [
  { id: 'a', label: 'Workspace', uri: 'file:///a.jpg' },
  { id: 'b', label: 'Meeting room', uri: 'file:///b.jpg' },
  { id: 'c', label: 'Team', uri: 'file:///c.jpg' },
];
const press = async (name: string) => userEvent.setup().press(screen.getByRole('button', { name, exact: true }));

test('rapid carousel changes keep the latest image and discard outgoing images after the transition', async () => {
  const r = await render(NeuCarouselComponent, { inputs: { items: photos, loop: true } });
  await press('Next image');
  await press('Next image');
  await press('Previous image');
  expect(r.instance.index()).toBe(1);
  await new Promise(resolve => setTimeout(resolve, 300));
  expect(screen.getByRole('image', { name: 'Meeting room' })).toBeTruthy();
  expect(screen.queryByRole('image', { name: 'Workspace' })).toBeNull();
  expect(screen.queryByRole('image', { name: 'Team' })).toBeNull();
  await press('Next image');
  r.unmount();
  await new Promise(resolve => setTimeout(resolve, 300));
  expect(r.componentRef.hostView.destroyed).toBe(true);
});

test('zero duration theme leaves skeleton bars static with their loading announcement', async () => {
  const r = await render(NeuSkeletonComponent, {
    inputs: { lines: 3 },
    providers: [{ provide: NEU_THEME, useValue: signal({ ...NEU_LIGHT_TOKENS, duration: 0 }) }],
  });
  const bars = () => screen.getByRole('progressbar').children.filter(node => node.props.height === 16);
  expect(bars()).toHaveLength(3);
  expect(bars().map(node => node.props.opacity)).toEqual([1, 1, 1]);
  await new Promise(resolve => setTimeout(resolve, 100));
  expect(bars().map(node => node.props.opacity)).toEqual([1, 1, 1]);
  r.unmount();
});

test('skeleton pulses and stops immediately when reduced motion is requested', async () => {
  let preference: ((state: { reduceMotion: boolean; screenReader: boolean; boldText: boolean; fontScale: number }) => void) | undefined;
  const r = await render(NeuSkeletonComponent, {
    providers: [{ provide: Accessibility.SOURCE, useValue: {
      current: async () => ({ reduceMotion: false, screenReader: false, boldText: false, fontScale: 1 }),
      subscribe: (callback: typeof preference) => { preference = callback; return () => {}; }, announce: () => {},
    } }],
  });
  const opacity = () => screen.getByRole('progressbar').children[0]?.props.opacity as number;
  await vi.waitFor(() => expect(opacity()).toBeLessThan(0.99));
  preference?.({ reduceMotion: true, screenReader: false, boldText: false, fontScale: 1 });
  await vi.waitFor(() => expect(r.componentRef.injector.get(Accessibility).reduceMotion()).toBe(true));
  await vi.waitFor(() => expect(opacity()).toBe(1));
  await new Promise(resolve => setTimeout(resolve, 100));
  expect(opacity()).toBe(1);
});

test('skeleton changes from bounded text rows to a single shape without losing its loading announcement', async () => {
  const r = await render(NeuSkeletonComponent, { inputs: { lines: 99, animation: 'none' } });
  const bars = () => screen.getByRole('progressbar').children;
  expect(bars()).toHaveLength(20);
  await r.rerender({ inputs: { variant: 'circle', lines: 5 } });
  expect(bars()).toHaveLength(1);
  expect(bars()[0].props.height).toBe(40);
  expect(screen.getByRole('progressbar').props.width).toBe(40);
  await r.rerender({ inputs: { variant: 'rect', width: '80%', height: 120 } });
  expect(bars()).toHaveLength(1);
  expect(bars()[0].props.height).toBe(120);
  expect(screen.getByRole('progressbar').props.width).toBe('80%');
  await r.rerender({ inputs: { variant: 'text', lines: 2, width: '180px', lastLineWidth: '45%' } });
  expect(bars()).toHaveLength(2);
  expect(screen.getByRole('progressbar').props.width).toBe(180);
  expect(bars()[1].props.width).toBe('45%');
  expect(screen.getByRole('progressbar').props.accessibilityState).toMatchObject({ busy: true });
});

test('skeleton stops a running animation when disabled and can restart it', async () => {
  const r = await render(NeuSkeletonComponent);
  const opacity = () => screen.getByRole('progressbar').children[0]?.props.opacity as number;
  await vi.waitFor(() => expect(opacity()).toBeLessThan(0.99));
  await r.rerender({ inputs: { animation: 'none' } });
  expect(opacity()).toBe(1);
  await new Promise(resolve => setTimeout(resolve, 100));
  expect(opacity()).toBe(1);
  await r.rerender({ inputs: { animation: 'pulse' } });
  await vi.waitFor(() => expect(opacity()).toBeLessThan(0.99));
});

test('skeleton normalizes invalid dimensions and row counts', async () => {
  await render(NeuSkeletonComponent, { inputs: { animation: 'none', lines: Number.NaN, height: -5, width: 'invalid', gap: -2, borderRadius: -4, lastLineWidth: '200%' } });
  const root = screen.getByRole('progressbar');
  expect(root.children).toHaveLength(3);
  expect(root.props.width).toBe('100%');
  expect(root.props.gap).toBe(0);
  expect(root.children[0].props.height).toBe(0);
  expect(root.children[0].props.borderRadius).toBe(0);
  expect(root.children[2].props.width).toBe('100%');
});

test('notification activation updates read state once and mark all read preserves item order', async () => {
  const activated = vi.fn();
  const r = await render(NeuNotificationCenterComponent, {
    inputs: { items: [
      { id: 'invite', label: 'Project invitation' },
      { id: 'review', label: 'Review complete' },
    ], readIds: ['review'] },
    on: { activated },
  });
  expect(screen.getByText('1 Unread')).toBeTruthy();
  await press('Project invitation · Unread');
  expect(r.instance.readIds()).toEqual(['review', 'invite']);
  expect(activated.mock.calls).toEqual([['invite']]);
  await press('Project invitation');
  expect(r.instance.readIds()).toEqual(['review', 'invite']);
  await r.rerender({ inputs: { readIds: [] } });
  await press('Mark all read');
  expect(r.instance.readIds()).toEqual(['invite', 'review']);
  expect(screen.getByText('0 Unread')).toBeTruthy();
});
