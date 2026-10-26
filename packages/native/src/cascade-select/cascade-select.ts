import {
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
import { findTreeNode } from '../foundation/tree.js';
import { NeuAnchoredOverlayComponent } from '../foundation/anchored-overlay.js';
import { NEU_CHEVRON_DOWN, NEU_CHEVRON_LEFT, NEU_CHEVRON_RIGHT, NEU_CHECK } from '../foundation/icons.js';

@Component({
  selector: 'neu-cascade-select',
  imports: [View, Text, Pressable, NgIcon, NeuAnchoredOverlayComponent],
  template: `<view class="stack"
    ><text class="label">{{ label() }}</text
    ><pressable class="control row" #triggerElement="pressable" accessibilityRole="button"
      [accessibilityLabel]="label() || placeholder()"
      [accessibilityValue]="{ text: selectedLabel() || placeholder() }"
      [accessibilityState]="{ expanded: open(), disabled: disabled() || readonly() }"
      [disabled]="disabled() || readonly()" (press)="show()">
      <text class="label grow">{{ selectedLabel() || placeholder() }}</text>
      <ng-icon [svg]="downIcon" [size]="20" color="var(--neu-muted, #596477)" />
    </pressable>
    @if (invalid() && error()) { <text class="error" accessibilityRole="alert">{{ error() }}</text> }
    </view>
    <neu-anchored-overlay [gap]="4" [(open)]="open" [anchor]="anchorRef()?.nativeElement" [closeLabel]="closeLabel()">
    <view class="stack">
    <view class="cascade-header row">
      @if (path().length) {
        <pressable class="cascade-back" accessibilityRole="button" [accessibilityLabel]="backLabel()"
          [accessibilityState]="{ disabled: disabled() || readonly() }"
          [disabled]="disabled() || readonly()" (press)="back()">
          <ng-icon [svg]="backIcon" [size]="20" color="var(--neu-text, #172033)" />
        </pressable>
      }
      <text class="title grow" accessibilityRole="header">{{ trail() || rootLabel() }}</text>
    </view>
    @for (node of level(); track node.id) {
      <pressable class="cascade-option row" [class.cascade-selected]="value() === node.id"
        [accessibilityRole]="node.children?.length ? 'button' : 'radio'"
        [accessibilityLabel]="node.label"
        [accessibilityState]="{ checked: value() === node.id, disabled: disabled() || readonly() || !!node.disabled }"
        [disabled]="disabled() || readonly() || !!node.disabled"
        [class.neu-unavailable]="disabled() || readonly() || node.disabled" (press)="choose(node.id)">
        <view class="grow stack"><text class="label">{{ node.label }}</text>
          @if (node.description) { <text class="muted">{{ node.description }}</text> }
        </view>
        @if (node.children?.length) { <ng-icon [svg]="rightIcon" [size]="20" color="var(--neu-muted, #596477)" /> }
        @else if (value() === node.id) { <ng-icon [svg]="checkIcon" [size]="20" color="var(--neu-accent, #3155d9)" /> }
      </pressable>
    }
    </view>
    </neu-anchored-overlay>`,
  styleUrls: ['../foundation/mobile.css', './cascade-select.css'],
})
export class NeuCascadeSelectComponent extends NeuTextControl {
  readonly nodes = input<readonly NeuTreeNode[]>([]);
  readonly backLabel = input('Back');
  readonly placeholder = input('Choose item');
  readonly closeLabel = input('Dismiss options');
  readonly rootLabel = input('All categories');
  protected readonly open = signal(false);
  protected readonly anchorRef = viewChild('triggerElement', { read: ElementRef<HostNode> });
  protected readonly selectedLabel = computed(() => findTreeNode(this.nodes(), this.value())?.node.label ?? '');
  protected readonly downIcon = NEU_CHEVRON_DOWN;
  protected readonly backIcon = NEU_CHEVRON_LEFT;
  protected readonly rightIcon = NEU_CHEVRON_RIGHT;
  protected readonly checkIcon = NEU_CHECK;
  protected readonly path = signal<readonly string[]>([]);
  protected readonly level = computed(() => {
    let list = this.nodes();
    for (const id of this.path()) {
      const node = list.find((x) => x.id === id && !x.disabled);
      if (!node?.children) return this.nodes();
      list = node.children;
    }
    return list;
  });
  protected readonly trail = computed(() =>
    this.path()
      .map((id) => findTreeNode(this.nodes(), id)?.node.label ?? '')
      .join(' / '),
  );
  protected back(): void {
    if (!this.disabled() && !this.readonly())
      this.path.update((x) => x.slice(0, -1));
  }
  protected show(): void {
    if (!this.disabled() && !this.readonly()) this.open.set(true);
  }
  protected choose(id: string): void {
    const node = this.level().find((x) => x.id === id && !x.disabled);
    if (!node || this.disabled() || this.readonly()) return;
    if (node.children?.length) this.path.update((x) => [...x, id]);
    else { this.accept(id); this.open.set(false); }
  }
}
