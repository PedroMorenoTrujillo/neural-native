import {
  booleanAttribute,
  Component,
  input,
  computed,
  signal,
  ElementRef,
  viewChild,
} from '@angular/core';
import { View, Text } from '@ng-native/components';
import { NeuNativePressable as Pressable } from '../foundation/native-pressable.js';
import { NgIcon } from '@ng-native/icons';
import type { HostNode } from '@ng-native/fabric';
import { NeuTreeNode, NeuTextControl } from '../foundation/mobile.js';
import { NeuAnchoredOverlayComponent } from '../foundation/anchored-overlay.js';
import { NEU_CHEVRON_DOWN } from '../foundation/icons.js';
import { NeuTreeComponent } from '../tree/tree.js';
import { findTreeNode } from '../foundation/tree.js';

@Component({
  selector: 'neu-tree-select',
  imports: [
    View,
    Text,
    Pressable,
    NgIcon,
    NeuAnchoredOverlayComponent,
    NeuTreeComponent,
  ],
  template: `<view class="stack"
      ><text class="label">{{ label() }}</text
      ><pressable class="control row" #triggerElement="pressable" accessibilityRole="button"
        [accessibilityLabel]="label() || placeholder()"
        [accessibilityValue]="{ text: selectedLabel() || placeholder() }"
        [accessibilityState]="{ expanded: open(), disabled: disabled() || readonly() }"
        [disabled]="disabled() || readonly()"
        (press)="show()">
        <text class="label grow">{{ selectedLabel() || placeholder() }}</text>
        <ng-icon [svg]="chevron" [size]="20" color="var(--neu-muted, #596477)" />
      </pressable>
      @if (invalid() && error()) { <text class="error" accessibilityRole="alert">{{ error() }}</text> }
    </view
    ><neu-anchored-overlay [gap]="4" [(open)]="open" [anchor]="anchorRef()?.nativeElement" [closeLabel]="closeLabel()"
      ><neu-tree
        [label]="label()"
        [nodes]="nodes()"
        [value]="value()"
        [expanded]="expanded()"
        [leafOnly]="leafOnly()"
        [expandLabel]="expandLabel()"
        [emptyLabel]="emptyLabel()"
        [disabled]="disabled()"
        [readonly]="readonly()"
        (expandedChange)="expanded.set($event)"
        (selected)="choose($event)"
    /></neu-anchored-overlay>`,
  styleUrl: '../foundation/mobile.css',
})
export class NeuTreeSelectComponent extends NeuTextControl {
  readonly nodes = input<readonly NeuTreeNode[]>([]);
  readonly leafOnly = input(true, { transform: booleanAttribute });
  readonly placeholder = input('Choose item');
  readonly closeLabel = input('Dismiss options');
  readonly expandLabel = input('Expand');
  readonly emptyLabel = input('No items');
  protected readonly anchorRef = viewChild('triggerElement', { read: ElementRef<HostNode> });
  protected readonly chevron = NEU_CHEVRON_DOWN;
  protected readonly open = signal(false);
  protected readonly expanded = signal<readonly string[]>([]);
  protected readonly selectedLabel = computed(
    () => findTreeNode(this.nodes(), this.value())?.node.label ?? '',
  );
  protected show(): void {
    if (!this.disabled() && !this.readonly()) this.open.set(true);
  }
  protected choose(id: string): void {
    const found = findTreeNode(this.nodes(), id);
    if (
      this.disabled() ||
      this.readonly() ||
      !found ||
      found.disabled ||
      (this.leafOnly() && found.node.children?.length)
    )
      return;
    this.accept(id);
    this.open.set(false);
  }
}
