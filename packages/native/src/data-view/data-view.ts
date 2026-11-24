import {
  booleanAttribute,
  Component,
  contentChild,
  input,
  model,
  output,
  computed,
  inject,
  TemplateRef,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { View, Text, VirtualList, VirtualListRow } from '@ng-native/components';
import { NeuNativePressable as Pressable } from '../foundation/native-pressable.js';
import { AnimatedStyle } from '@ng-native/components/animations';
import { NeuDataViewRowMotionDirective } from './data-view-row.js';
import { NeuNativeTextInput as TextInput } from '../foundation/native-text-input.js';
import { NeuOption, uniqueOptions } from '../foundation/mobile.js';
import { NeuIconButtonComponent } from '../icon-button/icon-button.js';
import { NeuSkeletonComponent } from '../skeleton/skeleton.js';
import { NeuAlertComponent } from '../alert/alert.js';
import { NeuEmptyStateComponent } from '../empty-state/empty-state.js';
import { NEU_LIGHT_TOKENS, NEU_THEME } from '../foundation/index.js';

import { NeuNativeTextSyncDirective } from '../foundation/native-text-sync.js';

import { NeuDataViewItemDirective, type NeuDataViewItemContext } from './data-view-templates.js';
export type { NeuDataViewItemContext } from './data-view-templates.js';

@Component({
  selector: 'neu-data-view',
  imports: [NeuNativeTextSyncDirective,
    View,
    Text,
    TextInput,
    Pressable,
    VirtualList,
    VirtualListRow,
    NeuDataViewRowMotionDirective,
    AnimatedStyle,
    NgTemplateOutlet,
    NeuIconButtonComponent,
    NeuSkeletonComponent,
    NeuAlertComponent,
    NeuEmptyStateComponent,
  ],
  template: `<ng-template #rowContents let-item let-index="index">
    @if (resolvedItemTemplate(); as template) {
      <ng-container [ngTemplateOutlet]="template" [ngTemplateOutletContext]="{ $implicit: item, index }" />
    } @else {
      <text class="title">{{ item.label }}</text><text class="muted">{{ item.description }}</text>
    }
  </ng-template>
  <view class="stack"
    ><view class="data-toolbar"
      ><neu-icon-button
        [label]="sortLabel()"
        [svg]="sortIcon"
        tone="neutral"
        variant="text"
        (pressed)="descending.update(invert)" /><neu-icon-button
        [label]="refreshLabel()"
        [svg]="refreshIcon"
        tone="neutral"
        variant="text"
        [disabled]="loading()"
        (pressed)="refresh.emit()"
    /></view>
    <text-input
      neuSyncText
      #textSync="neuSyncText"
      (changeText)="textSync.synchronize()"
      class="control"
      [neuralValue]="query()"
      (neuralValueChange)="query.set($event)"
      [accessibilityLabel]="searchLabel()"
      [placeholder]="searchLabel()"
      [placeholderTextColor]="mutedColor()"
    />
    @if (loading()) {
      <neu-skeleton />
    } @else if (error()) {
      <neu-alert [message]="error()" />
    } @else if (!displayed().length) {
      <neu-empty-state [title]="emptyLabel()" />
    } @else if (viewportHeight(); as height) {
      <virtual-list #list [items]="displayed()" [keyExtractor]="itemKey"
        [style.height]="height" [rowGap]="12" keyboardShouldPersistTaps="handled">
        @for (row of list.window(); track row.slot) {
          <view [virtualListRow]="row" [accessibilityElementsHidden]="!!row.parked"
            [importantForAccessibility]="row.parked ? 'no-hide-descendants' : 'auto'">
            @for (item of [row.item]; track item.id) {
              <pressable class="data-item" [class.surface]="!resolvedItemTemplate()" [class.outline]="!resolvedItemTemplate()"
                accessibilityRole="button" [accessibilityLabel]="item.label" [accessible]="!row.parked"
                [disabled]="!!row.parked || !!item.disabled" (press)="!row.parked && choose(item)">
                <ng-container [ngTemplateOutlet]="rowContents" [ngTemplateOutletContext]="{ $implicit: item, index: row.index }" />
              </pressable>
            }
          </view>
        }
      </virtual-list>
    } @else {
      @for (item of displayed(); track item.id) {
        <pressable class="data-item" [neuDataRowIndex]="$index" #rowMotion="neuDataRowMotion"
          [animatedStyle]="rowMotion.animated" [class.surface]="!resolvedItemTemplate()" [class.outline]="!resolvedItemTemplate()"
          accessibilityRole="button" [accessibilityLabel]="item.label" [disabled]="!!item.disabled" (press)="choose(item)">
          <ng-container [ngTemplateOutlet]="rowContents" [ngTemplateOutletContext]="{ $implicit: item, index: $index }" />
        </pressable>
      }
    }
  </view>`,
  styleUrl: '../foundation/mobile.css',
  styles: '.data-item { min-width: 0; } .data-toolbar { flex-direction: row; justify-content: flex-end; gap: 4px; }',
})
export class NeuDataViewComponent {
  readonly items = input<readonly NeuOption[]>([]);
  /** Explicit template takes precedence over a projected neuDataViewItem. */
  readonly itemTemplate = input<TemplateRef<NeuDataViewItemContext>>();
  /** A positive viewport height enables internally scrolling, measured rows. */
  readonly virtualHeight = input<number>();
  private readonly itemContent = contentChild(NeuDataViewItemDirective);
  protected readonly resolvedItemTemplate = computed(() => this.itemTemplate() ?? this.itemContent()?.templateRef);
  protected readonly viewportHeight = computed(() => {
    const height = this.virtualHeight();
    return height !== undefined && Number.isFinite(height) && height > 0 ? height : undefined;
  });
  protected readonly itemKey = (item: NeuOption) => item.id;
  readonly query = model('');
  readonly descending = model(false);
  readonly loading = input(false, { transform: booleanAttribute });
  readonly error = input('');
  readonly searchLabel = input('Search items');
  readonly sortLabel = input('Reverse order');
  readonly refreshLabel = input('Refresh');
  readonly emptyLabel = input('No items');
  readonly selected = output<string>();
  readonly refresh = output<void>();
  protected readonly sortIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="m7 4-3 3m3-3 3 3M7 4v16m10 0-3-3m3 3 3-3M17 4v16"/></svg>';
  protected readonly refreshIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 0 1 15.4-6.4L21 8M21 3v5h-5M21 12a9 9 0 0 1-15.4 6.4L3 16M3 21v-5h5"/></svg>';
  private readonly theme = inject(NEU_THEME, { optional: true });
  protected readonly mutedColor = computed(
    () => (this.theme?.() ?? NEU_LIGHT_TOKENS).muted,
  );
  protected readonly invert = (x: boolean) => !x;
  private readonly searchable = computed(() =>
    uniqueOptions(this.items()).map((item) => ({
      item,
      text: (item.label + ' ' + (item.description ?? '')).toLocaleLowerCase(),
    })),
  );
  private readonly sorted = computed(() => {
    const direction = this.descending() ? -1 : 1;
    return [...this.searchable()].sort(
      (a, b) => a.item.label.localeCompare(b.item.label) * direction,
    );
  });
  protected readonly displayed = computed(() => {
    const q = this.query().trim().toLocaleLowerCase();
    return this.sorted().filter((row) => row.text.includes(q)).map((row) => row.item);
  });
  protected choose(item: NeuOption): void {
    if (!item.disabled && !this.loading()) this.selected.emit(item.id);
  }
}
