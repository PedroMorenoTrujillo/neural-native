import {
  booleanAttribute,
  Component,
  computed,
  inject,
  input,
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
  selector: 'neu-button-group',
  imports: [View, Text, Pressable, ScrollView],
  template: `@if (items().length) {
    <scroll-view
      class="group-scroll"
      [horizontal]="true"
      keyboardShouldPersistTaps="handled"
      [showsHorizontalScrollIndicator]="false"
      [contentContainerStyle]="scrollContent"
    >
      <view
        class="button-group"
        [accessibilityLabel]="label()"
        [style.minWidth]="items().length * 48 + 2"
      >
        @for (item of items(); track item.id; let last = $last) {
          <pressable
            class="group-action"
            accessibilityRole="button"
            [accessibilityLabel]="item.label"
            [disabled]="disabled() || !!item.disabled"
            [accessibilityState]="{ disabled: disabled() || item.disabled }"
            [class.neu-unavailable]="disabled() || item.disabled"
            [style.borderRightWidth]="last ? 0 : 1"
            [style.backgroundColor]="
              !disabled() && !item.disabled && held() === item.id
                ? palette().tonal
                : tokens().surface
            "
            (pressIn)="held.set(item.id)"
            (pressOut)="held.set(null)"
            (press)="activate(item)"
            ><text
              class="label"
              pointerEvents="none"
              [accessible]="false"
              [style.color]="palette().ink"
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
    .button-group {
      flex-direction: row;
      flex-grow: 1;
      align-items: stretch;
      border-radius: var(--neu-radius, 12px);
      border-width: 1px;
      border-color: var(--neu-border, #a5afbf);
      overflow: hidden;
    }
    .group-action {
      min-height: 48px;
      min-width: 48px;
      flex-grow: 1;
      flex-shrink: 1;
      flex-basis: 0;
      padding: 12px 8px;
      justify-content: center;
      align-items: center;
      border-color: var(--neu-border, #a5afbf);
      background-color: var(--neu-surface, #ffffff);
    }
    .label {
      color: var(--neu-accent-ink, #3155d9);
      font-size: 14px;
      line-height: 20px;
      text-align: center;
      flex-shrink: 1;
    }
  `,
})
export class NeuButtonGroupComponent {
  readonly label = input('Actions');
  readonly items = input<readonly NeuOption[]>([]);
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly tone = input<NeuTone>('brand');
  readonly activated = output<string>();
  protected readonly scrollContent = { flexGrow: 1 };
  protected readonly held = signal<string | null>(null);
  private readonly theme = inject(NEU_THEME, { optional: true });
  protected readonly tokens = computed(
    () => this.theme?.() ?? NEU_LIGHT_TOKENS,
  );
  protected readonly palette = computed(() =>
    neuTonePalette(this.tokens(), this.tone()),
  );
  protected activate(item: NeuOption): void {
    if (!this.disabled() && !item.disabled) this.activated.emit(item.id);
  }
}
