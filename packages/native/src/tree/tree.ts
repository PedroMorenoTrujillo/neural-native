import {
  booleanAttribute,
  Component,
  input,
  model,
  output,
  computed,
} from '@angular/core';
import { View, Text } from '@ng-native/components';
import { NeuNativePressable as Pressable } from '../foundation/native-pressable.js';
import { NgIcon } from '@ng-native/icons';
import { NEU_CHEVRON_DOWN, NEU_CHEVRON_RIGHT, NEU_FOLDER, NEU_FILE, NEU_CHECK } from '../foundation/icons.js';
import { NeuTreeNode } from '../foundation/mobile.js';
import { visibleTree, findTreeNode } from '../foundation/tree.js';

@Component({
  selector: 'neu-tree',
  imports: [View, Text, Pressable, NgIcon],
  template: `<view [accessibilityLabel]="label()">
    @for (row of rows(); track row.node.id) {
      <view class="row tree-row" [style.paddingLeft]="row.depth * 16"
        [style.opacity]="disabled() || row.disabled ? 0.45 : 1">
        @if (row.branch) {
          <pressable
            class="tree-disclosure"
            accessibilityRole="button"
            [accessibilityLabel]="row.node.label + ' ' + expandLabel()"
            [accessibilityState]="{
              expanded: expandedIds().has(row.node.id),
              disabled: disabled() || row.disabled,
            }"
            [disabled]="disabled() || row.disabled"
            (press)="toggle(row.node.id)"
            ><ng-icon [svg]="expandedIds().has(row.node.id) ? downIcon : rightIcon" [size]="18" color="var(--neu-muted, #596477)" /></pressable
          >
        } @else {
          <view class="tree-spacer" />
        }
        <pressable
          class="tree-node row grow"
          [class.tree-selected]="value() === row.node.id"
          accessibilityRole="radio"
          [accessibilityLabel]="row.node.label"
          [accessibilityState]="{
            checked: value() === row.node.id,
            disabled:
              disabled() ||
              readonly() ||
              row.disabled ||
              (leafOnly() && row.branch),
          }"
          [disabled]="
            disabled() ||
            readonly() ||
            row.disabled ||
            (leafOnly() && row.branch)
          "
          (press)="choose(row.node.id)"
          ><ng-icon [svg]="row.branch ? folderIcon : fileIcon" [size]="20" color="var(--neu-muted, #596477)" />
          <view class="grow tree-copy">
            <text [class]="value() === row.node.id ? 'tree-selected-label' : row.branch ? 'tree-branch-label' : 'label'">{{ row.node.label }}</text>
            @if (row.node.description) { <text class="muted">{{ row.node.description }}</text> }
          </view>
          @if (value() === row.node.id) { <ng-icon [svg]="checkIcon" [size]="18" color="var(--neu-accent, #3155d9)" /> }
          </pressable
        ></view
      >
    } @empty {
      <text class="muted">{{ emptyLabel() }}</text>
    }
  </view>`,
  styleUrls: ['../foundation/mobile.css', './tree.css'],
})
export class NeuTreeComponent {
  readonly label = input('Tree');
  readonly nodes = input<readonly NeuTreeNode[]>([]);
  readonly expanded = model<readonly string[]>([]);
  readonly value = model('');
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly readonly = input(false, { transform: booleanAttribute });
  readonly leafOnly = input(false, { transform: booleanAttribute });
  readonly expandLabel = input('Expand');
  readonly emptyLabel = input('No items');
  readonly selected = output<string>();
  readonly touch = output<void>();
  protected readonly downIcon = NEU_CHEVRON_DOWN;
  protected readonly rightIcon = NEU_CHEVRON_RIGHT;
  protected readonly folderIcon = NEU_FOLDER;
  protected readonly fileIcon = NEU_FILE;
  protected readonly checkIcon = NEU_CHECK;
  protected readonly expandedIds = computed(() => new Set(this.expanded()));
  protected readonly rows = computed(() =>
    visibleTree(this.nodes(), this.expanded()),
  );
  protected toggle(id: string): void {
    const found = findTreeNode(this.nodes(), id);
    if (
      this.disabled() ||
      !found ||
      found.disabled ||
      !found.node.children?.length
    )
      return;
    this.expanded.update((ids) =>
      ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id],
    );
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
    this.value.set(id);
    this.selected.emit(id);
    this.touch.emit();
  }
}
