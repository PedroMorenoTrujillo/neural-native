import {
  booleanAttribute,
  Component,
  contentChild,
  input,
  output,
  viewChild,
} from '@angular/core';
import {
  View,
  Text,
  VirtualList,
  VirtualListRow,
} from '@ng-native/components';
import { NeuNativePressable as Pressable } from '../foundation/native-pressable.js';
import { NeuOption } from '../foundation/mobile.js';
import { NgTemplateOutlet } from '@angular/common';
import { NeuVirtualListItemDirective } from './virtual-list-templates.js';

@Component({
  selector: 'neu-virtual-list',
  imports: [View, Text, Pressable, VirtualList, VirtualListRow, NgTemplateOutlet],
  template: `<view class="stack"
    ><virtual-list
      #list
      [items]="items()"
      [estimatedItemHeight]="estimatedItemHeight()"
      [keyExtractor]="keyOf"
      [style.height]="height()"
      keyboardShouldPersistTaps="handled"
      (endReached)="endReached.emit()"
    >
      @for (row of list.window(); track row.slot) {
        <view class="virtual-row" [virtualListRow]="row"
          [accessibilityElementsHidden]="!!row.parked"
          [importantForAccessibility]="row.parked ? 'no-hide-descendants' : 'auto'"
          >@for (item of [row.item]; track item.id) {<pressable
            class="surface outline"
            accessibilityRole="button"
            [accessibilityLabel]="item.label"
            [accessible]="!row.parked"
            [disabled]="!!row.parked || disabled() || !!item.disabled"
            (press)="choose(item)"
            >@if (itemContent(); as customItem) {
              <ng-container [ngTemplateOutlet]="customItem.templateRef" [ngTemplateOutletContext]="{ $implicit: item, index: row.index, disabled: disabled() || !!item.disabled }" />
            } @else {
              <text class="title">{{ item.label }}</text><text class="muted">{{ item.description }}</text>
            }</pressable
          >}</view
        >
      }
      <ng-content select="[listHeader]" ngProjectAs="[listHeader]" /><ng-content select="[listFooter]" ngProjectAs="[listFooter]"
    /></virtual-list>
    @if (!items().length) {
      <text class="muted">{{ emptyLabel() }}</text>
    }
  </view>`,
  styleUrls: ['../foundation/mobile.css', './virtual-list.css'],
})
export class NeuVirtualListComponent {
  protected readonly itemContent = contentChild(NeuVirtualListItemDirective);
  readonly items = input<readonly NeuOption[]>([]);
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly estimatedItemHeight = input(84);
  readonly height = input(400);
  readonly emptyLabel = input('No items');
  readonly selected = output<string>();
  readonly endReached = output<void>();
  private readonly list = viewChild(VirtualList<NeuOption>);
  protected readonly keyOf = (item: NeuOption) => item.id;
  scrollToIndex(index: number): void {
    if (index >= 0 && index < this.items().length)
      this.list()?.scrollToIndex({ index, animated: true });
  }
  scrollToTop(): void {
    this.list()?.scrollToOffset({ offset: 0, animated: true });
  }
  protected choose(item: NeuOption): void {
    if (!this.disabled() && !item.disabled) this.selected.emit(item.id);
  }
}
