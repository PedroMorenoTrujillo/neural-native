import {
  booleanAttribute,
  Component,
  input,
  model,
  output,
  computed,
  inject,
} from '@angular/core';
import { View, Text } from '@ng-native/components';
import { NeuNativePressable as Pressable } from '../foundation/native-pressable.js';
import { NgIcon } from '@ng-native/icons';
import { NEU_CHECK_ICON, NEU_LIGHT_TOKENS, NEU_THEME, type NeuTone } from '../foundation/index.js';
import { neuTonePalette } from '../foundation/tone.js';

@Component({
  selector: 'neu-chip',
  imports: [View, Text, Pressable, NgIcon],
  template: `<view class="chip" [class.chip-selected]="selected()" [class.chip-disabled]="disabled()"
    ><view class="chip-surface" pointerEvents="none" [style.backgroundColor]="selected() ? palette().tonal : 'var(--neu-surface-secondary, #eef1f5)'" /><pressable
      class="chip-body"
      [accessibilityRole]="selectable() ? 'checkbox' : 'text'"
      [accessibilityLabel]="label()"
      [disabled]="disabled() || !selectable()"
      [accessibilityState]="selectable() ? { checked: selected(), disabled: disabled() } : { disabled: disabled() }"
      (press)="toggle()"
      >@if (selected()) { <ng-icon [svg]="check" [size]="16" [color]="palette().ink" /> }
      <text class="label" [style.color]="selected() ? palette().ink : 'var(--neu-text, #172033)'">{{
        label()
      }}</text></pressable
    >
    @if (removable()) {
      <pressable
        class="chip-remove"
        accessibilityRole="button"
        [accessibilityLabel]="removeLabel() + ' ' + label()"
        [disabled]="disabled()"
        (press)="remove()"
        ><text class="label" [style.color]="selected() ? palette().ink : 'var(--neu-text, #172033)'">×</text></pressable
      >
    }
  </view>`,
  styleUrls: ['../foundation/mobile.css', './chip.css'],
})
export class NeuChipComponent {
  protected readonly check = NEU_CHECK_ICON;
  readonly label = input.required<string>();
  readonly tone = input<NeuTone>('brand');
  readonly selected = model(false);
  readonly selectable = input(true, { transform: booleanAttribute });
  readonly removable = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly removeLabel = input('Remove');
  readonly removed = output<void>();
  private readonly theme = inject(NEU_THEME, { optional: true });
  protected readonly palette = computed(() => neuTonePalette(this.theme?.() ?? NEU_LIGHT_TOKENS, this.tone()));
  protected toggle(): void {
    if (!this.disabled() && this.selectable()) this.selected.update((x) => !x);
  }
  protected remove(): void {
    if (!this.disabled()) this.removed.emit();
  }
}
