import { Component, input, computed, inject } from '@angular/core';
import { View, Text } from '@ng-native/components';
import { NeuOption, finite, clamp } from '../foundation/mobile.js';
import {
  NEU_LIGHT_TOKENS,
  NEU_THEME,
  type NeuTone,
} from '../foundation/index.js';
import { neuTonePalette } from '../foundation/tone.js';

@Component({
  selector: 'neu-meter-group',
  imports: [View, Text],
  template: `<view class="stack" [accessibilityLabel]="label()">
    @for (item of segments(); track item.id) {
      <view class="stack"
        ><text class="label">{{ item.label }} · {{ item.value }}</text
        ><view
          class="track"
          accessibilityRole="progressbar"
          [accessibilityLabel]="item.label"
          [accessibilityValue]="{ min: 0, max: 100, now: item.percent }"
          ><view
            class="fill"
            [style.width]="item.percent + '%'"
            [style.backgroundColor]="color()" /></view
      ></view>
    }
  </view>`,
  styleUrl: '../foundation/mobile.css',
  styles: '.track, .fill { height: 6px; } .label { font-size: var(--neu-caption-size, 13px); line-height: 18px; }',
})
export class NeuMeterGroupComponent {
  readonly label = input('Distribution');
  readonly items = input<readonly (NeuOption & { readonly value: number })[]>(
    [],
  );
  readonly max = input<number>();
  readonly tone = input<NeuTone>('brand');
  private readonly theme = inject(NEU_THEME, { optional: true });
  protected readonly color = computed(
    () => neuTonePalette(this.theme?.() ?? NEU_LIGHT_TOKENS, this.tone()).color,
  );
  protected readonly segments = computed(() => {
    const items = this.items().map((x) => ({
      ...x,
      value: Math.max(0, finite(x.value)),
    }));
    const max = Math.max(
      1,
      this.max() ?? items.reduce((n, x) => n + x.value, 0),
    );
    return items.map((x) => ({
      ...x,
      percent: clamp((x.value / max) * 100, 0, 100),
    }));
  });
}
