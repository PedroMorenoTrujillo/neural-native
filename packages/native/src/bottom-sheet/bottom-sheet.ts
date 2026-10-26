import {
  booleanAttribute,
  Component,
  computed,
  input,
  model,
  output,
} from '@angular/core';
import {
  View,
  Text,
  ScrollView,
  Modal,
  SafeAreaProvider,
  SafeAreaView,
  KeyboardAvoidingView,
  type TouchEvent,
} from '@ng-native/components';
import { NeuNativePressable as Pressable } from '../foundation/native-pressable.js';
import { AnimatedStyle } from '@ng-native/components/animations';
import { neuPresence } from '../foundation/motion.js';

export type NeuBottomSheetHeight = 'auto' | 'sm' | 'md' | 'lg' | 'full';

@Component({
  selector: 'neu-bottom-sheet',
  imports: [
    Modal,
    SafeAreaProvider,
    SafeAreaView,
    KeyboardAvoidingView,
    View,
    Text,
    Pressable,
    ScrollView,
    AnimatedStyle,
  ],
  template: `
    <modal [supportedOrientations]="['portrait', 'landscape']"
      [visible]="motion.visible()"
      [transparent]="true"
      presentationStyle="overFullScreen"
      animationType="none"
      (requestClose)="close()"
      (show)="opened.emit()"
      (dismiss)="dismissed.emit()"
      ><safe-area-provider class="full" [reportInsets]="false"
        ><keyboard-avoiding-view class="full sheet-backdrop" behavior="padding"
          [animatedStyle]="backdropStyle" [pointerEvents]="open() ? 'auto' : 'none'"
          [accessibilityElementsHidden]="!open()"
          [importantForAccessibility]="open() ? 'auto' : 'no-hide-descendants'">
          <pressable class="sheet-dismiss" [accessible]="false" [focusable]="false"
            [disabled]="!dismissible()" (press)="close()" />
          <safe-area-view class="sheet-panel" [edges]="['bottom']"
            [animatedStyle]="panelStyle"
            [style.height]="panelHeight()"
            [style.maxHeight]="panelHeight() ? '100%' : '85%'"
            ><view
              class="sheet-content"
              [class.sheet-fixed-content]="!!panelHeight()"
              [accessibilityViewIsModal]="open()"
              ><view class="sheet-handle" />
              <view
                class="row"
                (touchStart)="start($event)"
                (touchEnd)="end($event)"
                ><text class="title grow" accessibilityRole="header">{{
                  title()
                }}</text>
                @if (dismissible()) {
                  <pressable
                    class="action"
                    accessibilityRole="button"
                    [accessibilityLabel]="closeLabel()"
                    (press)="close()"
                    ><text class="label">×</text></pressable
                  >
                }</view
              ><scroll-view class="sheet-scroll" [class.sheet-fixed-scroll]="!!panelHeight()" keyboardShouldPersistTaps="handled"
                ><view class="stack scroll-content"
                  ><ng-content /></view></scroll-view></view></safe-area-view></keyboard-avoiding-view></safe-area-provider
    ></modal>`,
  styleUrls: ['../foundation/mobile.css', './bottom-sheet.css'],
})
export class NeuBottomSheetComponent {
  readonly open = model(false);
  // A hidden Modal has no native view tag until presentation. JS frames also
  // update the newly mounted backdrop instead of leaving its opacity at zero.
  protected readonly motion = neuPresence(this.open, false);
  protected readonly backdropStyle = { opacity: this.motion.progress };
  protected readonly panelStyle = {
    transform: [{ translateY: this.motion.progress.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }],
  };
  readonly title = input.required<string>();
  readonly dismissible = input(true, { transform: booleanAttribute });
  readonly closeLabel = input('Close');
  readonly height = input<NeuBottomSheetHeight>('auto');
  protected readonly panelHeight = computed(() => {
    switch (this.height()) {
      case 'sm': return '35%';
      case 'md': return '50%';
      case 'lg': return '75%';
      case 'full': return '100%';
      default: return undefined;
    }
  });
  readonly closed = output<void>();
  /** Native presentation has finished. */
  readonly opened = output<void>();
  /** iOS native dismissal has finished. Android does not emit this native event. */
  readonly dismissed = output<void>();
  private startY: number | undefined;
  close(): void {
    if (this.open() && this.dismissible()) {
      this.open.set(false);
      this.closed.emit();
    }
  }
  protected start(event: TouchEvent): void {
    this.startY = event.nativeEvent.pageY;
  }
  protected end(event: TouchEvent): void {
    const y = event.nativeEvent.pageY;
    if (y !== undefined && this.startY !== undefined && y - this.startY > 80)
      this.close();
    this.startY = undefined;
  }
}
