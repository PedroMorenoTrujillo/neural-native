import {
  Component,
  booleanAttribute,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import {
  ActivityIndicator,
  type PressEvent,
} from '@ng-native/components';
import { NeuNativePressable as Pressable } from '../foundation/native-pressable.js';
import { NgIcon } from '@ng-native/icons';
import {
  NEU_LIGHT_TOKENS,
  NEU_THEME,
  type NeuVariant,
  type NeuTone,
} from '../foundation/index.js';
import { neuTonePalette } from '../foundation/tone.js';

@Component({
  selector: 'neu-icon-button',
  host: { '[style.opacity]': 'unavailable() ? 0.45 : held() ? 0.8 : 1' },
  imports: [Pressable, NgIcon, ActivityIndicator],
  template: `
    <pressable
      [class]="'control ' + variant()"
      accessibilityRole="button"
      [accessibilityLabel]="label()"
      [accessibilityState]="{ disabled: unavailable(), busy: loading() }"
      [aria-disabled]="unavailable()"
      [aria-busy]="loading()"
      [disabled]="unavailable()"
      [style.backgroundColor]="variant() === 'solid' ? palette().color : variant() === 'tonal' ? palette().tonal : 'transparent'"
      [style.borderColor]="variant() === 'outline' ? palette().color : 'transparent'"
      (pressIn)="held.set(true)"
      (pressOut)="held.set(false)"
      (press)="activate($event)"
    >
      @if (loading()) {
        <activity-indicator [color]="color()" [accessible]="false" [accessibilityElementsHidden]="true" importantForAccessibility="no-hide-descendants" />
      } @else {
        <ng-icon [svg]="svg()" [size]="24" [color]="color()" />
      }
    </pressable>
  `,
  styles: `
    .control {
      align-self: flex-start;
      width: 48px;
      height: 48px;
      min-width: 48px;
      min-height: 48px;
      padding: 12px;
      align-items: center;
      justify-content: center;
      border-radius: var(--neu-radius, 12px);
      background-color: var(--neu-accent, #3155d9);
    }
    .tonal {
      background-color: var(--neu-tonal, #e9edfc);
    }
    .outline {
      background-color: transparent;
      border-width: 1px;
      border-color: var(--neu-border, #a5afbf);
    }
    .text {
      background-color: transparent;
    }
  `,
})
export class NeuIconButtonComponent {
  readonly label = input.required<string>();
  readonly svg = input.required<string>();
  readonly variant = input<NeuVariant>('tonal');
  readonly tone = input<NeuTone>('brand');
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly loading = input(false, { transform: booleanAttribute });
  readonly pressed = output<PressEvent>();
  private readonly theme = inject(NEU_THEME, { optional: true });
  protected readonly palette = computed(() => neuTonePalette(this.theme?.() ?? NEU_LIGHT_TOKENS, this.tone()));
  protected readonly held = signal(false);
  protected readonly unavailable = computed(
    () => this.disabled() || this.loading(),
  );
  protected readonly color = computed(() => {
    return this.variant() === 'solid' ? this.palette().onColor : this.palette().color;
  });
  protected activate(event: PressEvent): void {
    if (!this.unavailable()) this.pressed.emit(event);
  }
}
