import {
  booleanAttribute,
  Component,
  input,
  model,
  output,
  computed,
  effect,
  signal,
} from '@angular/core';
import { View, Text } from '@ng-native/components';
import { NeuNativePressable as Pressable } from '../foundation/native-pressable.js';
import { NeuNativeTextInput as TextInput } from '../foundation/native-text-input.js';
import { finite, bounded } from '../foundation/mobile.js';

import { NeuNativeTextSyncDirective } from '../foundation/native-text-sync.js';

@Component({
  selector: 'neu-number-input',
  imports: [NeuNativeTextSyncDirective, View, Text, Pressable, TextInput],
  template: `<view class="stack"
    ><text class="label">{{ label() }}</text
    ><view class="row"
      ><pressable
        class="action"
        accessibilityRole="button"
        [accessibilityLabel]="decreaseLabel() + ' ' + label()"
        [disabled]="unavailable() || value() <= min()"
        (press)="change(-1)"
        ><text class="label">−</text></pressable
      ><text-input
        neuSyncText
        #textSync="neuSyncText"
        (changeText)="textSync.synchronize()"
        class="control grow"
        [neuralValue]="displayText()"
        [accessibilityLabel]="label()"
        keyboardType="decimal-pad"
        [disabled]="disabled()"
        [readonly]="readonly()"
        (neuralValueChange)="edit($event)"
        (touch)="finishEdit()"
      /><pressable
        class="action"
        accessibilityRole="button"
        [accessibilityLabel]="increaseLabel() + ' ' + label()"
        [disabled]="unavailable() || value() >= max()"
        (press)="change(1)"
        ><text class="label">+</text></pressable
      ></view
    ></view
  >`,
  styleUrl: '../foundation/mobile.css',
})
export class NeuNumberInputComponent {
  readonly label = input.required<string>();
  readonly value = model(0);
  readonly min = input(0);
  readonly max = input(100);
  readonly step = input(1);
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly readonly = input(false, { transform: booleanAttribute });
  readonly decreaseLabel = input('Decrease');
  readonly increaseLabel = input('Increase');
  readonly touch = output<void>();
  protected readonly unavailable = computed(
    () => this.disabled() || this.readonly(),
  );
  private readonly draft = signal<{ text: string; value: number } | null>(null);
  protected readonly displayText = computed(() => {
    const draft = this.draft();
    return draft && !this.unavailable() && draft.value === this.value()
      ? draft.text
      : String(this.value());
  });
  constructor() {
    effect(() => {
      const draft = this.draft();
      // A parent replacement or unavailable control must not revive an old edit.
      if (draft && (this.unavailable() || draft.value !== this.value())) this.draft.set(null);
    });
  }
  protected change(direction: number): void {
    if (this.unavailable()) return;
    this.draft.set(null);
    this.commit(this.value() + direction * Math.abs(finite(this.step(), 1)));
  }
  protected edit(text: string): void {
    if (this.unavailable()) return;
    const n = Number(text.replace(',', '.'));
    const valid = text.trim() !== '' && Number.isFinite(n);
    const value = valid ? bounded(n, this.min(), this.max(), this.step()) : this.value();
    // Preserve blanks, signs and partial decimals while editing. The numeric
    // model stays bounded; blur or a step action restores its canonical text.
    this.draft.set({ text, value });
    if (valid) this.commit(value);
  }
  protected finishEdit(): void {
    this.draft.set(null);
    if (!this.unavailable()) this.touch.emit();
  }
  private commit(value: number): void {
    if (this.unavailable()) return;
    this.value.set(bounded(value, this.min(), this.max(), this.step()));
    this.touch.emit();
  }
}
