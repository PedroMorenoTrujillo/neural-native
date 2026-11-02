import { Component } from '@angular/core';
import { cleanup, render, screen, userEvent, fireEvent } from '@ng-native/testing';
import { afterEach, expect, test, vi } from 'vitest';
import { requireOptionalNativeModule } from 'expo-modules-core';
import { NeuHaptics, NEU_HAPTICS_DRIVER, NEU_HAPTICS_OPTIONS, type NeuHapticsDriver } from './foundation/haptics.ts';
import { provideNeuHaptics, NEU_NATIVE_HAPTICS } from './haptics/index.ts';
import { NeuButtonComponent } from './button/button.ts';
import { NeuCheckboxComponent } from './checkbox/checkbox.ts';
import { NeuSwitchComponent } from './switch/switch.ts';
import { NeuRadioGroupComponent } from './radio/radio.ts';
import { NeuSliderComponent } from './slider/slider.ts';

@Component({ template: '' }) class Empty {}
vi.mock('expo-modules-core', () => ({ requireOptionalNativeModule: vi.fn(() => null) }));
afterEach(() => { cleanup(); vi.restoreAllMocks(); });
const driver = () => ({ available: vi.fn(() => true), play: vi.fn<NeuHapticsDriver['play']>() });
const configured = (d: NeuHapticsDriver, options = {}) => [
  { provide: NEU_HAPTICS_DRIVER, useValue: d },
  { provide: NEU_HAPTICS_OPTIONS, useValue: { enabled: true, minimumIntervalMs: 0, ...options } },
];

test('feedback is opt-in and absent hardware is harmless', async () => {
  const r = await render(Empty);
  const h = r.componentRef.injector.get(NeuHaptics);
  expect(h.enabled()).toBe(false);
  expect(h.available).toBe(false);
  h.enabled.set(true);
  expect(h.play()).toBe(false);
});
test('runtime opt-out, per-action opt-out and configured press style are respected', async () => {
  const d = driver();
  const r = await render(Empty, { providers: configured(d, { pressStyle: 'soft' }) });
  const h = r.componentRef.injector.get(NeuHaptics);
  expect(h.play(false)).toBe(false);
  expect(h.play()).toBe(true);
  expect(d.play).toHaveBeenCalledExactlyOnceWith('soft');
  h.enabled.set(false);
  expect(h.play('success')).toBe(false);
  expect(d.play).toHaveBeenCalledTimes(1);
});
test('rapid feedback is bounded, including malformed intervals and a changed clock', async () => {
  const d = driver();
  const clock = vi.spyOn(Date, 'now').mockReturnValue(1000);
  const r = await render(Empty, { providers: configured(d, { minimumIntervalMs: NaN }) });
  const h = r.componentRef.injector.get(NeuHaptics);
  expect(h.play()).toBe(true);
  clock.mockReturnValue(1020);
  expect(h.play('selection')).toBe(false);
  clock.mockReturnValue(1080);
  expect(h.play('selection')).toBe(true);
  clock.mockReturnValue(500);
  expect(h.play('selection')).toBe(true);
  expect(d.play).toHaveBeenCalledTimes(3);
});
test('default interval suppresses a duplicate request', async () => {
  const d = driver();
  const r = await render(Empty, { providers: [{ provide: NEU_HAPTICS_DRIVER, useValue: d }, { provide: NEU_HAPTICS_OPTIONS, useValue: { enabled: true } }] });
  vi.spyOn(Date, 'now').mockReturnValue(1000);
  const h = r.componentRef.injector.get(NeuHaptics);
  expect(h.play()).toBe(true);
  expect(h.play()).toBe(false);
});
test('unavailable and failing drivers cannot break UI actions or reject unhandled promises', async () => {
  const d = driver();
  const r = await render(Empty, { providers: configured(d) });
  const h = r.componentRef.injector.get(NeuHaptics);
  d.available.mockReturnValue(false);
  expect(h.play()).toBe(false);
  d.available.mockImplementation(() => { throw new Error('No module'); });
  expect(h.play()).toBe(false);
  d.available.mockReturnValue(true);
  d.play.mockImplementation(() => { throw new Error('Motor off'); });
  expect(h.play()).toBe(false);
  d.play.mockRejectedValue(new Error('No Taptic Engine'));
  expect(h.play()).toBe(true);
  await Promise.resolve();
});
test('official adapter maps selection, impacts and notifications to native service calls', async () => {
  const source = { selectionAsync: vi.fn().mockResolvedValue(undefined), impactAsync: vi.fn().mockResolvedValue(undefined), notificationAsync: vi.fn().mockResolvedValue(undefined) };
  const r = await render(Empty, { providers: [provideNeuHaptics({ minimumIntervalMs: 0 }), { provide: NEU_NATIVE_HAPTICS, useValue: source }] });
  const h = r.componentRef.injector.get(NeuHaptics);
  expect(h.available).toBe(true);
  h.play('selection');
  for (const impact of ['light', 'medium', 'heavy', 'soft', 'rigid'] as const) h.play(impact);
  for (const notification of ['success', 'warning', 'error'] as const) h.play(notification);
  expect(source.selectionAsync).toHaveBeenCalledOnce();
  expect(source.impactAsync.mock.calls.map(c => c[0])).toEqual(['light', 'medium', 'heavy', 'soft', 'rigid']);
  expect(source.notificationAsync.mock.calls.map(c => c[0])).toEqual(['success', 'warning', 'error']);
});
test('optional adapter can start disabled and tolerates an unlinked module', async () => {
  const r = await render(Empty, { providers: [provideNeuHaptics({ enabled: false })] });
  const h = r.componentRef.injector.get(NeuHaptics);
  expect(h.enabled()).toBe(false);
  h.enabled.set(true);
  expect(h.play()).toBe(false);
});
test('native module initialization failure remains an unavailable optional feature', async () => {
  vi.mocked(requireOptionalNativeModule).mockImplementationOnce(() => { throw new Error('Native runtime unavailable'); });
  const r = await render(Empty, { providers: [provideNeuHaptics()] });
  expect(r.componentRef.injector.get(NeuHaptics).available).toBe(false);
});
test('a button emits one haptic request; disabled, loading and per-control opt-out stay silent', async () => {
  const d = driver();
  const r = await render(NeuButtonComponent, { inputs: { label: 'Save' }, providers: configured(d) });
  await userEvent.setup().press(screen.getByRole('button', { name: 'Save' }));
  expect(d.play).toHaveBeenCalledExactlyOnceWith('light');
  for (const inputs of [{ disabled: true }, { disabled: false, loading: true }, { loading: false, haptic: false as const }]) {
    await r.rerender({ inputs });
    await userEvent.setup().press(screen.getByRole('button', { name: 'Save' }));
  }
  expect(d.play).toHaveBeenCalledTimes(1);
});
test('checkbox has one selection tick and readonly or programmatic changes have none', async () => {
  const d = driver();
  const r = await render(NeuCheckboxComponent, { inputs: { label: 'Accept' }, providers: configured(d) });
  await userEvent.setup().press(screen.getByRole('checkbox', { name: 'Accept' }));
  expect(d.play).toHaveBeenCalledExactlyOnceWith('selection');
  await r.rerender({ inputs: { readonly: true } });
  await userEvent.setup().press(screen.getByRole('checkbox', { name: 'Accept' }));
  r.instance.checked.set(false);
  expect(d.play).toHaveBeenCalledTimes(1);
});
test('radio is silent when selecting the already selected value or a disabled option', async () => {
  const d = driver();
  await render(NeuRadioGroupComponent, { inputs: { label: 'Plan', options: [{ id: 'a', label: 'Alpha' }, { id: 'b', label: 'Blocked', disabled: true }] }, providers: configured(d) });
  await userEvent.setup().press(screen.getByRole('radio', { name: 'Alpha' }));
  await userEvent.setup().press(screen.getByRole('radio', { name: 'Alpha' }));
  await userEvent.setup().press(screen.getByRole('radio', { name: 'Blocked' }));
  expect(d.play).toHaveBeenCalledExactlyOnceWith('selection');
});
test('native switch changes produce one request and repeated values are silent', async () => {
  const d = driver();
  const r = await render(NeuSwitchComponent, { inputs: { label: 'Updates' }, providers: configured(d) });
  await fireEvent(screen.getByRole('switch', { name: 'Updates' }), 'change', { value: true });
  await fireEvent(screen.getByRole('switch', { name: 'Updates' }), 'change', { value: true });
  expect(r.instance.checked()).toBe(true);
  expect(d.play).toHaveBeenCalledExactlyOnceWith('selection');
});
test('slider buttons tick on value changes, not on bounds or readonly presses', async () => {
  const d = driver();
  const r = await render(NeuSliderComponent, { inputs: { label: 'Volume', min: 0, max: 1 }, providers: configured(d) });
  await userEvent.setup().press(screen.getByRole('button', { name: 'Increase Volume' }));
  await userEvent.setup().press(screen.getByRole('button', { name: 'Increase Volume' }));
  expect(r.instance.value()).toBe(1);
  expect(d.play).toHaveBeenCalledExactlyOnceWith('selection');
  await r.rerender({ inputs: { readonly: true } });
  await userEvent.setup().press(screen.getByRole('button', { name: 'Decrease Volume' }));
  expect(d.play).toHaveBeenCalledTimes(1);
});
