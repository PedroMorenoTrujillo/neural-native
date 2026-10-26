import {
  booleanAttribute,
  Component,
  computed,
  input,
  model,
  output,
  signal,
} from '@angular/core';
import { Modal, View, Text, ScrollView, SafeAreaProvider, SafeAreaView, type LayoutEvent } from '@ng-native/components';
import { NeuNativePressable as Pressable } from '../foundation/native-pressable.js';
import { AnimatedStyle } from '@ng-native/components/animations';
import { NeuOption } from '../foundation/mobile.js';
import { neuPresence } from '../foundation/motion.js';

@Component({
  selector: 'neu-sidebar',
  imports: [Modal, View, Text, Pressable, ScrollView, SafeAreaProvider, SafeAreaView, AnimatedStyle],
  template: `<modal [supportedOrientations]="['portrait', 'landscape']" [visible]="motion.visible()" [transparent]="true" animationType="none"
    presentationStyle="overFullScreen" [statusBarTranslucent]="true"
    (requestClose)="close()" (show)="opened.emit()" (dismiss)="dismissed.emit()">
    <safe-area-provider class="full" [reportInsets]="false">
      <view class="full drawer-root" [pointerEvents]="open() ? 'auto' : 'none'"
        [accessibilityElementsHidden]="!open()" [importantForAccessibility]="open() ? 'auto' : 'no-hide-descendants'">
        <pressable class="drawer-backdrop" [animatedStyle]="backdropStyle" [accessible]="false"
          [focusable]="false" (press)="close()" />
        <view class="drawer-panel" [class.drawer-full]="fullWidth()" (layout)="measure($event)"
          [animatedStyle]="drawerStyle()" [accessibilityViewIsModal]="open()"
          [pointerEvents]="open() ? 'auto' : 'none'" [accessibilityElementsHidden]="!open()"
          [importantForAccessibility]="open() ? 'auto' : 'no-hide-descendants'">
          <safe-area-view class="full">
            <view class="drawer-header row">
              <text class="title grow" accessibilityRole="header">{{ title() }}</text>
              <pressable class="drawer-close" accessibilityRole="button" [accessibilityLabel]="closeLabel()" (press)="close()">
                <text class="title">×</text>
              </pressable>
            </view>
            <scroll-view class="grow" keyboardShouldPersistTaps="handled">
              <view class="drawer-items" [accessibilityLabel]="title()">
                @for (item of items(); track item.id) {
                  <pressable class="drawer-item" [class.drawer-selected]="value() === item.id"
                    accessibilityRole="radio" [accessibilityLabel]="item.label"
                    [accessibilityState]="{ checked: value() === item.id, disabled: !open() || disabled() || !!item.disabled }"
                    [disabled]="!open() || disabled() || !!item.disabled" [class.neu-unavailable]="disabled() || item.disabled" (press)="choose(item.id)">
                    <text class="label" [class.drawer-selected-label]="value() === item.id">{{ item.label }}</text>
                    @if (item.description) { <text class="muted">{{ item.description }}</text> }
                  </pressable>
                }
              </view>
            </scroll-view>
            <view class="drawer-footer"><ng-content /></view>
          </safe-area-view>
        </view>
      </view>
    </safe-area-provider>
  </modal>`,
  styleUrls: ['../foundation/mobile.css', './sidebar.css'],
})
export class NeuSidebarComponent {
  readonly open = model(false);
  readonly title = input.required<string>();
  readonly items = input<readonly NeuOption[]>([]);
  readonly value = model('');
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly fullWidth = input(false, { transform: booleanAttribute });
  readonly closeLabel = input('Close navigation');
  readonly navigate = output<string>();
  readonly opened = output<void>();
  readonly dismissed = output<void>();
  protected readonly motion = neuPresence(this.open);
  private readonly panelWidth = signal(0);
  protected readonly drawerStyle = computed(() => ({
    opacity: this.panelWidth() > 0 ? 1 : 0,
    transform: [{ translateX: this.motion.progress.interpolate({ inputRange: [0, 1], outputRange: [-this.panelWidth(), 0] }) }],
  }));
  protected readonly backdropStyle = { opacity: this.motion.progress.interpolate({ inputRange: [0, 1], outputRange: [0, 0.36] }) };
  protected measure(event: LayoutEvent): void {
    const width = event.nativeEvent.layout.width;
    if (Number.isFinite(width) && width > 0) this.panelWidth.set(width);
  }
  protected close(): void { this.open.set(false); }
  protected choose(id: string): void {
    if (
      !this.open() || this.disabled() ||
      !this.items().some((x) => x.id === id && !x.disabled)
    )
      return;
    this.value.set(id);
    this.open.set(false);
    this.navigate.emit(id);
  }
}
