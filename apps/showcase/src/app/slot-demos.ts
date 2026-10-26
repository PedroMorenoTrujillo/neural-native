import {
  Component,
  input,
  model,
  signal,
} from '@angular/core';
import { View, Text } from '@ng-native/components';
import {
  NeuCardComponent,
  NeuFormFieldComponent,
  NeuPanelComponent,
  NeuTabsComponent,
  NeuTabPanelComponent,
  NeuModalComponent,
  NeuBottomSheetComponent,
  NeuPopoverComponent,
  NeuStepperComponent,
  NeuToolbarComponent,
  NeuInputComponent,
  NeuButtonComponent,
  type NeuOption,
} from '@neural-ui/native';
const PROJECTED_TEXT_STYLES = `
  text { color: var(--neu-text, #172033); font-size: 16px; }
`;
@Component({
  imports: [Text, NeuCardComponent],
  styles: PROJECTED_TEXT_STYLES,
  template: `<neu-card [title]="title()" [description]="description()"
    ><text>Contenido proyectado en una superficie nativa.</text></neu-card
  >`,
})
export class NativeCardDemo {
  readonly title = input('Tarjeta');
  readonly description = input('');
}
@Component({
  imports: [NeuFormFieldComponent, NeuInputComponent],
  template: `<neu-form-field
    [label]="label()"
    [hint]="hint()"
    [invalid]="!value()"
    error="Introduce un correo"
    ><neu-input label="Correo" keyboardType="email-address" [(value)]="value"
  /></neu-form-field>`,
})
export class NativeFormFieldDemo {
  readonly label = input('Correo');
  readonly hint = input('');
  readonly value = model('');
}
@Component({
  imports: [Text, NeuPanelComponent],
  styles: PROJECTED_TEXT_STYLES,
  template: `<neu-panel [title]="title()" [(collapsed)]="collapsed"
    ><text
      >El contenido desaparece al plegar el panel y vuelve a montarse al
      abrirlo.</text
    ></neu-panel
  >`,
})
export class NativePanelDemo {
  readonly title = input('Panel');
  readonly collapsed = model(false);
}
@Component({
  imports: [View, Text, NeuTabsComponent, NeuTabPanelComponent],
  styles: PROJECTED_TEXT_STYLES,
  template: `<neu-tabs [tabs]="tabs()" [(value)]="value"
    ><neu-tab-panel id="one"
      ><view><text>Contenido de la primera pestaña.</text></view></neu-tab-panel
    ><neu-tab-panel id="two"
      ><view><text>Contenido de la segunda pestaña.</text></view></neu-tab-panel
    ></neu-tabs
  >`,
})
export class NativeTabsDemo {
  readonly tabs = input<readonly NeuOption[]>([]);
  readonly value = model('one');
}
@Component({
  imports: [Text, NeuModalComponent, NeuInputComponent, NeuButtonComponent],
  styles: PROJECTED_TEXT_STYLES,
  template: `<neu-modal [title]="title()" [(open)]="open"
    ><text>Un modal con contenido y teclado.</text
    ><neu-input label="Nombre en el modal" [(value)]="value" /><neu-button
      label="Guardar y cerrar"
      (pressed)="open.set(false)"
  /></neu-modal>`,
})
export class NativeModalDemo {
  readonly title = input('Ventana nativa');
  readonly open = model(true);
  readonly value = model('');
}
@Component({
  imports: [
    Text,
    NeuBottomSheetComponent,
    NeuInputComponent,
    NeuButtonComponent,
  ],
  styles: PROJECTED_TEXT_STYLES,
  template: `<neu-bottom-sheet [title]="title()" [(open)]="open"
    ><text
      >Esta hoja utiliza la presentación nativa y respeta el área segura.</text
    ><neu-input label="Nombre en la hoja" [(value)]="value" /><neu-button
      label="Guardar y cerrar"
      (pressed)="open.set(false)"
  /></neu-bottom-sheet>`,
})
export class NativeBottomSheetDemo {
  readonly title = input('Hoja nativa');
  readonly open = model(true);
  readonly value = model('');
}
@Component({
  imports: [Text, NeuPopoverComponent],
  styles: PROJECTED_TEXT_STYLES,
  template: `<neu-popover [label]="label()" [title]="title()" [(open)]="open"
    ><text
      >La información se presenta en una ventana accesible para interacción
      táctil.</text
    ></neu-popover
  >`,
})
export class NativePopoverDemo {
  readonly label = input('Información');
  readonly title = input('Ayuda');
  readonly open = model(false);
}
@Component({
  imports: [Text, NeuStepperComponent, NeuInputComponent],
  styles: PROJECTED_TEXT_STYLES,
  template: `<neu-stepper
    [steps]="steps()"
    [(activeStep)]="activeStep"
    (finished)="finished.set(true)"
  >
    @if (activeStep() === 0) {
      <neu-input label="Nombre del asistente" [(value)]="value" />
    } @else {
      <text>Revisa tu nombre: {{ value() || 'Sin nombre' }}</text>
    }
    @if (finished()) {
      <text>Asistente terminado.</text>
    }
  </neu-stepper>`,
})
export class NativeStepperDemo {
  readonly steps = input<readonly NeuOption[]>([]);
  readonly activeStep = model(0);
  readonly value = model('');
  readonly finished = signal(false);
}
@Component({
  imports: [NeuToolbarComponent, NeuInputComponent, Text],
  styles: PROJECTED_TEXT_STYLES,
  template: `<neu-toolbar [actions]="actions()" (activated)="value.set($event)"
      ><neu-input label="Buscar en la barra" [(value)]="query" /></neu-toolbar
    ><text>Última acción: {{ value() }}</text>`,
})
export class NativeToolbarDemo {
  readonly actions = input<readonly NeuOption[]>([]);
  readonly value = model('');
  readonly query = model('');
}
