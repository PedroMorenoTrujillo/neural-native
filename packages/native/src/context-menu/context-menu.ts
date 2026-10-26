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
import type { HostNode } from '@ng-native/fabric';
import { NeuOption } from '../foundation/mobile.js';
import { NeuAnchoredOverlayComponent } from '../foundation/anchored-overlay.js';
import { NeuIconButtonComponent } from '../icon-button/icon-button.js';
import { NEU_MORE } from '../foundation/icons.js';

@Component({
  selector: 'neu-context-menu',
  imports: [View, Text, Pressable, NeuAnchoredOverlayComponent, NeuIconButtonComponent],
  template: `<view class="surface outline row"
    ><pressable
      class="context-target grow" #triggerElement="pressable"
      accessibilityRole="button"
      [accessibilityLabel]="label()"
      [accessibilityHint]="hint()"
      [disabled]="disabled()"
      (longPress)="show()"
      (press)="activate()"
      ><ng-content /><text class="title">{{ label() }}</text>
      <text class="muted">{{ hint() }}</text></pressable
    ><neu-icon-button
      [label]="actionsLabel()"
      [svg]="moreIcon"
      variant="text"
      [disabled]="disabled()"
      (pressed)="show()" />
    </view>
    <neu-anchored-overlay [(open)]="open" [anchor]="anchorRef()?.nativeElement" [minimumWidth]="240" [closeLabel]="closeLabel()">
      <view accessibilityRole="menu" [accessibilityLabel]="actionsLabel()">
        @for (item of items(); track item.id) {
          <pressable class="context-option" accessibilityRole="menuitem" [accessibilityLabel]="item.label"
            [accessibilityState]="{ disabled: disabled() || !!item.disabled }"
            [disabled]="disabled() || !!item.disabled" [class.neu-unavailable]="disabled() || item.disabled" (press)="choose(item.id)">
            <text class="label">{{ item.label }}</text>
            @if (item.description) { <text class="muted">{{ item.description }}</text> }
          </pressable>
        }
      </view>
    </neu-anchored-overlay>`,
  styleUrls: ['../foundation/mobile.css', './context-menu.css'],
})
export class NeuContextMenuComponent {
  readonly label = input.required<string>();
  readonly items = input<readonly NeuOption[]>([]);
  readonly hint = input('Long press for actions');
  readonly actionsLabel = input('Actions');
  readonly closeLabel = input('Dismiss actions');
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly open = model(false);
  readonly activated = output<string>();
  readonly pressed = output<void>();
  protected readonly moreIcon = NEU_MORE;
  protected readonly anchorRef = viewChild('triggerElement', { read: ElementRef<HostNode> });
  protected activate(): void {
    if (!this.disabled()) this.pressed.emit();
  }
  protected show(): void {
    if (!this.disabled()) this.open.set(true);
  }
  protected choose(id: string): void {
    if (this.disabled() || !this.items().some(item => item.id === id && !item.disabled)) return;
    this.open.set(false);
    this.activated.emit(id);
  }
}
