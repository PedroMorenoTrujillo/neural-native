import { cleanup, render, screen, settle, userEvent } from '@ng-native/testing';
import { afterEach, expect, test } from 'vitest';
import { NeuNumberInputComponent } from './number-input/number-input.ts';

afterEach(cleanup);

test('a number can be cleared and replaced without restoring the old digit between native keystrokes', async () => {
  const r = await render(NeuNumberInputComponent, { inputs: { label: 'Seats', value: 2, min: 1, max: 10 } });
  r.fabric.emit(screen.getByLabelText('Seats'), 'topFocus', {});
  r.fabric.emit(screen.getByLabelText('Seats'), 'topChange', { text: '', eventCount: 1 });
  await settle();
  expect(r.instance.value()).toBe(2);
  expect(r.fabric.commands.filter(c => c.name === 'setTextAndSelection')).toEqual([]);
  r.fabric.emit(screen.getByLabelText('Seats'), 'topChange', { text: '4', eventCount: 2 });
  await settle();
  expect(r.instance.value()).toBe(4);
});

test.each([
  { min: -10, max: 10, step: 0.5, value: 2, drafts: ['-', '-3,', '-3,5'], result: -3.5 },
  { min: 10, max: 100, step: 1, value: 20, drafts: ['1', '15'], result: 15 },
])('numeric intermediate drafts remain editable and normalize on blur: %j', async ({ drafts, result, ...inputs }) => {
  const r = await render(NeuNumberInputComponent, { inputs: { label: 'Amount', ...inputs } });
  r.fabric.emit(screen.getByLabelText('Amount'), 'topFocus', {});
  for (const [index, text] of drafts.entries()) {
    r.fabric.emit(screen.getByLabelText('Amount'), 'topChange', { text, eventCount: index + 1 });
    await settle();
    expect(r.fabric.commands.filter(c => c.name === 'setTextAndSelection')).toEqual([]);
    expect(r.instance.value()).toBeGreaterThanOrEqual(inputs.min);
    expect(r.instance.value()).toBeLessThanOrEqual(inputs.max);
  }
  expect(r.instance.value()).toBe(result);
  r.fabric.emit(screen.getByLabelText('Amount'), 'topBlur', {});
  await settle();
  expect(screen.getByLabelText('Amount').props['text']).toBe(String(result));
});

test('external resets discard stale numeric drafts and step actions restore canonical text', async () => {
  const r = await render(NeuNumberInputComponent, { inputs: { label: 'Quantity', value: 2, min: 1, max: 10 } });
  r.fabric.emit(screen.getByLabelText('Quantity'), 'topChange', { text: '', eventCount: 1 });
  await settle();
  await r.rerender({ inputs: { value: 6 } });
  expect(screen.getByLabelText('Quantity').props['text']).toBe('6');
  await r.rerender({ inputs: { value: 2 } });
  expect(screen.getByLabelText('Quantity').props['text']).toBe('2');
  r.fabric.emit(screen.getByLabelText('Quantity'), 'topChange', { text: '7,', eventCount: 2 });
  await settle();
  await userEvent.setup().press(screen.getByRole('button', { name: 'Increase Quantity', exact: true }));
  expect(r.instance.value()).toBe(8);
  expect(screen.getByLabelText('Quantity').props['text']).toBe('8');
  await r.rerender({ inputs: { readonly: true, value: 3 } });
  r.fabric.emit(screen.getByLabelText('Quantity'), 'topChange', { text: '9', eventCount: 3 });
  await settle();
  expect(r.instance.value()).toBe(3);
});
