import { Component, computed, inject, input } from '@angular/core';
import { Text, View } from '@ng-native/components';
import { NEU_LIGHT_TOKENS, NEU_THEME, type NeuTone } from '../foundation/index.js';
import { neuTonePalette } from '../foundation/tone.js';
@Component({
  selector: 'neu-badge',
  imports: [View, Text],
  template: `<view [class]="'badge ' + tone()"
    [style.backgroundColor]="palette().tonal"
    ><text class="label" [style.color]="palette().ink">{{ label() }}</text></view
  >`,
  styles: `
    :host {
      align-self: flex-start;
    }
    .badge {
      padding: 4px 9px;
      border-radius: 6px;
    }
    .label {
      font-size: 12px;
      font-weight: 600;
    }
  `,
})
export class NeuBadgeComponent {
  private readonly theme = inject(NEU_THEME, { optional: true });
  readonly label = input.required<string>();
  readonly tone = input<NeuTone>('neutral');
  protected readonly palette = computed(() => neuTonePalette(this.theme?.() ?? NEU_LIGHT_TOKENS, this.tone()));
}
