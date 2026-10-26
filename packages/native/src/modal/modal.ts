import {
  booleanAttribute,
  Component,
  computed,
  contentChild,
  inject,
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
} from '@ng-native/components';
import { Accessibility, Screen } from '@ng-native/device';
import { NeuNativePressable as Pressable } from '../foundation/native-pressable.js';
import { AnimatedStyle } from '@ng-native/components/animations';
import { neuPresence } from '../foundation/motion.js';
import { NgTemplateOutlet } from '@angular/common';
import { NeuModalHeaderDirective, NeuModalFooterDirective } from './modal-templates.js';

@Component({
  selector: 'neu-modal',
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
    NgTemplateOutlet,
  ],
  template: `
    <modal [supportedOrientations]="['portrait', 'landscape']"
      [visible]="motion.visible()"
      [transparent]="true"
      animationType="none"
      (requestClose)="close('native')"
      (show)="opened.emit()"
      (dismiss)="dismissed.emit()"
      ><safe-area-provider class="full" [reportInsets]="false"
        ><safe-area-view class="backdrop" [animatedStyle]="backdropStyle"
          [pointerEvents]="open() ? 'auto' : 'none'"
          [accessibilityElementsHidden]="!open()"
          [importantForAccessibility]="open() ? 'auto' : 'no-hide-descendants'"
          ><keyboard-avoiding-view behavior="padding" class="modal-layout"
            ><view class="sheet" [animatedStyle]="panelStyle" [accessibilityViewIsModal]="open()"
              ><view class="row"
                ><view class="grow modal-heading">
                  @if (header(); as customHeader) {
                    <ng-container [ngTemplateOutlet]="customHeader.templateRef" />
                  } @else {
                    <text class="title" accessibilityRole="header">{{ title() }}</text>
                  }
                </view>
                @if (dismissible() && showCloseButton()) {
                  <pressable
                    class="action modal-close"
                    accessibilityRole="button"
                    [accessibilityLabel]="closeLabel()"
                    (press)="close('action')"
                    ><text class="label">×</text></pressable
                  >
                }</view
              ><scroll-view
                class="modal-scroll"
                keyboardShouldPersistTaps="handled"
                ><view class="stack modal-scroll-content">
                  <view class="stack scroll-content"><ng-content /></view>
                  @if (footerScrolls()) {
                    @if (footer(); as customFooter) {
                      <view class="modal-footer"><ng-container [ngTemplateOutlet]="customFooter.templateRef" /></view>
                    }
                  }
                </view></scroll-view>
              @if (!footerScrolls()) {
                @if (footer(); as customFooter) {
                  <view class="modal-footer"><ng-container [ngTemplateOutlet]="customFooter.templateRef" /></view>
                }
              }
            </view></keyboard-avoiding-view></safe-area-view></safe-area-provider
    ></modal>`,
  styleUrl: '../foundation/mobile.css',
  styles: '.modal-heading { min-width: 0; } .modal-close { background-color: transparent; padding: 0; } .modal-close .label { font-size: 20px; } .modal-scroll-content { gap: 16px; } .sheet { width: 100%; max-width: 420px; align-self: center; }',
})
export class NeuModalComponent {
  private readonly screen = inject(Screen);
  private readonly accessibility = inject(Accessibility);
  // Keep actions fixed when there is room. Short windows and enlarged text need
  // one scrollable body so the footer cannot squeeze a focused field to zero.
  protected readonly footerScrolls = computed(() => {
    const height = this.screen.window().height;
    return height > 0 && height < 720 * Math.max(1, this.accessibility.fontScale());
  });
  readonly open = model(false);
  // Prefilled fields can relayout while the native presentation is mounting.
  // JS frames keep the transition attached across those layout commits.
  protected readonly motion = neuPresence(this.open, false);
  protected readonly backdropStyle = { opacity: this.motion.progress };
  protected readonly panelStyle = {
    transform: [
      { translateY: this.motion.progress.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) },
      { scale: this.motion.progress.interpolate({ inputRange: [0, 1], outputRange: [0.985, 1] }) },
    ],
  };
  protected readonly header = contentChild(NeuModalHeaderDirective);
  protected readonly footer = contentChild(NeuModalFooterDirective);
  readonly title = input.required<string>();
  readonly dismissible = input(true, { transform: booleanAttribute });
  readonly showCloseButton = input(true, { transform: booleanAttribute });
  readonly closeLabel = input('Close');
  readonly closed = output<'native' | 'action' | 'backdrop'>();
  /** Native presentation has finished; separate from the requested open state. */
  readonly opened = output<void>();
  /** iOS native dismissal has finished. Android does not emit this native event. */
  readonly dismissed = output<void>();
  close(reason: 'native' | 'action' | 'backdrop' = 'action'): void {
    if (this.dismissible() && this.open()) {
      this.open.set(false);
      this.closed.emit(reason);
    }
  }
}
