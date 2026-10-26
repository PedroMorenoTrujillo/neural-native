import { Component, signal } from '@angular/core';
import { Text } from '@ng-native/components';
import { cleanup, render, screen, settle, userEvent } from '@ng-native/testing';
import { afterEach, expect, test } from 'vitest';
import { NEU_TABS, NeuTabPanelComponent, NeuTabsComponent } from './tabs/tabs.ts';

afterEach(cleanup);

@Component({
  selector: 'test-tabs-localized-panels',
  imports: [NeuTabsComponent, NeuTabPanelComponent, Text],
  template: `<neu-tabs label="Proyecto" [tabs]="options()" [(value)]="value">
    <neu-tab-panel id="overview"><text>Resumen del proyecto</text></neu-tab-panel>
    <neu-tab-panel id="activity"><text>Actividad reciente</text></neu-tab-panel>
  </neu-tabs>`,
})
class LocalizedTabsHost {
  readonly options = signal([{ id: 'overview', label: 'Resumen' }, { id: 'activity', label: 'Actividad' }]);
  readonly value = signal('overview');
}

test('tab panels follow the selected tab label and reactive translations while preserving IDs', async () => {
  const r = await render(LocalizedTabsHost);
  expect(screen.getByRole('tabpanel', { name: 'Resumen' })).toBeTruthy();
  await userEvent.press(screen.getByRole('tab', { name: 'Actividad' }));
  expect(r.instance.value()).toBe('activity');
  expect(screen.getByRole('tabpanel', { name: 'Actividad' })).toBeTruthy();
  r.instance.options.set([{ id: 'overview', label: 'Overview' }, { id: 'activity', label: 'Activity' }]);
  await settle();
  expect(r.instance.value()).toBe('activity');
  expect(screen.getByRole('tabpanel', { name: 'Activity' })).toBeTruthy();
});

test('tab panels retain the ID fallback for legacy value-only providers', async () => {
  await render(NeuTabPanelComponent, {
    inputs: { id: 'legacy' },
    providers: [{ provide: NEU_TABS, useValue: { value: signal('legacy') } }],
  });
  expect(screen.getByRole('tabpanel', { name: 'legacy' })).toBeTruthy();
});
