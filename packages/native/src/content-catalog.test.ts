import { Component, signal } from '@angular/core';
import { Text } from '@ng-native/components';
import {
  cleanup,
  render,
  screen,
  userEvent,
  fireEvent,
} from '@ng-native/testing';
import { afterEach, expect, test, vi } from 'vitest';
import { NeuCalendarComponent } from './calendar/calendar.ts';
import { NeuDateInputComponent } from './date-input/date-input.ts';
import { NeuSliderComponent } from './slider/slider.ts';
import { NeuStepperComponent } from './stepper/stepper.ts';
import { NeuTabsComponent, NeuTabPanelComponent } from './tabs/tabs.ts';
import { NeuDataViewComponent } from './data-view/data-view.ts';
import { NeuTreeComponent } from './tree/tree.ts';
import { NeuTreeSelectComponent } from './tree-select/tree-select.ts';
import { NeuCascadeSelectComponent } from './cascade-select/cascade-select.ts';
import { NeuPickListComponent } from './pick-list/pick-list.ts';
import { NeuNotificationCenterComponent } from './notification-center/notification-center.ts';
import { NeuVirtualListComponent } from './virtual-list/virtual-list.ts';
import { monthCells, isoDate, shiftMonth } from './foundation/calendar.ts';
import { visibleTree } from './foundation/tree.ts';
import type { NeuTreeNode } from './foundation/mobile.ts';
afterEach(cleanup);
const options = [
  { id: 'one', label: 'One', description: 'First' },
  { id: 'two', label: 'Two', description: 'Second' },
  { id: 'off', label: 'Unavailable', disabled: true },
];
const nodes = [
  {
    id: 'group',
    label: 'Group',
    children: [
      { id: 'ada', label: 'Ada' },
      { id: 'off', label: 'Unavailable', disabled: true },
    ],
  },
  {
    id: 'disabled',
    label: 'Disabled group',
    disabled: true,
    children: [{ id: 'hidden', label: 'Hidden child' }],
  },
];
const press = async (name: string) =>
  userEvent.setup().press(screen.getByRole('button', { name }));
const choose = async (name: string) =>
  userEvent.setup().press(screen.getByRole('radio', { name }));
@Component({
  selector: 'test-slider-cleanup',
  imports: [NeuSliderComponent],
  template: `@if (shown()) {
    <neu-slider
      label="Cleanup probe"
      [(value)]="value"
      [disabled]="disabled()"
    />
  }`,
})
class SliderHost {
  readonly shown = signal(true);
  readonly disabled = signal(false);
  readonly value = signal(50);
}
test('calendar dates validate leap days and preserve year boundaries', () => {
  expect(isoDate('2024-02-29')).not.toBeNull();
  expect(isoDate('2025-02-29')).toBeNull();
  expect(isoDate('2024-13-01')).toBeNull();
  expect(shiftMonth('2025-12', 1)).toBe('2026-01');
  expect(shiftMonth('2026-01', -1)).toBe('2025-12');
  const cells = monthCells('2024-02', 1);
  expect(cells).toHaveLength(42);
  expect(cells.filter((x) => x.current)).toHaveLength(29);
});
test('calendar marks event dates and updates the selected agenda without stale indicators', async () => {
  const r = await render(NeuCalendarComponent, {
    inputs: {
      month: '2026-10',
      value: '2026-10-16',
      events: [
        { id: 'review', label: 'Release review', date: '2026-10-16' },
        { id: 'planning', label: 'Planning', date: '2026-10-20' },
        { id: 'bad', label: 'Invalid event', date: 'not-a-date' },
      ],
    },
  });
  expect(
    screen.getByRole('button', { name: '2026-10-16' }).props.accessibilityHint,
  ).toBe('Day with events');
  expect(screen.getByText('Release review')).toBeTruthy();
  expect(screen.queryByText('Planning')).toBeNull();
  await press('2026-10-20');
  expect(screen.getByText('Planning')).toBeTruthy();
  expect(screen.queryByText('Release review')).toBeNull();
  await r.rerender({ inputs: { events: [] } });
  expect(screen.getByText('No events on this day')).toBeTruthy();
  expect(
    screen.getByRole('button', { name: '2026-10-20' }).props.accessibilityHint,
  ).toBeNull();
});
test('calendar requests app-owned event changes without mutating entries and guards readonly', async () => {
  const entry = { id: 'review', label: 'Release review', date: '2026-10-16' };
  const create = vi.fn(),
    edit = vi.fn(),
    remove = vi.fn();
  const r = await render(NeuCalendarComponent, {
    inputs: { value: '2026-10-16', events: [entry], editable: true },
    on: {
      eventCreateRequested: create,
      eventEditRequested: edit,
      eventDeleteRequested: remove,
    },
  });
  await press('Add event');
  await press('Edit Release review');
  await press('Delete Release review');
  expect(create).toHaveBeenCalledWith('2026-10-16');
  expect(edit).toHaveBeenCalledWith(entry);
  expect(remove).toHaveBeenCalledWith(entry);
  expect(r.instance.events()).toEqual([entry]);
  await r.rerender({ inputs: { readonly: true } });
  await press('Add event');
  await press('Edit Release review');
  await press('Delete Release review');
  expect(create).toHaveBeenCalledOnce();
  expect(edit).toHaveBeenCalledOnce();
  expect(remove).toHaveBeenCalledOnce();
});
test('calendar supports date-only usage without an agenda or event actions', async () => {
  await render(NeuCalendarComponent, {
    inputs: { value: '2026-10-16', showAgenda: false, editable: true },
  });
  expect(screen.queryByText('Agenda')).toBeNull();
  expect(screen.queryByRole('button', { name: 'Add event' })).toBeNull();
  await press('2026-10-20');
  expect(
    screen.getByRole('button', { name: '2026-10-20' }).props.accessibilityState,
  ).toMatchObject({ selected: true });
});
test('calendar guards bounds, chooses a leap date and displays its agenda', async () => {
  const r = await render(NeuCalendarComponent, {
    inputs: {
      month: '2024-02',
      min: '2024-02-10',
      max: '2024-02-29',
      events: [{ id: 'meet', label: 'Review', date: '2024-02-29' }],
    },
  });
  await press('2024-02-09');
  expect(r.instance.value()).toBe('');
  await press('2024-02-29');
  expect(r.instance.value()).toBe('2024-02-29');
  expect(screen.getByText('Review')).toBeTruthy();
  await press('Next month');
  expect(r.instance.month()).toBe('2024-02');
});
test('calendar navigation crosses December and handles invalid locales', async () => {
  const r = await render(NeuCalendarComponent, {
    inputs: { month: '2025-12', locale: '!' },
  });
  await press('Next month');
  expect(r.instance.month()).toBe('2026-01');
  expect(screen.getByText('2026-01')).toBeTruthy();
});
test('calendar drills from years to months to days without prematurely selecting a date', async () => {
  const touch = vi.fn();
  const r = await render(NeuCalendarComponent, {
    inputs: { month: '2026-10', min: '2024-03-10', max: '2028-08-20' },
    on: { touch },
  });
  await press('October');
  expect(screen.getByRole('button', { name: 'January' })).toBeTruthy();
  await press('March');
  expect(r.instance.month()).toBe('2026-03');
  expect(r.instance.value()).toBe('');
  expect(touch).not.toHaveBeenCalled();
  await press('2026');
  await press('2024');
  expect(
    screen.getByRole('button', { name: 'January' }).props.accessibilityState,
  ).toMatchObject({ disabled: true });
  await press('January');
  expect(r.instance.month()).toBe('2024-03');
  await press('April');
  await press('2024-04-15');
  expect(r.instance.value()).toBe('2024-04-15');
  expect(touch).toHaveBeenCalledOnce();
});
test('calendar pages years, respects disabled state and does not edit a readonly date', async () => {
  const r = await render(NeuCalendarComponent, {
    inputs: { month: '2026-10', readonly: true },
  });
  await press('2026');
  await press('Next 12 years');
  await press('2030');
  await press('May');
  await press('2030-05-12');
  expect(r.instance.value()).toBe('');
  expect(r.instance.month()).toBe('2030-05');
  await r.rerender({ inputs: { disabled: true } });
  await press('May');
  expect(screen.queryByRole('button', { name: 'January' })).toBeNull();
  await press('Next month');
  expect(r.instance.month()).toBe('2030-05');
});
test('date input commits ISO values through its sheet and preserves readonly', async () => {
  const r = await render(NeuDateInputComponent, {
    inputs: {
      label: 'Date',
      value: '2024-02-10',
      min: '2024-02-10',
      max: '2024-02-29',
    },
  });
  await press('Date');
  await press('2024-02-29');
  expect(r.instance.value()).toBe('2024-02-29');
  expect(screen.queryByRole('button', { name: '2024-02-10' })).toBeNull();
  await r.rerender({ inputs: { readonly: true } });
  await press('Date');
  expect(screen.queryByRole('button', { name: '2024-02-10' })).toBeNull();
});
test('date input exposes its displayed date, locale changes and empty placeholder to screen readers', async () => {
  const r = await render(NeuDateInputComponent, {
    inputs: { label: 'Date', placeholder: 'Pick a date' },
  });
  const accessibleValue = () =>
    screen.getByRole('button', { name: 'Date' }).props['accessibilityValue'];
  expect(accessibleValue()).toMatchObject({ text: 'Pick a date' });
  await r.rerender({
    inputs: { value: '2024-02-10', min: '2024-02-10', max: '2024-02-29' },
  });
  expect(accessibleValue()).toMatchObject({ text: 'Feb 10, 2024' });
  await press('Date');
  await press('2024-02-29');
  expect(r.instance.value()).toBe('2024-02-29');
  expect(accessibleValue()).toMatchObject({ text: 'Feb 29, 2024' });
  await r.rerender({ inputs: { locale: 'es' } });
  const spanish = new Intl.DateTimeFormat('es', {
    dateStyle: 'medium',
    timeZone: 'UTC',
  }).format(new Date('2024-02-29T12:00:00Z'));
  expect(screen.getByText(spanish)).toBeTruthy();
  expect(accessibleValue()).toMatchObject({ text: spanish });
  await r.rerender({ inputs: { locale: 'invalid!', readonly: true } });
  expect(accessibleValue()).toMatchObject({ text: '2024-02-29' });
  await r.rerender({ inputs: { value: '' } });
  expect(accessibleValue()).toMatchObject({ text: 'Pick a date' });
});
test('slider accepts native layout and touch positions, snaps steps and guards readonly', async () => {
  const r = await render(NeuSliderComponent, {
    inputs: { label: 'Volume', min: 0, max: 10, step: 2 },
  });
  const slider = screen.getByRole('adjustable', { name: 'Volume' });
  expect(slider.props.accessible).toBe(true);
  await fireEvent(slider, 'accessibilityAction', { actionName: 'increment' });
  expect(r.instance.value()).toBe(2);
  await fireEvent.layout(slider, { width: 224, height: 48 });
  await fireEvent(slider, 'touchStart', { locationX: 112 });
  expect(r.instance.value()).toBe(6);
  await fireEvent(slider, 'touchMove', { locationX: 400 });
  expect(r.instance.value()).toBe(10);
  await fireEvent(slider, 'touchEnd', { locationX: 400 });
  await press('Decrease Volume');
  expect(r.instance.value()).toBe(8);
  await r.rerender({ inputs: { readonly: true } });
  await fireEvent(slider, 'touchMove', { locationX: 12 });
  expect(r.instance.value()).toBe(8);
});
test('slider hides step buttons without replacing the adjustable track or losing gestures', async () => {
  const r = await render(NeuSliderComponent, {
    inputs: { label: 'Touch volume', value: 50, step: 5 },
  });
  expect(
    screen.getByRole('button', { name: 'Decrease Touch volume' }),
  ).toBeDefined();
  const track = screen.getByRole('adjustable', { name: 'Touch volume' });
  await r.rerender({ inputs: { showButtons: false } });
  expect(
    screen.queryByRole('button', { name: 'Decrease Touch volume' }),
  ).toBeNull();
  expect(
    screen.queryByRole('button', { name: 'Increase Touch volume' }),
  ).toBeNull();
  expect(screen.getByRole('adjustable', { name: 'Touch volume' })).toBe(track);
  await fireEvent.layout(track, { width: 324, height: 48 });
  await fireEvent(track, 'touchStart', { locationX: 12 });
  await fireEvent(track, 'touchMove', { locationX: 237 });
  expect(r.instance.value()).toBe(75);
  await fireEvent(track, 'touchEnd', { locationX: 324 });
  expect(r.instance.value()).toBe(100);
  await fireEvent(track, 'accessibilityAction', { actionName: 'decrement' });
  expect(r.instance.value()).toBe(95);
  await r.rerender({ inputs: { readonly: true } });
  await fireEvent(track, 'touchStart', { locationX: 12 });
  await fireEvent(track, 'touchEnd', { locationX: 12 });
  await fireEvent(track, 'accessibilityAction', { actionName: 'decrement' });
  expect(r.instance.value()).toBe(95);
  await r.rerender({ inputs: { readonly: false, disabled: true } });
  await fireEvent(track, 'accessibilityAction', { actionName: 'decrement' });
  expect(r.instance.value()).toBe(95);
  await r.rerender({ inputs: { disabled: false, showButtons: true } });
  await press('Decrease Touch volume');
  expect(r.instance.value()).toBe(90);
});
test('slider commits the final release position at both endpoints after an incomplete move', async () => {
  const r = await render(NeuSliderComponent, {
    inputs: { label: 'Endpoint probe', step: 5, value: 50 },
  });
  const slider = screen.getByRole('adjustable', { name: 'Endpoint probe' });
  await fireEvent.layout(slider, { width: 1140, height: 48 });
  await fireEvent(slider, 'touchStart', { locationX: 570 });
  await fireEvent(slider, 'touchMove', { locationX: 68 });
  expect(r.instance.value()).toBe(5);
  await fireEvent(slider, 'touchEnd', { locationX: 0 });
  expect(r.instance.value()).toBe(0);
  await fireEvent(slider, 'touchStart', { locationX: 12 });
  await fireEvent(slider, 'touchMove', { locationX: 1072 });
  expect(r.instance.value()).toBe(95);
  await fireEvent(slider, 'touchEnd', { locationX: 1140 });
  expect(r.instance.value()).toBe(100);
});
test('slider release preserves readonly and disabled values', async () => {
  const r = await render(NeuSliderComponent, {
    inputs: { label: 'Guard probe', value: 50, readonly: true },
  });
  const slider = screen.getByRole('adjustable', { name: 'Guard probe' });
  await fireEvent.layout(slider, { width: 1140, height: 48 });
  await fireEvent(slider, 'touchEnd', { locationX: 0 });
  expect(r.instance.value()).toBe(50);
  await r.rerender({ inputs: { readonly: false, disabled: true } });
  await fireEvent(slider, 'touchEnd', { locationX: 1140 });
  expect(r.instance.value()).toBe(50);
});

test('slider cancels a gesture without committing its cancelled position and can drag again', async () => {
  const r = await render(NeuSliderComponent, {
    inputs: { label: 'Drag probe', value: 50 },
  });
  const slider = screen.getByRole('adjustable', { name: 'Drag probe' });
  await fireEvent.layout(slider, { width: 224, height: 48 });
  await fireEvent(slider, 'touchStart', { locationX: 112 });
  await fireEvent(slider, 'touchMove', { locationX: 162 });
  expect(r.instance.value()).toBe(75);
  await fireEvent(slider, 'touchCancel', { locationX: 212 });
  expect(r.instance.value()).toBe(75);
  await fireEvent(slider, 'touchMove', { locationX: 12 });
  expect(r.instance.value()).toBe(75);
  await fireEvent(slider, 'touchStart', { locationX: 12 });
  expect(r.instance.value()).toBe(0);
  await fireEvent(slider, 'touchEnd', { locationX: 212 });
  expect(r.instance.value()).toBe(100);
});

test('slider stops changing when disabled during a drag and releases its responder on destruction', async () => {
  const r = await render(SliderHost);
  const slider = screen.getByRole('adjustable', { name: 'Cleanup probe' });
  await fireEvent.layout(slider, { width: 224, height: 48 });
  await fireEvent(slider, 'touchStart', { locationX: 112 });
  expect(r.fabric.responderCalls.at(-1)).toMatchObject({
    isResponder: true,
    block: true,
  });
  r.instance.disabled.set(true);
  await r.detectChanges();
  await fireEvent(slider, 'touchMove', { locationX: 212 });
  expect(r.instance.value()).toBe(50);
  r.instance.shown.set(false);
  await r.detectChanges();
  r.instance.disabled.set(false);
  r.instance.shown.set(true);
  await r.detectChanges();
  const replacement = screen.getByRole('adjustable', { name: 'Cleanup probe' });
  await fireEvent.layout(replacement, { width: 224, height: 48 });
  await fireEvent(replacement, 'touchStart', { locationX: 12 });
  expect(r.instance.value()).toBe(0);
  await fireEvent(replacement, 'touchEnd', { locationX: 212 });
  expect(r.instance.value()).toBe(100);
});
test('wizard prevents skipping incomplete steps and finishes only after final validation', async () => {
  const cb = vi.fn();
  const r = await render(NeuStepperComponent, {
    inputs: { steps: options.slice(0, 2), linear: true },
    on: { finished: cb },
  });
  await press('Two');
  await press('Next');
  expect(r.instance.activeStep()).toBe(0);
  await r.rerender({ inputs: { completed: ['one'] } });
  await press('Next');
  expect(r.instance.activeStep()).toBe(1);
  await press('Finish');
  expect(cb).not.toHaveBeenCalled();
  await r.rerender({ inputs: { completed: ['one', 'two'] } });
  await press('Finish');
  expect(cb).toHaveBeenCalledOnce();
  await press('Previous');
  expect(r.instance.activeStep()).toBe(0);
});
@Component({
  imports: [Text, NeuTabsComponent, NeuTabPanelComponent],
  template: `<neu-tabs [tabs]="options"
    ><neu-tab-panel id="one"><text>First panel</text></neu-tab-panel
    ><neu-tab-panel id="two"><text>Second panel</text></neu-tab-panel></neu-tabs
  >`,
})
class TabsHost {
  readonly options = options;
}
test('tabs initializes an enabled selection and mounts only the active projected panel', async () => {
  await render(TabsHost);
  expect(screen.getByText('First panel')).toBeTruthy();
  expect(screen.queryByText('Second panel')).toBeNull();
  await userEvent.setup().press(screen.getByRole('tab', { name: 'Two' }));
  expect(screen.queryByText('First panel')).toBeNull();
  expect(screen.getByText('Second panel')).toBeTruthy();
  await userEvent
    .setup()
    .press(screen.getByRole('tab', { name: 'Unavailable' }));
  expect(screen.getByText('Second panel')).toBeTruthy();
});
test('data view searches, changes sort order and emits selection', async () => {
  const cb = vi.fn();
  const r = await render(NeuDataViewComponent, {
    inputs: { items: options },
    on: { selected: cb },
  });
  await fireEvent.changeText(screen.getByLabelText('Search items'), 'Second');
  expect(screen.queryByRole('button', { name: 'One' })).toBeNull();
  await press('Two');
  expect(cb.mock.calls).toEqual([['two']]);
  await r.rerender({ inputs: { query: '' } });
  await press('Reverse order');
  expect(r.instance.descending()).toBe(true);
  await press('Unavailable');
  expect(cb).toHaveBeenCalledOnce();
});
test('data view invalidates cached search when parent data and sort order change', async () => {
  const r = await render(NeuDataViewComponent, {
    inputs: {
      items: [{ id: 'one', label: 'Before', description: 'matches' }],
      query: 'matches',
    },
  });
  expect(screen.getByRole('button', { name: 'Before' })).toBeTruthy();
  await r.rerender({
    inputs: {
      items: [
        { id: 'one', label: 'After', description: 'updated' },
        { id: 'two', label: 'Another', description: 'updated' },
      ],
      query: 'updated',
      descending: true,
    },
  });
  expect(screen.queryByRole('button', { name: 'Before' })).toBeNull();
  const labels = screen
    .getAllByRole('button')
    .map((row) => row.props.accessibilityLabel)
    .filter((name) => name === 'After' || name === 'Another');
  expect(labels).toEqual(['Another', 'After']);
  await r.rerender({ inputs: { query: 'matches' } });
  expect(screen.queryByRole('button', { name: 'After' })).toBeNull();
});
test('data view exposes loading, failure and empty states', async () => {
  const r = await render(NeuDataViewComponent, { inputs: { loading: true } });
  expect(screen.getByRole('progressbar')).toBeTruthy();
  await r.rerender({ inputs: { loading: false, error: 'Offline' } });
  expect(screen.getByText('Offline')).toBeTruthy();
  await r.rerender({ inputs: { error: '' } });
  expect(screen.getByText('No items')).toBeTruthy();
});
test('tree expands branches, chooses leaves and propagates disabled ancestors', async () => {
  const r = await render(NeuTreeComponent, {
    inputs: { nodes, leafOnly: true },
  });
  await press('Group Expand');
  await choose('Ada');
  expect(r.instance.value()).toBe('ada');
  await choose('Unavailable');
  expect(r.instance.value()).toBe('ada');
  await press('Disabled group Expand');
  expect(screen.queryByRole('radio', { name: 'Hidden child' })).toBeNull();
  await choose('Group');
  expect(r.instance.value()).toBe('ada');
});
test('tree traversal handles malformed cyclic input without recursing forever', () => {
  const node: { id: string; label: string; children?: NeuTreeNode[] } = {
    id: 'root',
    label: 'Root',
  };
  node.children = [node];
  expect(visibleTree([node], ['root'])).toHaveLength(1);
});
test('tree select opens a hierarchy, selects a leaf and closes', async () => {
  const r = await render(NeuTreeSelectComponent, {
    inputs: { label: 'Owner', nodes },
  });
  await press('Owner');
  await press('Group Expand');
  await choose('Ada');
  expect(r.instance.value()).toBe('ada');
  expect(screen.queryByRole('radio', { name: 'Ada' })).toBeNull();
  expect(
    screen.getByRole('button', { name: 'Owner' }).props.accessibilityValue,
  ).toMatchObject({ text: 'Ada' });
});
test('cascade selection navigates levels and stores only a chosen leaf', async () => {
  const r = await render(NeuCascadeSelectComponent, {
    inputs: { label: 'Location', nodes },
  });
  await press('Location');
  await press('Group');
  expect(r.instance.value()).toBe('');
  await choose('Ada');
  expect(r.instance.value()).toBe('ada');
  expect(screen.queryByRole('radio', { name: 'Ada' })).toBeNull();
  await press('Location');
  await press('Back');
  expect(screen.getByRole('button', { name: 'Group' })).toBeTruthy();
  await press('Disabled group');
  expect(r.instance.value()).toBe('ada');
});
test('pick list adds, reorders and removes without selecting disabled entries', async () => {
  const r = await render(NeuPickListComponent, {
    inputs: { label: 'Team', options },
  });
  await press('Add One');
  await press('Add Two');
  await press('Move up Two');
  expect(r.instance.value()).toEqual(['two', 'one']);
  await press('Add Unavailable');
  expect(r.instance.value()).toEqual(['two', 'one']);
  await press('Remove Two');
  expect(r.instance.value()).toEqual(['one']);
  await r.rerender({ inputs: { readonly: true } });
  await press('Remove One');
  expect(r.instance.value()).toEqual(['one']);
});
test('notification center tracks read IDs and emits activation only for enabled items', async () => {
  const cb = vi.fn();
  const r = await render(NeuNotificationCenterComponent, {
    inputs: { items: options },
    on: { activated: cb },
  });
  await press('One · Unread');
  await press('Unavailable · Unread');
  expect(r.instance.readIds()).toEqual(['one']);
  expect(cb.mock.calls).toEqual([['one']]);
  await press('Mark all read');
  expect(r.instance.readIds()).toEqual(['one', 'two', 'off']);
});
test('native virtual list renders a bounded window from a large data set', async () => {
  const items = Array.from({ length: 10000 }, (_, i) => ({
    id: String(i),
    label: 'Item ' + i,
  }));
  const r = await render(NeuVirtualListComponent, {
    inputs: { items, height: 400 },
  });
  const scroll = r.fabric.find('ScrollView');
  expect(scroll).toBeTruthy();
  await fireEvent.layout(scroll!, { width: 320, height: 400 });
  const rows = screen.queryAllByRole('button');
  expect(rows.length).toBeGreaterThan(0);
  expect(rows.length).toBeLessThan(100);
  expect(screen.queryByRole('button', { name: 'Item 9999' })).toBeNull();
  r.instance.scrollToTop();
  r.unmount();
  expect(r.componentRef.hostView.destroyed).toBe(true);
});

test('virtual rows never reuse an accessible action identity for a different item', async () => {
  const items = Array.from({ length: 100 }, (_, index) => ({ id: String(index), label: 'Project ' + index }));
  const r = await render(NeuVirtualListComponent, { inputs: { items, height: 200, estimatedItemHeight: 60 } });
  const scroll = r.fabric.find('ScrollView')!;
  const identities = new Map(screen.queryAllByRole('button').map(node => [node.reactTag, node.props.accessibilityLabel]));
  let retained = 0;
  for (const y of [600, 1800, 3000]) {
    await fireEvent.scroll(scroll, { contentOffset: { x: 0, y }, layoutMeasurement: { width: 320, height: 200 }, contentSize: { width: 320, height: 6000 } });
    for (const node of screen.queryAllByRole('button')) {
      if (identities.has(node.reactTag)) {
        retained++;
        expect(node.props.accessibilityLabel).toBe(identities.get(node.reactTag));
      } else identities.set(node.reactTag, node.props.accessibilityLabel);
    }
  }
  expect(retained).toBeGreaterThan(0);
});
