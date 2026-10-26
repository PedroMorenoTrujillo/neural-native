import {
  booleanAttribute,
  Component,
  input,
  model,
  output,
  signal,
} from '@angular/core';
import { View, Text } from '@ng-native/components';
import { NeuNativeTextInput as TextInput } from '../foundation/native-text-input.js';
import { NeuIconButtonComponent } from '../icon-button/icon-button.js';
import { NeuChipComponent } from '../chip/chip.js';
import { NEU_PLUS_ICON } from '../foundation/index.js';

import { NeuNativeTextSyncDirective } from '../foundation/native-text-sync.js';

@Component({
  selector: 'neu-input-tags',
  imports: [
    NeuNativeTextSyncDirective,
    View,
    Text,
    TextInput,
    NeuChipComponent,
    NeuIconButtonComponent,
  ],
  template: `<view class="stack"
    ><text class="label">{{ label() }}</text
    >@if (!readonly()) { <view class="tag-editor"
      ><text-input
        neuSyncText
        #textSync="neuSyncText"
        (changeText)="textSync.synchronize()"
        class="control grow tag-entry"
        [neuralValue]="draft()"
        (neuralValueChange)="draft.set($event)"
        [accessibilityLabel]="label()"
        [placeholder]="placeholder()"
        [disabled]="disabled()"
        [readonly]="readonly()"
        (submitEditing)="add()" /><neu-icon-button
        [svg]="plus"
        variant="tonal"
        [label]="addLabel()"
        [disabled]="
          disabled() || readonly() || !draft().trim() || value().length >= max()
        "
        (pressed)="add()"
    /></view> }
    @if (message()) {
      <text class="error" accessibilityRole="alert">{{ message() }}</text>
    }
    @if (value().length) {
      <view class="tag-list">
        @for (tag of value(); track tag) {
          <neu-chip
            [label]="tag"
            [selectable]="false"
            [removable]="!readonly()"
            [disabled]="disabled()"
            [removeLabel]="removeLabel()"
            (removed)="remove(tag)"
          />
        }
      </view>
    }
  </view>`,
  styleUrl: '../foundation/mobile.css',
  styles: `
    .label { font-weight: 500; }
    .tag-editor { flex-direction: row; align-items: center; gap: 8px; }
    .tag-entry { min-height: 48px; min-width: 0; }
    .tag-list { flex-direction: row; flex-wrap: wrap; gap: 8px; }
  `,
})
export class NeuInputTagsComponent {
  protected readonly plus = NEU_PLUS_ICON;
  readonly label = input.required<string>();
  readonly value = model<readonly string[]>([]);
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly readonly = input(false, { transform: booleanAttribute });
  readonly max = input(20);
  readonly addLabel = input('Add');
  readonly placeholder = input('');
  readonly removeLabel = input('Remove');
  readonly touch = output<void>();
  protected readonly draft = signal('');
  protected readonly message = signal('');
  protected add(): void {
    if (this.disabled() || this.readonly()) return;
    const text = this.draft().trim();
    if (!text || this.value().length >= this.max()) return;
    if (this.value().includes(text)) {
      this.message.set('Duplicate: ' + text);
      return;
    }
    this.value.update((x) => [...x, text]);
    this.draft.set('');
    this.message.set('');
    this.touch.emit();
  }
  protected remove(tag: string): void {
    if (!this.disabled() && !this.readonly()) {
      this.value.update((x) => x.filter((t) => t !== tag));
      this.touch.emit();
    }
  }
}
