import { signal } from '@angular/core';
import { cleanup, render, screen } from '@ng-native/testing';
import { afterEach, expect, test } from 'vitest';
import { NEU_DARK_TOKENS, NEU_LIGHT_TOKENS, NEU_THEME } from './foundation/index.ts';
import { NeuInputMaskComponent } from './input-mask/input-mask.ts';
import { NeuInputTagsComponent } from './input-tags/input-tags.ts';

afterEach(cleanup);

test('masked input uses a readable placeholder without a theme provider', async () => {
  await render(NeuInputMaskComponent, { inputs: { label: 'Booking', mask: '###-###' } });
  const field = screen.getByLabelText('Booking');
  expect(field.props.placeholder).toBe('___-___');
  expect(field.props.placeholderTextColor).toBe(NEU_LIGHT_TOKENS.muted);
});

test('masked input placeholder follows live theme and custom muted tokens', async () => {
  const tokens = signal(NEU_LIGHT_TOKENS);
  const view = await render(NeuInputMaskComponent, {
    inputs: { label: 'Booking', mask: '###-###' },
    providers: [{ provide: NEU_THEME, useValue: tokens }],
  });
  tokens.set(NEU_DARK_TOKENS);
  await view.detectChanges();
  expect(screen.getByLabelText('Booking').props.placeholderTextColor).toBe(NEU_DARK_TOKENS.muted);
  tokens.set({ ...NEU_DARK_TOKENS, muted: '#aabbcc' });
  await view.detectChanges();
  expect(screen.getByLabelText('Booking').props.placeholderTextColor).toBe('#aabbcc');
});

test('tag input uses a readable placeholder without a theme provider', async () => {
  await render(NeuInputTagsComponent, { inputs: { label: 'Skills', placeholder: 'Add a skill' } });
  const field = screen.getByLabelText('Skills');
  expect(field.props.placeholder).toBe('Add a skill');
  expect(field.props.placeholderTextColor).toBe(NEU_LIGHT_TOKENS.muted);
});

test('tag input placeholder follows live theme and custom muted tokens', async () => {
  const tokens = signal(NEU_LIGHT_TOKENS);
  const view = await render(NeuInputTagsComponent, {
    inputs: { label: 'Skills', placeholder: 'Add a skill' },
    providers: [{ provide: NEU_THEME, useValue: tokens }],
  });
  tokens.set(NEU_DARK_TOKENS);
  await view.detectChanges();
  expect(screen.getByLabelText('Skills').props.placeholderTextColor).toBe(NEU_DARK_TOKENS.muted);
  tokens.set({ ...NEU_DARK_TOKENS, muted: '#aabbcc' });
  await view.detectChanges();
  expect(screen.getByLabelText('Skills').props.placeholderTextColor).toBe('#aabbcc');
});
