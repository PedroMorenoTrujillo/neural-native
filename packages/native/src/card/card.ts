import { Component, contentChild, input } from '@angular/core';
import { NeuCardHeaderDirective } from './card-slots.js';
import { Text, View } from '@ng-native/components';
@Component({
  selector: 'neu-card',
  imports: [View, Text],
  template: `<view [class]="'card ' + variant()">
    @if (header()) {
      <ng-content select="[neuCardHeader]" />
    } @else {
    @if (title()) {
      <text class="title" accessibilityRole="header">{{ title() }}</text>
    }
    @if (description()) {
      <text class="description">{{ description() }}</text>
    }
    }
    <ng-content />
    <ng-content select="[neuCardFooter]" />
  </view>`,
  styles: `
    .card {
      padding: var(--neu-spacing, 16px);
      gap: 12px;
      background-color: var(--neu-surface, #ffffff);
      border-radius: var(--neu-surface-radius, 16px);
    }
    .outlined {
      border-width: 1px;
      border-color: var(--neu-surface-border, #e1e6ed);
    }
    .tonal {
      background-color: var(--neu-tonal, #e9edfc);
    }
    .title {
      font-size: var(--neu-heading-size, 18px);
      line-height: var(--neu-heading-line, 24px);
      font-weight: 600;
      color: var(--neu-text, #172033);
    }
    .description {
      font-size: var(--neu-label-size, 14px);
      line-height: var(--neu-label-line, 20px);
      color: var(--neu-muted, #596477);
    }
  `,
})
export class NeuCardComponent {
  protected readonly header = contentChild(NeuCardHeaderDirective);
  readonly title = input('');
  readonly description = input('');
  readonly variant = input<'surface' | 'outlined' | 'tonal'>('surface');
}
