import {
  booleanAttribute,
  Component,
  input,
  model,
  output,
} from '@angular/core';
import { View, Text } from '@ng-native/components';
import { NeuNativePressable as Pressable } from '../foundation/native-pressable.js';
import { NeuOption } from '../foundation/mobile.js';

@Component({
  selector: 'neu-radio',
  imports: [View, Text, Pressable],
  template: `<view
    class="stack"
    [class.radio-invalid]="invalid()"
    accessibilityRole="radiogroup"
    [accessibilityLabel]="label()"
    [accessibilityHint]="invalid() && error() ? error() : undefined"
    [attr.aria-invalid]="invalid() ? 'true' : null"
  >
    @for (item of options(); track item.id) {
      <pressable
        class="row radio-option"
        accessibilityRole="radio"
        [accessibilityLabel]="item.label"
        [accessibilityState]="{
          checked: value() === item.id,
          disabled: disabled() || readonly() || item.disabled,
        }"
        [disabled]="disabled() || readonly() || !!item.disabled"
        (press)="choose(item)"
        ><view class="radio-ring" [class.radio-selected]="value() === item.id">
          @if (value() === item.id) {
            <view class="radio-center" />
          }</view
        ><view class="grow">
          <text class="label">{{ item.label }}</text>
          @if (item.description) {
            <text class="muted">{{ item.description }}</text>
          }
        </view></pressable
      >
    }
    @if (invalid() && error()) {
      <text class="error" accessibilityRole="alert">{{ error() }}</text>
    }
  </view>`,
  styleUrl: '../foundation/mobile.css',
  styles: `
    .radio-option .label { font-size: var(--neu-row-size, 15px); line-height: var(--neu-row-line, 21px); }
    .radio-option .muted { font-size: var(--neu-caption-size, 13px); line-height: var(--neu-caption-line, 18px); }
    .radio-option {
      min-height: 48px;
      padding: 8px 0;
    }
    .radio-ring {
      width: 20px;
      height: 20px;
      border-width: 1.5px;
      border-color: var(--neu-muted);
      border-radius: 10px;
      align-items: center;
      justify-content: center;
    }
    .radio-ring.radio-selected {
      border-color: var(--neu-accent);
    }
    .radio-center {
      width: 10px;
      height: 10px;
      border-radius: 5px;
      background-color: var(--neu-accent);
    }
    .radio-invalid .radio-ring {
      border-color: var(--neu-danger, #dc2626);
    }
    .radio-invalid .radio-center {
      background-color: var(--neu-danger, #dc2626);
    }
  `,
})
export class NeuRadioGroupComponent {
  readonly label = input.required<string>();
  readonly options = input<readonly NeuOption[]>([]);
  readonly value = model('');
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly readonly = input(false, { transform: booleanAttribute });
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly touched = input(false, { transform: booleanAttribute });
  readonly error = input('');
  readonly touch = output<void>();
  protected choose(item: NeuOption): void {
    if (!this.disabled() && !this.readonly() && !item.disabled) {
      this.value.set(item.id);
      this.touch.emit();
    }
  }
}
