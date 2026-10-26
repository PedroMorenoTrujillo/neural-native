import { Component, signal } from '@angular/core';
import { Text } from '@ng-native/components';
import {
  cleanup,
  render,
  screen,
  userEvent,
  fireEvent,
  type FakeFabricNode,
} from '@ng-native/testing';
import { afterEach, expect, test, vi } from 'vitest';
import { NeuAvatarGroupComponent } from './avatar-group/avatar-group.ts';
import { NeuEmptyStateComponent } from './empty-state/empty-state.ts';
import { NeuFormFieldComponent } from './form-field/form-field.ts';
import { NeuMeterGroupComponent } from './meter-group/meter-group.ts';
import { NeuSkeletonComponent } from './skeleton/skeleton.ts';
import { NeuStatsCardComponent } from './stats-card/stats-card.ts';
import { NeuTimelineComponent } from './timeline/timeline.ts';
import { NeuToolbarComponent } from './toolbar/toolbar.ts';
import { NeuSpeedDialComponent } from './speed-dial/speed-dial.ts';
import { NeuModalComponent } from './modal/modal.ts';
import { NeuBottomSheetComponent } from './bottom-sheet/bottom-sheet.ts';
import { NEU_LIGHT_TOKENS, NEU_DARK_TOKENS, NEU_THEME } from './foundation/index.ts';
import { neuTonePalette } from './foundation/tone.ts';
afterEach(cleanup);
test('avatar group limits visible people and announces the remainder', async () => {
  await render(NeuAvatarGroupComponent, {
    inputs: {
      max: 2,
      items: [
        { id: 'a', label: 'Ada' },
        { id: 'b', label: 'Grace' },
        { id: 'c', label: 'Linus' },
      ],
    },
  });
  expect(screen.queryAllByRole('image')).toHaveLength(2);
  expect(screen.getByLabelText('1 more people')).toBeTruthy();
});
test('avatar group preserves individual tones while shared size, fallback tone and visible count change', async () => {
  const items = [
    { id: 'ada', label: 'Ada Lovelace' },
    { id: 'grace', label: 'Grace Hopper', tone: 'success' as const },
    { id: 'alan', label: 'Alan Turing' },
  ];
  const r = await render(NeuAvatarGroupComponent, { inputs: { items, max: 2 } });
  const verify = (diameter: number, tone: 'brand' | 'danger') => {
    expect(screen.getByRole('image', { name: 'Ada Lovelace' }).props).toMatchObject({
      width: diameter, height: diameter,
      backgroundColor: neuTonePalette(NEU_LIGHT_TOKENS, tone).tonal,
    });
    expect(screen.getByRole('image', { name: 'Grace Hopper' }).props.backgroundColor)
      .toBe(neuTonePalette(NEU_LIGHT_TOKENS, 'success').tonal);
    expect(screen.getByLabelText('1 more people').props.backgroundColor)
      .toBe(neuTonePalette(NEU_LIGHT_TOKENS, tone).tonal);
  };
  verify(40, 'brand');
  await r.rerender({ inputs: { size: 'sm', tone: 'danger' } });
  verify(32, 'danger');
  await r.rerender({ inputs: { size: 'lg', max: 3 } });
  expect(screen.getByRole('image', { name: 'Alan Turing' }).props.width).toBe(48);
  expect(screen.queryByLabelText('1 more people')).toBeNull();
});
test('empty state exposes its recovery action', async () => {
  const cb = vi.fn();
  await render(NeuEmptyStateComponent, {
    inputs: { title: 'No files', actionLabel: 'Choose files' },
    on: { action: cb },
  });
  await userEvent
    .setup()
    .press(screen.getByRole('button', { name: 'Choose files' }));
  expect(cb).toHaveBeenCalledOnce();
});
@Component({
  imports: [Text, NeuFormFieldComponent],
  template: `<neu-form-field
    label="Email"
    [required]="true"
    [invalid]="true"
    error="Invalid email"
    ><text>Projected control</text></neu-form-field
  >`,
})
class FieldHost {}
test('form field preserves projection and announces errors', async () => {
  await render(FieldHost);
  expect(screen.getByText('Projected control')).toBeTruthy();
  expect(screen.getByText('Email *')).toBeTruthy();
  expect(screen.getByText('Invalid email')).toBeTruthy();
});
test('meter group normalizes negative values and exposes per-segment progress', async () => {
  await render(NeuMeterGroupComponent, {
    inputs: {
      items: [
        { id: 'a', label: 'Used', value: 25 },
        { id: 'b', label: 'Free', value: 75 },
        { id: 'c', label: 'Invalid', value: -5 },
      ],
    },
  });
  expect(
    screen.getByRole('progressbar', { name: 'Used' }).props[
      'accessibilityValue'
    ],
  ).toMatchObject({ now: 25 });
  expect(
    screen.getByRole('progressbar', { name: 'Invalid' }).props[
      'accessibilityValue'
    ],
  ).toMatchObject({ now: 0 });
});
test('skeleton announces loading independently of its visual animation', async () => {
  await render(NeuSkeletonComponent, {
    inputs: { label: 'Loading contacts', lines: 3 },
  });
  expect(
    screen.getByRole('progressbar', { name: 'Loading contacts' }).props[
      'accessibilityState'
    ],
  ).toMatchObject({ busy: true });
});
test('stats card renders its number and meaningful change text', async () => {
  await render(NeuStatsCardComponent, {
    inputs: { label: 'Revenue', value: '€1200', change: '+12% vs last month' },
  });
  expect(screen.getByText('€1200')).toBeTruthy();
  expect(screen.getByText('+12% vs last month')).toBeTruthy();
});
test('stats card has an optional decorative icon that follows the theme and tone', async () => {
  const r = await render(NeuStatsCardComponent, {
    inputs: { label: 'Revenue', value: '$1,250', svg: '<svg viewBox="0 0 24 24"><path d="M3 17 9 11 13 15 21 7" stroke="currentColor" fill="none"/></svg>' },
    providers: [{ provide: NEU_THEME, useValue: signal(NEU_DARK_TOKENS) }],
  });
  const nodes = (node: FakeFabricNode | undefined): FakeFabricNode[] => node ? [node, ...node.children.flatMap(nodes)] : [];
  const iconSurface = () => nodes(r.fabric.find('View')).find(node => node.props.accessibilityElementsHidden === true);
  expect(r.fabric.find('RNSVGPath')).toBeTruthy();
  expect(iconSurface()?.props).toMatchObject({ accessible: false, importantForAccessibility: 'no-hide-descendants', backgroundColor: neuTonePalette(NEU_DARK_TOKENS, 'brand').tonal });
  await r.rerender({ inputs: { tone: 'danger' } });
  expect(iconSurface()?.props.backgroundColor).toBe(neuTonePalette(NEU_DARK_TOKENS, 'danger').tonal);
  await r.rerender({ inputs: { svg: '' } });
  expect(r.fabric.find('RNSVGPath')).toBeUndefined();
  expect(iconSurface()).toBeUndefined();
  expect(screen.getByText('$1,250')).toBeTruthy();
});
test('timeline presents status descriptions in source order', async () => {
  await render(NeuTimelineComponent, {
    inputs: {
      items: [
        { id: 'a', label: 'Ordered', description: 'Confirmed', done: true },
        { id: 'b', label: 'Delivered', description: 'Tomorrow' },
      ],
    },
  });
  expect(screen.getByText('Confirmed')).toBeTruthy();
  expect(screen.getByText('Tomorrow')).toBeTruthy();
});
test('timeline exposes changing completion status with localized labels and preserves plain milestones', async () => {
  const items = [
    { id: 'review', label: 'Device review', date: 'Wednesday', done: false },
    { id: 'release', label: 'Release notes', done: true },
    { id: 'meeting', label: 'Team meeting' },
  ];
  const r = await render(NeuTimelineComponent, { inputs: { items } });
  expect(screen.getByLabelText('Device review, Pending')).toBeTruthy();
  expect(screen.getByLabelText('Release notes, Completed')).toBeTruthy();
  expect(screen.getByLabelText('Team meeting')).toBeTruthy();
  expect(screen.getByText('Wednesday')).toBeTruthy();

  await r.rerender({ inputs: { items: items.map(item => item.id === 'review' ? { ...item, done: true } : item) } });
  expect(screen.queryByLabelText('Device review, Pending')).toBeNull();
  expect(screen.getByLabelText('Device review, Completed')).toBeTruthy();
  expect(screen.getByText('Device review')).toBeTruthy();

  await r.rerender({ inputs: { items, completedLabel: 'Completado', pendingLabel: 'Pendiente' } });
  expect(screen.getByLabelText('Device review, Pendiente')).toBeTruthy();
  expect(screen.getByLabelText('Release notes, Completado')).toBeTruthy();
  expect(screen.getByLabelText('Team meeting')).toBeTruthy();
});
test('toolbar supports named icon and text actions and respects both disabled states', async () => {
  const cb = vi.fn();
  const r = await render(NeuToolbarComponent, {
    inputs: { actions: [
      { id: 'save', label: 'Save note', svg: '<svg viewBox="0 0 24 24"><path d="m5 12 4 4L19 6" /></svg>' },
      { id: 'share', label: 'Share' },
      { id: 'archive', label: 'Archive', disabled: true },
    ] },
    on: { activated: cb },
  });
  await userEvent.setup().press(screen.getByRole('button', { name: 'Save note' }));
  await userEvent.setup().press(screen.getByRole('button', { name: 'Share' }));
  await userEvent.setup().press(screen.getByRole('button', { name: 'Archive' }));
  expect(cb.mock.calls).toEqual([['save'], ['share']]);
  await r.rerender({ inputs: { disabled: true } });
  await userEvent.setup().press(screen.getByRole('button', { name: 'Save note' }));
  expect(cb.mock.calls).toEqual([['save'], ['share']]);
});
test('speed dial toggles inline actions, closes on activation and refuses disabled actions', async () => {
  const cb = vi.fn();
  const r = await render(NeuSpeedDialComponent, {
    inputs: {
      label: 'Create',
      actions: [
        { id: 'note', label: 'New note' },
        { id: 'off', label: 'Unavailable', disabled: true },
      ],
    },
    on: { activated: cb },
  });
  expect(screen.queryByRole('button', { name: 'New note' })).toBeNull();
  await userEvent.setup().press(screen.getByRole('button', { name: 'Create' }));
  expect(r.fabric.find('ModalHostView')).toBeFalsy();
  expect(
    screen.getByRole('button', { name: 'Create' }).props.accessibilityState,
  ).toMatchObject({ expanded: true });
  await userEvent
    .setup()
    .press(screen.getByRole('button', { name: 'Unavailable' }));
  expect(cb).not.toHaveBeenCalled();
  expect(r.instance.open()).toBe(true);
  await userEvent
    .setup()
    .press(screen.getByRole('button', { name: 'New note' }));
  expect(cb.mock.calls).toEqual([['note']]);
  expect(r.instance.open()).toBe(false);
  expect(screen.queryByRole('button', { name: 'New note' })).toBeNull();
  await userEvent.setup().press(screen.getByRole('button', { name: 'Create' }));
  await userEvent.setup().press(screen.getByRole('button', { name: 'Create' }));
  expect(r.instance.open()).toBe(false);
  await r.rerender({ inputs: { open: true, disabled: true } });
  await userEvent
    .setup()
    .press(screen.getByRole('button', { name: 'New note' }));
  await userEvent.setup().press(screen.getByRole('button', { name: 'Create' }));
  expect(r.instance.open()).toBe(true);
  expect(cb.mock.calls).toEqual([['note']]);
});
test('modal handles the native Back request and refuses it while protected', async () => {
  const r = await render(NeuModalComponent, {
    inputs: { title: 'Dialog', open: true },
  });
  await fireEvent(r.fabric.find('ModalHostView')!, 'requestClose', {});
  expect(r.instance.open()).toBe(false);
  await r.rerender({ inputs: { open: false } });
  await r.rerender({ inputs: { open: true, dismissible: false } });
  await fireEvent(r.fabric.find('ModalHostView')!, 'requestClose', {});
  expect(r.instance.open()).toBe(true);
});
test('sheet native swipe dismisses through the same controlled state', async () => {
  const r = await render(NeuBottomSheetComponent, {
    inputs: { title: 'Sheet', open: true },
  });
  await fireEvent(r.fabric.find('ModalHostView')!, 'requestClose', {});
  expect(r.instance.open()).toBe(false);
});
