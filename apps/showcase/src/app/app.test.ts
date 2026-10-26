import {
  cleanup,
  fireEvent,
  render,
  screen,
  userEvent,
} from '@ng-native/testing';
import { afterEach, expect, test, vi } from 'vitest';
import { StatusBar } from '@ng-native/device';
import { App } from './app.ts';
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
test('status bar icons remain visible when the appearance switch changes', async () => {
  const statusBar = vi.spyOn(StatusBar.prototype, 'set');
  await render(App);
  expect(statusBar).toHaveBeenLastCalledWith({ style: 'dark' });
  await fireEvent(
    screen.getByRole('switch', { name: 'Dark appearance' }),
    'change',
    { value: true },
  );
  expect(statusBar).toHaveBeenLastCalledWith({ style: 'light' });
  await fireEvent(
    screen.getByRole('switch', { name: 'Dark appearance' }),
    'change',
    { value: false },
  );
  expect(statusBar).toHaveBeenLastCalledWith({ style: 'dark' });
});
test('uses packaged components for interactions, categories and forms', async () => {
  await render(App);
  await userEvent
    .setup()
    .press(screen.getByRole('button', { name: 'Actions' }));
  await userEvent
    .setup()
    .press(screen.getByRole('button', { name: 'Primary action' }));
  expect(screen.getByText('1 interactions')).toBeTruthy();
  await userEvent.setup().press(screen.getByRole('button', { name: 'Forms' }));
  await fireEvent.changeText(screen.getByLabelText('Your name'), 'Ada');
  await userEvent
    .setup()
    .press(screen.getByRole('button', { name: 'Validate form' }));
  expect(screen.getByText('Form validated')).toBeTruthy();
  await fireEvent.changeText(screen.getByLabelText('Your name'), '');
  expect(screen.queryByText('Form validated')).toBeNull();
  await userEvent
    .setup()
    .press(screen.getByRole('button', { name: 'Display' }));
  expect(
    screen.getByRole('progressbar', { name: 'Loading content' }),
  ).toBeTruthy();
});
