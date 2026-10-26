import {
  cleanup,
  render,
  screen,
  userEvent,
  fireEvent,
} from '@ng-native/testing';
import { afterEach, expect, test, vi } from 'vitest';
import { NeuAccordionComponent } from './accordion/accordion.ts';
import { NeuAlertComponent } from './alert/alert.ts';
import { NeuAvatarComponent } from './avatar/avatar.ts';
import { NeuButtonGroupComponent } from './button-group/button-group.ts';
import { NeuChipComponent } from './chip/chip.ts';
import { NeuInputMaskComponent, formatMask } from './input-mask/input-mask.ts';
import { NeuInputOtpComponent } from './input-otp/input-otp.ts';
import { NeuInputTagsComponent } from './input-tags/input-tags.ts';
import { NeuNumberInputComponent } from './number-input/number-input.ts';
import { NeuPasswordComponent } from './password/password.ts';
import { NeuRadioGroupComponent } from './radio/radio.ts';
import { NeuRatingComponent } from './rating/rating.ts';
import { NeuToastComponent } from './toast/toast.ts';
import { NeuToggleButtonGroupComponent } from './toggle-button-group/toggle-button-group.ts';
import { NeuProgressBarComponent } from './progress-bar/progress-bar.ts';
import { NeuPanelComponent } from './panel/panel.ts';
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});
const options = [
  { id: 'one', label: 'One', description: 'First content' },
  { id: 'two', label: 'Two', description: 'Second content' },
  { id: 'off', label: 'Unavailable', disabled: true },
];
const press = async (name: string) =>
  userEvent.setup().press(screen.getByRole('button', { name }));
test('accordion enforces single expansion, closes and refuses disabled sections', async () => {
  const r = await render(NeuAccordionComponent, { inputs: { items: options } });
  await press('One');
  expect(screen.getByText('First content')).toBeTruthy();
  await press('Two');
  expect(screen.queryByText('First content')).toBeNull();
  await press('Unavailable');
  expect(r.instance.expanded()).toEqual(['two']);
  await press('Two');
  expect(r.instance.expanded()).toEqual([]);
});
test('accordion can keep multiple sections open', async () => {
  const r = await render(NeuAccordionComponent, {
    inputs: { items: options, multiple: true },
  });
  await press('One');
  await press('Two');
  expect(r.instance.expanded()).toEqual(['one', 'two']);
});
test('alert closes once and disappears', async () => {
  const close = vi.fn();
  await render(NeuAlertComponent, {
    inputs: { message: 'Connection lost', closable: true },
    on: { closed: close },
  });
  await press('Close');
  expect(screen.queryByText('Connection lost')).toBeNull();
  expect(close).toHaveBeenCalledOnce();
});
test('avatar computes Unicode initials across whitespace', async () => {
  await render(NeuAvatarComponent, { inputs: { label: '  Ada   Lovelace  ' } });
  expect(screen.getByText('AL')).toBeTruthy();
});
test('button group emits action IDs and ignores unavailable options', async () => {
  const cb = vi.fn();
  const r = await render(NeuButtonGroupComponent, {
    inputs: { items: options },
    on: { activated: cb },
  });
  expect(screen.getByRole('button', { name: 'One' }).props.opacity ?? 1).toBe(1);
  expect(screen.getByRole('button', { name: 'Unavailable' }).props.opacity ?? 1).toBe(1);
  expect(screen.getByText('Unavailable').props.opacity).toBe(0.45);
  await press('One');
  await press('Unavailable');
  expect(cb.mock.calls).toEqual([['one']]);
  await r.rerender({ inputs: { disabled: true } });
  expect(screen.getByRole('button', { name: 'One' }).props.opacity ?? 1).toBe(1);
  expect(screen.getByText('One').props.opacity).toBe(0.45);
  await press('One');
  expect(cb.mock.calls).toEqual([['one']]);
  await r.rerender({ inputs: { disabled: false } });
  expect(screen.getByText('One').props.opacity ?? 1).toBe(1);
  expect(screen.getByRole('button', { name: 'Unavailable' }).props.opacity ?? 1).toBe(1);
  expect(screen.getByText('Unavailable').props.opacity).toBe(0.45);
});
test('chip separates selection from removal', async () => {
  const cb = vi.fn();
  const r = await render(NeuChipComponent, {
    inputs: { label: 'Angular', removable: true },
    on: { removed: cb },
  });
  await userEvent.setup().press(screen.getByRole('checkbox'));
  expect(r.instance.selected()).toBe(true);
  await press('Remove Angular');
  expect(cb).toHaveBeenCalledOnce();
  expect(r.instance.selected()).toBe(true);
});
test.each([{ disabled: true }, { readonly: true }])(
  'masked input refuses edits in %j',
  async (state) => {
    const r = await render(NeuInputMaskComponent, {
      inputs: { label: 'Phone', mask: '###-###', value: '123', ...state },
    });
    await fireEvent.changeText(screen.getByLabelText('Phone'), '456789');
    expect(r.instance.value()).toBe('123');
  },
);
test('mask handles pasted punctuation, rejects letters in digit slots and stores raw value', async () => {
  expect(formatMask('(12a3) 456', '(###) ###')).toEqual({
    raw: '123456',
    display: '(123) 456',
  });
  const r = await render(NeuInputMaskComponent, {
    inputs: { label: 'Phone', mask: '###-###' },
  });
  expect(screen.getByLabelText('Phone').props.placeholder).toBe('___-___');
  expect(r.instance.value()).toBe('');
  await fireEvent.changeText(screen.getByLabelText('Phone'), '123-456');
  expect(r.instance.value()).toBe('123456');
  await r.rerender({ inputs: { value: '', mask: '(###) ###' } });
  expect(screen.getByLabelText('Phone').props.placeholder).toBe('(___) ___');
  expect(r.instance.value()).toBe('');
  await r.rerender({ inputs: { mask: 'AA-##*' } });
  expect(screen.getByLabelText('Phone').props.placeholder).toBe('__-___');
});
test('OTP normalizes pasted codes and emits completion once per changed code', async () => {
  const cb = vi.fn();
  const r = await render(NeuInputOtpComponent, {
    inputs: { label: 'Code', length: 4, hint: 'Check your messages' },
    on: { completed: cb },
  });
  expect(screen.getByTestId('otp-position-3')).toBeTruthy();
  expect(screen.queryByTestId('otp-position-4')).toBeNull();
  expect(screen.getByLabelText('Code').props.textContentType).toBe(
    'oneTimeCode',
  );
  expect(screen.getByText('Check your messages')).toBeTruthy();
  await fireEvent.changeText(screen.getByLabelText('Code'), '12a34 567');
  expect(r.instance.value()).toBe('1234');
  await fireEvent.changeText(screen.getByLabelText('Code'), '1234');
  expect(cb.mock.calls).toEqual([['1234']]);
  await fireEvent.changeText(screen.getByLabelText('Code'), '123');
  expect(r.instance.value()).toBe('123');
  await fireEvent.changeText(screen.getByLabelText('Code'), '193');
  expect(r.instance.value()).toBe('193');
  await r.rerender({ inputs: { disabled: true } });
  await fireEvent.changeText(screen.getByLabelText('Code'), '9876');
  expect(r.instance.value()).toBe('193');
  await r.rerender({ inputs: { disabled: false, readonly: true } });
  await fireEvent.changeText(screen.getByLabelText('Code'), '9876');
  expect(r.instance.value()).toBe('193');
  await r.rerender({
    inputs: { length: 12, invalid: true, error: 'Try another code' },
  });
  expect(screen.getByTestId('otp-position-11')).toBeTruthy();
  expect(screen.getByText('Try another code')).toBeTruthy();
  expect(screen.queryByText('Check your messages')).toBeNull();
});
test('tags prevent duplicates, respect the limit and permit removal', async () => {
  const r = await render(NeuInputTagsComponent, {
    inputs: { label: 'Tags', max: 2 },
  });
  await fireEvent.changeText(screen.getByLabelText('Tags'), 'Angular');
  await press('Add');
  await fireEvent.changeText(screen.getByLabelText('Tags'), 'Angular');
  await press('Add');
  expect(screen.getByText('Duplicate: Angular')).toBeTruthy();
  await fireEvent.changeText(screen.getByLabelText('Tags'), 'Native');
  await press('Add');
  await fireEvent.changeText(screen.getByLabelText('Tags'), 'Third');
  await press('Add');
  expect(r.instance.value()).toEqual(['Angular', 'Native']);
  await press('Remove Angular');
  expect(r.instance.value()).toEqual(['Native']);
});
test('tag removal has a localized action name without selectable checkbox semantics', async () => {
  const r = await render(NeuInputTagsComponent, {
    inputs: { label: 'Skills', value: ['Angular'], removeLabel: 'Eliminar', placeholder: 'Añade una habilidad' },
  });
  expect(screen.queryByRole('checkbox')).toBeNull();
  await press('Eliminar Angular');
  expect(r.instance.value()).toEqual([]);
});
test('read-only tags remain readable without offering removal or selection', async () => {
  const r = await render(NeuInputTagsComponent, {
    inputs: { label: 'Skills', value: ['Angular', 'Design'], readonly: true },
  });
  expect(screen.getByText('Angular')).toBeTruthy();
  expect(screen.getByText('Design')).toBeTruthy();
  expect(screen.queryByRole('checkbox')).toBeNull();
  expect(screen.queryByRole('button', { name: 'Remove Angular' })).toBeNull();
  expect(screen.queryByLabelText('Skills')).toBeNull();
  expect(screen.queryByRole('button', { name: 'Add' })).toBeNull();
  expect(r.instance.value()).toEqual(['Angular', 'Design']);
});
test('disabled tags cannot remove values and can be enabled again', async () => {
  const r = await render(NeuInputTagsComponent, {
    inputs: { label: 'Skills', value: ['Angular'], disabled: true },
  });
  await press('Remove Angular');
  expect(r.instance.value()).toEqual(['Angular']);
  await r.rerender({ inputs: { label: 'Skills', disabled: false } });
  await press('Remove Angular');
  expect(r.instance.value()).toEqual([]);
});
test('number input rounds decimal steps, clamps bounds and rejects non-finite input', async () => {
  const r = await render(NeuNumberInputComponent, {
    inputs: { label: 'Amount', min: 0, max: 1, step: 0.1 },
  });
  await press('Increase Amount');
  await press('Increase Amount');
  await press('Increase Amount');
  expect(r.instance.value()).toBe(0.3);
  await fireEvent.changeText(screen.getByLabelText('Amount'), '3');
  expect(r.instance.value()).toBe(1);
  await fireEvent.changeText(screen.getByLabelText('Amount'), 'NaN');
  expect(r.instance.value()).toBe(1);
  await fireEvent.changeText(screen.getByLabelText('Amount'), '-2');
  expect(r.instance.value()).toBe(0);
});
test.each([{ disabled: true }, { readonly: true }])(
  'number input refuses changes in %j',
  async (state) => {
    const r = await render(NeuNumberInputComponent, {
      inputs: { label: 'Amount', value: 2, ...state },
    });
    await press('Increase Amount');
    await fireEvent.changeText(screen.getByLabelText('Amount'), '5');
    expect(r.instance.value()).toBe(2);
  },
);
test('password hides the native input and reveal preserves the value', async () => {
  const r = await render(NeuPasswordComponent, {
    inputs: { label: 'Password', value: 'secret' },
  });
  expect(screen.getByLabelText('Password').props['secureTextEntry']).toBe(true);
  expect(screen.queryByText('Show password')).toBeNull();
  expect(screen.queryByText('>')).toBeNull();
  expect(
    screen.getByRole('button', { name: 'Show password' }).props,
  ).toMatchObject({ minWidth: 48, minHeight: 48 });
  await press('Show password');
  expect(screen.getByLabelText('Password').props['secureTextEntry']).toBe(
    false,
  );
  expect(screen.queryByText('Hide password')).toBeNull();
  expect(r.instance.value()).toBe('secret');
  await press('Hide password');
  expect(screen.getByLabelText('Password').props['secureTextEntry']).toBe(true);
});
test('radio group chooses enabled options with a single selected state', async () => {
  const r = await render(NeuRadioGroupComponent, {
    inputs: { label: 'Choice', options },
  });
  await userEvent.setup().press(screen.getByRole('radio', { name: 'One' }));
  await userEvent
    .setup()
    .press(screen.getByRole('radio', { name: 'Unavailable' }));
  expect(r.instance.value()).toBe('one');
});
test('radio validation is independent of selection and restores its error presentation', async () => {
  const r = await render(NeuRadioGroupComponent, {
    inputs: {
      label: 'Choice',
      options,
      value: 'one',
      invalid: true,
      error: 'Review your choice',
    },
  });
  expect(screen.getByRole('radiogroup').props.accessibilityHint).toBe(
    'Review your choice',
  );
  expect(screen.getByText('Review your choice')).toBeTruthy();
  expect(screen.getByRole('alert')).toBeTruthy();
  expect(r.instance.value()).toBe('one');
  await userEvent.setup().press(screen.getByRole('radio', { name: 'Two' }));
  expect(r.instance.value()).toBe('two');
  await r.rerender({ inputs: { invalid: false, readonly: true } });
  expect(screen.queryByRole('alert')).toBeNull();
  await userEvent.setup().press(screen.getByRole('radio', { name: 'One' }));
  expect(r.instance.value()).toBe('two');
});
test('rating can select and clear, and respects readonly', async () => {
  const r = await render(NeuRatingComponent, { inputs: { label: 'Rate' } });
  await userEvent.setup().press(screen.getByRole('radio', { name: '3 / 5' }));
  expect(r.instance.value()).toBe(3);
  await press('Clear rating');
  expect(r.instance.value()).toBe(0);
  await r.rerender({ inputs: { readonly: true } });
  await userEvent.setup().press(screen.getByRole('radio', { name: '5 / 5' }));
  expect(r.instance.value()).toBe(0);
});
test('toast clears timers on unmount and can reopen after dismissal', async () => {
  const timeout = vi.spyOn(globalThis, 'setTimeout'),
    clear = vi.spyOn(globalThis, 'clearTimeout'),
    cb = vi.fn();
  const r = await render(NeuToastComponent, {
    inputs: { message: 'Saved', open: true, duration: 1000 },
    on: { dismissed: cb },
  });
  const index = timeout.mock.calls.findIndex((x) => x[1] === 1000);
  expect(index).toBeGreaterThanOrEqual(0);
  const timer = timeout.mock.results[index]!.value;
  r.unmount();
  expect(clear).toHaveBeenCalledWith(timer);
  expect(cb).not.toHaveBeenCalled();
  timeout.mockRestore();
  clear.mockRestore();
  const next = await render(NeuToastComponent, {
    inputs: { message: 'Saved', open: true, duration: 0 },
  });
  await press('Dismiss');
  expect(next.instance.open()).toBe(false);
  await next.rerender({ inputs: { open: false } });
  await next.rerender({ inputs: { open: true } });
  expect(screen.getByText('Saved')).toBeTruthy();
});
test('toggle group supports single and multiple selection without disabled activation', async () => {
  const r = await render(NeuToggleButtonGroupComponent, {
    inputs: { label: 'Filter', options },
  });
  await userEvent.setup().press(screen.getByRole('checkbox', { name: 'One' }));
  await userEvent.setup().press(screen.getByRole('checkbox', { name: 'Two' }));
  expect(r.instance.value()).toEqual(['two']);
  expect(
    screen.getByRole('checkbox', { name: 'One' }).props.accessibilityState
      .checked,
  ).toBe(false);
  expect(
    screen.getByRole('checkbox', { name: 'Two' }).props.accessibilityState
      .checked,
  ).toBe(true);
  await r.rerender({ inputs: { multiple: true } });
  await userEvent.setup().press(screen.getByRole('checkbox', { name: 'One' }));
  await userEvent
    .setup()
    .press(screen.getByRole('checkbox', { name: 'Unavailable' }));
  expect(r.instance.value()).toEqual(['two', 'one']);
  await userEvent.setup().press(screen.getByRole('checkbox', { name: 'Two' }));
  expect(r.instance.value()).toEqual(['one']);
  await r.rerender({ inputs: { disabled: true } });
  await userEvent.setup().press(screen.getByRole('checkbox', { name: 'One' }));
  expect(r.instance.value()).toEqual(['one']);
});
test('progress handles values outside the range', async () => {
  const r = await render(NeuProgressBarComponent, {
    inputs: { label: 'Download', value: 200, max: 100 },
  });
  expect(
    screen.getByRole('progressbar').props['accessibilityValue'],
  ).toMatchObject({ now: 100 });
  await r.rerender({ inputs: { value: -1 } });
  expect(
    screen.getByRole('progressbar').props['accessibilityValue'],
  ).toMatchObject({ now: 0 });
});
test('panel toggles its expansion state', async () => {
  const r = await render(NeuPanelComponent, { inputs: { title: 'Details' } });
  await press('Details');
  expect(r.instance.collapsed()).toBe(true);
  await press('Details');
  expect(r.instance.collapsed()).toBe(false);
});
