import {
  booleanAttribute,
  Component,
  computed,
  inject,
  input,
  model,
  output,
  signal,
} from '@angular/core';
import { View, Text, ScrollView } from '@ng-native/components';
import { NeuNativePressable as Pressable } from '../foundation/native-pressable.js';
import { NeuOption } from '../foundation/mobile.js';
import {
  NEU_LIGHT_TOKENS,
  NEU_THEME,
  type NeuTone,
} from '../foundation/index.js';
import { neuTonePalette } from '../foundation/tone.js';

@Component({
  selector: 'neu-toggle-button-group',
  imports: [View, Text, Pressable, ScrollView],
  template: `@if (options().length) {
    <scroll-view
      class="group-scroll"
      [horizontal]="true"
      keyboardShouldPersistTaps="handled"
      [showsHorizontalScrollIndicator]="false"
      [contentContainerStyle]="scrollContent"
    >
      <view
        class="toggle-group"
        [accessibilityLabel]="label()"
        [style.minWidth]="options().length * 48 + 10"
      >
        @for (item of options(); track item.id) {
          <pressable
            class="segment"
            accessibilityRole="checkbox"
            [accessibilityLabel]="item.label"
            [accessibilityState]="{
              checked: value().includes(item.id),
              disabled: disabled() || item.disabled,
            }"
            [disabled]="disabled() || !!item.disabled"
            [class.neu-unavailable]="disabled() || item.disabled"
            [class.neu-held]="!disabled() && !item.disabled && held() === item.id"
            [style.backgroundColor]="
              value().includes(item.id)
                ? (multiple() ? palette().tonal : tokens().surface)
                : 'transparent'
            "
            (pressIn)="held.set(item.id)"
            (pressOut)="held.set(null)"
            (press)="toggle(item)"
          >
            @if (multiple()) { <text class="segment-check" pointerEvents="none" [accessible]="false" [style.color]="palette().ink" [style.opacity]="value().includes(item.id) ? 1 : 0">✓</text> }
            <text
              class="label"
              pointerEvents="none"
              [accessible]="false"
              [style.color]="
                value().includes(item.id) ? palette().ink : tokens().muted
              "
              [numberOfLines]="2"
              ellipsizeMode="tail"
              >{{ item.label }}</text
            ></pressable
          >
        }
      </view></scroll-view
    >
  }`,
  styles: `
    .neu-unavailable > * { opacity: 0.45; }
    .neu-held > * { opacity: 0.8; }
    .segment-check { position: absolute; top: 1px; right: 3px; font-size: 10px; line-height: 12px; }
    :host {
      align-self: stretch;
      min-width: 0;
      max-width: 100%;
    }
    .group-scroll {
      flex-grow: 0;
      flex-shrink: 1;
      max-width: 100%;
    }
    .toggle-group {
      flex-direction: row;
      flex-grow: 1;
      align-items: stretch;
      gap: 4px;
      padding: 4px;
      border-radius: var(--neu-radius, 12px);
      border-width: 1px;
      border-color: var(--neu-surface-border, #e1e6ed);
      background-color: var(--neu-surface-secondary, #eef1f5);
    }
    .segment {
      flex-direction: row;
      align-items: center;
      justify-content: center;
      gap: 6px;
      flex-grow: 1;
      flex-shrink: 0;
      flex-basis: auto;
      min-height: 48px;
      min-width: 48px;
      padding: 10px 4px;
      border-radius: 8px;
    }
    .label {
      color: var(--neu-text, #172033);
      font-size: 14px;
      font-weight: 500;
      line-height: 20px;
      text-align: center;
      flex-shrink: 1;
    }
  `,
})
export class NeuToggleButtonGroupComponent {
  readonly label = input.required<string>();
  readonly options = input<readonly NeuOption[]>([]);
  readonly value = model<readonly string[]>([]);
  readonly multiple = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly tone = input<NeuTone>('brand');
  readonly touch = output<void>();
  protected readonly scrollContent = { flexGrow: 1 };
  protected readonly held = signal<string | null>(null);
  private readonly theme = inject(NEU_THEME, { optional: true });
  protected readonly tokens = computed(
    () => this.theme?.() ?? NEU_LIGHT_TOKENS,
  );
  protected readonly palette = computed(() =>
    neuTonePalette(this.tokens(), this.tone()),
  );
  protected toggle(item: NeuOption): void {
    if (this.disabled() || item.disabled) return;
    const ids = this.value();
    this.value.set(
      ids.includes(item.id)
        ? ids.filter((x) => x !== item.id)
        : this.multiple()
          ? [...ids, item.id]
          : [item.id],
    );
    this.touch.emit();
  }
}
