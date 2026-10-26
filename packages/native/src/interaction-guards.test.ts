import { type Type } from '@angular/core';
import { cleanup, render, screen, userEvent } from '@ng-native/testing';
import { afterEach, expect, test, vi } from 'vitest';
import { NeuAccordionComponent } from './accordion/accordion.ts';
import { NeuAutocompleteComponent } from './autocomplete/autocomplete.ts';
import { NeuButtonComponent } from './button/button.ts';
import { NeuIconButtonComponent } from './icon-button/icon-button.ts';
import { NeuButtonGroupComponent } from './button-group/button-group.ts';
import { NeuCascadeSelectComponent } from './cascade-select/cascade-select.ts';
import { NeuCheckboxComponent } from './checkbox/checkbox.ts';
import { NeuChipComponent } from './chip/chip.ts';
import { NeuContextMenuComponent } from './context-menu/context-menu.ts';
import { NeuDateInputComponent } from './date-input/date-input.ts';
import { NeuFilterBarComponent } from './filter-bar/filter-bar.ts';
import { NeuInlineEditorComponent } from './inline-editor/inline-editor.ts';
import { NeuInputTagsComponent } from './input-tags/input-tags.ts';
import { NeuListboxComponent } from './listbox/listbox.ts';
import { NeuMenuComponent } from './menu/menu.ts';
import { NeuNavComponent } from './nav/nav.ts';
import { NeuNotificationCenterComponent } from './notification-center/notification-center.ts';
import { NeuNumberInputComponent } from './number-input/number-input.ts';
import { NeuPasswordComponent } from './password/password.ts';
import { NeuPickListComponent } from './pick-list/pick-list.ts';
import { NeuPopoverComponent } from './popover/popover.ts';
import { NeuRadioGroupComponent } from './radio/radio.ts';
import { NeuRatingComponent } from './rating/rating.ts';
import { NeuSelectComponent } from './select/select.ts';
import { NeuSidebarComponent } from './sidebar/sidebar.ts';
import { NeuSpeedDialComponent } from './speed-dial/speed-dial.ts';
import { NeuStepperComponent } from './stepper/stepper.ts';
import { NeuTabsComponent } from './tabs/tabs.ts';
import { NeuToggleButtonGroupComponent } from './toggle-button-group/toggle-button-group.ts';
import { NeuTreeComponent } from './tree/tree.ts';
import { NeuTreeSelectComponent } from './tree-select/tree-select.ts';
import { NeuVirtualListComponent } from './virtual-list/virtual-list.ts';
import { NEU_PLUS_ICON } from './foundation/index.ts';

afterEach(cleanup);

// A native callback may already have been queued when its control becomes
// unavailable. Exercise the handlers as well as the disabled rendered controls.
function invoke(instance: object, name: string, ...args: unknown[]): unknown {
  return (instance as Record<string, (...values: unknown[]) => unknown>)[name]!.apply(instance, args);
}
const one = { id: 'one', label: 'One' };
const off = { id: 'off', label: 'Unavailable', disabled: true };
const options = [one, off];
const nodes = [{ ...one, children: [{ id: 'leaf', label: 'Leaf' }] }, off];
interface GuardCase {
  name: string;
  component: Type<object>;
  inputs?: Record<string, unknown>;
  readonly?: boolean;
  actions: [string, ...unknown[]][];
  state: string[];
  outputs: string[];
}
const cases: GuardCase[] = [
  { name: 'accordion', component: NeuAccordionComponent, inputs: { items: options }, actions: [['toggle', one]], state: ['expanded'], outputs: ['expandedChange'] },
  { name: 'autocomplete', component: NeuAutocompleteComponent, readonly: true, inputs: { options }, actions: [['search', 'One'], ['choose', 'one'], ['accept', 'late']], state: ['value', 'query', 'searching'], outputs: ['valueChange', 'touch'] },
  { name: 'button', component: NeuButtonComponent, actions: [['activate', {}]], state: [], outputs: ['pressed'] },
  { name: 'icon button', component: NeuIconButtonComponent, inputs: { svg: NEU_PLUS_ICON }, actions: [['activate', {}]], state: [], outputs: ['pressed'] },
  { name: 'button group', component: NeuButtonGroupComponent, inputs: { items: options }, actions: [['activate', one]], state: [], outputs: ['activated'] },
  { name: 'cascade select', component: NeuCascadeSelectComponent, readonly: true, inputs: { nodes }, actions: [['show'], ['choose', 'one'], ['back']], state: ['value', 'open', 'path'], outputs: ['valueChange', 'touch'] },
  { name: 'checkbox', component: NeuCheckboxComponent, readonly: true, actions: [['toggle']], state: ['checked'], outputs: ['checkedChange', 'touch'] },
  { name: 'chip', component: NeuChipComponent, inputs: { removable: true }, actions: [['toggle'], ['remove']], state: ['selected'], outputs: ['selectedChange', 'removed'] },
  { name: 'context menu', component: NeuContextMenuComponent, inputs: { items: options }, actions: [['activate'], ['show'], ['choose', 'one']], state: ['open'], outputs: ['pressed', 'activated', 'openChange'] },
  { name: 'date input', component: NeuDateInputComponent, readonly: true, actions: [['show'], ['choose', '2026-10-16']], state: ['value', 'open'], outputs: ['valueChange', 'touch'] },
  { name: 'filter bar', component: NeuFilterBarComponent, inputs: { options, value: ['one'], query: 'One' }, actions: [['clear'], ['toggle', 'one', false]], state: ['value', 'query'], outputs: ['valueChange', 'queryChange'] },
  { name: 'inline editor', component: NeuInlineEditorComponent, readonly: true, inputs: { editing: true, value: 'Original' }, actions: [['begin'], ['save']], state: ['value', 'editing'], outputs: ['valueChange', 'saved', 'touch'] },
  { name: 'input tags', component: NeuInputTagsComponent, readonly: true, inputs: { value: ['Existing'] }, actions: [['add'], ['remove', 'Existing']], state: ['value'], outputs: ['valueChange', 'touch'] },
  { name: 'listbox', component: NeuListboxComponent, readonly: true, inputs: { options }, actions: [['choose', one]], state: ['value'], outputs: ['valueChange', 'selected', 'touch'] },
  { name: 'menu', component: NeuMenuComponent, inputs: { items: options }, actions: [['show'], ['activate', 'one']], state: ['open'], outputs: ['activated', 'openChange'] },
  { name: 'nav', component: NeuNavComponent, inputs: { items: options }, actions: [['choose', one]], state: ['value'], outputs: ['valueChange', 'navigate'] },
  { name: 'notification center', component: NeuNotificationCenterComponent, inputs: { items: options }, actions: [['activate', one], ['markAll']], state: ['readIds'], outputs: ['readIdsChange', 'activated'] },
  { name: 'number input', component: NeuNumberInputComponent, readonly: true, actions: [['change', 1]], state: ['value'], outputs: ['valueChange', 'touch'] },
  { name: 'password', component: NeuPasswordComponent, actions: [['toggle']], state: ['revealed'], outputs: [] },
  { name: 'pick list', component: NeuPickListComponent, readonly: true, inputs: { options, value: ['one'] }, actions: [['add', 'off'], ['remove', 'one'], ['move', 0, 1]], state: ['value'], outputs: ['valueChange', 'touch'] },
  { name: 'popover', component: NeuPopoverComponent, actions: [['show']], state: ['open'], outputs: ['openChange'] },
  { name: 'radio', component: NeuRadioGroupComponent, readonly: true, inputs: { options }, actions: [['choose', one]], state: ['value'], outputs: ['valueChange', 'touch'] },
  { name: 'rating', component: NeuRatingComponent, readonly: true, actions: [['rate', 3]], state: ['value'], outputs: ['valueChange', 'touch'] },
  { name: 'select', component: NeuSelectComponent, readonly: true, inputs: { options }, actions: [['show'], ['choose', 'one']], state: ['value', 'open'], outputs: ['valueChange', 'touch'] },
  { name: 'sidebar', component: NeuSidebarComponent, inputs: { title: 'Navigation', items: options, open: true }, actions: [['choose', 'one']], state: ['value', 'open'], outputs: ['valueChange', 'navigate'] },
  { name: 'speed dial', component: NeuSpeedDialComponent, inputs: { actions: options, open: true }, actions: [['toggle'], ['activate', one]], state: ['open'], outputs: ['activated', 'openChange'] },
  { name: 'stepper', component: NeuStepperComponent, inputs: { steps: options }, actions: [['goTo', 1], ['next']], state: ['activeStep'], outputs: ['activeStepChange', 'finished'] },
  { name: 'tabs', component: NeuTabsComponent, inputs: { tabs: options }, actions: [['choose', one]], state: ['value'], outputs: ['valueChange'] },
  { name: 'toggle button group', component: NeuToggleButtonGroupComponent, inputs: { options }, actions: [['toggle', one]], state: ['value'], outputs: ['valueChange', 'touch'] },
  { name: 'tree', component: NeuTreeComponent, inputs: { nodes }, actions: [['toggle', 'one'], ['choose', 'leaf']], state: ['expanded', 'value'], outputs: ['expandedChange', 'valueChange', 'selected', 'touch'] },
  { name: 'tree select', component: NeuTreeSelectComponent, readonly: true, inputs: { nodes }, actions: [['show'], ['choose', 'leaf']], state: ['value', 'open'], outputs: ['valueChange', 'touch'] },
  { name: 'virtual list', component: NeuVirtualListComponent, inputs: { items: options }, actions: [['choose', one]], state: [], outputs: ['selected'] },
];
for (const spec of cases) {
  for (const mode of spec.readonly ? ['disabled', 'readonly'] : ['disabled']) {
    test(`${spec.name}: queued callbacks do not edit or emit when ${mode}`, async () => {
      const emitted = vi.fn();
      const r = await render(spec.component, {
        inputs: { ...(['accordion', 'sidebar', 'stepper', 'virtual list'].includes(spec.name) ? {} : { label: 'Control' }), ...spec.inputs, [mode]: true },
        on: Object.fromEntries(spec.outputs.map(name => [name, emitted])),
      });
      emitted.mockClear(); // Ignore initial normalization (for example, tabs).
      const before = spec.state.map(name => invoke(r.instance, name));
      for (const [name, ...args] of spec.actions) invoke(r.instance, name, ...args);
      await r.detectChanges();
      expect(spec.state.map(name => invoke(r.instance, name))).toEqual(before);
      expect(emitted).not.toHaveBeenCalled();
    });
  }
}

test('filter bar toggles only known enabled filters and can remove a selection', async () => {
  const r = await render(NeuFilterBarComponent, { inputs: { options } });
  invoke(r.instance, 'toggle', 'missing', true);
  invoke(r.instance, 'toggle', 'off', true);
  expect(r.instance.value()).toEqual([]);
  invoke(r.instance, 'toggle', 'one', true);
  expect(r.instance.value()).toEqual(['one']);
  invoke(r.instance, 'toggle', 'one', false);
  expect(r.instance.value()).toEqual([]);
});

test('context target emits its primary action separately from long-press actions', async () => {
  const primary = vi.fn(), action = vi.fn();
  const r = await render(NeuContextMenuComponent, { inputs: { label: 'Message', items: options }, on: { pressed: primary, activated: action } });
  invoke(r.instance, 'activate');
  expect(primary).toHaveBeenCalledOnce();
  expect(r.instance.open()).toBe(false);
  invoke(r.instance, 'show');
  invoke(r.instance, 'choose', 'missing');
  expect(r.instance.open()).toBe(true);
  invoke(r.instance, 'choose', 'one');
  expect(action).toHaveBeenCalledWith('one');
  expect(r.instance.open()).toBe(false);
});

test('nonselectable chips still support their independent remove action', async () => {
  const removed = vi.fn();
  const r = await render(NeuChipComponent, { inputs: { label: 'Tag', selectable: false, removable: true }, on: { removed } });
  invoke(r.instance, 'toggle');
  expect(r.instance.selected()).toBe(false);
  await userEvent.setup().press(screen.getByRole('button', { name: 'Remove Tag' }));
  expect(removed).toHaveBeenCalledOnce();
});

test('virtual list supports bounded imperative scrolling and rejects disabled rows', async () => {
  const selected = vi.fn();
  const r = await render(NeuVirtualListComponent, { inputs: { items: options }, on: { selected } });
  r.instance.scrollToIndex(-1);
  r.instance.scrollToIndex(options.length);
  r.instance.scrollToIndex(1);
  r.instance.scrollToTop();
  invoke(r.instance, 'choose', off);
  expect(selected).not.toHaveBeenCalled();
  invoke(r.instance, 'choose', one);
  expect(selected).toHaveBeenCalledExactlyOnceWith('one');
});

test('tree collapses expanded branches and ignores missing or leaf expansion requests', async () => {
  const r = await render(NeuTreeComponent, { inputs: { nodes } });
  invoke(r.instance, 'toggle', 'missing');
  invoke(r.instance, 'toggle', 'leaf');
  expect(r.instance.expanded()).toEqual([]);
  invoke(r.instance, 'toggle', 'one');
  expect(r.instance.expanded()).toEqual(['one']);
  invoke(r.instance, 'toggle', 'one');
  expect(r.instance.expanded()).toEqual([]);
});

test('readonly trees permit browsing but never selection', async () => {
  const selected = vi.fn();
  const r = await render(NeuTreeComponent, { inputs: { nodes, readonly: true }, on: { selected } });
  invoke(r.instance, 'toggle', 'one');
  expect(r.instance.expanded()).toEqual(['one']);
  invoke(r.instance, 'choose', 'leaf');
  expect(r.instance.value()).toBe('');
  expect(selected).not.toHaveBeenCalled();
});

test('tabs with only unavailable entries leave no tab selected', async () => {
  const r = await render(NeuTabsComponent, { inputs: { tabs: [off], value: 'one' } });
  expect(r.instance.value()).toBe('');
  await r.rerender({ inputs: { tabs: [] } });
  expect(r.instance.value()).toBe('');
});

test('sidebar dismiss button closes without navigating', async () => {
  const navigate = vi.fn();
  const r = await render(NeuSidebarComponent, { inputs: { title: 'Navigation', items: options, open: true }, on: { navigate } });
  await userEvent.setup().press(screen.getByRole('button', { name: 'Close navigation' }));
  expect(r.instance.open()).toBe(false);
  expect(navigate).not.toHaveBeenCalled();
});
