import {
  Component,
  input,
  computed,
  signal,
  effect,
} from '@angular/core';
import { View, Text } from '@ng-native/components';
import { NeuNativeTextInput as TextInput } from '../foundation/native-text-input.js';
import {
  NeuOption,
  NeuTextControl,
  uniqueOptions,
} from '../foundation/mobile.js';
import { NeuListboxComponent } from '../listbox/listbox.js';

import { NeuNativeTextSyncDirective } from '../foundation/native-text-sync.js';

@Component({
  selector: 'neu-autocomplete',
  imports: [NeuNativeTextSyncDirective, View, Text, TextInput, NeuListboxComponent],
  template: `<view class="stack"
    ><text class="label">{{ label() }}</text
    ><text-input
      neuSyncText
      #textSync="neuSyncText"
      (changeText)="textSync.synchronize()"
      class="control"
      [accessibilityLabel]="label()"
      [neuralValue]="query()"
      [disabled]="disabled()"
      [readonly]="readonly()"
      [invalid]="invalid()"
      [touched]="touched()"
      (neuralValueChange)="search($event)"
      (touch)="touch.emit()"
    />
    @if (searching()) {
      <neu-listbox
        [label]="label()"
        [options]="matches()"
        [value]="value() ? [value()] : []"
        [disabled]="disabled()"
        [readonly]="readonly()"
        [emptyLabel]="emptyLabel()"
        (selected)="choose($event)"
      />
    }
    @if (invalid() && error()) {
      <text class="error" accessibilityRole="alert">{{ error() }}</text>
    }
  </view>`,
  styleUrl: '../foundation/mobile.css',
})
export class NeuAutocompleteComponent extends NeuTextControl {
  readonly options = input<readonly NeuOption[]>([]);
  readonly emptyLabel = input('No matches');
  readonly minLength = input(1);
  protected readonly query = signal('');
  protected readonly searching = signal(false);
  protected readonly matches = computed(() => {
    const q = this.query().trim().toLocaleLowerCase();
    return q.length < this.minLength()
      ? []
      : uniqueOptions(this.options()).filter((x) =>
          x.label.toLocaleLowerCase().includes(q),
        );
  });
  constructor() {
    super();
    effect(() => {
      const value = this.value(),
        options = this.options();
      if (!this.searching()) {
        this.query.set(options.find((x) => x.id === value)?.label ?? '');
      }
    });
  }
  protected search(text: string): void {
    if (this.disabled() || this.readonly()) return;
    this.query.set(text);
    this.searching.set(true);
    this.value.set('');
  }
  protected choose(id: string): void {
    const option = this.options().find((x) => x.id === id && !x.disabled);
    if (!option || this.disabled() || this.readonly()) return;
    this.accept(id);
    this.query.set(option.label);
    this.searching.set(false);
  }
}
