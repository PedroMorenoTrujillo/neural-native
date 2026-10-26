import { Component, computed, inject, input } from '@angular/core';
import { View, Text } from '@ng-native/components';
import { NgIcon } from '@ng-native/icons';
import { NEU_LIGHT_TOKENS, NEU_THEME, type NeuTone } from '../foundation/index.js';
import { neuTonePalette } from '../foundation/tone.js';

@Component({
  selector: 'neu-stats-card',
  imports: [View, Text, NgIcon],
  template: `<view class="surface outline stats-card">
    <view class="stats-header">
      <view class="stats-heading">
        <text class="muted">{{ label() }}</text>
        <text class="metric-value">{{ value() }}</text>
      </view>
      @if (svg()) {
        <view class="stats-icon" [style.backgroundColor]="palette().tonal"
          [accessible]="false" [accessibilityElementsHidden]="true" importantForAccessibility="no-hide-descendants">
          <ng-icon [svg]="svg()" [size]="20" [color]="palette().color" />
        </view>
      }
    </view>
    @if (change()) {
      <text class="label">{{ change() }}</text>
    }
    @if (description()) {
      <text class="muted">{{ description() }}</text>
    }
    <ng-content
  /></view>`,
  styleUrl: '../foundation/mobile.css',
  styles: `
    .stats-card { gap: 12px; }
    .metric-value { color: var(--neu-text, #172033); font-size: var(--neu-metric-size, 32px); line-height: var(--neu-metric-line, 38px); font-weight: 600; flex-shrink: 1; }
    .stats-card .muted, .stats-card .label { font-size: var(--neu-caption-size, 13px); line-height: var(--neu-caption-line, 18px); }
    .stats-header { flex-direction: row; align-items: center; gap: 12px; }
    .stats-heading { flex: 1; min-width: 0; gap: 6px; }
    .stats-icon { width: 32px; height: 32px; flex-shrink: 0; align-items: center; justify-content: center; border-radius: 10px; }
  `,
})
export class NeuStatsCardComponent {
  readonly label = input.required<string>();
  readonly value = input.required<string | number>();
  readonly change = input('');
  readonly description = input('');
  readonly svg = input('');
  readonly tone = input<NeuTone>('brand');
  private readonly theme = inject(NEU_THEME, { optional: true });
  protected readonly palette = computed(() => neuTonePalette(this.theme?.() ?? NEU_LIGHT_TOKENS, this.tone()));
}
