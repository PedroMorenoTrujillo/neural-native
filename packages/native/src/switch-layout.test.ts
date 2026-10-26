import { cleanup, render, screen } from '@ng-native/testing';
import { afterEach, expect, test } from 'vitest';
import { NeuSwitchComponent } from './switch/switch.ts';

afterEach(cleanup);

test('switch sizes reserve enough room for the 63-point iOS control without shrinking it', async () => {
  const r = await render(NeuSwitchComponent, { inputs: { label: 'Updates', size: 'sm' } });
  for (const size of ['sm', 'md', 'lg'] as const) {
    await r.rerender({ inputs: { size } });
    const slot = screen.getByRole('switch', { name: 'Updates' }).parent;
    expect(Number(slot?.props.width)).toBeGreaterThanOrEqual(64);
    expect(Number(slot?.props.minHeight)).toBeGreaterThanOrEqual(48);
  }
});
