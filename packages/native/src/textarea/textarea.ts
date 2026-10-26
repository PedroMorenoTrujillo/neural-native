import {
  Component,
  computed,
  inject,
} from '@angular/core';
import { Text, View } from '@ng-native/components';
import { NeuNativeTextInput as TextInput } from '../foundation/native-text-input.js';
import { NEU_LIGHT_TOKENS, NEU_THEME } from '../foundation/index.js';
import { NeuTextControl } from '../foundation/text-control.js';

import { NeuNativeTextSyncDirective } from '../foundation/native-text-sync.js';

@Component({
  selector: 'neu-textarea',
  imports: [NeuNativeTextSyncDirective, View, Text, TextInput],
  template: `
    <view class="field">
      <text class="label" [nativeID]="labelNativeId">{{ label() }}</text>
      <text-input
        neuSyncText
        #textSync="neuSyncText"
        (changeText)="textSync.synchronize()"
        [class]="invalid() ? 'control invalid' : 'control'"
        [neuralValue]="value()"
        (neuralValueChange)="value.set($event)"
        [accessibilityLabel]="label()"
        [accessibilityLabelledBy]="label() ? labelNativeId : undefined"
        [accessibilityHint]="fieldHint()"
        [attr.aria-required]="required() ? 'true' : null"
        [placeholder]="placeholder()"
        [placeholderTextColor]="mutedColor()"
        [disabled]="disabled()"
        [readonly]="readonly()"
        [invalid]="invalid()"
        [touched]="touched()"
        [maxLength]="maxLength()"
        [allowFontScaling]="true"
        [multiline]="true"
        textAlignVertical="top"
        [numberOfLines]="4"
        [style.opacity]="disabled() ? 0.45 : 1"
        (touch)="touch.emit()"
      />
      @if (invalid() && error()) {
        <text class="error" accessibilityRole="alert">{{ error() }}</text>
      } @else if (hint()) {
        <text class="hint">{{ hint() }}</text>
      }
    </view>
  `,
  styles: `
    .field {
      gap: 8px;
    }
    .label {
      color: var(--neu-text, #172033);
      font-size: var(--neu-label-size, 14px);
      font-weight: 500;
    }
    .control {
      min-height: 112px;
      padding: 12px 14px;
      font-size: var(--neu-font-size, 16px);
      color: var(--neu-text, #172033);
      background-color: var(--neu-surface, #ffffff);
      border-width: 1px;
      border-color: var(--neu-border, #a5afbf);
      border-radius: var(--neu-control-radius, 10px);
    }
    .invalid {
      border-color: var(--neu-danger, #b3261e);
    }
    .error {
      color: var(--neu-danger-ink, #b3261e);
      font-size: 13px;
    }
    .hint {
      color: var(--neu-muted, #596477);
      font-size: 13px;
    }
  `,
})
export class NeuTextareaComponent extends NeuTextControl {
  private readonly theme = inject(NEU_THEME, { optional: true });
  protected readonly mutedColor = computed(
    () => (this.theme?.() ?? NEU_LIGHT_TOKENS).muted,
  );
}
