import {
  booleanAttribute,
  Component,
  computed,
  inject,
  input,
  model,
  output,
} from '@angular/core';
import { NeuOption } from '../foundation/mobile.js';
import { View, Text } from '@ng-native/components';
import { NeuNativePressable as Pressable } from '../foundation/native-pressable.js';
import { AnimatedStyle } from '@ng-native/components/animations';
import { neuPresence } from '../foundation/motion.js';
import { NgIcon } from '@ng-native/icons';
import { NEU_LIGHT_TOKENS, NEU_THEME } from '../foundation/index.js';

export interface NeuSpeedDialAction extends NeuOption {
  /** Optional SVG markup for the action's circular button. */
  readonly svg?: string;
}

@Component({
  selector: 'neu-speed-dial',
  imports: [View, Text, Pressable, NgIcon, AnimatedStyle],
  template: `<view class="speed-dial">
    <view
      class="dial-actions"
      [animatedStyle]="actionsStyle"
      [pointerEvents]="open() ? 'auto' : 'none'"
      [accessibilityElementsHidden]="!open()"
      [importantForAccessibility]="open() ? 'auto' : 'no-hide-descendants'"
    >
      @for (item of actions(); track item.id) {
        <pressable
          class="dial-action"
          accessibilityRole="button"
          [accessibilityLabel]="item.label"
          [disabled]="!open() || disabled() || !!item.disabled"
          [focusable]="open() && !disabled() && !item.disabled"
          [accessibilityState]="{ disabled: disabled() || !!item.disabled }"
          [class.neu-unavailable]="disabled() || item.disabled"
          (press)="activate(item)"
        >
          <text class="action-label">{{ item.label }}</text>
          <view class="action-circle" [accessible]="false">
            @if (item.svg) {
              <ng-icon [svg]="item.svg" [size]="22" [color]="iconColor()" />
            } @else {
              <text class="action-symbol">{{ item.label.slice(0, 1) }}</text>
            }
          </view>
        </pressable>
      }
    </view>
    <pressable
      class="fab"
      accessibilityRole="button"
      [accessibilityLabel]="label()"
      [disabled]="disabled()"
      [class.neu-unavailable]="disabled()"
      [accessibilityState]="{ expanded: open(), disabled: disabled() }"
      (press)="toggle()"
      ><view
        class="fab-symbol"
        [animatedStyle]="symbolStyle"
        pointerEvents="none"
        [accessible]="false"
      >
        <view class="symbol-line" />
        <view class="symbol-line symbol-vertical" /> </view></pressable
  ></view>`,
  styles: `
    .neu-unavailable > * { opacity: 0.45; }
    .speed-dial {
      position: relative;
      min-height: 56px;
      align-items: flex-end;
    }
    .dial-actions {
      position: absolute;
      right: 0;
      bottom: 72px;
      align-items: flex-end;
      gap: 12px;
    }
    .dial-action {
      flex-direction: row;
      align-items: center;
      gap: 12px;
      min-height: 48px;
    }
    .action-label {
      flex-shrink: 1;
      font-size: 14px;
      color: var(--neu-text, #172033);
      background-color: var(--neu-surface, #ffffff);
      padding: 8px 12px;
      border-radius: 8px;
    }
    .action-circle {
      width: 48px;
      height: 48px;
      border-radius: 24px;
      align-items: center;
      justify-content: center;
      background-color: var(--neu-tonal, #e9edfc);
    }
    .action-symbol {
      font-size: 20px;
      color: var(--neu-accent, #3155d9);
    }
    .fab {
      width: 56px;
      height: 56px;
      border-radius: 28px;
      align-items: center;
      justify-content: center;
      background-color: var(--neu-accent, #3155d9);
    }
    .fab-symbol {
      width: 24px;
      height: 24px;
    }
    .symbol-line {
      position: absolute;
      left: 1px;
      top: 11px;
      width: 22px;
      height: 2px;
      border-radius: 1px;
      background-color: var(--neu-on-accent, #ffffff);
    }
    .symbol-vertical {
      transform: rotate(90deg);
    }
  `,
})
export class NeuSpeedDialComponent {
  readonly label = input('Quick actions');
  readonly actions = input<readonly NeuSpeedDialAction[]>([]);
  readonly open = model(false);
  private readonly motion = neuPresence(this.open, true, false);
  protected readonly actionsStyle = {
    opacity: this.motion.progress,
    transform: [{ translateY: this.motion.progress.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }],
  };
  protected readonly symbolStyle = {
    transform: [{ rotate: this.motion.progress.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '45deg'] }) }],
  };
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly activated = output<string>();
  private readonly theme = inject(NEU_THEME, { optional: true });
  protected readonly iconColor = computed(
    () => (this.theme?.() ?? NEU_LIGHT_TOKENS).accent,
  );
  protected toggle(): void {
    if (!this.disabled()) this.open.update((open) => !open);
  }
  protected activate(item: NeuSpeedDialAction): void {
    if (!this.open() || this.disabled() || item.disabled) return;
    this.open.set(false);
    this.activated.emit(item.id);
  }
}
