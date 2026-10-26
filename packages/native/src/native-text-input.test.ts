import { Component, signal, viewChild } from '@angular/core';
import { cleanup, fireEvent, render, screen, settle } from '@ng-native/testing';
import { HostEngine } from '@ng-native/fabric';
import { afterEach, expect, test, vi } from 'vitest';
import { NeuNativeTextInput } from './foundation/native-text-input.ts';
import { NeuNativeTextSyncDirective } from './foundation/native-text-sync.ts';
import { NeuInputMaskComponent } from './input-mask/input-mask.ts';
import { NeuInputOtpComponent } from './input-otp/input-otp.ts';
import { NeuInputComponent } from './input/input.ts';

afterEach(cleanup);

@Component({
  imports: [NeuNativeTextInput, NeuNativeTextSyncDirective],
  template: `<text-input
    neuSyncText #sync="neuSyncText" (changeText)="sync.synchronize()"
    [neuralValue]="value()" (neuralValueChange)="accept($event)"
    [disabled]="disabled()" [readonly]="readonly()"
    [multiline]="multiline()"
    accessibilityLabel="Entry" />`,
})
class TextHost {
  readonly entry = viewChild.required(NeuNativeTextInput);
  readonly value = signal('');
  readonly disabled = signal(false);
  readonly readonly = signal(false);
  readonly multiline = signal(false);
  refuse = false;
  readonly changes: string[] = [];
  accept(value: string): void {
    this.changes.push(value);
    if (!this.refuse) this.value.set(value);
  }
}

@Component({
  imports: [NeuInputComponent],
  template: `<neu-input label="Driver" [(value)]="value" />
    @for (row of rows; track row) {
      <neu-input [label]="'Mirror ' + row" [value]="value()" />
    }`,
})
class InputMirrorsHost {
  readonly value = signal('');
  readonly rows = Array.from({ length: 32 }, (_, index) => index);
}

test('linked inputs reconcile all native values without one full-tree commit per mirror', async () => {
  const r = await render(InputMirrorsHost);
  const commits = r.fabric.calls.completeRoot;
  await fireEvent.changeText(screen.getByLabelText('Driver'), 'Árbol café 🙂🚀');
  expect(r.instance.value()).toBe('Árbol café 🙂🚀');
  for (const row of r.instance.rows) {
    expect(screen.getByLabelText('Mirror ' + row).props['text']).toBe('Árbol café 🙂🚀');
  }
  expect(r.fabric.commands.filter(command => command.name === 'setTextAndSelection')).toHaveLength(0);
  // A value fan-out must commit the render in a bounded number of passes.
  expect(r.fabric.calls.completeRoot - commits).toBeLessThanOrEqual(4);
});

test('programmatic multiline replacements after editing retain explicit native remeasurement', async () => {
  const r = await render(TextHost);
  r.instance.multiline.set(true);
  await r.detectChanges();
  await fireEvent.changeText(screen.getByLabelText('Entry'), 'Draft');
  const remeasure = vi.spyOn(r.componentRef.injector.get(HostEngine), 'remeasure');
  r.instance.value.set('First line\nSecond line\nThird line');
  await r.detectChanges();
  expect(remeasure).toHaveBeenCalledOnce();
  expect(r.fabric.commands.filter(command => command.name === 'setTextAndSelection').at(-1)?.args)
    .toEqual([1, 'First line\nSecond line\nThird line', -1, -1]);
});

test('untouched fields receive app values through mount props without premature native commands', async () => {
  const r = await render(TextHost);
  r.instance.value.set('Event prepared before presentation');
  await r.detectChanges();
  expect(screen.getByLabelText('Entry').props['text']).toBe('Event prepared before presentation');
  expect(r.fabric.commands.filter(c => c.name === 'setTextAndSelection')).toEqual([]);
});

test('an empty focused field can receive an app value before its first native edit', async () => {
  const r = await render(TextHost);
  r.fabric.emit(screen.getByLabelText('Entry'), 'topFocus', {});
  await settle();
  r.instance.value.set('Suggested value');
  await r.detectChanges();
  expect(screen.getByLabelText('Entry').props['text']).toBeNull();
  expect(r.fabric.commands.filter(c => c.name === 'setTextAndSelection').at(-1)?.args)
    .toEqual([0, 'Suggested value', -1, -1]);
});

test('accepted native edits retain counters for commands without committing text or counter props', async () => {
  const r = await render(TextHost);
  for (const text of ['A', 'Árbol café', 'Árbol café 🙂🚀', 'Árbol Xcafé 🙂🚀', '']) {
    // The testing helper derives its synthetic counter from props. Native counts
    // advance independently of those props, so deliver the real protocol here.
    r.fabric.emit(screen.getByLabelText('Entry'), 'topChange', {
      text, eventCount: r.instance.changes.length + 1,
    });
    await settle();
    expect(r.instance.value()).toBe(text);
    // Fabric props describe the last programmatic value, not the field's native buffer.
    expect(screen.getByLabelText('Entry').props['text']).toBe('');
    expect(screen.getByLabelText('Entry').props['mostRecentEventCount']).toBe(0);
  }
  expect(r.instance.changes).toEqual(['A', 'Árbol café', 'Árbol café 🙂🚀', 'Árbol Xcafé 🙂🚀', '']);
  expect(r.fabric.commands.filter(c => c.name === 'setTextAndSelection')).toEqual([]);
  // A fresh counter must not force an accepted native edit back through a text prop.
  expect(screen.getByLabelText('Entry').props['text']).toBe('');
  expect(screen.getByLabelText('Entry').props['mostRecentEventCount']).toBe(0);
  r.instance.entry().setSelection(1, 3);
  expect(r.fabric.commands.at(-1)?.args).toEqual([5, null, 1, 3]);
  r.instance.value.set('External reset');
  await r.detectChanges();
  expect(r.fabric.commands.filter(c => c.name === 'setTextAndSelection').at(-1)?.args)
    .toEqual([5, 'External reset', -1, -1]);
});

test('native edits after a programmatic replacement preserve the model and its next explicit reset', async () => {
  const r = await render(TextHost);
  r.instance.value.set('Seed');
  await r.detectChanges();
  const commands = r.fabric.commands.length;
  await fireEvent.changeText(screen.getByLabelText('Entry'), 'Seed café 🙂');
  await r.detectChanges();
  expect(r.instance.value()).toBe('Seed café 🙂');
  expect(screen.getByLabelText('Entry').props['text']).toBe('Seed');
  expect(screen.getByLabelText('Entry').props['mostRecentEventCount']).toBe(0);
  expect(r.fabric.commands).toHaveLength(commands);
  r.instance.value.set('Replacement');
  await r.detectChanges();
  expect(screen.getByLabelText('Entry').props['text']).toBe('Replacement');
  expect(r.fabric.commands.filter(c => c.name === 'setTextAndSelection').at(-1)?.args)
    .toEqual([1, 'Replacement', -1, -1]);
});

test('programmatic reset to the initial value still reaches native after an edit', async () => {
  const r = await render(TextHost);
  await fireEvent.changeText(screen.getByLabelText('Entry'), 'Ada');
  r.instance.value.set('');
  await r.detectChanges();
  expect(r.fabric.commands.filter(c => c.name === 'setTextAndSelection')).toMatchObject([
    { args: [1, '', -1, -1] },
  ]);
  r.instance.value.set('Grace');
  await r.detectChanges();
  expect(screen.getByLabelText('Entry').props['text']).toBe('Grace');
  expect(r.fabric.commands.filter(c => c.name === 'setTextAndSelection').at(-1)?.args)
    .toEqual([1, 'Grace', -1, -1]);
});

test('refused proposals reconcile even when the parent binding retains its cached value', async () => {
  const r = await render(TextHost);
  r.instance.refuse = true;
  await fireEvent.changeText(screen.getByLabelText('Entry'), 'Rejected');
  expect(r.instance.value()).toBe('');
  expect(r.fabric.commands.filter(c => c.name === 'setTextAndSelection').at(-1)?.args)
    .toEqual([1, '', -1, -1]);
});

test.each(['disabled', 'readonly'] as const)('refuses synthetic native edits when %s', async (state) => {
  const r = await render(TextHost);
  r.instance[state].set(true);
  await r.detectChanges();
  await fireEvent.changeText(screen.getByLabelText('Entry'), 'Rejected');
  expect(r.instance.value()).toBe('');
  expect(r.instance.changes).toEqual([]);
});

test('mask transformations reconcile formatted text and accept a programmatic clear', async () => {
  const r = await render(NeuInputMaskComponent, { inputs: { label: 'Phone', mask: '###-###' } });
  await fireEvent.changeText(screen.getByLabelText('Phone'), '12a3456');
  expect(r.instance.value()).toBe('123456');
  expect(r.fabric.commands.filter(c => c.name === 'setTextAndSelection').at(-1)?.args)
    .toEqual([1, '123-456', -1, -1]);
  await r.rerender({ inputs: { value: '' } });
  expect(r.fabric.commands.filter(c => c.name === 'setTextAndSelection').at(-1)?.args)
    .toEqual([1, '', -1, -1]);
});

test('OTP rejection restores the normalized value when another proposal changes no model state', async () => {
  const r = await render(NeuInputOtpComponent, { inputs: { label: 'Code', length: 4 } });
  r.fabric.emit(screen.getByLabelText('Code'), 'topChange', { text: '1234', eventCount: 1 });
  r.fabric.emit(screen.getByLabelText('Code'), 'topChange', { text: '1234x', eventCount: 2 });
  await settle();
  expect(r.instance.value()).toBe('1234');
  expect(r.fabric.commands.filter(c => c.name === 'setTextAndSelection').at(-1)?.args)
    .toEqual([2, '1234', -1, -1]);
});

test('focusing an initially empty field retains external replacements without reinstating its text prop', async () => {
  const r = await render(TextHost);
  r.fabric.emit(screen.getByLabelText('Entry'), 'topFocus', {});
  await settle();
  expect(screen.getByLabelText('Entry').props['text']).toBeNull();
  r.fabric.emit(screen.getByLabelText('Entry'), 'topChange', { text: 'Ada', eventCount: 7 });
  r.instance.value.set('Grace');
  await r.detectChanges();
  expect(screen.getByLabelText('Entry').props['text']).toBeNull();
  expect(r.fabric.commands.filter(c => c.name === 'setTextAndSelection').at(-1)?.args)
    .toEqual([7, 'Grace', -1, -1]);
});

test('focusing a seeded field preserves its initial native text', async () => {
  const r = await render(TextHost);
  r.instance.value.set('Seed café');
  await r.detectChanges();
  const commands = r.fabric.commands.length;
  r.fabric.emit(screen.getByLabelText('Entry'), 'topFocus', {});
  await settle();
  expect(screen.getByLabelText('Entry').props['text']).toBe('Seed café');
  expect(r.fabric.commands).toHaveLength(commands);
});

test.each(['', 'Seed café'])('blurring an edited field retains its current text for native remounts (seed %j)', async (seed) => {
  const r = await render(TextHost);
  r.instance.value.set(seed);
  await r.detectChanges();
  const touch = vi.fn();
  r.instance.entry().touch.subscribe(touch);
  r.fabric.emit(screen.getByLabelText('Entry'), 'topFocus', {});
  r.fabric.emit(screen.getByLabelText('Entry'), 'topChange', {
    text: 'Saved event café', eventCount: 7,
  });
  await settle();
  // Do not replay accepted keystrokes while native owns the active editing buffer.
  expect(screen.getByLabelText('Entry').props['text']).toBe(seed === '' ? null : seed);
  r.fabric.emit(screen.getByLabelText('Entry'), 'topBlur', {});
  await settle();
  expect(touch).toHaveBeenCalledOnce();
  // A modal can recreate the native field without recreating its Angular directive.
  expect(screen.getByLabelText('Entry').props['text']).toBe('Saved event café');
  r.instance.value.set('Another saved event');
  await r.detectChanges();
  expect(screen.getByLabelText('Entry').props['text']).toBe('Another saved event');
});

test('destroying an edited field cancels external reconciliation', async () => {
  const r = await render(TextHost);
  await fireEvent.changeText(screen.getByLabelText('Entry'), 'Ada');
  r.unmount();
  const count = r.fabric.commands.length;
  r.instance.value.set('After destruction');
  await settle();
  expect(r.fabric.commands.length).toBe(count);
});
