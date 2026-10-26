import {
  Component,
  booleanAttribute,
  computed,
  inject,
  input,
} from '@angular/core';
import { ActivityIndicator, Text, View } from '@ng-native/components';
import {
  NEU_LIGHT_TOKENS,
  NEU_THEME,
  type NeuTone,
} from '../foundation/index.js';
import { neuTonePalette } from '../foundation/tone.js';
@Component({
  selector: 'neu-spinner',
  imports: [ActivityIndicator, Text, View],
  template: `<view
    class="row"
    accessibilityRole="progressbar"
    [accessibilityLabel]="label()"
    [accessibilityState]="{ busy: active() }"
    ><activity-indicator
      [size]="size()"
      [animating]="active()"
      [color]="color()"
      [accessible]="false"
      [accessibilityElementsHidden]="true"
      importantForAccessibility="no-hide-descendants"
    />
    @if (showLabel()) {
      <text class="label">{{ label() }}</text>
    }
  </view>`,
  styles: `
    .row {
      flex-direction: row;
      align-items: center;
      gap: 10px;
      min-height: 32px;
    }
    .label {
      font-size: 14px;
      color: var(--neu-muted, #596477);
    }
  `,
})
export class NeuSpinnerComponent {
  readonly label = input('Loading');
  readonly size = input<'small' | 'large'>('small');
  readonly active = input(true, { transform: booleanAttribute });
  readonly showLabel = input(false, { transform: booleanAttribute });
  readonly tone = input<NeuTone>('brand');
  private readonly theme = inject(NEU_THEME, { optional: true });
  protected readonly color = computed(
    () => neuTonePalette(this.theme?.() ?? NEU_LIGHT_TOKENS, this.tone()).color,
  );
}
