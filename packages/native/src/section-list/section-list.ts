import { booleanAttribute, Component, computed, inject, input, output } from '@angular/core';
import { Accessibility } from '@ng-native/device';
import { RefreshControl, SectionHeader, SectionItem, SectionList, Text, View } from '@ng-native/components';
import { NeuAlertComponent } from '../alert/alert.js';
import { NeuButtonComponent } from '../button/button.js';
import { NeuEmptyStateComponent } from '../empty-state/empty-state.js';
import { type NeuOption } from '../foundation/mobile.js';
import { NeuNativePressable as Pressable } from '../foundation/native-pressable.js';
import { NeuSkeletonComponent } from '../skeleton/skeleton.js';

export interface NeuSectionListSection {
  readonly key: string;
  readonly title: string;
  readonly data: readonly NeuOption[];
}

export interface NeuSectionListSelection {
  readonly sectionKey: string;
  readonly itemId: string;
}

@Component({
  selector: 'neu-section-list',
  imports: [
    View, Text, Pressable, SectionList, SectionHeader, SectionItem, RefreshControl,
    NeuButtonComponent, NeuSkeletonComponent, NeuAlertComponent, NeuEmptyStateComponent,
  ],
  template: `<view class="stack">
    @if (refreshEnabled()) {
      <view class="section-actions">
        <neu-button [label]="refreshLabel()" variant="text" [loading]="refreshing()"
          [disabled]="loading()" (pressed)="requestRefresh()" />
      </view>
    }
    @if (loading()) {
      <neu-skeleton />
    } @else if (error()) {
      <neu-alert [message]="error()" />
    } @else {
      <view [style.height]="viewportHeight()">
        <section-list class="section-list" [sections]="nonemptySections()"
          [itemHeight]="resolvedItemHeight()" [sectionHeaderHeight]="resolvedHeaderHeight()"
          [stickySectionHeadersEnabled]="stickyHeaders()" keyboardShouldPersistTaps="handled">
          @if (refreshEnabled()) {
            <refresh-control [refreshing]="refreshing()" (refresh)="requestRefresh()" />
          }
          @if (!nonemptySections().length) {
            <view listHeader><neu-empty-state [title]="emptyLabel()" /></view>
          }
          <ng-template sectionHeader let-section>
            <view class="section-heading">
              <text class="label" accessibilityRole="header" [numberOfLines]="1">{{ sectionFromSlot(section).title }}</text>
            </view>
          </ng-template>
          <ng-template sectionItem let-item let-section="section">
            @for (group of [sectionFromSlot(section)]; track group.key) {
              @for (entry of [itemFromSlot(item)]; track entry.id) {
                <pressable class="section-item" accessibilityRole="button"
                  [accessibilityLabel]="entry.description ? entry.label + ', ' + entry.description : entry.label"
                  [accessibilityState]="{ disabled: !!entry.disabled }" [disabled]="!!entry.disabled" (press)="select(group, entry)">
                  <text class="label" [numberOfLines]="1">{{ entry.label }}</text>
                  @if (entry.description) {
                    <text class="muted" [numberOfLines]="1">{{ entry.description }}</text>
                  }
                </pressable>
              }
            }
          </ng-template>
        </section-list>
      </view>
    }
  </view>`,
  styleUrls: ['../foundation/mobile.css', './section-list.css'],
})
export class NeuSectionListComponent {
  readonly sections = input<readonly NeuSectionListSection[]>([]);
  /** Height of the scroll viewport, in native layout units. */
  readonly height = input(400);
  /** Optional fixed row and header heights. Defaults respond to system font scale. */
  readonly itemHeight = input<number>();
  readonly headerHeight = input<number>();
  readonly stickyHeaders = input(true, { transform: booleanAttribute });
  readonly loading = input(false, { transform: booleanAttribute });
  readonly error = input('');
  readonly emptyLabel = input('No items');
  readonly refreshEnabled = input(false, { transform: booleanAttribute });
  readonly refreshing = input(false, { transform: booleanAttribute });
  readonly refreshLabel = input('Refresh');

  readonly selected = output<NeuSectionListSelection>();
  readonly refresh = output<void>();

  private readonly accessibility = inject(Accessibility);
  private readonly fontScale = computed(() => Math.max(1, this.accessibility.fontScale()));
  protected readonly viewportHeight = computed(() => this.positiveSize(this.height(), 400));
  protected readonly nonemptySections = computed(() => this.sections().filter(section => section.data.length > 0));
  protected readonly resolvedItemHeight = computed(() => this.positiveSize(this.itemHeight(), 24 + 44 * this.fontScale()));
  protected readonly resolvedHeaderHeight = computed(() => this.positiveSize(this.headerHeight(), 12 + 24 * this.fontScale()));

  // Angular Native's projected templates have independent generics. These slots
  // receive only the sections and items supplied to the typed list above.
  protected sectionFromSlot(section: unknown): NeuSectionListSection {
    return section as NeuSectionListSection;
  }

  protected itemFromSlot(item: unknown): NeuOption {
    return item as NeuOption;
  }

  protected select(section: NeuSectionListSection, item: NeuOption): void {
    if (!item.disabled) this.selected.emit({ sectionKey: section.key, itemId: item.id });
  }

  protected requestRefresh(): void {
    if (this.refreshEnabled() && !this.refreshing() && !this.loading()) this.refresh.emit();
  }

  private positiveSize(size: number | undefined, fallback: number): number {
    return size !== undefined && Number.isFinite(size) && size > 0 ? size : fallback;
  }
}
