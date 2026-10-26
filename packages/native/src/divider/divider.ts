import { Component, input } from '@angular/core';
import { View } from '@ng-native/components';
@Component({
  selector: 'neu-divider',
  imports: [View],
  template: `<view [class]="'line ' + orientation()" [accessible]="false" />`,
  styles: `
    .line {
      background-color: var(--neu-border, #a5afbf);
    }
    .horizontal {
      height: 1px;
      width: 100%;
    }
    .vertical {
      width: 1px;
      min-height: 24px;
      height: 100%;
    }
  `,
})
export class NeuDividerComponent {
  readonly orientation = input<'horizontal' | 'vertical'>('horizontal');
}
