import {
  cleanup,
  fireEvent,
  render,
  screen,
  userEvent,
} from '@ng-native/testing';
import { afterEach, expect, test } from 'vitest';
import { App } from './app.ts';
import { NEU_LIGHT_TOKENS } from '@neural-ui/native/foundation';
afterEach(cleanup);
test('installs public entry points, compiles library CSS and handles real native events', async () => {
  const result = await render(App);
  const button = screen.getByRole('button', { name: 'Count' });
  expect(button.props['backgroundColor']).toBe(NEU_LIGHT_TOKENS.accent);
  expect(button.props['minHeight']).toBe(56);
  await userEvent.setup().press(button);
  await fireEvent.changeText(screen.getByLabelText('Name'), 'Ada');
  await fireEvent(screen.getByRole('switch'), 'change', { value: true });
  expect(result.instance.count()).toBe(1);
  expect(result.instance.name()).toBe('Ada');
  expect(result.instance.enabled()).toBe(true);
});
