import { cleanup, render, screen, userEvent } from '@ng-native/testing';
import { afterEach, expect, test } from 'vitest';
import { NeuInlineEditorComponent } from './inline-editor/inline-editor.ts';

afterEach(cleanup);

test('inline editor exposes its displayed value before editing and after parent updates', async () => {
  const r = await render(NeuInlineEditorComponent, {
    inputs: { label: 'Profile name', placeholder: 'Choose a name' },
  });
  const accessibleValue = () => screen.getByRole('button', { name: 'Profile name' }).props['accessibilityValue'];
  expect(accessibleValue()).toMatchObject({ text: 'Choose a name' });
  await r.rerender({ inputs: { value: 'Pedro' } });
  expect(accessibleValue()).toMatchObject({ text: 'Pedro' });
  await r.rerender({ inputs: { value: '', readonly: true } });
  expect(accessibleValue()).toMatchObject({ text: 'Choose a name' });
});

test('inline editor disables native editing and saving when readonly changes during editing', async () => {
  const r = await render(NeuInlineEditorComponent, {
    inputs: { label: 'Profile name', value: 'Pedro' },
  });
  await userEvent.setup().press(screen.getByRole('button', { name: 'Profile name' }));
  const nativeEditor = () => screen.getByLabelText('Profile name');
  await r.rerender({ inputs: { readonly: true } });
  expect(nativeEditor().props['editable']).toBe(false);
  expect(screen.getByRole('button', { name: 'Save' }).props['accessibilityState']).toMatchObject({ disabled: true });
  await r.rerender({ inputs: { readonly: false, disabled: true } });
  expect(nativeEditor().props['editable']).toBe(false);
  await r.rerender({ inputs: { disabled: false } });
  expect(nativeEditor().props['editable']).not.toBe(false);
  expect(screen.getByRole('button', { name: 'Save' }).props['accessibilityState']).toMatchObject({ disabled: false });
  expect(r.instance.value()).toBe('Pedro');
});
