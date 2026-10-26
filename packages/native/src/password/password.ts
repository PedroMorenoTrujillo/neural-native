import { Component, input, model } from '@angular/core';
import { View, Text } from '@ng-native/components';
import { NeuNativeTextInput as TextInput } from '../foundation/native-text-input.js';
import { NeuTextControl } from '../foundation/mobile.js';
import { NEU_EYE, NEU_EYE_OFF } from '../foundation/icons.js';
import { NeuIconButtonComponent } from '../icon-button/icon-button.js';

import { NeuNativeTextSyncDirective } from '../foundation/native-text-sync.js';

@Component({
  selector: 'neu-password',
  imports: [
    NeuNativeTextSyncDirective,
    View,
    Text,
    TextInput,
    NeuIconButtonComponent,
  ],
  template: `<view class="stack"
    ><text class="label" [nativeID]="labelNativeId">{{ label() }}</text
    ><view class="password-row"
      ><text-input
        neuSyncText
        #textSync="neuSyncText"
        (changeText)="textSync.synchronize()"
        class="control password-control"
        [neuralValue]="value()"
        [accessibilityLabel]="label()"
        [accessibilityLabelledBy]="label() ? labelNativeId : undefined"
        [accessibilityHint]="fieldHint()"
        [attr.aria-required]="required() ? 'true' : null"
        [secureTextEntry]="!revealed()"
        textContentType="password"
        autoComplete="current-password"
        [autoCorrect]="false"
        autoCapitalize="none"
        [disabled]="disabled()"
        [readonly]="readonly()"
        [invalid]="invalid()"
        [touched]="touched()"
        (neuralValueChange)="accept($event)"
        (touch)="touch.emit()"
      /><view class="visibility-toggle">
        <neu-icon-button
          [label]="revealed() ? hideLabel() : showLabel()"
          [svg]="revealed() ? eyeOff : eye"
          variant="text"
          tone="neutral"
          [disabled]="disabled()"
          (pressed)="toggle()"
        />
      </view>
    </view>
    @if (invalid() && error()) {
      <text class="error" accessibilityRole="alert">{{ error() }}</text>
    }
  </view>`,
  styleUrl: '../foundation/mobile.css',
  styles: `
    .password-row {
      position: relative;
      min-width: 0;
    }
    .password-control {
      min-height: 56px;
      padding-right: 60px;
    }
    .visibility-toggle {
      position: absolute;
      right: 4px;
      top: 4px;
    }
  `,
})
export class NeuPasswordComponent extends NeuTextControl {
  readonly revealed = model(false);
  readonly showLabel = input('Show password');
  readonly hideLabel = input('Hide password');
  protected readonly eye = NEU_EYE;
  protected readonly eyeOff = NEU_EYE_OFF;
  protected toggle(): void {
    if (!this.disabled()) this.revealed.update((x) => !x);
  }
}
