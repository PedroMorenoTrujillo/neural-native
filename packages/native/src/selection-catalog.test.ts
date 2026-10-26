import { Component, signal } from '@angular/core';
import { FormField, form, required } from '@angular/forms/signals';
import {
  cleanup,
  render,
  screen,
  userEvent,
  fireEvent,
} from '@ng-native/testing';
import { afterEach, expect, test, vi } from 'vitest';
import { NeuModalComponent } from './modal/modal.ts';
import { NeuBottomSheetComponent, type NeuBottomSheetHeight } from './bottom-sheet/bottom-sheet.ts';
import { NeuConfirmDialogComponent } from './confirm-dialog/confirm-dialog.ts';
import { NeuListboxComponent } from './listbox/listbox.ts';
import { NeuSelectComponent } from './select/select.ts';
import { NeuAutocompleteComponent } from './autocomplete/autocomplete.ts';
import { NeuMenuComponent } from './menu/menu.ts';
import { NeuContextMenuComponent } from './context-menu/context-menu.ts';
import { NeuPopoverComponent } from './popover/popover.ts';
import { NeuSidebarComponent } from './sidebar/sidebar.ts';
import { NeuNavComponent } from './nav/nav.ts';
import { NeuFilterBarComponent } from './filter-bar/filter-bar.ts';
import { NeuInlineEditorComponent } from './inline-editor/inline-editor.ts';
import { NeuThemeComponent } from './theme/theme.ts';
import { NEU_DARK_TOKENS } from './foundation/index.ts';
afterEach(cleanup);
const options = [
  { id: 'ada', label: 'Ada', description: 'First person' },
  { id: 'grace', label: 'Grace', description: 'Second person' },
  { id: 'off', label: 'Unavailable', disabled: true },
];
const press = async (name: string) =>
  userEvent.setup().press(screen.getByRole('button', { name }));
const choose = async (name: string) =>
  userEvent.setup().press(screen.getByRole('radio', { name }));
test('modal is absent while closed, closes once and can reopen', async () => {
  const cb = vi.fn();
  const r = await render(NeuModalComponent, {
    inputs: { title: 'Details' },
    on: { closed: cb },
  });
  expect(screen.queryByText('Details')).toBeNull();
  await r.rerender({ inputs: { open: true } });
  await press('Close');
  expect(r.instance.open()).toBe(false);
  expect(cb.mock.calls).toEqual([['action']]);
  await r.rerender({ inputs: { open: false } });
  await r.rerender({ inputs: { open: true } });
  expect(screen.getByText('Details')).toBeTruthy();
  r.unmount();
  expect(r.componentRef.hostView.destroyed).toBe(true);
});
test('modal protects a pending action from dismissal', async () => {
  const r = await render(NeuModalComponent, {
    inputs: { title: 'Pending', open: true, dismissible: false },
  });
  expect(screen.queryByRole('button', { name: 'Close' })).toBeNull();
  r.instance.close('native');
  expect(r.instance.open()).toBe(true);
});
test('sheet closes and respects the dismissal guard', async () => {
  const r = await render(NeuBottomSheetComponent, {
    inputs: { title: 'Sheet', open: true },
  });
  await press('Close');
  expect(r.instance.open()).toBe(false);
  await r.rerender({ inputs: { open: false } });
  await r.rerender({ inputs: { open: true, dismissible: false } });
  r.instance.close();
  expect(r.instance.open()).toBe(true);
});
test('sheet changes height without reopening, preserves auto sizing and keeps dismissal guards', async () => {
  const closed = vi.fn();
  const r = await render(NeuBottomSheetComponent, {
    inputs: { title: 'Preferences', open: true, dismissible: false },
    on: { closed },
  });
  const tag = r.fabric.find('ModalHostView')!.reactTag;
  const modes: readonly [NeuBottomSheetHeight, string | undefined][] = [
    ['auto', undefined], ['sm', '35%'], ['md', '50%'], ['lg', '75%'], ['full', '100%'], ['auto', undefined],
  ];
  for (const [height, expected] of modes) {
    await r.rerender({ inputs: { height } });
    const panel = screen.getByRole('header', { name: 'Preferences' }).parent?.parent?.parent;
    expect(panel?.props.height ?? undefined).toBe(expected);
    expect(panel?.props.maxHeight).toBe(expected ? '100%' : '85%');
    expect(r.fabric.find('ModalHostView')!.reactTag).toBe(tag);
    await fireEvent(r.fabric.find('ModalHostView')!, 'requestClose', {});
    expect(r.instance.open()).toBe(true);
  }
  expect(closed).not.toHaveBeenCalled();
  await r.rerender({ inputs: { dismissible: true, height: 'full' } });
  await press('Close');
  expect(r.instance.open()).toBe(false);
  expect(closed).toHaveBeenCalledOnce();
});
test('confirmation can remain open until its asynchronous owner finishes', async () => {
  const cb = vi.fn();
  const r = await render(NeuConfirmDialogComponent, {
    inputs: { title: 'Delete', message: 'Remove the item?', open: true, closeOnConfirm: false },
    on: { confirmed: cb },
  });
  await press('Confirm');
  expect(cb).toHaveBeenCalledOnce();
  expect(r.instance.open()).toBe(true);
  await r.rerender({ inputs: { busy: true } });
  await press('Confirm');
  await press('Cancel');
  expect(cb).toHaveBeenCalledOnce();
  expect(r.instance.open()).toBe(true);
  await r.rerender({ inputs: { busy: false } });
  await userEvent
    .setup()
    .press(screen.getAllByRole('button', { name: 'Cancel' }).at(-1)!);
  expect(r.instance.open()).toBe(false);
});
test('confirmation closes on confirm by default without reporting cancellation and can reopen', async () => {
  const confirmed = vi.fn(), cancelled = vi.fn(), changed = vi.fn();
  const r = await render(NeuConfirmDialogComponent, {
    inputs: { title: 'Delete', message: 'Remove the item?', open: true },
    on: { confirmed, cancelled, openChange: changed },
  });
  await press('Confirm');
  expect(r.instance.open()).toBe(false);
  expect(confirmed).toHaveBeenCalledOnce();
  expect(cancelled).not.toHaveBeenCalled();
  expect(changed.mock.calls).toEqual([[false]]);
  await r.rerender({ inputs: { open: false } });
  await r.rerender({ inputs: { open: true } });
  await press('Close');
  expect(r.instance.open()).toBe(false);
  expect(cancelled).toHaveBeenCalledOnce();
  expect(confirmed).toHaveBeenCalledOnce();
});
test('confirmation close button is optional, named independently and protected while busy', async () => {
  const cancelled = vi.fn(), confirmed = vi.fn();
  const r = await render(NeuConfirmDialogComponent, {
    inputs: { title: 'Delete', message: 'Remove the item?', open: true, showCloseButton: false, closeLabel: 'Dismiss confirmation' },
    on: { cancelled, confirmed },
  });
  expect(screen.queryByRole('button', { name: 'Dismiss confirmation' })).toBeNull();
  await r.rerender({ inputs: { showCloseButton: true, busy: true } });
  expect(screen.queryByRole('button', { name: 'Dismiss confirmation' })).toBeNull();
  await fireEvent(r.fabric.find('ModalHostView')!, 'requestClose', {});
  await press('Confirm');
  await press('Cancel');
  expect(r.instance.open()).toBe(true);
  expect(cancelled).not.toHaveBeenCalled();
  expect(confirmed).not.toHaveBeenCalled();
  await r.rerender({ inputs: { busy: false } });
  await press('Dismiss confirmation');
  expect(r.instance.open()).toBe(false);
  expect(cancelled).toHaveBeenCalledOnce();
});
test('listbox removes duplicates and keeps a single selected ID', async () => {
  const r = await render(NeuListboxComponent, {
    inputs: { label: 'People', options: [...options, options[0]!] },
  });
  expect(screen.getAllByRole('radio', { name: 'Ada' })).toHaveLength(1);
  await choose('Ada');
  await choose('Grace');
  await choose('Unavailable');
  expect(r.instance.value()).toEqual(['grace']);
});
test('listbox handles multiselect toggles and readonly state', async () => {
  const r = await render(NeuListboxComponent, {
    inputs: { label: 'People', options, multiple: true },
  });
  await userEvent.setup().press(screen.getByRole('checkbox', { name: 'Ada' }));
  await userEvent
    .setup()
    .press(screen.getByRole('checkbox', { name: 'Grace' }));
  await userEvent.setup().press(screen.getByRole('checkbox', { name: 'Ada' }));
  expect(r.instance.value()).toEqual(['grace']);
  await r.rerender({ inputs: { readonly: true } });
  await userEvent.setup().press(screen.getByRole('checkbox', { name: 'Ada' }));
  expect(r.instance.value()).toEqual(['grace']);
});
test('select opens the native sheet, commits an ID and closes', async () => {
  const r = await render(NeuSelectComponent, {
    inputs: { label: 'Person', options },
  });
  await press('Person');
  await choose('Grace');
  expect(r.instance.value()).toBe('grace');
  expect(screen.queryByRole('radio', { name: 'Ada' })).toBeNull();
  await r.rerender({ inputs: { value: 'ada' } });
  expect(screen.getByText('Ada')).toBeTruthy();
});
test('select exposes the displayed value to screen readers after selection and parent updates', async () => {
  const r = await render(NeuSelectComponent, {
    inputs: { label: 'Person', options, placeholder: 'Choose a person' },
  });
  const accessibleValue = () => screen.getByRole('button', { name: 'Person' }).props['accessibilityValue'];
  expect(accessibleValue()).toMatchObject({ text: 'Choose a person' });
  await press('Person');
  await choose('Grace');
  expect(accessibleValue()).toMatchObject({ text: 'Grace' });
  await r.rerender({ inputs: { value: 'ada' } });
  expect(accessibleValue()).toMatchObject({ text: 'Ada' });
  await r.rerender({ inputs: { options: options.map(option => option.id === 'ada' ? { ...option, label: 'Ada Lovelace' } : option) } });
  expect(accessibleValue()).toMatchObject({ text: 'Ada Lovelace' });
  await r.rerender({ inputs: { value: '' } });
  expect(accessibleValue()).toMatchObject({ text: 'Choose a person' });
});
test.each([{ disabled: true }, { readonly: true }])(
  'select refuses opening when %j',
  async (state) => {
    await render(NeuSelectComponent, {
      inputs: { label: 'Person', options, ...state },
    });
    await press('Person');
    expect(screen.queryByRole('radio')).toBeNull();
  },
);
test('autocomplete filters options, commits the ID and restores an external selection', async () => {
  const r = await render(NeuAutocompleteComponent, {
    inputs: { label: 'Person', options },
  });
  await fireEvent.changeText(screen.getByLabelText('Person'), 'gra');
  expect(screen.queryByRole('radio', { name: 'Ada' })).toBeNull();
  await choose('Grace');
  expect(r.instance.value()).toBe('grace');
  expect(screen.getByLabelText('Person').props['text']).toBe('Grace');
  await r.rerender({ inputs: { value: 'ada' } });
  expect(screen.getByLabelText('Person').props['text']).toBe('Ada');
});
test('menu emits enabled commands and closes its anchored popup after selection', async () => {
  const cb = vi.fn();
  await render(NeuMenuComponent, {
    inputs: { label: 'Actions', items: options },
    on: { activated: cb },
  });
  await press('Actions');
  await userEvent.setup().press(screen.getByRole('menuitem', { name: 'Unavailable' }));
  expect(cb).not.toHaveBeenCalled();
  await userEvent.setup().press(screen.getByRole('menuitem', { name: 'Ada' }));
  expect(cb.mock.calls).toEqual([['ada']]);
  expect(screen.queryByRole('menuitem', { name: 'Grace' })).toBeNull();
});
test('context menu always offers an explicit accessible actions button', async () => {
  const cb = vi.fn();
  await render(NeuContextMenuComponent, {
    inputs: { label: 'Message', items: options },
    on: { activated: cb },
  });
  await press('Actions');
  await userEvent.setup().press(screen.getByRole('menuitem', { name: 'Grace' }));
  expect(cb.mock.calls).toEqual([['grace']]);
});
test('popover toggles a native overlay from its action', async () => {
  const r = await render(NeuPopoverComponent, {
    inputs: { label: 'Help', title: 'Information' },
  });
  await press('Help');
  expect(screen.getByText('Information')).toBeTruthy();
  await press('Close information');
  expect(r.instance.open()).toBe(false);
});
test('sidebar chooses navigation and closes without replacing the application router', async () => {
  const cb = vi.fn();
  const r = await render(NeuSidebarComponent, {
    inputs: { title: 'Routes', items: options, open: true },
    on: { navigate: cb },
  });
  await choose('Ada');
  expect(r.instance.value()).toBe('ada');
  expect(r.instance.open()).toBe(false);
  expect(cb.mock.calls).toEqual([['ada']]);
});
test('navigation emits route selection and guards disabled routes', async () => {
  const cb = vi.fn();
  const r = await render(NeuNavComponent, {
    inputs: { items: options },
    on: { navigate: cb },
  });
  await userEvent.setup().press(screen.getByRole('tab', { name: 'Grace' }));
  await userEvent
    .setup()
    .press(screen.getByRole('tab', { name: 'Unavailable' }));
  expect(r.instance.value()).toBe('grace');
  expect(cb.mock.calls).toEqual([['grace']]);
});
test('filter bar resets query and selected filters together', async () => {
  const r = await render(NeuFilterBarComponent, {
    inputs: { options, query: 'Ada', value: ['ada'] },
  });
  await press('Clear filters');
  expect(r.instance.query()).toBe('');
  expect(r.instance.value()).toEqual([]);
});
test('filter bar enables reset for text or selected chips and disables it once clear', async () => {
  const r = await render(NeuFilterBarComponent, { inputs: { options } });
  const resetState = () => screen.getByRole('button', { name: 'Clear filters' }).props.accessibilityState;
  expect(resetState()).toMatchObject({ disabled: true });
  await fireEvent.changeText(screen.getByLabelText('Search'), 'Ada');
  expect(r.instance.query()).toBe('Ada');
  expect(resetState()).toMatchObject({ disabled: false });
  await press('Clear filters');
  expect(resetState()).toMatchObject({ disabled: true });
  await userEvent.setup().press(screen.getByRole('checkbox', { name: 'Grace' }));
  expect(r.instance.value()).toEqual(['grace']);
  expect(resetState()).toMatchObject({ disabled: false });
  await press('Clear filters');
  expect(r.instance.value()).toEqual([]);
  expect(resetState()).toMatchObject({ disabled: true });
});
test('inline editor cancels drafts and commits only valid content', async () => {
  const cb = vi.fn();
  const r = await render(NeuInlineEditorComponent, {
    inputs: { label: 'Title', value: 'Original', required: true },
    on: { saved: cb },
  });
  await press('Title');
  await fireEvent.changeText(screen.getByLabelText('Title'), 'Draft');
  await press('Cancel');
  expect(r.instance.value()).toBe('Original');
  expect(cb).not.toHaveBeenCalled();
  await press('Title');
  await fireEvent.changeText(screen.getByLabelText('Title'), '');
  await press('Save');
  expect(r.instance.editing()).toBe(true);
  await fireEvent.changeText(screen.getByLabelText('Title'), 'Final');
  await press('Save');
  expect(r.instance.value()).toBe('Final');
  expect(cb.mock.calls).toEqual([['Final']]);
});
@Component({
  imports: [NeuSelectComponent, FormField],
  template: `<neu-select
    label="Owner"
    [options]="options"
    [formField]="fields.owner"
  />`,
})
class FormHost {
  readonly options = options;
  readonly data = signal({ owner: '' });
  readonly fields = form(this.data, (p) => required(p.owner));
}
test('select participates in Signal Forms, required validation and touch state', async () => {
  const r = await render(FormHost);
  expect(r.instance.fields.owner().invalid()).toBe(true);
  await press('Owner');
  await choose('Ada');
  expect(r.instance.data().owner).toBe('ada');
  expect(r.instance.fields.owner().invalid()).toBe(false);
  expect(r.instance.fields.owner().touched()).toBe(true);
});
@Component({
  imports: [NeuThemeComponent, NeuModalComponent],
  template: `<neu-theme scheme="dark"
    ><neu-modal title="Dark overlay" [open]="true"
  /></neu-theme>`,
})
class ThemeHost {}
test('native overlays retain dark theme colors', async () => {
  await render(ThemeHost);
  expect(
    screen.getByRole('header', { name: 'Dark overlay' }).props['color'],
  ).toBe('#edf1fa');
});
@Component({
  selector: 'test-dark-bottom-sheet',
  imports: [NeuThemeComponent, NeuBottomSheetComponent],
  template: `<neu-theme scheme="dark"
    ><neu-bottom-sheet title="Dark sheet" [open]="true"
  /></neu-theme>`,
})
class BottomSheetThemeHost {}
test('bottom sheets keep a rounded themed surface over a transparent native window', async () => {
  const r = await render(BottomSheetThemeHost);
  const sheet = screen.getByRole('header', { name: 'Dark sheet' }).parent
    ?.parent;
  expect(sheet?.parent?.props).toMatchObject({
    maxHeight: '85%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    backgroundColor: NEU_DARK_TOKENS.surface,
  });
  expect(r.fabric.find('ModalHostView')?.props).toMatchObject({
    transparent: true,
    presentationStyle: 'overFullScreen',
  });
});
