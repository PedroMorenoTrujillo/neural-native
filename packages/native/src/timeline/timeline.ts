import { Component, input } from '@angular/core';
import { View, Text } from '@ng-native/components';
import { NeuOption } from '../foundation/mobile.js';

@Component({
  selector: 'neu-timeline',
  imports: [View, Text],
  template: `<view [accessibilityLabel]="label()">
    @for (item of items(); track item.id; let last = $last) {
      <view class="timeline-item">
        <view class="timeline-rail">
          <view class="timeline-dot" [class.timeline-done]="item.done" />
          @if (!last) {
            <view class="timeline-connector" />
          }
        </view>
        <view class="timeline-content" [class.timeline-last]="last">
          <text class="title" [accessibilityLabel]="milestoneLabel(item)">{{ item.label }}</text>
          @if (item.date) {
            <text class="muted">{{ item.date }}</text>
          }
          @if (item.description) {
            <text class="label">{{ item.description }}</text>
          }
        </view>
      </view>
    }
  </view>`,
  styleUrls: ['../foundation/mobile.css', './timeline.css'],
})
export class NeuTimelineComponent {
  readonly label = input('Timeline');
  readonly completedLabel = input('Completed');
  readonly pendingLabel = input('Pending');
  readonly items = input<
    readonly (NeuOption & { readonly date?: string; readonly done?: boolean })[]
  >([]);

  protected milestoneLabel(item: NeuOption & { readonly done?: boolean }): string {
    if (item.done === undefined) return item.label;
    const status = item.done ? this.completedLabel() : this.pendingLabel();
    return status ? `${item.label}, ${status}` : item.label;
  }
}
