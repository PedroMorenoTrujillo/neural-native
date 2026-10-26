import {
  booleanAttribute,
  Component,
  input,
  model,
  computed,
  inject,
  signal,
} from '@angular/core';
import { View, Text } from '@ng-native/components';
import { NgIcon } from '@ng-native/icons';
import { NeuNativeTextInput as TextInput } from '../foundation/native-text-input.js';
import { NeuOption, uniqueOptions } from '../foundation/mobile.js';
import { NeuChipComponent } from '../chip/chip.js';
import { NeuButtonComponent } from '../button/button.js';
import { NEU_LIGHT_TOKENS, NEU_THEME } from '../foundation/index.js';
import { NEU_SEARCH } from '../foundation/icons.js';

import { NeuNativeTextSyncDirective } from '../foundation/native-text-sync.js';

@Component({
  selector: 'neu-filter-bar',
  imports: [NeuNativeTextSyncDirective, View, Text, TextInput, NgIcon, NeuChipComponent, NeuButtonComponent],
  template: `<view class="filter-bar">
    <view class="row control filter-search" [class.filter-search-focused]="focused()" [style.opacity]="disabled() ? 0.45 : 1">
      <ng-icon [svg]="searchIcon" [size]="20" [color]="mutedColor()" />
      <text-input
      neuSyncText
      #textSync="neuSyncText"
      (changeText)="textSync.synchronize()"
      class="filter-search-input"
      [neuralValue]="query()"
      (neuralValueChange)="query.set($event)"
      [accessibilityLabel]="searchLabel()"
      [placeholder]="searchLabel()"
      [placeholderTextColor]="mutedColor()"
      autoCapitalize="none"
      [autoCorrect]="false"
      (focus)="focused.set(true)"
      (blur)="focused.set(false)"
      [disabled]="disabled()" />
    </view>
    <view class="row filter-heading">
      <text class="label grow filter-label">{{ label() }}</text>
      <neu-button
        [label]="clearLabel()" size="sm" variant="text"
        [disabled]="disabled() || !hasFilters()" (pressed)="clear()" />
    </view>
    <view class="row wrap filter-options" [accessibilityLabel]="label()">
        @for (option of filters(); track option.id) {
          <neu-chip [label]="option.label" [selected]="value().includes(option.id)"
            [disabled]="disabled() || !!option.disabled" (selectedChange)="toggle(option.id, $event)" />
        }
      </view>
  </view>`,
  styleUrls: ['../foundation/mobile.css', './filter-bar.css'],
})
export class NeuFilterBarComponent {
  readonly label = input('Filters');
  readonly options = input<readonly NeuOption[]>([]);
  readonly value = model<readonly string[]>([]);
  readonly query = model('');
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly searchLabel = input('Search');
  readonly clearLabel = input('Clear filters');
  protected readonly searchIcon = NEU_SEARCH;
  protected readonly focused = signal(false);
  protected readonly hasFilters = computed(() => this.query().length > 0 || this.value().length > 0);
  protected readonly filters = computed(() => uniqueOptions(this.options()));
  private readonly theme = inject(NEU_THEME, { optional: true });
  protected readonly mutedColor = computed(
    () => (this.theme?.() ?? NEU_LIGHT_TOKENS).muted,
  );
  protected clear(): void {
    if (!this.disabled()) {
      this.value.set([]);
      this.query.set('');
    }
  }
  protected toggle(id: string, selected: boolean): void {
    if (this.disabled() || !this.filters().some(option => option.id === id && !option.disabled)) return;
    const ids = new Set(this.value());
    if (selected) ids.add(id); else ids.delete(id);
    this.value.set([...ids]);
  }
}
