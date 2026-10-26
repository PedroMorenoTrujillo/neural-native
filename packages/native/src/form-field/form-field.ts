import {
  booleanAttribute,
  Component,
  input,
} from '@angular/core';
import { View, Text } from '@ng-native/components';
import { controlLabelId } from '../foundation/control-label.js';

@Component({
  selector: 'neu-form-field',
  imports: [View, Text],
  template: `<view class="stack"
    ><text class="label" [nativeID]="labelId">{{ label() }}{{ required() ? ' *' : '' }}</text
    ><ng-content />
    @if (invalid() && error()) {
      <text class="error" accessibilityRole="alert">{{ error() }}</text>
    } @else if (hint()) {
      <text class="muted">{{ hint() }}</text>
    }
  </view>`,
  styleUrl: '../foundation/mobile.css',
  styles: '.stack { gap: var(--neu-space-6, 6px); } .label { font-size: var(--neu-label-size, 14px); line-height: var(--neu-label-line, 20px); font-weight: 500; } .muted, .error { font-size: var(--neu-caption-size, 13px); line-height: var(--neu-caption-line, 18px); }',
})
export class NeuFormFieldComponent {
  /** Bind a projected native control's accessibilityLabelledBy to this label. */
  readonly labelId = controlLabelId();
  readonly label = input.required<string>();
  readonly required = input(false, { transform: booleanAttribute });
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly error = input('');
  readonly hint = input('');
}
