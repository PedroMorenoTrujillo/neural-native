import {
  Component,
  input,
  output,
} from '@angular/core';
import { View, Text } from '@ng-native/components';
import {} from '../foundation/mobile.js';
import { NeuButtonComponent } from '../button/button.js';

@Component({
  selector: 'neu-empty-state',
  imports: [View, Text, NeuButtonComponent],
  template: `<view class="surface"
    ><text class="title">{{ title() }}</text
    ><text class="muted">{{ description() }}</text
    ><ng-content />
    @if (actionLabel()) {
      <neu-button [label]="actionLabel()" size="sm" (pressed)="action.emit()" />
    }
  </view>`,
  styleUrl: '../foundation/mobile.css',
})
export class NeuEmptyStateComponent {
  readonly title = input.required<string>();
  readonly description = input('');
  readonly actionLabel = input('');
  readonly action = output<void>();
}
