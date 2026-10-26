import {
  booleanAttribute,
  Component,
  input,
  model,
  output,
  computed,
} from '@angular/core';
import { View, Text } from '@ng-native/components';
import { NeuNativePressable as Pressable } from '../foundation/native-pressable.js';
import { NgIcon } from '@ng-native/icons';
import { NeuOption, uniqueOptions } from '../foundation/mobile.js';
import { NeuIconButtonComponent } from '../icon-button/icon-button.js';
import { NEU_ARROW_UP, NEU_ARROW_DOWN, NEU_CLOSE, NEU_PLUS } from '../foundation/icons.js';

@Component({
  selector: 'neu-pick-list',
  imports: [View, Text, Pressable, NgIcon, NeuIconButtonComponent],
  template: `<view class="pick-list">
    <text class="title">{{ label() }}</text>
    <view class="section">
      <view class="row section-heading">
        <text class="label grow">{{ selectedLabel() }}</text>
        <view class="count"><text class="count-text">{{ picked().length }}</text></view>
      </view>
      <view class="items">
    @for (item of picked(); track item.id; let i = $index) {
      <view class="picked-item" [class.separated]="i > 0">
        <view class="row item-heading">
          <view class="position"><text class="position-text">{{ i + 1 }}</text></view>
          <view class="item-copy grow">
            <text class="label item-label">{{ item.label }}</text>
            @if (item.description) { <text class="muted">{{ item.description }}</text> }
          </view>
        </view>
        <view class="row item-actions">
        <neu-icon-button
          [svg]="upIcon"
          [label]="upLabel() + ' ' + item.label"
          variant="text"
          tone="neutral"
          [disabled]="unavailable() || i === 0"
          (pressed)="move(i, -1)" /><neu-icon-button
          [svg]="downIcon"
          [label]="downLabel() + ' ' + item.label"
          variant="text"
          tone="neutral"
          [disabled]="unavailable() || i === picked().length - 1"
          (pressed)="move(i, 1)" /><neu-icon-button
          [svg]="removeIcon"
          [label]="removeLabel() + ' ' + item.label"
          variant="text"
          tone="neutral"
          [disabled]="unavailable() || !!item.disabled"
          (pressed)="remove(item.id)"
        /></view>
      </view>
    } @empty {
      <text class="muted empty">{{ emptySelectedLabel() }}</text>
    }
      </view>
    </view>
    <view class="section">
      <view class="row section-heading">
        <text class="label grow">{{ availableLabel() }}</text>
        <view class="count"><text class="count-text">{{ available().length }}</text></view>
      </view>
      <view class="items">
    @for (item of available(); track item.id; let i = $index) {
      <pressable class="row available-item" accessibilityRole="button"
        [class.separated]="i > 0"
        [accessibilityLabel]="addLabel() + ' ' + item.label"
        [accessibilityState]="{ disabled: unavailable() || !!item.disabled }"
        [disabled]="unavailable() || !!item.disabled"
        [class.neu-unavailable]="unavailable() || item.disabled" (press)="add(item.id)">
        <view class="grow item-copy"><text class="label item-label">{{ item.label }}</text>
          @if (item.description) { <text class="muted">{{ item.description }}</text> }
        </view>
        <view class="add-indicator"><ng-icon [svg]="addIcon" [size]="20" color="var(--neu-accent, #3155d9)" /></view>
      </pressable>
    } @empty {
      <text class="muted empty">{{ emptyAvailableLabel() }}</text>
    }
      </view>
    </view>
  </view>`,
  styleUrls: ['../foundation/mobile.css', './pick-list.css'],
})
export class NeuPickListComponent {
  readonly label = input.required<string>();
  readonly options = input<readonly NeuOption[]>([]);
  readonly value = model<readonly string[]>([]);
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly readonly = input(false, { transform: booleanAttribute });
  readonly selectedLabel = input('Selected');
  readonly availableLabel = input('Available');
  readonly upLabel = input('Move up');
  readonly downLabel = input('Move down');
  readonly removeLabel = input('Remove');
  readonly addLabel = input('Add');
  readonly emptySelectedLabel = input('No items selected');
  readonly emptyAvailableLabel = input('All items selected');
  readonly touch = output<void>();
  protected readonly upIcon = NEU_ARROW_UP;
  protected readonly downIcon = NEU_ARROW_DOWN;
  protected readonly removeIcon = NEU_CLOSE;
  protected readonly addIcon = NEU_PLUS;
  protected readonly unavailable = computed(
    () => this.disabled() || this.readonly(),
  );
  private readonly optionIndex = computed(() =>
    new Map(uniqueOptions(this.options()).map((option) => [option.id, option])),
  );
  private readonly selectedIds = computed(() => new Set(this.value()));
  protected readonly picked = computed(() =>
    [...this.selectedIds()]
      .map((id) => this.optionIndex().get(id))
      .filter((x): x is NeuOption => !!x),
  );
  protected readonly available = computed(() =>
    [...this.optionIndex().values()].filter((x) => !this.selectedIds().has(x.id)),
  );
  protected add(id: string): void {
    if (
      this.unavailable() ||
      !this.available().some((x) => x.id === id && !x.disabled)
    )
      return;
    this.value.update((ids) => [...ids, id]);
    this.touch.emit();
  }
  protected remove(id: string): void {
    if (this.unavailable() || this.optionIndex().get(id)?.disabled)
      return;
    this.value.update((ids) => ids.filter((x) => x !== id));
    this.touch.emit();
  }
  protected move(index: number, delta: number): void {
    if (this.unavailable()) return;
    const ids = this.picked().map((x) => x.id),
      next = index + delta;
    if (next < 0 || next >= ids.length) return;
    [ids[index], ids[next]] = [ids[next]!, ids[index]!];
    this.value.set(ids);
    this.touch.emit();
  }
}
