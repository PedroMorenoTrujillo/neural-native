import { Component, signal } from '@angular/core';
import { Text } from '@ng-native/components';
import { cleanup, fireEvent, render, screen, settle, userEvent } from '@ng-native/testing';
import { afterEach, expect, test, vi } from 'vitest';
import { NeuDataViewComponent } from './data-view/data-view.ts';
import { NeuSectionListComponent, type NeuSectionListSection } from './section-list/index.ts';

afterEach(cleanup);

@Component({
  imports: [NeuDataViewComponent, Text],
  template: `
    <ng-template #person let-item let-index="index"><text>{{ index }}: {{ item.description }}</text></ng-template>
    <neu-data-view [items]="people" [itemTemplate]="person" [virtualHeight]="240"
      [(query)]="query" [(descending)]="descending" [loading]="loading()" [error]="error()"
      (selected)="selected.set($event)" (refresh)="refreshes.update(increment)" />
  `,
})
class DirectoryHost {
  readonly people = Array.from({ length: 300 }, (_, index) => ({
    id: 'person-' + index,
    label: 'Person ' + String(index).padStart(3, '0'),
    description: index === 150 ? 'Android specialist' : 'Engineer ' + index,
    disabled: index === 1,
  }));
  readonly query = signal('');
  readonly descending = signal(false);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly selected = signal('');
  readonly refreshes = signal(0);
  readonly increment = (count: number) => count + 1;
}

test('DataView mounts and scrolls a bounded window while keeping the custom row contract', async () => {
  const r = await render(DirectoryHost);
  const scroll = r.fabric.find('ScrollView')!;
  expect(scroll).toBeTruthy();
  await fireEvent.layout(scroll, { width: 320, height: 240 });
  expect(screen.queryAllByRole('button').length).toBeLessThan(100);
  expect(screen.getByText('0: Engineer 0')).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Person 299' })).toBeNull();
  await userEvent.press(screen.getByRole('button', { name: 'Person 001' }));
  expect(r.instance.selected()).toBe('');

  const leading = screen.getByRole('button', { name: 'Person 000' }).reactTag;
  await fireEvent.scroll(scroll, {
    contentOffset: { x: 0, y: 1600 },
    layoutMeasurement: { width: 320, height: 240 },
    contentSize: { width: 320, height: 24000 },
  });
  expect(screen.queryByRole('button', { name: 'Person 000' })?.reactTag).not.toBe(leading);
  await fireEvent.changeText(screen.getByLabelText('Search items'), 'specialist');
  const filteredScroll = r.fabric.find('ScrollView')!;
  await fireEvent.layout(filteredScroll, { width: 320, height: 240 });
  expect(screen.getByText('0: Android specialist')).toBeTruthy();
  await userEvent.press(screen.getByRole('button', { name: 'Person 150' }));
  expect(r.instance.selected()).toBe('person-150');
  await userEvent.press(screen.getByRole('button', { name: 'Refresh' }));
  expect(r.instance.refreshes()).toBe(1);

  r.instance.query.set('missing');
  await settle();
  expect(screen.getByText('No items')).toBeTruthy();
  r.instance.error.set('Offline');
  await settle();
  expect(screen.getByText('Offline')).toBeTruthy();
  r.instance.loading.set(true);
  await settle();
  expect(screen.queryByText('Offline')).toBeNull();
  expect(screen.getByRole('button', { name: 'Refresh' }).props.accessibilityState?.disabled).toBe(true);
});

const sections: readonly NeuSectionListSection[] = [
  { key: 'today', title: 'Today', data: [{ id: 'order', label: 'Order packed' }, { id: 'off', label: 'Unavailable', disabled: true }] },
  { key: 'yesterday', title: 'Yesterday', data: [{ id: 'order', label: 'Order received', description: 'Intake confirmation' }] },
  { key: 'empty', title: 'Empty group', data: [] },
];

test('SectionList exposes group headings and selects a row by both group and item identity', async () => {
  const selected = vi.fn();
  const r = await render(NeuSectionListComponent, { inputs: { sections, height: 400 }, on: { selected } });
  await fireEvent.layout(r.fabric.find('ScrollView')!, { width: 320, height: 400 });
  expect(screen.getByRole('header', { name: 'Today' })).toBeTruthy();
  expect(screen.getByRole('header', { name: 'Yesterday' })).toBeTruthy();
  expect(screen.queryByRole('header', { name: 'Empty group' })).toBeNull();
  await userEvent.press(screen.getByRole('button', { name: 'Order packed' }));
  await userEvent.press(screen.getByRole('button', { name: 'Unavailable' }));
  await userEvent.press(screen.getByRole('button', { name: 'Order received, Intake confirmation' }));
  expect(selected.mock.calls).toEqual([
    [{ sectionKey: 'today', itemId: 'order' }],
    [{ sectionKey: 'yesterday', itemId: 'order' }],
  ]);
});

test('SectionList retains a localized refresh action in empty and error states', async () => {
  const refresh = vi.fn();
  const r = await render(NeuSectionListComponent, {
    inputs: { refreshEnabled: true, refreshLabel: 'Update activity', emptyLabel: 'No activity' },
    on: { refresh },
  });
  expect(screen.getByText('No activity')).toBeTruthy();
  const pressRefresh = async () => userEvent.press(screen.getByRole('button', { name: 'Update activity' }));
  await pressRefresh();
  expect(refresh).toHaveBeenCalledTimes(1);
  r.componentRef.setInput('refreshing', true);
  await r.detectChanges();
  await pressRefresh();
  expect(refresh).toHaveBeenCalledTimes(1);
  r.componentRef.setInput('refreshing', false);
  r.componentRef.setInput('error', 'Load failed');
  await r.detectChanges();
  expect(screen.getByText('Load failed')).toBeTruthy();
  expect(screen.queryByText('No activity')).toBeNull();
  await pressRefresh();
  expect(refresh).toHaveBeenCalledTimes(2);
});
