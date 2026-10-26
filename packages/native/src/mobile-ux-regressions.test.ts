import { Component, signal, type Type } from '@angular/core';
import { Text } from '@ng-native/components';
import { Accessibility } from '@ng-native/device';
import { HostEngine } from '@ng-native/fabric';
import { cleanup, fireEvent, render, screen, userEvent, type FakeFabricNode } from '@ng-native/testing';
import { afterEach, expect, test, vi } from 'vitest';
import { NeuPanelComponent } from './panel/panel.ts';
import { NeuSelectComponent } from './select/select.ts';
import { NeuThemeComponent } from './theme/theme.ts';
import { NeuSidebarComponent } from './sidebar/sidebar.ts';
import { NeuTreeSelectComponent } from './tree-select/tree-select.ts';
import { NeuCascadeSelectComponent } from './cascade-select/cascade-select.ts';
import { NeuContextMenuComponent } from './context-menu/context-menu.ts';
import { NeuMenuComponent } from './menu/menu.ts';
import { NeuDateInputComponent } from './date-input/date-input.ts';

afterEach(cleanup);

test('date input exposes translated picker actions as well as localized dates', async () => {
  await render(NeuDateInputComponent, { inputs: {
    label: 'Fecha', value: '2026-10-16', locale: 'es',
    closeLabel: 'Cerrar', previousLabel: 'Mes anterior', nextLabel: 'Mes siguiente',
    previousYearLabel: 'Año anterior', nextYearLabel: 'Año siguiente',
    previousYearsLabel: '12 años anteriores', nextYearsLabel: '12 años siguientes',
  } });
  await userEvent.setup().press(screen.getByRole('button', { name: 'Fecha' }));
  expect(screen.getByRole('button', { name: 'Cerrar' })).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Mes anterior' })).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Mes siguiente' })).toBeTruthy();
  await userEvent.setup().press(screen.getByRole('button', { name: 'octubre' }));
  expect(screen.getByRole('button', { name: 'Año anterior' })).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Año siguiente' })).toBeTruthy();
  await userEvent.setup().press(screen.getByRole('button', { name: '2026' }));
  expect(screen.getByRole('button', { name: '12 años anteriores' })).toBeTruthy();
  expect(screen.getByRole('button', { name: '12 años siguientes' })).toBeTruthy();
});

test('tree select forwards translated branch and empty labels to its tree', async () => {
  const r = await render(NeuTreeSelectComponent, { inputs: {
    label: 'Departamento', expandLabel: 'Expandir', emptyLabel: 'No hay departamentos',
    nodes: [{ id: 'product', label: 'Producto', children: [{ id: 'design', label: 'Diseño' }] }],
  } });
  await userEvent.setup().press(screen.getByRole('button', { name: 'Departamento' }));
  await userEvent.setup().press(screen.getByRole('button', { name: 'Producto Expandir' }));
  expect(screen.getByRole('radio', { name: 'Diseño' })).toBeTruthy();
  await r.rerender({ inputs: { nodes: [] } });
  expect(screen.getByText('No hay departamentos')).toBeTruthy();
});

test('menu dismissal emits no command and a queued item event cannot execute after closing', async () => {
  const activated = vi.fn();
  const r = await render(NeuMenuComponent, { inputs: { label: 'Actions', items: [{ id: 'a', label: 'Alpha' }, { id: 'b', label: 'Beta' }] }, on: { activated } });
  await userEvent.setup().press(screen.getByRole('button', { name: 'Actions' }));
  await userEvent.setup().press(screen.getByRole('button', { name: 'Dismiss menu' }));
  expect(activated).not.toHaveBeenCalled();
  await userEvent.setup().press(screen.getByRole('button', { name: 'Actions' }));
  const queued = screen.getByRole('menuitem', { name: 'Beta' });
  await userEvent.setup().press(screen.getByRole('menuitem', { name: 'Alpha' }));
  await fireEvent(queued, 'press', {});
  expect(activated.mock.calls).toEqual([['a']]);
  expect(r.instance.open()).toBe(false);
});

test.each([
  ['select', NeuSelectComponent], ['tree-select', NeuTreeSelectComponent],
  ['cascade-select', NeuCascadeSelectComponent], ['context-menu', NeuContextMenuComponent],
] as const)('%s ignores an option event queued after the popup has closed', async (name, component) => {
  const changed = vi.fn();
  const options = [{ id: 'a', label: 'Alpha' }, { id: 'b', label: 'Beta' }];
  const hierarchical = name === 'tree-select' || name === 'cascade-select';
  const r = await render(component as Type<unknown>, {
    inputs: { label: 'Choice', ...(hierarchical ? { nodes: [{ id: 'group', label: 'Group', children: options }] } : name === 'select' ? { options } : { items: options }) },
    on: name === 'context-menu' ? { activated: changed } : { valueChange: changed },
  });
  await userEvent.setup().press(screen.getByRole('button', { name: name === 'context-menu' ? 'Actions' : 'Choice' }));
  if (hierarchical) await userEvent.setup().press(screen.getByRole('button', { name: name === 'tree-select' ? 'Group Expand' : 'Group' }));
  const role = name === 'context-menu' ? 'menuitem' : 'radio';
  const queuedTarget = screen.getByRole(role, { name: 'Beta' });
  await userEvent.setup().press(screen.getByRole(role, { name: 'Alpha' }));
  await fireEvent(queuedTarget, 'press', {});
  expect(changed.mock.calls).toEqual([['a']]);
  if (name !== 'context-menu') expect((r.instance as { value: () => string }).value()).toBe('a');
});

test('an outgoing drawer cannot navigate again while its closing animation is running', async () => {
  const navigate = vi.fn();
  const r = await render(NeuSidebarComponent, {
    inputs: { title: 'Workspace', open: true, items: [{ id: 'a', label: 'Alpha' }, { id: 'b', label: 'Beta' }] },
    on: { navigate },
  });
  const queuedTarget = screen.getByRole('radio', { name: 'Beta' });
  await userEvent.setup().press(screen.getByRole('radio', { name: 'Alpha' }));
  await fireEvent(queuedTarget, 'press', {});
  expect(r.instance.value()).toBe('a');
  expect(navigate.mock.calls).toEqual([['a']]);
});

@Component({
  selector: 'test-collapse-lifecycle',
  imports: [NeuPanelComponent, Text],
  template: `<neu-panel title="Details" [(collapsed)]="collapsed"><text>Editing content</text></neu-panel>`,
})
class CollapseHost { readonly collapsed = signal(false); }

@Component({
  selector: 'test-zero-duration-panel',
  imports: [NeuThemeComponent, NeuPanelComponent, Text],
  template: `<neu-theme [tokens]="{ duration: 0 }"><neu-panel title="Instant details" [(collapsed)]="collapsed"><text>Instant content</text></neu-panel></neu-theme>`,
})
class ZeroDurationHost { readonly collapsed = signal(false); }

test('the existing zero duration theme token disables panel motion', async () => {
  await render(ZeroDurationHost);
  await userEvent.setup().press(screen.getByRole('button', { name: 'Instant details' }));
  expect(screen.queryByText('Instant content')).toBeNull();
});

test('an interrupted panel closing animation cannot remove newly reopened content', async () => {
  const r = await render(CollapseHost);
  await userEvent.setup().press(screen.getByRole('button', { name: 'Details' }));
  expect(r.instance.collapsed()).toBe(true);
  await userEvent.setup().press(screen.getByRole('button', { name: 'Details' }));
  expect(r.instance.collapsed()).toBe(false);
  await new Promise(resolve => setTimeout(resolve, 300));
  expect(screen.getByText('Editing content')).toBeTruthy();
  r.unmount();
  expect(r.componentRef.hostView.destroyed).toBe(true);
});

test('reduced motion closes a panel immediately instead of waiting for an animation', async () => {
  const r = await render(CollapseHost, {
    providers: [{ provide: Accessibility.SOURCE, useValue: {
      current: async () => ({ reduceMotion: true, screenReader: false, boldText: false, fontScale: 1 }),
      subscribe: () => () => {}, announce: () => {},
    } }],
  });
  await vi.waitFor(() => expect(r.componentRef.injector.get(Accessibility).reduceMotion()).toBe(true));
  await userEvent.setup().press(screen.getByRole('button', { name: 'Details' }));
  expect(screen.queryByText('Editing content')).toBeNull();
});

test('dropdown dismissal and native Back do not commit a value or touch a form', async () => {
  const touch = vi.fn();
  const r = await render(NeuSelectComponent, {
    inputs: { label: 'Team', value: 'a', options: [{ id: 'a', label: 'Alpha' }, { id: 'b', label: 'Beta' }] },
    on: { touch },
  });
  await userEvent.setup().press(screen.getByRole('button', { name: 'Team' }));
  await userEvent.setup().press(screen.getByRole('button', { name: 'Dismiss options' }));
  expect(r.instance.value()).toBe('a');
  expect(touch).not.toHaveBeenCalled();
  await userEvent.setup().press(screen.getByRole('button', { name: 'Team' }));
  await fireEvent(r.fabric.find('ModalHostView')!, 'requestClose', {});
  expect(screen.queryByRole('radio', { name: 'Beta' })).toBeNull();
  expect(r.instance.value()).toBe('a');
  expect(touch).not.toHaveBeenCalled();
});

function popup(node: FakeFabricNode | undefined): FakeFabricNode | undefined {
  if (!node) return undefined;
  if (typeof node.props.maxHeight === 'number') return node;
  for (const child of node.children) { const found = popup(child); if (found) return found; }
  return undefined;
}

test('a dropdown flips above a low field and stays within the horizontal viewport', async () => {
  const r = await render(NeuSelectComponent, {
    inputs: { label: 'Team', options: [{ id: 'a', label: 'Alpha' }] },
  });
  const engine = r.componentRef.injector.get(HostEngine);
  let origin: Parameters<HostEngine['measure']>[0] | undefined;
  const measure = vi.spyOn(engine, 'measure').mockImplementation((node, into) => {
    origin ??= node;
    into(node === origin ? { x: 0, y: 0, width: 360, height: 800 } : { x: 280, y: 640, width: 240, height: 48 });
  });
  await userEvent.setup().press(screen.getByRole('button', { name: 'Team' }));
  expect(measure).toHaveBeenCalled();
  expect(popup(r.fabric.find('ModalHostView'))?.props).toMatchObject({ left: 104, width: 240, bottom: 164, maxHeight: 320 });
  measure.mockRestore();
});

test('dropdown positioning subtracts the overlay origin rather than assuming a full-screen root', async () => {
  const r = await render(NeuSelectComponent, { inputs: { label: 'Team' } });
  let origin: Parameters<HostEngine['measure']>[0] | undefined;
  vi.spyOn(r.componentRef.injector.get(HostEngine), 'measure').mockImplementation((node, into) => {
    origin ??= node;
    into(node === origin ? { x: 0, y: -44, width: 322, height: 676 } : { x: 20, y: 50, width: 282, height: 48 });
  });
  await userEvent.setup().press(screen.getByRole('button', { name: 'Team' }));
  expect(popup(r.fabric.find('ModalHostView'))?.props).toMatchObject({ left: 20, width: 282, top: 146 });
});

test('a native dropdown has a bounded scroll viewport before measurement and follows content size changes', async () => {
  const r = await render(NeuSelectComponent, {
    inputs: { label: 'Team', options: [{ id: 'a', label: 'Alpha' }] },
  });
  await userEvent.setup().press(screen.getByRole('button', { name: 'Team' }));
  const surface = popup(r.fabric.find('ModalHostView'))!;
  expect(surface.props).toMatchObject({ height: 320, maxHeight: 320 });
  const scroll = surface.children[0]!;
  expect(scroll.props).toMatchObject({ flexGrow: 1, flexShrink: 1, minHeight: 0 });
  const content = scroll.children[0]!;
  await fireEvent(content, 'layout', { layout: { x: 0, y: 0, width: 240, height: 96 } });
  expect(popup(r.fabric.find('ModalHostView'))?.props.height).toBe(98);
  await fireEvent(content, 'layout', { layout: { x: 0, y: 0, width: 240, height: 900 } });
  expect(popup(r.fabric.find('ModalHostView'))?.props.height).toBe(320);
  await fireEvent(content, 'layout', { layout: { x: 0, y: 0, width: 240, height: 64 } });
  expect(popup(r.fabric.find('ModalHostView'))?.props.height).toBe(66);
});

test('a late native anchor measurement is harmless after destroying a dropdown', async () => {
  const r = await render(NeuSelectComponent, { inputs: { label: 'Team' } });
  let callback: Parameters<HostEngine['measure']>[1] | undefined;
  vi.spyOn(r.componentRef.injector.get(HostEngine), 'measure').mockImplementation((_node, into) => { callback = into; });
  await userEvent.setup().press(screen.getByRole('button', { name: 'Team' }));
  r.unmount();
  expect(() => callback?.({ x: 0, y: 0, width: 300, height: 48 })).not.toThrow();
  expect(r.componentRef.hostView.destroyed).toBe(true);
});
