import {
  cleanup,
  render,
  screen,
  userEvent,
  fireEvent,
} from '@ng-native/testing';
import { afterEach, expect, test } from 'vitest';
import { Component, signal } from '@angular/core';
import {
  NeuThemeComponent,
  NEU_DARK_TOKENS,
  NEU_LIGHT_TOKENS,
} from '@neural-ui/native';
import { NativeModalDemo } from './slot-demos.ts';
import { NativeCatalogueComponent } from './catalogue.ts';
import { NATIVE_DEMOS } from './catalogue-data.ts';
afterEach(cleanup);
@Component({
  selector: 'test-projected-text-theme',
  imports: [NeuThemeComponent, NativeModalDemo],
  template: `<neu-theme [scheme]="scheme()"><ng-component /></neu-theme>`,
})
class ProjectedTextThemeHost {
  readonly scheme = signal<'light' | 'dark'>('light');
}
test('projected modal text follows light and dark theme colors', async () => {
  const r = await render(ProjectedTextThemeHost);
  const text = () => screen.getByText('Un modal con contenido y teclado.');
  expect(text().props).toMatchObject({ color: NEU_LIGHT_TOKENS.text });
  r.instance.scheme.set('dark');
  await r.detectChanges();
  expect(text().props).toMatchObject({ color: NEU_DARK_TOKENS.text });
});
test('projected modal form updates its value and closes through its action', async () => {
  const r = await render(NativeCatalogueComponent);
  r.instance.selected.set(NATIVE_DEMOS.find((demo) => demo.entry === 'modal')!);
  await r.detectChanges();
  expect(screen.getByText('Un modal con contenido y teclado.')).toBeTruthy();
  await fireEvent.changeText(
    screen.getByLabelText('Nombre en el modal'),
    'Pedro',
  );
  await userEvent
    .setup()
    .press(screen.getByRole('button', { name: 'Guardar y cerrar' }));
  expect(screen.queryByLabelText('Nombre en el modal')).toBeNull();
  expect(screen.getByText(/"value": "Pedro"/)).toBeTruthy();
  expect(screen.getByText(/"open": false/)).toBeTruthy();
});
test('projected tab panels follow the selected native tab', async () => {
  const r = await render(NativeCatalogueComponent);
  r.instance.selected.set(NATIVE_DEMOS.find((demo) => demo.entry === 'tabs')!);
  await r.detectChanges();
  expect(screen.getByText('Contenido de la primera pestaña.')).toBeTruthy();
  await userEvent
    .setup()
    .press(screen.getByRole('tab', { name: 'Segunda opción' }));
  expect(screen.queryByText('Contenido de la primera pestaña.')).toBeNull();
  expect(screen.getByText('Contenido de la segunda pestaña.')).toBeTruthy();
});
test.each(NATIVE_DEMOS)(
  'mounts and destroys the public $entry example',
  async (demo) => {
    const r = await render(NativeCatalogueComponent);
    r.instance.selected.set(demo);
    await r.detectChanges();
    expect(screen.getByText(demo.name)).toBeTruthy();
    expect(r.fabric.committed.length).toBeGreaterThan(0);
    r.unmount();
    expect(r.componentRef.hostView.destroyed).toBe(true);
  },
);
test('catalogue searches, opens an example and returns to the filtered list', async () => {
  const r = await render(NativeCatalogueComponent);
  await fireEvent.changeText(
    screen.getByLabelText('Buscar componentes'),
    'Slider',
  );
  expect(screen.queryByRole('button', { name: 'Accordion' })).toBeNull();
  await userEvent.setup().press(screen.getByRole('button', { name: 'Slider' }));
  expect(r.instance.selected()?.entry).toBe('slider');
  await userEvent
    .setup()
    .press(screen.getByRole('button', { name: 'Increase Volumen' }));
  expect(screen.getByText(/"value": 41/)).toBeTruthy();
  await userEvent
    .setup()
    .press(screen.getByRole('button', { name: 'Volver al catálogo' }));
  expect(r.instance.selected()).toBeNull();
  expect(screen.getByRole('button', { name: 'Slider' })).toBeTruthy();
});
