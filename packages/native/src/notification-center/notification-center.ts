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
import { NeuOption } from '../foundation/mobile.js';
import { NeuButtonComponent } from '../button/button.js';
import { NgIcon } from '@ng-native/icons';
import { NEU_CHEVRON_RIGHT } from '../foundation/icons.js';

@Component({
  selector: 'neu-notification-center',
  imports: [View, Text, Pressable, NeuButtonComponent, NgIcon],
  template: `<view class="stack"
    ><view class="row"
      ><text class="title grow">{{ label() }}</text>
      <view class="unread-count"><text class="count-text">{{ unread() }} {{ unreadLabel() }}</text></view>
    </view><view class="row"><neu-button
        [label]="markAllLabel()"
        variant="text"
        [disabled]="disabled() || !unread()"
        (pressed)="markAll()"
    /></view>
    @for (item of items(); track item.id) {
      <pressable
        class="notification"
        [class.unread]="!readIds().includes(item.id)"
        [class.disabled]="disabled() || !!item.disabled"
        accessibilityRole="button"
        [accessibilityLabel]="
          item.label +
          (readIds().includes(item.id) ? '' : ' · ' + unreadLabel())
        "
        [disabled]="disabled() || !!item.disabled"
        (press)="activate(item)"
        ><view class="read-dot" [class.new-dot]="!readIds().includes(item.id)" />
        <view class="notification-copy"><text class="notification-title">{{ item.label }}</text>
          @if (item.description) { <text class="muted">{{ item.description }}</text> }
        </view><ng-icon [svg]="chevron" [size]="18" color="var(--neu-muted)" /></pressable
      >
    } @empty {
      <text class="muted">{{ emptyLabel() }}</text>
    }
  </view>`,
  styleUrls: ['../foundation/mobile.css', './notification-center.css'],
})
export class NeuNotificationCenterComponent {
  protected readonly chevron = NEU_CHEVRON_RIGHT;
  readonly label = input('Notifications');
  readonly items = input<readonly NeuOption[]>([]);
  readonly readIds = model<readonly string[]>([]);
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly markAllLabel = input('Mark all read');
  readonly unreadLabel = input('Unread');
  readonly emptyLabel = input('No notifications');
  readonly activated = output<string>();
  protected readonly unread = computed(
    () => this.items().filter((x) => !this.readIds().includes(x.id)).length,
  );
  protected activate(item: NeuOption): void {
    if (this.disabled() || item.disabled) return;
    if (!this.readIds().includes(item.id))
      this.readIds.update((ids) => [...ids, item.id]);
    this.activated.emit(item.id);
  }
  protected markAll(): void {
    if (!this.disabled()) this.readIds.set(this.items().map((x) => x.id));
  }
}
