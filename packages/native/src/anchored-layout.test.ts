import { expect, test } from 'vitest';
import { anchoredLayout } from './foundation/anchored-layout.ts';

test('a keyboard-covered trigger places the whole popup above the keyboard', () => {
  const p = anchoredLayout({ width: 393, height: 874 }, { x: 24, y: 600, width: 345, height: 64 }, 160, 0, 548);
  expect(p.bottom).not.toBeNull();
  expect(874 - p.bottom!).toBeLessThanOrEqual(548 - 16);
  expect(874 - p.bottom! - p.height).toBeGreaterThanOrEqual(16);
});

test('landscape placement clears the keyboard and the device cutout', () => {
  const p = anchoredLayout({ width: 874, height: 402 }, { x: 24, y: 250, width: 800, height: 48 }, 160, 8, 178, { top: 0, right: 62, bottom: 21, left: 62 });
  expect(p.left).toBe(62);
  expect(p.left + p.width).toBeLessThanOrEqual(812);
  expect(402 - p.bottom!).toBeLessThanOrEqual(162);
  expect(p.height).toBeGreaterThanOrEqual(100);
});

test('an unobscured trigger retains its requested gap and aligns the popup', () => {
  const p = anchoredLayout({ width: 393, height: 852 }, { x: 24, y: 120, width: 345, height: 48 }, 160, 8);
  expect(p).toEqual({ left: 24, width: 345, top: 176, bottom: null, height: 320 });
});

test('placement remains inside the visible region at narrow widths and every trigger edge', () => {
  for (const width of [228, 393, 874]) for (const height of [178, 402, 874]) {
    for (const keyboard of [undefined, Math.round(height / 2)]) for (const y of [-20, 64, height - 20, height + 40]) {
      const p = anchoredLayout({ width, height }, { x: width - 40, y, width: 345, height: 64 }, 160, 8, keyboard);
      const bottom = p.top !== null ? p.top + p.height : height - p.bottom!;
      const top = p.top ?? bottom - p.height;
      expect(p.left).toBeGreaterThanOrEqual(16);
      expect(p.left + p.width).toBeLessThanOrEqual(width - 16);
      expect(top).toBeGreaterThanOrEqual(16);
      expect(bottom).toBeLessThanOrEqual((keyboard ?? height) - 16);
      expect(p.height).toBeGreaterThanOrEqual(0);
    }
  }
});
