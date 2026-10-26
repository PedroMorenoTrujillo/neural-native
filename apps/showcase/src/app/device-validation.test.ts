import { cleanup, render, screen } from '@ng-native/testing';
import { afterEach, expect, test, vi } from 'vitest';
import {
  DEVICE_VALIDATION_MARKER,
  deviceValidationRequest,
  NativeDeviceValidationComponent,
} from './device-validation.ts';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.useRealTimers();
});

test('only an explicit valid validation route starts a native run', () => {
  expect(deviceValidationRequest('exp://127.0.0.1:8082')).toBeNull();
  expect(deviceValidationRequest('not a URL')).toBeNull();
  expect(
    deviceValidationRequest(
      'exp://127.0.0.1:8082/--/validate-catalogue?entry=unknown',
    ),
  ).toBeNull();
  expect(
    deviceValidationRequest(
      'exp://127.0.0.1:8082/--/validate-catalogue?hold=1',
    ),
  ).toBeNull();
  expect(
    deviceValidationRequest(
      'exp://127.0.0.1:8082/--/validate-catalogue?entry=modal&appearance=dark&hold=1',
    ),
  ).toEqual({ entry: 'modal', appearance: 'dark', hold: true });
});

test('unmounting native validation cancels its pending specimen callback', async () => {
  const log = vi.spyOn(console, 'info').mockImplementation(() => undefined);
  const fixture = await render(NativeDeviceValidationComponent, {
    inputs: { entry: 'modal', appearance: 'light' },
  });
  await new Promise((resolve) => setTimeout(resolve, 1700));
  await fixture.detectChanges();
  expect(screen.getByLabelText('Nombre en el modal')).toBeTruthy();
  fixture.unmount();
  const calls = log.mock.calls.length;
  await new Promise((resolve) => setTimeout(resolve, 1100));
  expect(log.mock.calls).toHaveLength(calls);
  expect(
    log.mock.calls.some(([marker]) => marker === DEVICE_VALIDATION_MARKER),
  ).toBe(true);
});
