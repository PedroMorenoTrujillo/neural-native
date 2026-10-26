import { Component, signal } from '@angular/core';
import { Text, View, Pressable, Image } from '@ng-native/components';
import { cleanup, fireEvent, render, screen, settle, userEvent, type FakeFabricNode } from '@ng-native/testing';
import { afterEach, expect, test } from 'vitest';
import { Accessibility, Screen } from '@ng-native/device';
import { NeuModalComponent, NeuModalHeaderDirective, NeuModalFooterDirective } from './modal/index.ts';
import { NeuCardComponent, NeuCardHeaderDirective, NeuCardFooterDirective } from './card/index.ts';
import { NeuPanelComponent, NeuPanelHeaderDirective, NeuPanelFooterDirective } from './panel/index.ts';
import { NeuSelectComponent, NeuSelectItemDirective, NeuSelectSelectedDirective } from './select/index.ts';
import { NeuListboxComponent, NeuListboxItemDirective } from './listbox/index.ts';
import { NeuGalleryComponent, NeuGalleryItemDirective, NeuGalleryCaptionDirective } from './gallery/index.ts';
import { NeuDataViewComponent, NeuDataViewItemDirective } from './data-view/index.ts';
import { NEU_LIGHT_TOKENS, NEU_THEME } from './foundation/index.ts';
import { NeuVirtualListComponent, NeuVirtualListItemDirective } from './virtual-list/index.ts';

afterEach(cleanup);
const instantMotion = [{ provide: NEU_THEME, useValue: signal({ ...NEU_LIGHT_TOKENS, duration: 0 }) }];
const press = (name: string, role: 'button' | 'radio' | 'checkbox' = 'button') => userEvent.setup().press(screen.getByRole(role, { name }));
const flatten = (nodes: readonly FakeFabricNode[]): FakeFabricNode[] => nodes.flatMap(node => [node, ...flatten(node.children)]);
const contains = (root: FakeFabricNode, target: FakeFabricNode): boolean => root === target || root.children.some(child => contains(child, target));

@Component({
  imports: [NeuModalComponent, NeuModalHeaderDirective, NeuModalFooterDirective, Text, Pressable],
  template: `<neu-modal title="Accessible workspace" [(open)]="open">
    @if (custom()) { <ng-template neuModalHeader><text accessibilityRole="header">Custom workspace</text></ng-template> }
    <text>Scrollable body</text>
    @if (custom()) { <ng-template neuModalFooter><pressable accessibilityRole="button" accessibilityLabel="Save workspace" (press)="saved.set(true); open.set(false)"><text>Save</text></pressable></ng-template> }
  </neu-modal>`,
})
class ModalHost {
  readonly open = signal(true);
  readonly custom = signal(true);
  readonly saved = signal(false);
}

test.each([
  ['short landscape window', 320, 1, true],
  ['moderately enlarged text', 874, 1.35, true],
  ['enlarged text', 900, 2, true],
  ['roomy window', 900, 1, false],
] as const)('modal keeps body and footer reachable in a %s', async (_name, height, fontScale, scrolls) => {
  const r = await render(ModalHost, { providers: [
    ...instantMotion,
    { provide: Screen.SOURCE, useValue: {
      current: () => ({ window: { width: 800, height }, screen: { width: 800, height } }),
      subscribe: () => () => {},
    } },
    { provide: Accessibility.SOURCE, useValue: {
      current: async () => ({ fontScale, screenReader: false, reduceMotion: false, boldText: false }),
      subscribe: () => () => {},
    } },
  ] });
  const body = screen.getByText('Scrollable body');
  const footer = screen.getByRole('button', { name: 'Save workspace' });
  expect(flatten(r.fabric.committed).some(node => /ScrollView/.test(node.viewName) && contains(node, body) && contains(node, footer))).toBe(scrolls);
  await press('Save workspace');
  expect(r.instance.saved()).toBe(true);
});

test('modal projects custom header and keeps its interactive footer outside every scroll view', async () => {
  const r = await render(ModalHost, { providers: instantMotion });
  expect(screen.getByRole('header', { name: 'Custom workspace' })).toBeTruthy();
  expect(screen.queryByText('Accessible workspace')).toBeNull();
  const body = screen.getByText('Scrollable body'), footer = screen.getByRole('button', { name: 'Save workspace' });
  const scrolls = flatten(r.fabric.committed).filter(node => /ScrollView/.test(node.viewName));
  expect(scrolls.some(node => contains(node, body))).toBe(true);
  expect(scrolls.some(node => contains(node, footer))).toBe(false);
  await press('Save workspace');
  expect(r.instance.saved()).toBe(true);
  expect(r.instance.open()).toBe(false);
  r.instance.open.set(true); r.instance.custom.set(false); await settle();
  expect(screen.getByText('Accessible workspace')).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Save workspace' })).toBeNull();
  await press('Close');
  expect(r.instance.open()).toBe(false);
});

@Component({
  imports: [NeuCardComponent, NeuCardHeaderDirective, NeuCardFooterDirective, Text, View, Pressable],
  template: `<neu-card title="Default card title" description="Default description">
    @if (custom()) { <view neuCardHeader><text accessibilityRole="header">Custom card heading</text></view> }
    <text>Card body</text>
    <view neuCardFooter><pressable accessibilityRole="button" accessibilityLabel="Open card" (press)="opened.set(true)"><text>Open</text></pressable></view>
  </neu-card>`,
})
class CardHost { readonly custom = signal(true); readonly opened = signal(false); }

test('card projects header, body and footer exactly once and restores default headings', async () => {
  const r = await render(CardHost);
  expect(screen.getByText('Custom card heading')).toBeTruthy();
  expect(screen.getByText('Card body')).toBeTruthy();
  expect(screen.getByText('Open')).toBeTruthy();
  expect(screen.queryByText('Default card title')).toBeNull();
  expect(screen.queryByText('Default description')).toBeNull();
  await press('Open card'); expect(r.instance.opened()).toBe(true);
  r.instance.custom.set(false); await settle();
  expect(screen.getByText('Default card title')).toBeTruthy();
  expect(screen.getByText('Default description')).toBeTruthy();
  expect(screen.queryByText('Custom card heading')).toBeNull();
});

@Component({
  imports: [NeuPanelComponent, NeuPanelHeaderDirective, NeuPanelFooterDirective, Text, View, Pressable],
  template: `<neu-panel title="Delivery" [(collapsed)]="collapsed">
    @if (custom()) { <view neuPanelHeader><text>Custom delivery heading</text></view> }
    <text>Panel body</text>
    <view neuPanelFooter><pressable accessibilityRole="button" accessibilityLabel="Change delivery" (press)="changed.set(true)"><text>Change address</text></pressable></view>
  </neu-panel>`,
})
class PanelHost { readonly collapsed = signal(false); readonly custom = signal(true); readonly changed = signal(false); }

test('panel keeps its accessible toggle and collapses the projected body and footer together', async () => {
  const r = await render(PanelHost, { providers: instantMotion });
  expect(screen.getByText('Custom delivery heading')).toBeTruthy();
  await press('Change delivery'); expect(r.instance.changed()).toBe(true);
  await press('Delivery'); expect(r.instance.collapsed()).toBe(true);
  expect(screen.queryByText('Panel body')).toBeNull();
  expect(screen.queryByRole('button', { name: 'Change delivery' })).toBeNull();
  await press('Delivery');
  expect(screen.getByText('Panel body')).toBeTruthy();
  r.instance.custom.set(false); await settle();
  expect(screen.getByText('Delivery')).toBeTruthy();
  expect(screen.queryByText('Custom delivery heading')).toBeNull();
});

const options = [
  { id: 'design', label: 'Design', description: 'Interfaces' },
  { id: 'engineering', label: 'Engineering', description: 'Applications' },
  { id: 'off', label: 'Unavailable', disabled: true },
];
@Component({
  imports: [NeuSelectComponent, NeuSelectItemDirective, NeuSelectSelectedDirective, Text, View],
  template: `<neu-select label="Team" [options]="options" [searchable]="true" [multiple]="multiple()" [(value)]="value" [(values)]="values" [readonly]="readonly()">
    @if (custom()) {
      <ng-template neuSelectItem let-option let-index="index" let-selected="selected" let-disabled="disabled"><text>{{ index }} · {{ option.description || option.label }} · {{ selected }} · {{ disabled }}</text></ng-template>
      <ng-template neuSelectSelected let-selected let-placeholder="placeholder"><text>{{ selected.length ? selected[0].label + ' selected' : placeholder }}</text></ng-template>
    }
  </neu-select>`,
})
class SelectHost {
  readonly options = options; readonly value = signal(''); readonly values = signal<readonly string[]>([]);
  readonly multiple = signal(false); readonly custom = signal(true); readonly readonly = signal(false);
}

test('select templates update after filtering and single selection without replacing accessible actions', async () => {
  const r = await render(SelectHost, { providers: instantMotion });
  expect(screen.getByText('Choose')).toBeTruthy();
  await press('Team');
  expect(screen.getByText('0 · Interfaces · false · false')).toBeTruthy();
  expect(screen.getByText('2 · Unavailable · false · true')).toBeTruthy();
  await press('Unavailable', 'radio'); expect(r.instance.value()).toBe('');
  await fireEvent.changeText(screen.getByLabelText('Search options'), 'applications');
  expect(screen.getByText('0 · Applications · false · false')).toBeTruthy();
  await press('Engineering', 'radio');
  expect(r.instance.value()).toBe('engineering');
  expect(screen.getByText('Engineering selected')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Team' }).props['accessibilityValue']).toEqual({ text: 'Engineering' });
  r.instance.custom.set(false); await settle();
  expect(screen.getByText('Engineering')).toBeTruthy();
  await press('Team');
  expect(screen.getByText('Interfaces')).toBeTruthy();
});

test('select templates preserve multiple selection, checked state and readonly semantics', async () => {
  const r = await render(SelectHost, { providers: instantMotion });
  r.instance.multiple.set(true); r.instance.values.set(['engineering']); await settle();
  await press('Team');
  expect(screen.getByText('1 · Applications · true · false')).toBeTruthy();
  await press('Design', 'checkbox');
  expect(r.instance.values()).toEqual(['engineering', 'design']);
  expect(screen.getByText('Design selected')).toBeTruthy();
  await press('Design', 'checkbox'); expect(r.instance.values()).toEqual(['engineering']);
  r.instance.readonly.set(true); await settle();
  expect(screen.getByText('0 · Interfaces · false · true')).toBeTruthy();
  await press('Design', 'checkbox'); expect(r.instance.values()).toEqual(['engineering']);
});

@Component({
  imports: [NeuListboxComponent, NeuListboxItemDirective, Text],
  template: `<ng-template #external let-option><text>External {{ option.label }}</text></ng-template>
  <neu-listbox label="Teams" [options]="options" [(value)]="values" [disabled]="disabled()" [itemTemplate]="explicit() ? external : undefined">
    @if (custom()) { <ng-template neuListboxItem let-option let-selected="selected" let-disabled="disabled"><text>Projected {{ option.label }} · {{ selected }} · {{ disabled }}</text></ng-template> }
  </neu-listbox>`,
})
class ListboxHost {
  readonly options = options; readonly values = signal<readonly string[]>([]); readonly explicit = signal(true); readonly custom = signal(true); readonly disabled = signal(false);
}

test('listbox explicit template takes precedence, then projected template and default content remain functional', async () => {
  const r = await render(ListboxHost);
  expect(screen.getByText('External Design')).toBeTruthy();
  expect(screen.queryByText('Projected Design · false · false')).toBeNull();
  r.instance.explicit.set(false); await settle();
  expect(screen.getByText('Projected Design · false · false')).toBeTruthy();
  await press('Design', 'radio'); expect(r.instance.values()).toEqual(['design']);
  expect(screen.getByText('Projected Design · true · false')).toBeTruthy();
  r.instance.disabled.set(true); await settle();
  expect(screen.getByText('Projected Engineering · false · true')).toBeTruthy();
  await press('Engineering', 'radio'); expect(r.instance.values()).toEqual(['design']);
  r.instance.custom.set(false); await settle();
  expect(screen.getByText('Interfaces')).toBeTruthy();
});

@Component({
  imports: [NeuDataViewComponent, NeuDataViewItemDirective, Text],
  template: `<ng-template #external let-option><text>Explicit {{ option.label }}</text></ng-template>
  <neu-data-view [items]="options" [itemTemplate]="explicit() ? external : undefined" [(query)]="query" [(descending)]="descending" (selected)="selected.set($event)">
    @if (custom()) { <ng-template neuDataViewItem let-item let-index="index"><text>{{ index }} · Person {{ item.label }}</text></ng-template> }
  </neu-data-view>`,
})
class DataViewHost { readonly options = options; readonly explicit = signal(false); readonly custom = signal(true); readonly query = signal(''); readonly descending = signal(false); readonly selected = signal(''); }

test('data view declarative rows retain sorted/filtered indices, disabled behavior and existing explicit-template precedence', async () => {
  const r = await render(DataViewHost, { providers: instantMotion });
  expect(screen.getByText('0 · Person Design')).toBeTruthy();
  await press('Unavailable'); expect(r.instance.selected()).toBe('');
  await press('Engineering'); expect(r.instance.selected()).toBe('engineering');
  r.instance.query.set('Applications'); await settle();
  expect(screen.getByText('0 · Person Engineering')).toBeTruthy();
  r.instance.query.set(''); r.instance.descending.set(true); await settle();
  expect(screen.getByText('0 · Person Unavailable')).toBeTruthy();
  r.instance.explicit.set(true); await settle();
  expect(screen.getByText('Explicit Design')).toBeTruthy();
  expect(screen.queryByText('2 · Person Design')).toBeNull();
  r.instance.explicit.set(false); r.instance.custom.set(false); await settle();
  expect(screen.getByText('Interfaces')).toBeTruthy();
});

@Component({
  imports: [NeuGalleryComponent, NeuGalleryItemDirective, NeuGalleryCaptionDirective, Text, View, Image],
  template: `<neu-gallery [items]="images" [(open)]="open" [(index)]="index" [layout]="layout()" [showCaptions]="captions()" [aspectRatio]="2" [borderRadius]="8">
    @if (custom()) {
      <ng-template neuGalleryItem let-image let-index="index" let-ratio="aspectRatio" let-radius="borderRadius"><view><image [source]="{ uri: image.uri }" [alt]="'Custom ' + image.label" [style.aspectRatio]="ratio" [style.borderRadius]="radius" /><text>Tile {{ index }} · {{ ratio }} · {{ radius }}</text></view></ng-template>
      <ng-template neuGalleryCaption let-image let-index="index"><text>Caption {{ index }} · {{ image.label }}</text></ng-template>
    }
  </neu-gallery>`,
})
class GalleryHost {
  readonly images = [{ id: 'coast', label: 'Coast', uri: 'https://example.test/coast.png' }, { id: 'hills', label: 'Hills', uri: 'https://example.test/hills.png' }];
  readonly open = signal(false); readonly index = signal(0); readonly custom = signal(true); readonly captions = signal(true); readonly layout = signal<'grid' | 'mosaic'>('grid');
}

test('gallery templates receive geometry and original indices while retaining one-press viewer navigation', async () => {
  const r = await render(GalleryHost, { providers: instantMotion });
  expect(screen.getByText('Tile 1 · 2 · 8')).toBeTruthy();
  expect(screen.getByText('Caption 1 · Hills')).toBeTruthy();
  expect(screen.getByLabelText('Custom Hills')).toBeTruthy();
  await press('Hills'); expect(r.instance.index()).toBe(1); expect(r.instance.open()).toBe(true);
  await press('Close viewer'); expect(r.instance.open()).toBe(false);
  r.instance.layout.set('mosaic'); await settle();
  expect(screen.getByText('Tile 0 · 1.3333333333333333 · 8')).toBeTruthy();
  r.instance.captions.set(false); await settle();
  expect(screen.queryByText('Caption 1 · Hills')).toBeNull();
  r.instance.custom.set(false); r.instance.captions.set(true); await settle();
  expect(screen.getAllByLabelText('Hills').some(node => node.viewName === 'Image')).toBe(true);
  expect(screen.getByText('Hills')).toBeTruthy();
  expect(screen.queryByText('Tile 1 · 2 · 8')).toBeNull();
});

@Component({
  imports: [NeuVirtualListComponent, NeuVirtualListItemDirective, Text, View],
  template: `<neu-virtual-list [items]="items()" [height]="200" [estimatedItemHeight]="60" [disabled]="disabled()" (selected)="selected.set($event)">
    <view listHeader><text>Directory heading</text></view>
    @if (custom()) { <ng-template neuVirtualListItem let-item let-index="index" let-disabled="disabled"><text>{{ index }} · {{ item.label }} · {{ disabled }}</text></ng-template> }
    <view listFooter><text>Directory footer</text></view>
  </neu-virtual-list>`,
})
class VirtualListHost {
  readonly items = signal(Array.from({ length: 100 }, (_, index) => ({ id: 'person-' + index, label: 'Person ' + index, description: 'Team member', disabled: index === 1 })));
  readonly selected = signal(''); readonly disabled = signal(false); readonly custom = signal(true);
}

test('virtual templates follow original item indices after scrolling, recycled slots and data changes', async () => {
  const r = await render(VirtualListHost);
  expect(screen.getByText('Directory heading')).toBeTruthy();
  expect(screen.getByText('Directory footer')).toBeTruthy();
  const order = flatten(r.fabric.committed);
  expect(order.indexOf(screen.getByText('Directory heading'))).toBeLessThan(order.indexOf(screen.getByText('0 · Person 0 · false')));
  expect(order.indexOf(screen.getByText('Directory footer'))).toBeGreaterThan(order.indexOf(screen.getByText('1 · Person 1 · true')));
  expect(screen.getByText('0 · Person 0 · false')).toBeTruthy();
  expect(screen.getByText('1 · Person 1 · true')).toBeTruthy();
  await press('Person 1'); expect(r.instance.selected()).toBe('');
  await press('Person 0'); expect(r.instance.selected()).toBe('person-0');
  const scroll = r.fabric.find('ScrollView')!;
  await fireEvent.scroll(scroll, { contentOffset: { x: 0, y: 1800 }, layoutMeasurement: { width: 320, height: 200 }, contentSize: { width: 320, height: 6000 } });
  expect(screen.getByText('30 · Person 30 · false')).toBeTruthy();
  await press('Person 30'); expect(r.instance.selected()).toBe('person-30');
  r.instance.items.set(r.instance.items().slice().reverse()); await settle();
  expect(screen.getByText('30 · Person 69 · false')).toBeTruthy();
  await press('Person 69'); expect(r.instance.selected()).toBe('person-69');
  r.instance.disabled.set(true); await settle();
  expect(screen.getByText('30 · Person 69 · true')).toBeTruthy();
  await press('Person 68'); expect(r.instance.selected()).toBe('person-69');
  r.instance.custom.set(false); await settle();
  expect(screen.getByText('Person 69')).toBeTruthy();
  expect(screen.queryByText('30 · Person 69 · true')).toBeNull();
});
