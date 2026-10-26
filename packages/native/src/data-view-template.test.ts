import { Component, signal } from '@angular/core';
import { Text, View, Pressable } from '@ng-native/components';
import { AnimatedStyle } from '@ng-native/components/animations';
import { Accessibility } from '@ng-native/device';
import { HostEngine } from '@ng-native/fabric';
import { cleanup, fireEvent, render, screen, settle, userEvent } from '@ng-native/testing';
import { afterEach, expect, test, vi } from 'vitest';
import { NeuAvatarComponent } from './avatar/avatar.ts';
import { NeuDataViewComponent } from './data-view/data-view.ts';
import { NeuDataViewRowMotionDirective } from './data-view/data-view-row.ts';
import { NEU_LIGHT_TOKENS, NEU_THEME } from './foundation/index.ts';

afterEach(cleanup);

@Component({
  imports: [NeuDataViewComponent, NeuAvatarComponent, View, Text],
  template: `
    <ng-template #person let-item let-index="index">
      <view><neu-avatar [label]="item.label" size="md" /><text>{{ index }} · {{ item.label }}</text><text>{{ item.description }}</text></view>
    </ng-template>
    <neu-data-view [items]="people" [itemTemplate]="custom() ? person : undefined"
      searchLabel="Search people" [(query)]="query" [(descending)]="descending" (selected)="selected.set($event)" (refresh)="refreshes.set(refreshes() + 1)" />
  `,
})
class PeopleHost {
  readonly people = [
    { id: 'ada', label: 'Ada Lovelace', description: 'Designer' },
    { id: 'grace', label: 'Grace Hopper', description: 'Engineer' },
    { id: 'off', label: 'Unavailable', description: 'Inactive account', disabled: true },
  ];
  readonly custom = signal(true);
  readonly query = signal('');
  readonly descending = signal(false);
  readonly selected = signal('');
  readonly refreshes = signal(0);
}

test('a filtered custom row can be the first selection and emits its stable ID', async () => {
  const r = await render(PeopleHost);
  await fireEvent.changeText(screen.getByLabelText('Search people'), 'engineer');
  expect(screen.queryByRole('button', { name: 'Ada Lovelace' })).toBeNull();
  expect(screen.getByText('0 · Grace Hopper')).toBeTruthy();
  await userEvent.press(screen.getByRole('button', { name: 'Grace Hopper' }));
  expect(r.instance.selected()).toBe('grace');
});

test('custom rows keep item context, filtering, sorting and disabled selection', async () => {
  const r = await render(PeopleHost);
  expect(screen.queryByText('Reverse order')).toBeNull();
  expect(screen.queryByText('Refresh')).toBeNull();
  await userEvent.setup().press(screen.getByRole('button', { name: 'Refresh' }));
  expect(r.instance.refreshes()).toBe(1);
  expect(screen.getByRole('image', { name: 'Ada Lovelace' })).toBeTruthy();
  expect(screen.getByText('0 · Ada Lovelace')).toBeTruthy();
  await userEvent.setup().press(screen.getByRole('button', { name: 'Ada Lovelace' }));
  expect(r.instance.selected()).toBe('ada');
  await userEvent.setup().press(screen.getByRole('button', { name: 'Unavailable' }));
  expect(r.instance.selected()).toBe('ada');
  await fireEvent.changeText(screen.getByLabelText('Search people'), 'engineer');
  expect(screen.getByText('0 · Grace Hopper')).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Ada Lovelace' })).toBeNull();
  await fireEvent.changeText(screen.getByLabelText('Search people'), '');
  r.instance.descending.set(true);
  await settle();
  expect(screen.getByText('0 · Unavailable')).toBeTruthy();
  expect(screen.getByText('2 · Ada Lovelace')).toBeTruthy();
  r.instance.custom.set(false);
  await settle();
  expect(screen.queryByRole('image', { name: 'Ada Lovelace' })).toBeNull();
  expect(screen.getByText('Ada Lovelace')).toBeTruthy();
  expect(screen.getByText('Designer')).toBeTruthy();
});

@Component({
  imports: [View, Pressable, AnimatedStyle, NeuDataViewRowMotionDirective],
  template: `<view><pressable [neuDataRowIndex]="index()" #motion="neuDataRowMotion" [animatedStyle]="motion.animated" accessibilityRole="button" accessibilityLabel="Ada" /></view>`,
})
class MovingRowHost { readonly index = signal(0); }

test('a retained row eases an index change and can reverse direction while moving', async () => {
  const r = await render(MovingRowHost, {
    providers: [{ provide: NEU_THEME, useValue: signal({ ...NEU_LIGHT_TOKENS, duration: 80 }) }],
  });
  const row = screen.getByRole('button', { name: 'Ada' });
  await fireEvent.layout(row, { x: 0, y: 100, width: 300, height: 66 });
  let calls = 0;
  vi.spyOn(r.componentRef.injector.get(HostEngine), 'measure').mockImplementation((_node, callback) => {
    const offset = Number(screen.getByRole('button', { name: 'Ada' }).props.transform?.[0]?.translateY ?? 0);
    const y = calls++ % 2 === 0 ? 500 : 500 + (r.instance.index() === 1 ? 0 : 100) + offset;
    callback({ x: 0, y, width: 300, height: 66 });
  });
  r.instance.index.set(1);
  await settle();
  expect(Number(screen.getByRole('button', { name: 'Ada' }).props.transform?.[0]?.translateY)).toBeGreaterThan(0);
  await fireEvent.layout(row, { x: 0, y: 100, width: 300, height: 66 });
  r.instance.index.set(0);
  await settle();
  await vi.waitFor(() => expect(screen.getByRole('button', { name: 'Ada' }).props.transform?.[0]?.translateY).toBe(0));
  await vi.waitFor(() => expect(screen.getByRole('button', { name: 'Ada' }).props.opacity).toBe(1));
});

test('same-index layout notifications do not reintroduce a translated press target', async () => {
  await render(MovingRowHost);
  const row = screen.getByRole('button', { name: 'Ada' });
  await fireEvent.layout(row, { x: 0, y: 78, width: 300, height: 66 });
  await fireEvent.layout(row, { x: 0, y: 0, width: 300, height: 66 });
  expect(row.props.transform?.[0]?.translateY).toBe(0);
  await fireEvent.layout(row, { x: 0, y: 0, width: 300, height: 66 });
  expect(row.props.transform?.[0]?.translateY).toBe(0);
});

test.each(['reduced motion', 'zero duration'])('rows remain immediately visible and stationary with %s', async mode => {
  const r = await render(MovingRowHost, {
    providers: [
      { provide: NEU_THEME, useValue: signal({ ...NEU_LIGHT_TOKENS, duration: mode === 'zero duration' ? 0 : 80 }) },
      { provide: Accessibility.SOURCE, useValue: {
        current: async () => ({ reduceMotion: mode === 'reduced motion', screenReader: false, boldText: false, fontScale: 1 }),
        subscribe: () => () => {}, announce: () => {},
      } },
    ],
  });
  if (mode === 'reduced motion') await vi.waitFor(() => expect(r.componentRef.injector.get(Accessibility).reduceMotion()).toBe(true));
  const row = screen.getByRole('button', { name: 'Ada' });
  await fireEvent.layout(row, { x: 0, y: 100, width: 300, height: 66 });
  await fireEvent.layout(row, { x: 0, y: 0, width: 300, height: 66 });
  expect(row.props.transform?.[0]?.translateY).toBe(0);
  expect(row.props.opacity).toBe(1);
});

test('reordering measures the row relative to its parent even without a resize event', async () => {
  const r = await render(MovingRowHost, { providers: [{ provide: NEU_THEME, useValue: signal({ ...NEU_LIGHT_TOKENS, duration: 80 }) }] });
  await fireEvent.layout(screen.getByRole('button', { name: 'Ada' }), { x: 0, y: 100, width: 300, height: 66 });
  let calls = 0;
  const measure = vi.spyOn(r.componentRef.injector.get(HostEngine), 'measure').mockImplementation((_node, callback) => {
    callback({ x: 0, y: calls++ % 2 === 0 ? 500 : 520, width: 300, height: 66 });
  });
  r.instance.index.set(1);
  await settle();
  expect(measure).toHaveBeenCalledTimes(2);
  expect(Number(screen.getByRole('button', { name: 'Ada' }).props.transform?.[0]?.translateY)).toBeGreaterThan(0);
  await vi.waitFor(() => expect(screen.getByRole('button', { name: 'Ada' }).props.transform?.[0]?.translateY).toBe(0));
});

test('stale and unmounted row measurements never restart a movement', async () => {
  const r = await render(MovingRowHost);
  await fireEvent.layout(screen.getByRole('button', { name: 'Ada' }), { x: 0, y: 100, width: 300, height: 66 });
  const pending: Parameters<HostEngine['measure']>[1][] = [];
  vi.spyOn(r.componentRef.injector.get(HostEngine), 'measure').mockImplementation((_node, callback) => { pending.push(callback); });
  r.instance.index.set(1);
  await settle();
  r.instance.index.set(2);
  await settle();
  expect(pending).toHaveLength(2);
  const frame = { x: 0, y: 0, width: 300, height: 66 };
  pending[0](frame);
  expect(pending).toHaveLength(2);
  pending[1](frame);
  expect(pending).toHaveLength(3);
  r.unmount();
  expect(() => pending[2](frame)).not.toThrow();
});
