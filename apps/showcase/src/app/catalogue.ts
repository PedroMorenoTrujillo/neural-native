import {
  Component,
  computed,
  isSignal,
  signal,
  viewChild,
} from '@angular/core';
import { NgComponentOutlet } from '@angular/common';
import { View, Text, Pressable, TextInput } from '@ng-native/components';
import { NATIVE_DEMOS } from './catalogue-data.js';
@Component({
  selector: 'native-catalogue',
  imports: [View, Text, Pressable, TextInput, NgComponentOutlet],
  template: ` <view class="catalogue"
    ><text class="heading" accessibilityRole="header"
      >Catálogo móvil · {{ demos.length }} componentes</text
    >
    @if (selected(); as demo) {
      <pressable
        class="action"
        accessibilityRole="button"
        accessibilityLabel="Volver al catálogo"
        (press)="selected.set(null)"
        ><text class="label">← Volver al catálogo</text></pressable
      ><text class="heading">{{ demo.name }}</text
      ><text class="hint"
        >Prueba las acciones y observa el estado del componente.</text
      ><view class="specimen"
        ><ng-container
          *ngComponentOutlet="demo.component; inputs: demo.inputs" /></view
      ><text class="hint">Estado</text><text class="state">{{ state() }}</text>
    } @else {
      <text-input
        class="control"
        accessibilityLabel="Buscar componentes"
        placeholder="Buscar componentes"
        [(value)]="query"
      /><view class="list">
        @for (demo of filtered(); track demo.entry) {
          <pressable
            class="row"
            accessibilityRole="button"
            [accessibilityLabel]="demo.name"
            (press)="selected.set(demo)"
            ><text class="label">{{ demo.name }}</text
            ><text class="hint">›</text></pressable
          >
        } @empty {
          <text class="hint">No hay resultados</text>
        }
      </view>
    }
  </view>`,
  styles: `
    .catalogue {
      gap: 16px;
    }
    .heading {
      font-size: 22px;
      font-weight: 600;
      color: var(--neu-text, #172033);
    }
    .label {
      font-size: 16px;
      color: var(--neu-text, #172033);
    }
    .hint {
      font-size: 14px;
      color: var(--neu-muted, #596477);
    }
    .list {
      gap: 8px;
    }
    .row {
      min-height: 52px;
      padding: 14px;
      flex-direction: row;
      justify-content: space-between;
      border-radius: 12px;
      background-color: var(--neu-surface, #fff);
    }
    .action {
      min-height: 48px;
      justify-content: center;
    }
    .control {
      min-height: 48px;
      padding: 12px;
      border-width: 1px;
      border-color: var(--neu-border, #a5afbf);
      border-radius: 12px;
      font-size: 16px;
      color: var(--neu-text, #172033);
    }
    .specimen {
      padding: 12px;
      gap: 16px;
      background-color: var(--neu-surface, #fff);
      border-radius: 16px;
    }
    .state {
      font-size: 14px;
      color: var(--neu-text, #172033);
      padding: 12px;
      background-color: var(--neu-tonal, #e9edfc);
      border-radius: 12px;
    }
  `,
})
export class NativeCatalogueComponent {
  readonly demos = NATIVE_DEMOS;
  readonly selected = signal<(typeof NATIVE_DEMOS)[number] | null>(null);
  readonly query = signal('');
  protected readonly filtered = computed(() =>
    this.demos.filter((x) =>
      x.name.toLocaleLowerCase().includes(this.query().toLocaleLowerCase()),
    ),
  );
  private readonly outlet = viewChild(NgComponentOutlet);
  protected state(): string {
    const instance = this.outlet()?.componentInstance as
      | Record<string, unknown>
      | null
      | undefined;
    if (!instance) return '{}';
    const values: Record<string, unknown> = {};
    for (const key of [
      'value',
      'checked',
      'open',
      'expanded',
      'index',
      'activeStep',
      'readIds',
      'files',
      'revealed',
      'collapsed',
      'query',
      'editing',
      'descending',
    ]) {
      const field = instance[key];
      if (isSignal(field)) values[key] = field();
    }
    return JSON.stringify(values, null, 2);
  }
}
