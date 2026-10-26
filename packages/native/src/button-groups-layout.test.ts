import {
  cleanup,
  fireEvent,
  render,
  screen,
  userEvent,
  waitFor,
  type FakeFabricNode,
} from '@ng-native/testing';
import { afterEach, expect, test, vi } from 'vitest';
import { NeuButtonGroupComponent } from './button-group/button-group.ts';
import { NeuToggleButtonGroupComponent } from './toggle-button-group/toggle-button-group.ts';
import { NEU_LIGHT_TOKENS } from './foundation/index.ts';
import { neuTonePalette } from './foundation/tone.ts';

afterEach(cleanup);
const items = [
  { id: 'open', label: 'Open' },
  { id: 'share', label: 'Share' },
  { id: 'archive', label: 'Archive', disabled: true },
];
const flatten = (nodes: readonly FakeFabricNode[]): FakeFabricNode[] =>
  nodes.flatMap((node) => [node, ...flatten(node.children)]);

test('action feedback lasts only for the active touch and clears on cancellation', async () => {
  const activated = vi.fn();
  await render(NeuButtonGroupComponent, {
    inputs: { items },
    on: { activated },
  });
  const button = () => screen.getByRole('button', { name: 'Open' });
  const initial = button().props.backgroundColor;
  const point = {
    identifier: 0,
    target: button().reactTag,
    pageX: 0,
    pageY: 0,
    locationX: 0,
    locationY: 0,
    timestamp: Date.now(),
  };
  await fireEvent(button(), 'touchStart', {
    ...point,
    touches: [point],
    changedTouches: [point],
  });
  expect(button().props.backgroundColor).not.toEqual(initial);
  expect(activated).not.toHaveBeenCalled();
  await fireEvent(button(), 'touchCancel', {
    ...point,
    touches: [],
    changedTouches: [point],
  });
  await waitFor(() => expect(button().props.backgroundColor).toEqual(initial));
  expect(activated).not.toHaveBeenCalled();
  await userEvent.setup().press(button());
  await waitFor(() => expect(button().props.backgroundColor).toEqual(initial));
  expect(activated.mock.calls).toEqual([['open']]);
});

test('actions form a connected row with shared separators and emit actions without selection', async () => {
  const activated = vi.fn();
  const r = await render(NeuButtonGroupComponent, {
    inputs: { items },
    on: { activated },
  });
  const group = flatten(r.fabric.committed).find(
    (node) => node.props.accessibilityLabel === 'Actions',
  );
  expect(group?.props).toMatchObject({
    flexDirection: 'row',
    borderTopWidth: 1,
    overflow: 'hidden',
    minWidth: 146,
  });
  expect(group?.props.flexWrap).not.toBe('wrap');
  expect(screen.getByRole('button', { name: 'Open' }).props).toMatchObject({
    borderRightWidth: 1,
    minHeight: 48,
    flexBasis: 0,
  });
  expect(
    screen.getByRole('button', { name: 'Archive' }).props.borderRightWidth,
  ).toBe(0);
  await userEvent.setup().press(screen.getByRole('button', { name: 'Share' }));
  expect(activated.mock.calls).toEqual([['share']]);
  expect(
    screen.getByRole('button', { name: 'Share' }).props.accessibilityState,
  ).not.toHaveProperty('checked');
  await userEvent
    .setup()
    .press(screen.getByRole('button', { name: 'Archive' }));
  expect(activated).toHaveBeenCalledTimes(1);
});

test('toggle selection uses a surface indicator and semantic ink and preserves independent multi-selection', async () => {
  const r = await render(NeuToggleButtonGroupComponent, {
    inputs: { label: 'Views', options: items, value: ['open'], tone: 'danger' },
  });
  expect(screen.getByRole('checkbox', { name: 'Open' }).props).toMatchObject({
    backgroundColor: NEU_LIGHT_TOKENS.surface,
    minHeight: 48,
  });
  expect(screen.getByText('Open').props.color).toBe(neuTonePalette(NEU_LIGHT_TOKENS, 'danger').ink);
  expect(screen.queryByText('✓')).toBeNull();
  await userEvent
    .setup()
    .press(screen.getByRole('checkbox', { name: 'Share' }));
  expect(r.instance.value()).toEqual(['share']);
  expect(
    screen.getByRole('checkbox', { name: 'Open' }).props.backgroundColor,
  ).toBe('transparent');
  await r.rerender({ inputs: { multiple: true } });
  await userEvent.setup().press(screen.getByRole('checkbox', { name: 'Open' }));
  expect(r.instance.value()).toEqual(['share', 'open']);
  await userEvent
    .setup()
    .press(screen.getByRole('checkbox', { name: 'Share' }));
  expect(r.instance.value()).toEqual(['open']);
  await r.rerender({ inputs: { disabled: true } });
  await userEvent.setup().press(screen.getByRole('checkbox', { name: 'Open' }));
  expect(r.instance.value()).toEqual(['open']);
});

test('larger groups retain touch targets and use a horizontal scroll viewport', async () => {
  const many = Array.from({ length: 8 }, (_, index) => ({
    id: String(index),
    label: 'Long action ' + index,
  }));
  const r = await render(NeuButtonGroupComponent, { inputs: { items: many } });
  const group = flatten(r.fabric.committed).find(
    (node) => node.props.accessibilityLabel === 'Actions',
  );
  expect(group?.props.minWidth).toBe(386);
  expect(
    flatten(r.fabric.committed).some((node) => node.props.horizontal === true),
  ).toBe(true);
  expect(screen.getByText('Long action 0').props).toMatchObject({
    numberOfLines: 2,
    ellipsizeMode: 'tail',
  });
  await r.rerender({ inputs: { items: [] } });
  expect(screen.queryAllByRole('button')).toHaveLength(0);
});
