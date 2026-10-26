import { Component, input, computed, inject } from '@angular/core';
import { View, Text } from '@ng-native/components';
import { finite, clamp } from '../foundation/mobile.js';
import {
  NEU_LIGHT_TOKENS,
  NEU_THEME,
  type NeuTone,
} from '../foundation/index.js';
import { neuTonePalette } from '../foundation/tone.js';

@Component({
  selector: 'neu-progress-bar',
  imports: [View, Text],
  template: `<view class="stack"
    ><text class="label">{{ label() }} · {{ percent() }}%</text
    ><view
      class="track"
      accessibilityRole="progressbar"
      [accessibilityLabel]="label()"
      [accessibilityValue]="{ min: 0, max: 100, now: percent() }"
      ><view
        class="fill"
        [style.width]="percent() + '%'"
        [style.backgroundColor]="color()" /></view
  ></view>`,
  styleUrl: '../foundation/mobile.css',
  styles: '.track, .fill { height: 6px; } .label { font-size: var(--neu-caption-size, 13px); line-height: 18px; }',
})
export class NeuProgressBarComponent {
  readonly label = input.required<string>();
  readonly value = input(0);
  readonly max = input(100);
  readonly tone = input<NeuTone>('brand');
  private readonly theme = inject(NEU_THEME, { optional: true });
  protected readonly color = computed(
    () => neuTonePalette(this.theme?.() ?? NEU_LIGHT_TOKENS, this.tone()).color,
  );
  protected readonly percent = computed(() =>
    Math.round(
      clamp(
        (this.value() / Math.max(1, finite(this.max(), 100))) * 100,
        0,
        100,
      ),
    ),
  );
}
