import { expect, test } from 'vitest';
import * as catalogue from './index.ts';

test('every public native component inherits Angular 22 OnPush by default', () => {
  const components = Object.entries(catalogue).filter(([name]) => name.endsWith('Component'));
  expect(components.length).toBeGreaterThan(0);
  for (const [name, value] of components) {
    const definition = (value as { ɵcmp?: { onPush?: boolean } }).ɵcmp;
    expect(definition?.onPush, name).toBe(true);
  }
});
