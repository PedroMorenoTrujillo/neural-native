import {
  Component,
  input,
  model,
  output,
  effect,
  computed,
  inject,
} from '@angular/core';
import { View, Text } from '@ng-native/components';
import { NeuNativePressable as Pressable } from '../foundation/native-pressable.js';
import { AnimatedStyle } from '@ng-native/components/animations';
import { NgIcon } from '@ng-native/icons';
import { neuPresence } from '../foundation/motion.js';
import { NEU_CLOSE } from '../foundation/icons.js';
import {
  NEU_LIGHT_TOKENS,
  NEU_THEME,
  type NeuTone,
} from '../foundation/index.js';
import { neuTonePalette } from '../foundation/tone.js';

@Component({
  selector: 'neu-toast',
  host: {
    style:
      'position: absolute; left: 16px; right: 16px; bottom: 16px; z-index: 1000;',
  },
  imports: [View, Text, Pressable, AnimatedStyle, NgIcon],
  template: `@if (motion.visible()) {
    <view
      class="toast"
      accessibilityRole="alert"
      [animatedStyle]="animationStyle"
      [pointerEvents]="open() ? 'auto' : 'none'"
      [style.backgroundColor]="palette().color"
      [accessibilityElementsHidden]="!open()"
      [importantForAccessibility]="open() ? 'auto' : 'no-hide-descendants'"
    >
      <text class="toast-message" [style.color]="palette().onColor">{{
        message()
      }}</text
      ><view class="toast-actions">
        @if (actionLabel()) {
          <pressable
            class="toast-action"
            accessibilityRole="button"
            [accessibilityLabel]="actionLabel()"
            (press)="invokeAction()"
            ><text
              class="toast-action-text"
              [style.color]="palette().onColor"
              >{{ actionLabel() }}</text
            ></pressable
          >
        }
        <pressable
          class="toast-close"
          accessibilityRole="button"
          [accessibilityLabel]="closeLabel()"
          (press)="dismiss()"
          ><ng-icon
            [svg]="closeIcon"
            [size]="18"
            [color]="palette().onColor" /></pressable></view
    ></view>
  }`,
  styleUrl: '../foundation/mobile.css',
  styles: `
    .toast {
      padding: 4px 8px 4px 16px;
      min-height: 56px;
      border-radius: var(--neu-radius);
      background-color: var(--neu-text);
      gap: 4px;
      flex-direction: row;
      align-items: center;
    }
    .toast-message {
      flex: 1;
      min-width: 0;
      color: var(--neu-surface);
      font-size: 16px;
      padding-top: 8px;
      padding-bottom: 4px;
    }
    .toast-actions {
      flex-direction: row;
      align-items: center;
      justify-content: flex-end;
    }
    .toast-action {
      min-height: 48px;
      padding: 12px;
      align-items: center;
      justify-content: center;
    }
    .toast-action-text {
      color: var(--neu-surface);
      font-size: 14px;
      font-weight: 600;
    }
    .toast-close {
      min-width: 48px;
      min-height: 48px;
      align-items: center;
      justify-content: center;
    }
  `,
})
export class NeuToastComponent {
  readonly open = model(false);
  readonly message = input.required<string>();
  readonly duration = input(0);
  readonly closeLabel = input('Dismiss');
  readonly actionLabel = input('');
  readonly tone = input<NeuTone>('neutral');
  readonly action = output<void>();
  readonly dismissed = output<void>();
  private readonly theme = inject(NEU_THEME, { optional: true });
  protected readonly palette = computed(() =>
    neuTonePalette(this.theme?.() ?? NEU_LIGHT_TOKENS, this.tone()),
  );
  protected readonly closeIcon = NEU_CLOSE;
  protected readonly motion = neuPresence(this.open);
  protected readonly animationStyle = {
    opacity: this.motion.progress,
    transform: [
      {
        translateY: this.motion.progress.interpolate({
          inputRange: [0, 1],
          outputRange: [8, 0],
        }),
      },
    ],
  };
  constructor() {
    effect((onCleanup) => {
      const open = this.open(),
        duration = this.duration();
      if (open && duration > 0) {
        const timer = setTimeout(() => this.dismiss(), duration);
        onCleanup(() => clearTimeout(timer));
      }
    });
  }
  protected dismiss(): void {
    if (this.open()) {
      this.open.set(false);
      this.dismissed.emit();
    }
  }
  protected invokeAction(): void {
    if (!this.open()) return;
    this.action.emit();
    this.dismiss();
  }
}
