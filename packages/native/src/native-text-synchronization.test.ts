import { Component, signal } from '@angular/core';
import { cleanup, render, screen } from '@ng-native/testing';
import { afterEach, expect, test } from 'vitest';
import { NeuInputComponent } from './input/input.ts';
import { NeuTextareaComponent } from './textarea/textarea.ts';
import { NeuInputMaskComponent } from './input-mask/input-mask.ts';

afterEach(cleanup);

test.each([NeuInputComponent, NeuTextareaComponent])(
  'passes only nonnegative integer length limits to native text controls: %s',
  async (component) => {
    const r = await render(component, {
      inputs: { label: 'Length limit', maxLength: -4 },
    });
    expect(screen.getByLabelText('Length limit').props.maxLength).toBe(0);
    await r.rerender({ inputs: { maxLength: 12.9 } });
    expect(screen.getByLabelText('Length limit').props.maxLength).toBe(12);
    await r.rerender({ inputs: { maxLength: undefined } });
    expect(r.instance.maxLength()).toBeUndefined();
    expect(
      screen.getByLabelText('Length limit').props.maxLength,
    ).toBeNull();
    await r.rerender({ inputs: { maxLength: Number.NaN } });
    expect(r.instance.maxLength()).toBeUndefined();
    expect(
      screen.getByLabelText('Length limit').props.maxLength,
    ).toBeNull();
  },
);

@Component({
  imports: [NeuInputComponent],
  template: '<neu-input label="Native text" [(value)]="value" />',
})
class ControlledInputHost {
  readonly value = signal('');
}

@Component({
  imports: [NeuTextareaComponent],
  template: '<neu-textarea label="Native text" [(value)]="value" />',
})
class ControlledTextareaHost {
  readonly value = signal('');
}

test.each([ControlledInputHost, ControlledTextareaHost])(
  'commits the model without a counter-only native props echo: %s',
  async (host) => {
    const result = await render(host);
    const text = 'Tablet native';
    for (let count = 1; count <= text.length; count++) {
      const value = text.slice(0, count);
      // Do not await settle: native can deliver the next key before a scheduled pass.
      result.fabric.emit(screen.getByLabelText('Native text'), 'topChange', {
        text: value,
        eventCount: count,
      });
      expect(result.instance.value()).toBe(value);
      const committed = screen.getByLabelText('Native text');
      // The native buffer already contains value. Keep the last programmatic prop
      // stable; the actual counter is retained for explicit reconciliation commands.
      expect(committed.props['text']).toBe('');
      expect(committed.props['mostRecentEventCount']).toBe(0);
      expect(result.fabric.commands).toEqual([]);
    }
  },
);

test('commits masked text with the count of the native edit that produced it', async () => {
  const result = await render(NeuInputMaskComponent, {
    inputs: { label: 'Native mask', mask: '###-###' },
  });
  result.fabric.emit(screen.getByLabelText('Native mask'), 'topChange', {
    text: '1234',
    eventCount: 1,
  });
  expect(result.instance.value()).toBe('1234');
  const committed = screen.getByLabelText('Native mask');
  expect(committed.props['text']).toBe('123-4');
  // Angular Native 0.18.2 keeps the iOS prop at zero to avoid replaying queued
  // keystrokes; explicit reconciliation still carries the actual native count.
  expect(committed.props['mostRecentEventCount']).toBe(0);
  expect(result.fabric.commands).toContainEqual({
    viewName: committed.viewName,
    name: 'setTextAndSelection',
    args: [1, '123-4', -1, -1],
  });
});
