import { signal } from '@angular/core';
import { cleanup, render, screen, userEvent } from '@ng-native/testing';
import { afterEach, expect, test, vi } from 'vitest';
import { NeuAutocompleteComponent } from './autocomplete/autocomplete.ts';
import { NeuAvatarComponent } from './avatar/avatar.ts';
import { NeuCalendarComponent } from './calendar/calendar.ts';
import { NeuCarouselComponent } from './carousel/carousel.ts';
import { NeuConfirmDialogComponent } from './confirm-dialog/confirm-dialog.ts';
import { NeuDataViewComponent } from './data-view/data-view.ts';
import { NeuDateInputComponent } from './date-input/date-input.ts';
import { NeuGalleryComponent } from './gallery/gallery.ts';
import { NeuImageViewerComponent } from './image-viewer/image-viewer.ts';
import { NeuInputMaskComponent, formatMask } from './input-mask/input-mask.ts';
import { NeuNumberInputComponent } from './number-input/number-input.ts';
import { NeuPanelComponent } from './panel/panel.ts';
import { NeuPasswordComponent } from './password/password.ts';
import { NeuPickListComponent } from './pick-list/pick-list.ts';
import { NeuSkeletonComponent } from './skeleton/skeleton.ts';
import { NeuTextareaComponent } from './textarea/textarea.ts';
import { NeuToastComponent } from './toast/toast.ts';
import { monthCells, shiftMonth, todayISO } from './foundation/calendar.ts';
import { finite } from './foundation/mobile.ts';
import { neuMotionDuration } from './foundation/motion.ts';
import { NEU_LIGHT_TOKENS, NEU_THEME } from './foundation/index.ts';

afterEach(cleanup);
function invoke(instance: object, name: string, ...args: unknown[]): unknown {
  return (instance as Record<string, (...values: unknown[]) => unknown>)[name]!.apply(instance, args);
}
const options = [{ id: 'a', label: 'Alpha' }, { id: 'b', label: 'Beta' }, { id: 'off', label: 'Unavailable', disabled: true }];
const images = [{ id: 'a', label: 'First', uri: 'file:///first.png' }, { id: 'b', label: 'Second', uri: 'file:///second.png' }];
const touch = (pageX?: number, touches?: Record<string, number>[]) => ({ nativeEvent: { pageX, touches } });

test('autocomplete waits for its minimum query length and exposes validation feedback', async () => {
  const r = await render(NeuAutocompleteComponent, { inputs: { label: 'City', options, minLength: 3, invalid: true, touched: true, error: 'Choose a city' } });
  invoke(r.instance, 'search', 'Al');
  await r.detectChanges();
  expect(screen.queryByRole('radio', { name: 'Alpha' })).toBeNull();
  expect(screen.getByText('Choose a city')).toBeTruthy();
  invoke(r.instance, 'search', 'Alpha');
  await r.detectChanges();
  expect(screen.getByRole('radio', { name: 'Alpha' })).toBeTruthy();
  invoke(r.instance, 'choose', 'missing');
  expect(r.instance.value()).toBe('');
});

test.each([
  { component: NeuPasswordComponent, name: 'Password', inputs: {} },
  { component: NeuTextareaComponent, name: 'Notes', inputs: {} },
  { component: NeuInputMaskComponent, name: 'Phone', inputs: { mask: '###-###' } },
])('$name announces its supplied validation error', async ({ component, name, inputs }) => {
  await render<object>(component, { inputs: { ...inputs, label: name, invalid: true, touched: true, error: 'Invalid value' } });
  expect(screen.getByText('Invalid value')).toBeTruthy();
});

test('avatar renders an image with an accessible identity', async () => {
  await render(NeuAvatarComponent, { inputs: { label: 'Ada Lovelace', uri: 'file:///ada.png' } });
  expect(screen.getByRole('image', { name: 'Ada Lovelace' })).toBeTruthy();
});

test('numeric helpers recover from nonfinite values and keep mask character classes distinct', () => {
  expect(finite(Number.NaN, 7)).toBe(7);
  expect(finite(Infinity)).toBe(0);
  expect(neuMotionDuration(Number.NaN, true)).toBe(NEU_LIGHT_TOKENS.duration * 1.8);
  expect(formatMask('q4', 'A-*')).toEqual({ raw: 'q4', display: 'q-4' });
});

test('number input ignores a transient blank edit instead of changing the number to zero', async () => {
  const changed = vi.fn();
  const r = await render(NeuNumberInputComponent, { inputs: { label: 'Quantity', value: 5 }, on: { valueChange: changed } });
  invoke(r.instance, 'edit', '  ');
  expect(r.instance.value()).toBe(5);
  expect(changed).not.toHaveBeenCalled();
});

test('fixed panels preserve projected content when a toggle callback arrives', async () => {
  const r = await render(NeuPanelComponent, { inputs: { title: 'Details', collapsible: false } });
  invoke(r.instance, 'toggle');
  expect(r.instance.collapsed()).toBe(false);
});

test('data view never activates a disabled result or a result while loading', async () => {
  const selected = vi.fn();
  const r = await render(NeuDataViewComponent, { inputs: { items: options }, on: { selected } });
  invoke(r.instance, 'choose', options[2]);
  await r.rerender({ inputs: { loading: true } });
  invoke(r.instance, 'choose', options[0]);
  expect(selected).not.toHaveBeenCalled();
});

test('pick list cannot add unavailable entries, remove disabled entries or reorder past an edge', async () => {
  const touched = vi.fn();
  const r = await render(NeuPickListComponent, { inputs: { label: 'Members', options, value: ['a', 'off', 'b'] }, on: { touch: touched } });
  invoke(r.instance, 'add', 'missing');
  invoke(r.instance, 'remove', 'off');
  invoke(r.instance, 'move', 0, -1);
  invoke(r.instance, 'move', 2, 1);
  expect(r.instance.value()).toEqual(['a', 'off', 'b']);
  expect(touched).not.toHaveBeenCalled();
  invoke(r.instance, 'remove', 'a');
  expect(r.instance.value()).toEqual(['off', 'b']);
});

test.each(['confirm', 'cancel'])('closed confirmation ignores a repeated %s callback', async name => {
  const confirmed = vi.fn(), cancelled = vi.fn();
  const r = await render(NeuConfirmDialogComponent, { inputs: { title: 'Delete?', message: 'Delete this item?', open: false }, on: { confirmed, cancelled } });
  invoke(r.instance, name);
  expect(confirmed).not.toHaveBeenCalled();
  expect(cancelled).not.toHaveBeenCalled();
});

test('calendar helpers reject malformed months without manufacturing dates', () => {
  expect(monthCells('not-a-month')).toEqual([]);
  expect(shiftMonth('2026-13', 1)).toBe(todayISO().slice(0, 7));
});

test('date input rejects invalid and out-of-range dates', async () => {
  const changed = vi.fn();
  const r = await render(NeuDateInputComponent, { inputs: { label: 'Date', min: '2026-10-05', max: '2026-10-20' }, on: { valueChange: changed } });
  for (const date of ['invalid', '2026-10-04', '2026-10-21']) invoke(r.instance, 'choose', date);
  expect(r.instance.value()).toBe('');
  expect(changed).not.toHaveBeenCalled();
  invoke(r.instance, 'choose', '2026-10-16');
  expect(r.instance.value()).toBe('2026-10-16');
});

test('calendar year and month pickers toggle back to days and respect the date boundaries', async () => {
  const r = await render(NeuCalendarComponent, { inputs: { month: '2026-10', min: '2025-06-01', max: '2027-08-31' } });
  invoke(r.instance, 'showMonths');
  expect(invoke(r.instance, 'view')).toBe('months');
  invoke(r.instance, 'showMonths');
  expect(invoke(r.instance, 'view')).toBe('days');
  invoke(r.instance, 'showYears');
  expect(invoke(r.instance, 'view')).toBe('years');
  invoke(r.instance, 'showYears');
  expect(invoke(r.instance, 'view')).toBe('days');
  invoke(r.instance, 'chooseMonth', '2024-01');
  invoke(r.instance, 'chooseYear', 2024);
  expect(r.instance.month()).toBe('2026-10');
  invoke(r.instance, 'chooseYear', 2027);
  expect(r.instance.month()).toBe('2027-08');
  await r.rerender({ inputs: { month: '2026-02' } });
  invoke(r.instance, 'chooseYear', 2025);
  expect(r.instance.month()).toBe('2025-06');
});

test('calendar shifts years from its month picker and refuses shifts outside min and max', async () => {
  const r = await render(NeuCalendarComponent, { inputs: { month: '2026-10', min: '2025-01-01', max: '2027-12-31' } });
  invoke(r.instance, 'showMonths');
  invoke(r.instance, 'shift', 1);
  expect(r.instance.month()).toBe('2027-10');
  invoke(r.instance, 'shift', 1);
  expect(r.instance.month()).toBe('2027-10');
});

test.each([{ disabled: true }, { readonly: true }])('calendar never changes dates or event data while unavailable: %j', async state => {
  const create = vi.fn(), edit = vi.fn(), remove = vi.fn();
  const event = { id: 'event', date: '2026-10-16', title: 'Review' };
  const r = await render(NeuCalendarComponent, { inputs: { ...state, month: '2026-10', value: event.date, events: [event], editable: true }, on: { eventCreateRequested: create, eventEditRequested: edit, eventDeleteRequested: remove } });
  invoke(r.instance, 'choose', '2026-10-17');
  invoke(r.instance, 'requestCreate');
  invoke(r.instance, 'requestEdit', event);
  invoke(r.instance, 'requestDelete', event);
  if ('disabled' in state) {
    invoke(r.instance, 'showMonths');
    invoke(r.instance, 'showYears');
    invoke(r.instance, 'shift', 1);
    expect(invoke(r.instance, 'view')).toBe('days');
    expect(r.instance.month()).toBe('2026-10');
  }
  expect(r.instance.value()).toBe(event.date);
  expect(create).not.toHaveBeenCalled();
  expect(edit).not.toHaveBeenCalled();
  expect(remove).not.toHaveBeenCalled();
});

test('calendar remains renderable when an external month is malformed', async () => {
  const r = await render(NeuCalendarComponent, { inputs: { month: 'invalid' } });
  invoke(r.instance, 'showMonths');
  await r.detectChanges();
  expect(invoke(r.instance, 'year')).toBe(Number(todayISO().slice(0, 4)));
  expect(invoke(r.instance, 'monthLabel')).toBe('invalid');
});

test('carousel requires a completed horizontal swipe and supports swiping in both directions', async () => {
  const r = await render(NeuCarouselComponent, { inputs: { items: images } });
  invoke(r.instance, 'end', touch(20));
  invoke(r.instance, 'start', touch());
  invoke(r.instance, 'end', touch(20));
  invoke(r.instance, 'start', touch(100));
  invoke(r.instance, 'end', touch());
  invoke(r.instance, 'start', touch(100));
  invoke(r.instance, 'end', touch(90));
  expect(r.instance.index()).toBe(0);
  invoke(r.instance, 'start', touch(100));
  invoke(r.instance, 'end', touch(20));
  expect(r.instance.index()).toBe(1);
  invoke(r.instance, 'start', touch(20));
  invoke(r.instance, 'end', touch(100));
  expect(r.instance.index()).toBe(0);
  await r.rerender({ inputs: { items: [] } });
  invoke(r.instance, 'move', 1);
  expect(r.instance.index()).toBe(0);
});

test('image viewer ignores incomplete pinches and short swipes, and navigates only at base zoom', async () => {
  const r = await render(NeuImageViewerComponent, { inputs: { items: images, open: true } });
  invoke(r.instance, 'start', touch(100, [{ pageX: 0 }, { pageX: 100 }]));
  invoke(r.instance, 'pinch', touch(100, [{ pageX: 0, pageY: 0 }, { pageX: 100, pageY: 0 }]));
  expect(invoke(r.instance, 'zoom')).toBe(1);
  invoke(r.instance, 'end', touch(90));
  expect(r.instance.index()).toBe(0);
  invoke(r.instance, 'start', touch(100));
  invoke(r.instance, 'end', touch(20));
  expect(r.instance.index()).toBe(1);
  await r.detectChanges();
  invoke(r.instance, 'start', touch(20));
  invoke(r.instance, 'end', touch(100));
  expect(r.instance.index()).toBe(0);
  r.instance.close();
  r.instance.close();
  expect(r.instance.open()).toBe(false);
});

test('empty image viewer cannot navigate or zoom', async () => {
  const r = await render(NeuImageViewerComponent);
  invoke(r.instance, 'move', 1);
  invoke(r.instance, 'adjustZoom', 1);
  expect(r.instance.index()).toBe(0);
  expect(invoke(r.instance, 'zoom')).toBe(1);
});

test('gallery rejects out-of-range selections and invalid layout measurements', async () => {
  const r = await render(NeuGalleryComponent, { inputs: { items: images } });
  invoke(r.instance, 'show', -1);
  invoke(r.instance, 'show', images.length);
  invoke(r.instance, 'measure', { nativeEvent: { layout: { width: Number.NaN } } });
  expect(invoke(r.instance, 'open')).toBe(false);
});

test('skeleton clamps numeric dimensions without converting percentages to pixels', async () => {
  const r = await render(NeuSkeletonComponent, { inputs: { variant: 'rectangle', width: -10, height: 80, animation: 'none' } });
  expect(screen.getByRole('progressbar').props.width).toBe(0);
  await r.rerender({ inputs: { width: 120 } });
  expect(screen.getByRole('progressbar').props.width).toBe(120);
});

test('toast action dismisses once, and ignores duplicate actions after closing', async () => {
  const action = vi.fn(), dismissed = vi.fn();
  const r = await render(NeuToastComponent, { inputs: { message: 'Saved', actionLabel: 'Undo', open: true, duration: 0 }, on: { action, dismissed } });
  await userEvent.setup().press(screen.getByRole('button', { name: 'Undo' }));
  expect(r.instance.open()).toBe(false);
  invoke(r.instance, 'invokeAction');
  invoke(r.instance, 'dismiss');
  expect(action).toHaveBeenCalledOnce();
  expect(dismissed).toHaveBeenCalledOnce();
});

test('toast automatically dismisses when its own duration elapses', async () => {
  const dismissed = vi.fn();
  const r = await render(NeuToastComponent, { inputs: { message: 'Saved', open: true, duration: 25 }, providers: [{ provide: NEU_THEME, useValue: signal({ ...NEU_LIGHT_TOKENS, duration: 0 }) }], on: { dismissed } });
  await vi.waitFor(() => expect(r.instance.open()).toBe(false));
  expect(dismissed).toHaveBeenCalledOnce();
});
