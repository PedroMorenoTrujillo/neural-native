import {
  booleanAttribute,
  Component,
  contentChild,
  TemplateRef,
  input,
  model,
  output,
  computed,
} from '@angular/core';
import { View, Text } from '@ng-native/components';
import { NeuNativePressable as Pressable } from '../foundation/native-pressable.js';
import { NgTemplateOutlet } from '@angular/common';
import { NeuListboxItemDirective, type NeuListboxItemContext } from './listbox-templates.js';
import { NeuOption, uniqueOptions } from '../foundation/mobile.js';

@Component({
  selector: 'neu-listbox',
  imports: [View, Text, Pressable, NgTemplateOutlet],
  template: `<view
    class="stack"
    [class.plain]="appearance() === 'plain'"
    [accessibilityRole]="multiple() ? undefined : 'radiogroup'"
    [accessibilityLabel]="label()"
  >
    @for (item of choices(); track item.id) {
      <pressable
        class="row action"
        [class.selected]="value().includes(item.id)"
        [accessibilityRole]="multiple() ? 'checkbox' : 'radio'"
        [accessibilityLabel]="item.label"
        [accessibilityState]="{
          checked: value().includes(item.id),
          disabled: disabled() || readonly() || item.disabled,
        }"
        [disabled]="disabled() || readonly() || !!item.disabled"
        [class.neu-unavailable]="disabled() || readonly() || item.disabled"
        (press)="choose(item)"
        ><view class="grow stack option-content"
          >@if (resolvedItemTemplate(); as customItem) {
            <ng-container [ngTemplateOutlet]="customItem" [ngTemplateOutletContext]="{ $implicit: item, index: $index, selected: value().includes(item.id), disabled: disabled() || readonly() || !!item.disabled }" />
          } @else {
          <text
            [class]="value().includes(item.id) ? 'option-title selected-text' : 'option-title label'"
            >{{ item.label }}</text
          >
          @if (item.description) {
            <text
              [class]="value().includes(item.id) ? 'option-description selected-text' : 'option-description muted'"
              >{{ item.description }}</text
            >
          }
          }</view
        ><text
          [class]="value().includes(item.id) ? 'selected-text' : 'label'"
          >{{ value().includes(item.id) ? '✓' : '' }}</text
        ></pressable
      >
    } @empty {
      <text class="muted">{{ emptyLabel() }}</text>
    }
  </view>`,
  styleUrls: ['../foundation/mobile.css', './listbox.css'],
})
export class NeuListboxComponent {
  readonly label = input.required<string>();
  readonly options = input<readonly NeuOption[]>([]);
  readonly appearance = input<'cards' | 'plain'>('cards');
  /** Explicit template takes precedence over a projected neuListboxItem. */
  readonly itemTemplate = input<TemplateRef<NeuListboxItemContext>>();
  private readonly itemContent = contentChild(NeuListboxItemDirective);
  protected readonly resolvedItemTemplate = computed(() => this.itemTemplate() ?? this.itemContent()?.templateRef);
  readonly value = model<readonly string[]>([]);
  readonly multiple = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly readonly = input(false, { transform: booleanAttribute });
  readonly emptyLabel = input('No options');
  readonly selected = output<string>();
  readonly touch = output<void>();
  protected readonly choices = computed(() => uniqueOptions(this.options()));
  protected choose(item: NeuOption): void {
    if (this.disabled() || this.readonly() || item.disabled) return;
    const ids = this.value();
    this.value.set(
      this.multiple()
        ? ids.includes(item.id)
          ? ids.filter((x) => x !== item.id)
          : [...ids, item.id]
        : [item.id],
    );
    this.selected.emit(item.id);
    this.touch.emit();
  }
}
