import {
  Component,
  input,
  model,
  computed,
  effect,
  inject,
  InjectionToken,
  forwardRef,
  type Signal,
} from '@angular/core';
import { View, Text, ScrollView } from '@ng-native/components';
import { NeuNativePressable as Pressable } from '../foundation/native-pressable.js';
import { NeuOption } from '../foundation/mobile.js';

export const NEU_TABS = new InjectionToken<{
  value: Signal<string>;
  tabs?: Signal<readonly NeuOption[]>;
}>(
  'Neural tabs',
);
@Component({
  selector: 'neu-tab-panel',
  imports: [View],
  template: `@if (active()) {
    <view role="tabpanel" [accessibilityLabel]="panelLabel()"><ng-content /></view>
  }`,
})
export class NeuTabPanelComponent {
  readonly id = input.required<string>();
  private readonly tabs = inject(NEU_TABS);
  protected readonly active = computed(() => this.tabs.value() === this.id());
  protected readonly panelLabel = computed(() =>
    this.tabs.tabs?.().find(tab => tab.id === this.id())?.label ?? this.id());
}

@Component({
  selector: 'neu-tabs',
  imports: [View, Text, Pressable, ScrollView],
  template: `<view class="stack"
    ><scroll-view [horizontal]="true" [showsHorizontalScrollIndicator]="false" keyboardShouldPersistTaps="handled">
      <view
      class="tabs-header"
      accessibilityRole="tablist"
      [accessibilityLabel]="label()"
    >
      @for (tab of tabs(); track tab.id) {
        <pressable
          class="tab-action"
          [class.tab-active]="value() === tab.id"
          accessibilityRole="tab"
          [accessibilityLabel]="tab.label"
          [accessibilityState]="{
            selected: value() === tab.id,
            disabled: disabled() || tab.disabled,
          }"
          [disabled]="disabled() || !!tab.disabled"
          [class.neu-unavailable]="disabled() || tab.disabled"
          (press)="choose(tab)"
          ><view class="tab-label-wrap"><text [class]="value() === tab.id ? 'tab-active-label' : 'tab-label'">{{
            tab.label
          }}</text><view class="tab-indicator" [style.opacity]="value() === tab.id ? 1 : 0" /></view></pressable
        >
      }</view></scroll-view
    ><ng-content
  /></view>`,
  styleUrls: ['../foundation/mobile.css', './tabs.css'],
  providers: [
    { provide: NEU_TABS, useExisting: forwardRef(() => NeuTabsComponent) },
  ],
})
export class NeuTabsComponent {
  readonly label = input('Tabs');
  readonly tabs = input<readonly NeuOption[]>([]);
  readonly value = model('');
  readonly disabled = input(false);
  constructor() {
    effect(() => {
      const tabs = this.tabs(),
        value = this.value();
      if (!tabs.some((x) => x.id === value && !x.disabled))
        this.value.set(tabs.find((x) => !x.disabled)?.id ?? '');
    });
  }
  protected choose(tab: NeuOption): void {
    if (!this.disabled() && !tab.disabled) this.value.set(tab.id);
  }
}
