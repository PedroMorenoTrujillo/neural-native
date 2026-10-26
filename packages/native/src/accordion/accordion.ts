import {
  booleanAttribute,
  Component,
  input,
  model,
} from '@angular/core';
import { View, Text } from '@ng-native/components';
import { NeuNativePressable as Pressable } from '../foundation/native-pressable.js';
import { NeuOption } from '../foundation/mobile.js';
import { NeuCollapseComponent } from '../foundation/collapse.js';
import { NeuAccordionIndicatorComponent } from '../foundation/accordion-indicator.js';

@Component({
  selector: 'neu-accordion',
  imports: [View, Text, Pressable, NeuCollapseComponent, NeuAccordionIndicatorComponent],
  template: `<view class="accordion">
    @for (item of items(); track item.id; let first = $first) {
      @if (!first) { <view class="accordion-divider" /> }
      <view class="accordion-item" [style.opacity]="disabled() || item.disabled ? 0.45 : 1"
        ><pressable
          class="accordion-header"
          accessibilityRole="button"
          [accessibilityLabel]="item.label"
          [accessibilityState]="{
            expanded: expanded().includes(item.id),
            disabled: disabled() || item.disabled,
          }"
          [disabled]="disabled() || !!item.disabled"
          (press)="toggle(item)"
          ><text class="accordion-title">{{ item.label }}</text
          ><neu-accordion-indicator [open]="expanded().includes(item.id)" /></pressable
        >
        <neu-collapse [open]="expanded().includes(item.id)">
          <view class="accordion-body"><text class="accordion-description">{{ item.description }}</text></view>
        </neu-collapse>
      </view>
    }
  </view>`,
  styleUrl: './accordion.css',
})
export class NeuAccordionComponent {
  readonly items = input<readonly NeuOption[]>([]);
  readonly expanded = model<readonly string[]>([]);
  readonly multiple = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  protected toggle(item: NeuOption): void {
    if (this.disabled() || item.disabled) return;
    const ids = this.expanded();
    this.expanded.set(
      ids.includes(item.id)
        ? ids.filter((x) => x !== item.id)
        : this.multiple()
          ? [...ids, item.id]
          : [item.id],
    );
  }
}
