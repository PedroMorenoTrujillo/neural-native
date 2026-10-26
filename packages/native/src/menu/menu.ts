import {
  booleanAttribute,
  Component,
  input,
  model,
  output,
  ElementRef,
  viewChild,
} from '@angular/core';
import { View, Text } from '@ng-native/components';
import { NeuNativePressable as Pressable } from '../foundation/native-pressable.js';
import { NgIcon } from '@ng-native/icons';
import type { HostNode } from '@ng-native/fabric';
import { NeuOption } from '../foundation/mobile.js';
import { NeuAnchoredOverlayComponent } from '../foundation/anchored-overlay.js';
import { NEU_CHEVRON_DOWN } from '../foundation/icons.js';

@Component({
  selector: 'neu-menu',
  imports: [
    View,
    Text,
    Pressable,
    NeuAnchoredOverlayComponent,
    NgIcon,
  ],
  template: `<view class="stack" #container [collapsable]="false">
    @if (showTrigger()) {
      <pressable
        class="menu-trigger" #trigger="pressable"
        accessibilityRole="button"
        [accessibilityLabel]="label()"
        [disabled]="disabled()"
        [accessibilityState]="{ expanded: open(), disabled: disabled() }"
        (press)="show()"
        ><text class="label">{{ label() }}</text><ng-icon [svg]="chevron" [size]="18" color="var(--neu-accent)" /></pressable
      >
    }
    <neu-anchored-overlay [(open)]="open" [anchor]="anchorRef()?.nativeElement ?? containerRef()?.nativeElement" [minimumWidth]="240" [closeLabel]="closeLabel()">
      <view accessibilityRole="menu" [accessibilityLabel]="label()">
        @for (item of items(); track item.id) {
          <pressable class="menu-item" accessibilityRole="menuitem" [accessibilityLabel]="item.label"
            [accessibilityState]="{ disabled: disabled() || !!item.disabled }" [disabled]="disabled() || !!item.disabled"
            [class.neu-unavailable]="disabled() || item.disabled" (press)="activate(item.id)">
            <text class="label">{{ item.label }}</text>
            @if (item.description) { <text class="muted">{{ item.description }}</text> }
          </pressable>
        }
      </view>
    </neu-anchored-overlay>
  </view>`,
  styleUrls: ['../foundation/mobile.css', './menu.css'],
})
export class NeuMenuComponent {
  readonly label = input.required<string>();
  readonly showTrigger = input(true, { transform: booleanAttribute });
  readonly closeLabel = input('Dismiss menu');
  readonly items = input<readonly NeuOption[]>([]);
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly open = model(false);
  readonly activated = output<string>();
  protected readonly chevron = NEU_CHEVRON_DOWN;
  protected readonly anchorRef = viewChild('trigger', { read: ElementRef<HostNode> });
  protected readonly containerRef = viewChild('container', { read: ElementRef<HostNode> });
  protected show(): void {
    if (!this.disabled()) this.open.set(true);
  }
  protected activate(id: string): void {
    if (
      this.open() && !this.disabled() &&
      this.items().some((x) => x.id === id && !x.disabled)
    ) {
      this.open.set(false);
      this.activated.emit(id);
    }
  }
}
