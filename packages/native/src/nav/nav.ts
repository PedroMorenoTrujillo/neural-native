import {
  booleanAttribute,
  Component,
  input,
  model,
  output,
} from '@angular/core';
import { View, Text } from '@ng-native/components';
import { NeuNativePressable as Pressable } from '../foundation/native-pressable.js';
import { NgIcon } from '@ng-native/icons';
import { NeuOption } from '../foundation/mobile.js';

export interface NeuNavItem extends NeuOption {
  readonly svg?: string;
}

@Component({
  selector: 'neu-nav',
  imports: [View, Text, Pressable, NgIcon],
  template: `<view
    class="navigation-bar"
    accessibilityRole="tablist"
    [accessibilityLabel]="label()"
  >
    @for (item of items(); track item.id) {
      <pressable
        class="navigation-item"
        accessibilityRole="tab"
        [accessibilityLabel]="item.label"
        [accessibilityState]="{
          selected: value() === item.id,
          disabled: disabled() || item.disabled,
        }"
        [disabled]="disabled() || !!item.disabled"
        [class.neu-unavailable]="disabled() || item.disabled"
        (press)="choose(item)"
        >
        @if (item.svg) {
          <view class="navigation-icon">
            <ng-icon [svg]="item.svg" [size]="22" [color]="value() === item.id ? 'var(--neu-accent, #3155d9)' : 'var(--neu-muted, #596477)'" />
          </view>
        }
        <text [class]="!item.svg && value() === item.id ? 'navigation-active-label' : 'navigation-label'">{{
          item.label
        }}</text></pressable
      >
    }
  </view>`,
  styleUrl: './nav.css',
})
export class NeuNavComponent {
  readonly label = input('Navigation');
  readonly items = input<readonly NeuNavItem[]>([]);
  readonly value = model('');
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly navigate = output<string>();
  protected choose(item: NeuNavItem): void {
    if (this.disabled() || item.disabled) return;
    this.value.set(item.id);
    this.navigate.emit(item.id);
  }
}
