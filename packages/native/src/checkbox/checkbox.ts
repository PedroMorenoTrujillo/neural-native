import {
  Component,
  booleanAttribute,
  computed,
  inject,
  input,
  model,
  output,
} from '@angular/core';
import { Text, View } from '@ng-native/components';
import { NeuNativePressable as Pressable } from '../foundation/native-pressable.js';
import { NgIcon } from '@ng-native/icons';
import {
  NEU_CHECK_ICON,
  NEU_LIGHT_TOKENS,
  NEU_THEME,
} from '../foundation/index.js';

@Component({
  selector: 'neu-checkbox',
  imports: [Pressable, Text, View, NgIcon],
  template: `
    <view class="field">
      <pressable
        [class]="labelPosition() === 'left' ? 'row label-left' : 'row'"
        accessibilityRole="checkbox"
        [accessibilityLabel]="label()"
        [accessibilityState]="{ checked: checked(), disabled: unavailable() }"
        [disabled]="unavailable()"
        [accessibilityHint]="invalid() && error() ? error() : undefined"
        [attr.aria-invalid]="invalid() ? 'true' : null"
        [class.neu-unavailable]="disabled()"
        (press)="toggle()"
      >
        <view
          [class]="checked() ? 'box checked' : 'box'"
          [style.borderColor]="invalid() ? errorColor() : undefined"
          [style.borderWidth]="invalid() ? 2 : 1"
          pointerEvents="none"
        >
          @if (checked()) {
            <ng-icon [svg]="checkIcon" [size]="14" [color]="iconColor()" />
          }
        </view>
        <text class="label" pointerEvents="none">{{ label() }}</text>
      </pressable>
      @if (invalid() && error()) {
        <text class="error" accessibilityRole="alert">{{ error() }}</text>
      }
    </view>
  `,
  styles: `
    .neu-unavailable > * { opacity: 0.45; }
    .row {
      min-height: 48px;
      flex-direction: row;
      align-items: center;
      gap: 12px;
    }
    .field {
      gap: 4px;
      min-width: 0;
    }
    .label-left {
      flex-direction: row-reverse;
      justify-content: flex-end;
    }
    .error {
      font-size: 13px;
      color: var(--neu-danger-ink, #b3261e);
    }
    .box {
      width: 22px;
      height: 22px;
      border-width: 1px;
      border-color: var(--neu-border, #a5afbf);
      border-radius: 6px;
      align-items: center;
      justify-content: center;
    }
    .checked {
      background-color: var(--neu-accent, #3155d9);
      border-color: var(--neu-accent, #3155d9);
    }
    .label {
      font-size: var(--neu-row-size, 15px);
      line-height: var(--neu-row-line, 21px);
      color: var(--neu-text, #172033);
      flex-shrink: 1;
    }
  `,
})
export class NeuCheckboxComponent {
  readonly label = input.required<string>();
  readonly labelPosition = input<'left' | 'right'>('right');
  readonly checked = model(false);
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly readonly = input(false, { transform: booleanAttribute });
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly touched = input(false, { transform: booleanAttribute });
  readonly error = input('');
  readonly touch = output<void>();
  private readonly theme = inject(NEU_THEME, { optional: true });
  protected readonly checkIcon = NEU_CHECK_ICON;
  protected readonly iconColor = computed(
    () => (this.theme?.() ?? NEU_LIGHT_TOKENS).onAccent,
  );
  protected readonly errorColor = computed(
    () => (this.theme?.() ?? NEU_LIGHT_TOKENS).danger,
  );
  protected readonly unavailable = computed(
    () => this.disabled() || this.readonly(),
  );
  protected toggle(): void {
    if (!this.unavailable()) {
      this.checked.update((value) => !value);
      this.touch.emit();
    }
  }
}
