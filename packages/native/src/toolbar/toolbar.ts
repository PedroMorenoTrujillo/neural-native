import {
  booleanAttribute,
  Component,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { View, Text, ScrollView } from '@ng-native/components';
import { NeuNativePressable as Pressable } from '../foundation/native-pressable.js';
import { NgIcon } from '@ng-native/icons';
import { NeuOption } from '../foundation/mobile.js';
import { NEU_LIGHT_TOKENS, NEU_THEME } from '../foundation/index.js';

/** An action on the current screen. Supply svg for an icon and label for its accessible name. */
export interface NeuToolbarAction extends NeuOption {
  readonly svg?: string;
}

@Component({
  selector: 'neu-toolbar',
  imports: [View, Text, Pressable, ScrollView, NgIcon],
  template: `<view class="toolbar" accessibilityRole="toolbar" [accessibilityLabel]="label()">
    <view class="toolbar-content"><ng-content /></view>
    @if (actions().length) {
      <scroll-view class="toolbar-scroll" [horizontal]="true"
        keyboardShouldPersistTaps="handled" [showsHorizontalScrollIndicator]="false">
        <view class="toolbar-actions">
          @for (action of actions(); track action.id) {
            <pressable class="toolbar-action" [class.toolbar-icon]="!!action.svg"
              accessibilityRole="button" [accessibilityLabel]="action.label"
              [accessibilityState]="{ disabled: disabled() || !!action.disabled }"
              [disabled]="disabled() || !!action.disabled"
              [class.neu-unavailable]="disabled() || action.disabled"
              [style.backgroundColor]="held() === action.id && !disabled() && !action.disabled ? tokens().tonal : 'transparent'"
              (pressIn)="held.set(action.id)" (pressOut)="held.set(null)"
              (press)="activate(action)">
              @if (action.svg) {
                <view pointerEvents="none" [accessible]="false">
                  <ng-icon [svg]="action.svg" [size]="22" [color]="tokens().text" />
                </view>
              } @else {
                <text class="toolbar-label" pointerEvents="none" [accessible]="false">{{ action.label }}</text>
              }
            </pressable>
          }
        </view>
      </scroll-view>
    }
  </view>`,
  styles: `
    .neu-unavailable > * { opacity: 0.45; }
    :host { align-self: stretch; min-width: 0; max-width: 100%; }
    .toolbar {
      flex-direction: row;
      align-items: center;
      min-height: 56px;
      padding: 4px 8px;
      gap: 8px;
      background-color: var(--neu-surface, #ffffff);
      border-bottom-width: 1px;
      border-color: var(--neu-divider, #e4e7ec);
    }
    .toolbar-content { flex-direction: row; align-items: center; gap: 8px; flex-grow: 1; flex-shrink: 1; min-width: 0; }
    .toolbar-scroll { flex-grow: 0; flex-shrink: 1; max-width: 100%; }
    .toolbar-actions { flex-direction: row; align-items: center; }
    .toolbar-action {
      min-width: 48px;
      min-height: 48px;
      padding: 8px 12px;
      align-items: center;
      justify-content: center;
      border-radius: var(--neu-radius, 12px);
    }
    .toolbar-icon { width: 48px; padding: 0; }
    .toolbar-label { color: var(--neu-text, #172033); font-size: 14px; font-weight: 500; }
  `,
})
export class NeuToolbarComponent {
  readonly label = input('Toolbar');
  readonly actions = input<readonly NeuToolbarAction[]>([]);
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly activated = output<string>();
  protected readonly held = signal<string | null>(null);
  private readonly theme = inject(NEU_THEME, { optional: true });
  protected readonly tokens = computed(() => this.theme?.() ?? NEU_LIGHT_TOKENS);
  protected activate(action: NeuToolbarAction): void {
    if (!this.disabled() && !action.disabled) this.activated.emit(action.id);
  }
}
