import { cleanup, render, screen, userEvent, fireEvent } from '@ng-native/testing';
import { afterEach, expect, test, vi } from 'vitest';
import { NeuSelectComponent } from './select/select.ts';

afterEach(cleanup);
const options = [
  { id: 'design', label: 'Design', description: 'Product interfaces' },
  { id: 'engineering', label: 'Engineering', description: 'Mobile applications' },
  { id: 'madrid', label: 'Diseño', description: 'Madrid office' },
  { id: 'off', label: 'Unavailable', disabled: true },
];
const press = (role: 'button' | 'radio' | 'checkbox', name: string) => userEvent.setup().press(screen.getByRole(role, { name }));

test('search matches labels, accents and descriptions, shows an empty result and resets on reopen', async () => {
  await render(NeuSelectComponent, { inputs: { label: 'Team', options, searchable: true } });
  await press('button', 'Team');
  await fireEvent.changeText(screen.getByLabelText('Search options'), 'diseno');
  expect(screen.getByRole('radio', { name: 'Diseño' })).toBeTruthy();
  expect(screen.queryByRole('radio', { name: 'Engineering' })).toBeNull();
  await fireEvent.changeText(screen.getByLabelText('Search options'), ' MOBILE ');
  await press('radio', 'Engineering');
  await press('button', 'Team');
  expect(screen.getByRole('radio', { name: 'Design' })).toBeTruthy();
  await fireEvent.changeText(screen.getByLabelText('Search options'), 'missing');
  expect(screen.getByText('No matching options')).toBeTruthy();
});

test('multiple selection preserves filtered IDs, toggles items and stays open', async () => {
  const changed = vi.fn();
  const result = await render(NeuSelectComponent, {
    inputs: { label: 'Team', options, multiple: true, searchable: true, values: ['design'] },
    on: { valuesChange: changed },
  });
  await press('button', 'Team');
  await fireEvent.changeText(screen.getByLabelText('Search options'), 'mobile');
  await press('checkbox', 'Engineering');
  expect(result.instance.values()).toEqual(['design', 'engineering']);
  expect(result.instance.value()).toBe('');
  expect(screen.getByRole('checkbox', { name: 'Engineering' })).toBeTruthy();
  await press('checkbox', 'Engineering');
  expect(result.instance.values()).toEqual(['design']);
  expect(changed).toHaveBeenCalledTimes(2);
});

test('multiple selection respects disabled items, readonly and parent changes', async () => {
  const result = await render(NeuSelectComponent, {
    inputs: { label: 'Team', options, multiple: true },
  });
  await press('button', 'Team');
  await press('checkbox', 'Unavailable');
  expect(result.instance.values()).toEqual([]);
  await result.rerender({ inputs: { values: ['engineering'], readonly: true } });
  await press('checkbox', 'Design');
  expect(result.instance.values()).toEqual(['engineering']);
  expect(screen.getByRole('button', { name: 'Team' }).props['accessibilityValue']).toMatchObject({ text: 'Engineering' });
});
