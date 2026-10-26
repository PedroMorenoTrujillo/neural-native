import {
  cleanup,
  render,
  screen,
  userEvent,
  fireEvent,
  settle,
} from '@ng-native/testing';
import { afterEach, expect, test } from 'vitest';
import { CatalogueConsumer, NEU_FILE_PICKER } from './catalogue-consumer.ts';
afterEach(cleanup);
test('packed catalogue retains dark CSS, selection, projected tabs, OTP, trees and native file adapters', async () => {
  const file = { uri: 'file:///consumer.txt', name: 'consumer.txt', size: 4 };
  const r = await render(CatalogueConsumer, {
    providers: [
      { provide: NEU_FILE_PICKER, useValue: { pick: async () => [file] } },
    ],
  });
  await userEvent.setup().press(screen.getByRole('button', { name: 'Owner' }));
  await userEvent.setup().press(screen.getByRole('radio', { name: 'Grace' }));
  expect(r.instance.owner()).toBe('grace');
  const slider = screen.getByRole('adjustable', { name: 'Volume' });
  expect(slider.props['backgroundColor']).toBe('#293756');
  await userEvent
    .setup()
    .press(screen.getByRole('button', { name: 'Increase Volume' }));
  expect(r.instance.volume()).toBe(31);
  await fireEvent.changeText(screen.getByLabelText('Code'), '123456');
  expect(r.instance.code()).toBe('123456');
  await userEvent.setup().press(screen.getByRole('tab', { name: 'Grace' }));
  expect(screen.getByText('Grace panel')).toBeTruthy();
  expect(screen.queryByText('Ada panel')).toBeNull();
  await userEvent
    .setup()
    .press(screen.getByRole('button', { name: 'Team member' }));
  await userEvent
    .setup()
    .press(screen.getByRole('button', { name: 'Team Expand' }));
  await userEvent.setup().press(screen.getByRole('radio', { name: 'Ada' }));
  expect(r.instance.member()).toBe('ada');
  await userEvent
    .setup()
    .press(screen.getByRole('button', { name: 'Choose files' }));
  await settle();
  expect(r.instance.files()[0]?.file.uri).toBe(file.uri);
});
