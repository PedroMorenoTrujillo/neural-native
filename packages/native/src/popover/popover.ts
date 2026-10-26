import {
  booleanAttribute,
  Component,
  input,
  model,
  ElementRef,
  viewChild,
} from '@angular/core';
import { View, Text } from '@ng-native/components';
import type { HostNode } from '@ng-native/fabric';
import { NeuButtonComponent } from '../button/button.js';
import { NeuIconButtonComponent } from '../icon-button/icon-button.js';
import { NeuAnchoredOverlayComponent } from '../foundation/anchored-overlay.js';
import { NEU_CLOSE } from '../foundation/icons.js';

@Component({
  selector: 'neu-popover',
  imports: [View, Text, NeuButtonComponent, NeuIconButtonComponent, NeuAnchoredOverlayComponent],
  template: `<view class="stack">
    <view class="popover-anchor" #anchor [collapsable]="false"><neu-button
      [label]="label()"
      variant="tonal"
      [disabled]="disabled()"
      (pressed)="show()" /></view><neu-anchored-overlay
      [(open)]="open"
      [anchor]="anchorRef()?.nativeElement" [minimumWidth]="240" [closeLabel]="dismissLabel()">
      <view class="popover-content"><view class="row"><text class="title grow">{{ title() || label() }}</text>
        <neu-icon-button [label]="closeLabel()" [svg]="closeIcon" variant="text" (pressed)="open.set(false)" />
      </view><ng-content /></view>
    </neu-anchored-overlay></view>`,
  styleUrl: '../foundation/mobile.css',
  styles: `.popover-anchor { align-self: flex-start; max-width: 100%; } .popover-content { padding: 8px 12px 16px; gap: 8px; }`,
})
export class NeuPopoverComponent {
  readonly label = input.required<string>();
  readonly title = input('');
  readonly closeLabel = input('Close information');
  readonly dismissLabel = input('Dismiss information');
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly open = model(false);
  protected readonly closeIcon = NEU_CLOSE;
  protected readonly anchorRef = viewChild('anchor', { read: ElementRef<HostNode> });
  protected show(): void {
    if (!this.disabled()) this.open.set(true);
  }
}
