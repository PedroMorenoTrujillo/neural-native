import { Component, signal } from '@angular/core';
import { HostEngine } from '@ng-native/fabric';
import { cleanup, render, screen, settle } from '@ng-native/testing';
import { afterEach, expect, test, vi } from 'vitest';
import { NeuInputComponent } from './input/input.ts';
import { NeuModalComponent } from './modal/modal.ts';
import { NEU_LIGHT_TOKENS, NEU_THEME } from './foundation/index.ts';

afterEach(cleanup);

@Component({
  selector: 'modal-input-focus-host',
  imports: [NeuInputComponent, NeuModalComponent],
  template: `<neu-input label="Outside" [(value)]="outside" />
    <neu-modal title="Editor" [(open)]="open">
      <neu-input label="Details" [(value)]="details" />
    </neu-modal>`,
})
class ModalFocusHost {
  readonly open = signal(false);
  readonly outside = signal('Outside value');
  readonly details = signal('');
}

const noMotion = { provide: NEU_THEME, useValue: signal({ ...NEU_LIGHT_TOKENS, duration: 0 }) };

test.each([
  [true, ''], [false, ''], [true, 'Seed details'], [false, 'Seed details'],
])('closing a modal retains edits with immediate blur %s and seed %j', async (immediateBlur, seed) => {
  const r = await render(ModalFocusHost, { providers: [noMotion] });
  r.instance.details.set(seed);
  r.instance.open.set(true);
  await r.detectChanges();
  const field = screen.getByLabelText('Details');
  r.fabric.emit(field, 'topFocus', {});
  r.fabric.emit(field, 'topChange', { text: 'Saved details', eventCount: 1 });
  await settle();
  const engine = r.componentRef.injector.get(HostEngine);
  expect(engine.focusedField).not.toBeNull();
  const focused = engine.focusedField!;
  const original = engine.dispatchCommand.bind(engine);
  const presentations: boolean[] = [];
  vi.spyOn(engine, 'dispatchCommand').mockImplementation((node, name, args) => {
    if (name === 'blur') {
      presentations.push(Boolean(r.fabric.find('ModalHostView')));
      if (immediateBlur) r.fabric.emit(field, 'topBlur', {});
    }
    original(node, name, args);
  });
  r.instance.open.set(false);
  await r.detectChanges();
  expect(presentations).toEqual([true]);
  expect(r.instance.details()).toBe('Saved details');
  expect(focused.props['latestEventCount']).toBe(1);
  r.instance.open.set(true);
  await r.detectChanges();
  expect(screen.getByLabelText('Details').props['text']).toBe('Saved details');
});

test('closing a modal does not blur a field owned by another part of the screen', async () => {
  const r = await render(ModalFocusHost, { providers: [noMotion] });
  r.fabric.emit(screen.getByLabelText('Outside'), 'topFocus', {});
  await settle();
  r.instance.open.set(true);
  await r.detectChanges();
  const engine = r.componentRef.injector.get(HostEngine);
  const commands = vi.spyOn(engine, 'dispatchCommand');
  r.instance.open.set(false);
  await r.detectChanges();
  expect(commands.mock.calls.filter(([, name]) => name === 'blur')).toEqual([]);
});

test.each(['', 'Seed details'])('closing a modal retains accepted edits without a native focus record (seed %j)', async (seed) => {
  const r = await render(ModalFocusHost, { providers: [noMotion] });
  r.instance.details.set(seed);
  r.instance.open.set(true);
  await r.detectChanges();
  r.fabric.emit(screen.getByLabelText('Details'), 'topChange', {
    text: 'Saved details', eventCount: 1,
  });
  await settle();
  expect(r.componentRef.injector.get(HostEngine).focusedField).toBeNull();
  r.instance.open.set(false);
  await r.detectChanges();
  r.instance.open.set(true);
  await r.detectChanges();
  expect(screen.getByLabelText('Details').props['text']).toBe('Saved details');
});

test('closing a modal preserves the seed of a field that was never edited', async () => {
  const r = await render(ModalFocusHost, { providers: [noMotion] });
  r.instance.details.set('Untouched details');
  r.instance.open.set(true);
  await r.detectChanges();
  r.instance.open.set(false);
  await r.detectChanges();
  r.instance.open.set(true);
  await r.detectChanges();
  expect(screen.getByLabelText('Details').props['text']).toBe('Untouched details');
  expect(r.instance.details()).toBe('Untouched details');
});
