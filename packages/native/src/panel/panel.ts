import {
  booleanAttribute,
  Component,
  contentChild,
  input,
  model,
} from '@angular/core';
import { View, Text } from '@ng-native/components';
import { NeuNativePressable as Pressable } from '../foundation/native-pressable.js';
import { NeuCollapseComponent } from '../foundation/collapse.js';
import { NeuPanelHeaderDirective } from './panel-slots.js';

@Component({
  selector: 'neu-panel',
  imports: [View, Text, Pressable, NeuCollapseComponent],
  template: `<view class="surface outline panel"
    ><pressable
      class="row"
      [accessibilityRole]="collapsible() ? 'button' : 'header'"
      [accessibilityLabel]="title()"
      [accessibilityState]="{ expanded: !collapsed() }"
      [disabled]="!collapsible()"
      (press)="toggle()"
      ><view class="grow panel-heading">
        @if (header()) { <ng-content select="[neuPanelHeader]" /> }
        @else { <text class="title">{{ title() }}</text> }
      </view>
      @if (collapsible()) {
        <text class="label">{{ collapsed() ? '+' : '−' }}</text>
      }
    </pressable>
    <neu-collapse [open]="!collapsed()"><view class="panel-body"><ng-content /><ng-content select="[neuPanelFooter]" /></view></neu-collapse>
  </view>`,
  styleUrls: ['../foundation/mobile.css', './panel.css'],
})
export class NeuPanelComponent {
  protected readonly header = contentChild(NeuPanelHeaderDirective);
  readonly title = input.required<string>();
  readonly collapsed = model(false);
  readonly collapsible = input(true, { transform: booleanAttribute });
  protected toggle(): void {
    if (this.collapsible()) this.collapsed.update((x) => !x);
  }
}
