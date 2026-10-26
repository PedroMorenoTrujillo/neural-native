import {
  Component,
  input,
  model,
  output,
  signal,
  effect,
} from '@angular/core';
import { View, Text } from '@ng-native/components';
import { NeuNativePressable as Pressable } from '../foundation/native-pressable.js';
import { NeuNativeTextInput as TextInput } from '../foundation/native-text-input.js';
import { NeuTextControl } from '../foundation/mobile.js';
import { NeuButtonComponent } from '../button/button.js';

import { NeuNativeTextSyncDirective } from '../foundation/native-text-sync.js';

@Component({
  selector: 'neu-inline-editor',
  imports: [
    NeuNativeTextSyncDirective,
    View,
    Text,
    TextInput,
    Pressable,
    NeuButtonComponent,
  ],
  template: `<view class="stack">
    @if (editing()) {
      <text class="label" [nativeID]="labelNativeId">{{ label() }}</text>
      <text-input
        neuSyncText
        #textSync="neuSyncText"
        (changeText)="textSync.synchronize()"
        class="control"
        [neuralValue]="draft()"
        (neuralValueChange)="draft.set($event)"
        [accessibilityLabel]="label()"
        [accessibilityLabelledBy]="label() ? labelNativeId : undefined"
        [accessibilityHint]="fieldHint()"
        [attr.aria-required]="required() ? 'true' : null"
        [disabled]="disabled()"
        [readonly]="readonly()"
        (submitEditing)="save()"
      /><view class="row"
        ><neu-button
          [label]="saveLabel()"
          size="sm"
          [disabled]="
            disabled() || readonly() || (required() && !draft().trim())
          "
          (pressed)="save()" /><neu-button
          [label]="cancelLabel()"
          size="sm"
          variant="text"
          (pressed)="cancel()"
      /></view>
    } @else {
      <pressable
        class="control"
        accessibilityRole="button"
        [accessibilityLabel]="label()"
        [accessibilityValue]="{ text: value() || placeholder() }"
        [disabled]="disabled() || readonly()"
        (press)="begin()"
        ><text class="label">{{ value() || placeholder() }}</text></pressable
      >
    }
  </view>`,
  styleUrl: '../foundation/mobile.css',
})
export class NeuInlineEditorComponent extends NeuTextControl {
  readonly editing = model(false);
  readonly placeholder = input('Tap to edit');
  readonly saveLabel = input('Save');
  readonly cancelLabel = input('Cancel');
  readonly saved = output<string>();
  readonly cancelled = output<void>();
  protected readonly draft = signal('');
  constructor() {
    super();
    effect(() => {
      if (this.editing()) this.draft.set(this.value());
    });
  }
  protected begin(): void {
    if (!this.disabled() && !this.readonly()) this.editing.set(true);
  }
  protected save(): void {
    if (
      this.disabled() ||
      this.readonly() ||
      !this.editing() ||
      (this.required() && !this.draft().trim())
    )
      return;
    this.accept(this.draft());
    this.editing.set(false);
    this.saved.emit(this.value());
  }
  protected cancel(): void {
    this.editing.set(false);
    this.draft.set(this.value());
    this.cancelled.emit();
  }
}
