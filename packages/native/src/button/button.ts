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
  Text,
  type PressEvent,
} from '@ng-native/components';
import { NeuNativePressable as Pressable } from '../foundation/native-pressable.js';
import {
  NEU_LIGHT_TOKENS,
  NEU_THEME,
  type NeuSize,
  type NeuVariant,
  type NeuTone,
} from '../foundation/index.js';
import { neuTonePalette } from '../foundation/tone.js';

@Component({
  selector: 'neu-button',
  imports: [Pressable, Text, ActivityIndicator],
  host: {
    '[style.width]': "fullWidth() ? '100%' : null",
    '[style.alignSelf]': "fullWidth() ? 'stretch' : 'flex-start'",
    '[style.opacity]': 'unavailable() ? 0.45 : held() ? 0.8 : 1',
  },
  template: `
    <pressable
      [class]="classes()"
      accessibilityRole="button"
      [accessibilityLabel]="accessibilityLabel() || label()"
      [accessibilityState]="{ disabled: unavailable(), busy: loading() }"
      [aria-disabled]="unavailable()"
      [aria-busy]="loading()"
      [disabled]="unavailable()"
      [style.width]="fullWidth() ? '100%' : null"
      [style.alignSelf]="fullWidth() ? 'stretch' : 'flex-start'"
      [style.backgroundColor]="background()"
      [style.borderColor]="variant() === 'outline' ? palette().color : 'transparent'"
      (pressIn)="held.set(true)"
      (pressOut)="held.set(false)"
      (press)="activate($event)"
    >
      @if (loading()) {
        <activity-indicator
          size="small"
          [color]="loadingColor()"
          [accessible]="false"
          [accessibilityElementsHidden]="true"
          importantForAccessibility="no-hide-descendants"
        />
      }
      <text class="label" [style.color]="loadingColor()" [style.fontSize]="fontSize()" [allowFontScaling]="true">{{ label() }}</text>
    </pressable>
  `,
  styles: `
    :host { transition: opacity var(--neu-duration, 120ms); }
    .control {
      max-width: 100%;
      min-width: 48px;
      min-height: 56px;
      padding: 12px 20px;
      border-radius: var(--neu-radius, 12px);
      flex-direction: row;
      gap: 8px;
      align-items: center;
      justify-content: center;
      background-color: var(--neu-accent, #006ee6);
    }
    .label {
      flex-shrink: 1;
      color: var(--neu-on-accent, #ffffff);
      font-size: var(--neu-font-size, 16px);
      font-weight: 600;
    }
    .tonal {
      background-color: var(--neu-tonal, #eff6ff);
    }
    .control.tonal > .label,
    .control.outline > .label,
    .control.text > .label {
      color: var(--neu-accent, #006ee6);
    }
    .outline {
      background-color: transparent;
      border-width: 1px;
      border-color: var(--neu-border, #a5afbf);
    }
    .text {
      background-color: transparent;
    }
    .sm {
      min-height: 48px;
      padding: 10px 14px;
    }
    .lg {
      min-height: 64px;
      padding: 16px 24px;
    }
    @media (prefers-reduced-motion: reduce) {
      :host { transition: none; }
    }
  `,
})
export class NeuButtonComponent {
  readonly label = input.required<string>();
  readonly accessibilityLabel = input('');
  readonly variant = input<NeuVariant>('solid');
  readonly tone = input<NeuTone>('brand');
  readonly size = input<NeuSize>('md');
  readonly fullWidth = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly loading = input(false, { transform: booleanAttribute });
  readonly pressed = output<PressEvent>();
  private readonly theme = inject(NEU_THEME, { optional: true });
  protected readonly palette = computed(() => neuTonePalette(this.theme?.() ?? NEU_LIGHT_TOKENS, this.tone()));
  protected readonly fontSize = computed(() => (this.theme?.() ?? NEU_LIGHT_TOKENS).fontSize * (this.size() === 'sm' ? 0.875 : this.size() === 'lg' ? 1.125 : 1));
  protected readonly background = computed(() => this.variant() === 'solid' ? this.palette().color : this.variant() === 'tonal' ? this.palette().tonal : 'transparent');
  protected readonly loadingColor = computed(() => {
    return this.variant() === 'solid' ? this.palette().onColor : this.palette().ink;
  });
  protected readonly held = signal(false);
  protected readonly unavailable = computed(
    () => this.disabled() || this.loading(),
  );
  protected readonly classes = computed(
    () => 'control ' + this.variant() + ' ' + this.size(),
  );
  protected activate(event: PressEvent): void {
    if (!this.unavailable()) this.pressed.emit(event);
  }
}
