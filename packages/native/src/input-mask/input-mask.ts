import {
  Component,
  input,
  computed,
} from '@angular/core';
import { View, Text } from '@ng-native/components';
import { NeuNativeTextInput as TextInput } from '../foundation/native-text-input.js';
import { NeuTextControl } from '../foundation/mobile.js';

export function formatMask(
  value: string,
  mask: string,
): { raw: string; display: string } {
  const rest = Array.from(value);
  let raw = '',
    display = '';
  for (const token of mask) {
    const pattern =
      token === '#'
        ? /[0-9]/
        : token === 'A'
          ? /[a-zA-Z]/
          : token === '*'
            ? /[a-zA-Z0-9]/
            : null;
    if (!pattern) {
      if (rest[0] === token) rest.shift();
      if (rest.length) display += token;
      continue;
    }
    let char = rest.shift();
    while (char !== undefined && !pattern.test(char)) char = rest.shift();
    if (char === undefined) break;
    raw += char;
    display += char;
  }
  return { raw, display };
}
import { NeuNativeTextSyncDirective } from '../foundation/native-text-sync.js';

@Component({
  selector: 'neu-input-mask',
  imports: [NeuNativeTextSyncDirective, View, Text, TextInput],
  template: `<view class="stack"
    ><text class="label" [nativeID]="labelNativeId">{{ label() }}</text
    ><text-input
      neuSyncText
      #textSync="neuSyncText"
      (changeText)="textSync.synchronize()"
      class="control"
      [neuralValue]="formatted()"
      [placeholder]="maskGuide()"
      [accessibilityLabel]="label()"
      [accessibilityLabelledBy]="label() ? labelNativeId : undefined"
      [accessibilityHint]="fieldHint()"
      [attr.aria-required]="required() ? 'true' : null"
      [disabled]="disabled()"
      [readonly]="readonly()"
      [invalid]="invalid()"
      [touched]="touched()"
      [keyboardType]="keyboardType()"
      (neuralValueChange)="edit($event)"
      (touch)="touch.emit()"
    />
    @if (invalid() && error()) {
      <text class="error" accessibilityRole="alert">{{ error() }}</text>
    } @else {
      <text class="muted">{{ hint() }}</text>
    }
  </view>`,
  styleUrl: '../foundation/mobile.css',
})
export class NeuInputMaskComponent extends NeuTextControl {
  readonly mask = input.required<string>();
  readonly keyboardType = input<'default' | 'numeric' | 'phone-pad'>('default');
  protected readonly maskGuide = computed(() => this.mask().replace(/[#A*]/g, '_'));
  protected readonly formatted = computed(
    () => formatMask(this.value(), this.mask()).display,
  );
  protected edit(value: string): void {
    this.accept(formatMask(value, this.mask()).raw);
  }
}
