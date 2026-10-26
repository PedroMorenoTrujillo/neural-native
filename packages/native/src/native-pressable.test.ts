import { Component, signal } from '@angular/core';
import { cleanup, fireEvent, render, screen } from '@ng-native/testing';
import { afterEach, expect, test } from 'vitest';
import { registerPlatformComponents } from '@ng-native/fabric';
import { NeuButtonComponent } from './button/button.ts';
import { NeuIconButtonComponent } from './icon-button/icon-button.ts';
import { NeuNativePressable } from './foundation/native-pressable.ts';

afterEach(() => { cleanup(); registerPlatformComponents('ios'); });

@Component({
  imports: [NeuButtonComponent, NeuIconButtonComponent],
  template: `<neu-button label="Open details" [disabled]="disabled()" [loading]="loading()" (pressed)="count = count + 1" />
    <neu-icon-button label="Close details" svg="<svg />" (pressed)="count = count + 1" />`,
})
class Actions {
  readonly disabled = signal(false);
  readonly loading = signal(false);
  count = 0;
}

@Component({
  imports: [NeuNativePressable],
  template: `<pressable accessibilityLabel="Outer" (press)="outer = outer + 1">
    <pressable accessibilityLabel="Inner" (press)="inner = inner + 1" />
  </pressable>`,
})
class NestedActions { outer = 0; inner = 0; }

test('a nested accessibility activation belongs only to its target', async () => {
  const r = await render(NestedActions);
  await fireEvent(screen.getByLabelText('Inner'), 'accessibilityTap');
  expect(r.instance.inner).toBe(1);
  expect(r.instance.outer).toBe(0);
  await fireEvent(screen.getByLabelText('Outer'), 'accessibilityTap');
  expect(r.instance.outer).toBe(1);
});

test('Android retains the framework accessibility click handler', async () => {
  registerPlatformComponents('android');
  const r = await render(Actions);
  const button = screen.getByLabelText('Open details');
  expect(button.props.onAccessibilityTap).toBeUndefined();
  await fireEvent(button, 'click');
  expect(r.instance.count).toBe(1);
});

test('iOS accessibility activation reaches the same action once and observes disabled and loading guards', async () => {
  const r = await render(Actions);
  const open = screen.getByLabelText('Open details');
  expect(open.props.onAccessibilityTap).toBe(true);
  await fireEvent(open, 'accessibilityTap');
  expect(r.instance.count).toBe(1);
  r.instance.disabled.set(true);
  await r.detectChanges();
  expect(screen.getByLabelText('Open details').props.accessibilityState).toMatchObject({ disabled: true });
  // Dimming the semantic node itself can clear iOS's unavailable trait.
  expect(screen.getByLabelText('Open details').props.opacity ?? 1).toBe(1);
  await fireEvent(open, 'accessibilityTap');
  expect(r.instance.count).toBe(1);
  r.instance.disabled.set(false);
  r.instance.loading.set(true);
  await r.detectChanges();
  expect(screen.getByLabelText('Open details').props.accessibilityState).toMatchObject({ disabled: true, busy: true });
  expect(screen.getByLabelText('Open details').props.opacity ?? 1).toBe(1);
  await fireEvent(open, 'accessibilityTap');
  expect(r.instance.count).toBe(1);
  await fireEvent(screen.getByLabelText('Close details'), 'accessibilityTap');
  expect(r.instance.count).toBe(2);
});
