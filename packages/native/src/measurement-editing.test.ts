import { signal } from '@angular/core';
import { cleanup, fireEvent, render, screen, userEvent, type FakeFabricNode } from '@ng-native/testing';
import { afterEach, expect, test, vi } from 'vitest';
import { NeuInputOtpComponent } from './input-otp/input-otp.ts';
import { NeuCollapseComponent } from './foundation/collapse.ts';
import { NeuSliderComponent } from './slider/slider.ts';
import { NEU_LIGHT_TOKENS, NEU_THEME } from './foundation/index.ts';

afterEach(cleanup);
function invoke(instance: object, name: string, ...args: unknown[]): unknown {
  return (instance as Record<string, (...values: unknown[]) => unknown>)[name]!.apply(instance, args);
}
const measure = (height: number) => ({ nativeEvent: { layout: { height } } });
function collapseHeight(node: FakeFabricNode | undefined): unknown {
  if (!node) return undefined;
  if (node.props.overflow === 'hidden') return node.props.height;
  for (const child of node.children) {
    const height = collapseHeight(child);
    if (height !== undefined) return height;
  }
  return undefined;
}

test('OTP positions focus the single native input and select an existing digit', async () => {
  const r = await render(NeuInputOtpComponent, { inputs: { label: 'Code', value: '1234' } });
  await userEvent.setup().press(screen.getByTestId('otp-position-1'));
  expect(r.fabric.commands.filter(c => c.name === 'setTextAndSelection').at(-1)?.args).toEqual([0, null, 1, 2]);
  await fireEvent(screen.getByLabelText('Code'), 'selectionChange', { nativeEvent: { selection: { start: 2, end: 3 } } });
  expect(invoke(r.instance, 'activePosition')).toBe(2);
  await userEvent.setup().press(screen.getByTestId('otp-position-5'));
  expect(r.fabric.commands.filter(c => c.name === 'setTextAndSelection').at(-1)?.args).toEqual([0, null, 4, 4]);
});

test.each([{ disabled: true }, { readonly: true }])('OTP ignores queued focus and edit requests while unavailable: %j', async state => {
  const completed = vi.fn();
  const r = await render(NeuInputOtpComponent, { inputs: { label: 'Code', value: '12', ...state }, on: { completed } });
  const commands = r.fabric.commands.length;
  invoke(r.instance, 'focusPosition', 1);
  invoke(r.instance, 'edit', '123456');
  expect(r.instance.value()).toBe('12');
  expect(r.fabric.commands).toHaveLength(commands);
  expect(completed).not.toHaveBeenCalled();
});

test('OTP focus and blur change its highlight without changing the code', async () => {
  const r = await render(NeuInputOtpComponent, { inputs: { label: 'Code', value: '12' } });
  await fireEvent(screen.getByLabelText('Code'), 'focus');
  expect(invoke(r.instance, 'focused')).toBe(true);
  await fireEvent(screen.getByLabelText('Code'), 'blur');
  expect(invoke(r.instance, 'focused')).toBe(false);
  expect(r.instance.value()).toBe('12');
});

test('already-open collapse uses its first measured content height without an opening flash', async () => {
  const r = await render(NeuCollapseComponent, { inputs: { open: true } });
  invoke(r.instance, 'measure', measure(80));
  await r.detectChanges();
  expect(collapseHeight(r.fabric.find('View'))).toBe(80);
  invoke(r.instance, 'measure', measure(Number.NaN));
  await r.detectChanges();
  expect(collapseHeight(r.fabric.find('View'))).toBe(80);
});

test('collapse animates subsequent measurements and stops after unmount', async () => {
  const r = await render(NeuCollapseComponent, { inputs: { open: true } });
  invoke(r.instance, 'measure', measure(40));
  await r.detectChanges();
  invoke(r.instance, 'measure', measure(80));
  await r.detectChanges();
  await vi.waitFor(() => expect(collapseHeight(r.fabric.find('View'))).toBe(80));
  r.unmount();
  expect(r.componentRef.hostView.destroyed).toBe(true);
});

test('zero-motion collapse clamps negative measurements and applies changed heights immediately', async () => {
  const r = await render(NeuCollapseComponent, { inputs: { open: true }, providers: [{ provide: NEU_THEME, useValue: signal({ ...NEU_LIGHT_TOKENS, duration: 0 }) }] });
  invoke(r.instance, 'measure', measure(-10));
  await r.detectChanges();
  expect(collapseHeight(r.fabric.find('View'))).toBe(0);
  invoke(r.instance, 'measure', measure(50));
  await r.detectChanges();
  expect(collapseHeight(r.fabric.find('View'))).toBe(50);
});

test('slider accessibility actions step, clamp and ignore unknown action names', async () => {
  const r = await render(NeuSliderComponent, { inputs: { label: 'Volume', value: 5, min: 0, max: 10, step: 2 } });
  invoke(r.instance, 'adjust', { nativeEvent: { actionName: 'increment' } });
  expect(r.instance.value()).toBe(8);
  invoke(r.instance, 'adjust', { nativeEvent: { actionName: 'decrement' } });
  expect(r.instance.value()).toBe(6);
  invoke(r.instance, 'adjust', { nativeEvent: { actionName: 'activate' } });
  expect(r.instance.value()).toBe(6);
});

test('slider ignores drag samples without a usable measured track or coordinate', async () => {
  const touch = vi.fn();
  const r = await render(NeuSliderComponent, { inputs: { label: 'Volume', value: 30 }, on: { touch } });
  invoke(r.instance, 'drag', { nativeEvent: { locationX: 70 } });
  invoke(r.instance, 'layout', { nativeEvent: { layout: { width: 200 } } });
  invoke(r.instance, 'drag', { nativeEvent: {} });
  invoke(r.instance, 'drag', { nativeEvent: { locationX: Infinity } });
  expect(r.instance.value()).toBe(30);
  expect(touch).not.toHaveBeenCalled();
});
