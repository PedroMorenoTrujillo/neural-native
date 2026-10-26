import {
  Component,
  contentChild,
  input,
  model,
  booleanAttribute,
  computed,
  signal,
  ElementRef,
  viewChild,
  inject,
} from '@angular/core';
import { View, Text } from '@ng-native/components';
import { NeuNativePressable as Pressable } from '../foundation/native-pressable.js';
import { NgIcon } from '@ng-native/icons';
import type { HostNode } from '@ng-native/fabric';
import { NeuOption, NeuTextControl, uniqueOptions } from '../foundation/mobile.js';
import { NeuNativeTextInput as TextInput } from '../foundation/native-text-input.js';
import { NeuNativeTextSyncDirective } from '../foundation/native-text-sync.js';
import { NeuAnchoredOverlayComponent } from '../foundation/anchored-overlay.js';
import { NeuListboxComponent } from '../listbox/listbox.js';
import { NEU_THEME, NEU_LIGHT_TOKENS } from '../foundation/index.js';
import { NEU_CHEVRON_DOWN } from '../foundation/icons.js';
import { NgTemplateOutlet } from '@angular/common';
import { NeuSelectItemDirective, NeuSelectSelectedDirective } from './select-templates.js';

@Component({
  selector: 'neu-select',
  imports: [
    View,
    Text,
    Pressable,
    NeuAnchoredOverlayComponent,
    NgIcon,
    NeuListboxComponent,
    TextInput,
    NeuNativeTextSyncDirective,
    NgTemplateOutlet,
  ],
  template: `<view class="stack"
      ><text class="label">{{ label() }}</text
      ><pressable
        #triggerElement="pressable"
        class="control row"
        accessibilityRole="button"
        [accessibilityLabel]="label()"
        [accessibilityValue]="{ text: selectedLabel() || placeholder() }"
        [accessibilityState]="{
          expanded: open(),
          disabled: disabled() || readonly(),
        }"
        [disabled]="disabled() || readonly()"
        (press)="show()"
        ><view class="grow select-value">
          @if (selectedContent(); as customSelected) {
            <ng-container [ngTemplateOutlet]="customSelected.templateRef" [ngTemplateOutletContext]="{ $implicit: selectedOptions(), value: value(), values: selectedIds(), placeholder: placeholder() }" />
          } @else { <text class="label">{{ selectedLabel() || placeholder() }}</text> }
        </view><ng-icon [svg]="chevron" [size]="20" [color]="chevronColor()" /></pressable
      >
      @if (invalid() && error()) {
        <text class="error" accessibilityRole="alert">{{ error() }}</text>
      } @else if (hint()) {
        <text class="muted">{{ hint() }}</text>
      }</view
    ><neu-anchored-overlay [gap]="4" [(open)]="open" [anchor]="anchorRef()?.nativeElement" [closeLabel]="closeLabel()"
      ><view class="select-options">@if (searchable()) {
        <text-input class="control select-search"
          neuSyncText #searchSync="neuSyncText"
          (changeText)="searchSync.synchronize()"
          [neuralValue]="query()" [neuralRemeasure]="false"
          (neuralValueChange)="query.set($event)"
          [accessibilityLabel]="searchLabel()" [placeholder]="searchPlaceholder()"
          [placeholderTextColor]="chevronColor()"
          [disabled]="disabled()" [readonly]="readonly()" />
      }
      <neu-listbox
        appearance="plain"
        [label]="label()"
        [options]="filteredOptions()"
        [itemTemplate]="itemContent()?.templateRef"
        [value]="selectedIds()"
        [multiple]="multiple()"
        [emptyLabel]="emptyLabel()"
        [disabled]="disabled()"
        [readonly]="readonly()"
        (selected)="choose($event)"
    /></view></neu-anchored-overlay>`,
  styleUrl: '../foundation/mobile.css',
  styles: '.select-value { min-width: 0; } .select-options { gap: 8px; } .select-search { padding: 12px 14px; font-size: var(--neu-font-size, 16px); } .stack > .label { font-size: var(--neu-label-size, 14px); line-height: 20px; font-weight: 500; }',
})
export class NeuSelectComponent extends NeuTextControl {
  readonly options = input<readonly NeuOption[]>([]);
  protected readonly itemContent = contentChild(NeuSelectItemDirective);
  protected readonly selectedContent = contentChild(NeuSelectSelectedDirective);
  readonly placeholder = input('Choose');
  readonly closeLabel = input('Dismiss options');
  readonly multiple = input(false, { transform: booleanAttribute });
  /** Selected IDs in multiple mode. `value` remains the single-selection model. */
  readonly values = model<readonly string[]>([]);
  readonly searchable = input(false, { transform: booleanAttribute });
  readonly searchLabel = input('Search options');
  readonly searchPlaceholder = input('Type to filter');
  readonly emptyLabel = input('No matching options');
  protected readonly query = signal('');
  protected readonly choices = computed(() => uniqueOptions(this.options()));
  protected readonly selectedIds = computed(() => this.multiple()
    ? this.values() : this.value() ? [this.value()] : []);
  protected readonly filteredOptions = computed(() => {
    const normalize = (text: string) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const query = normalize(this.query().trim());
    return !this.searchable() || !query ? this.choices()
      : this.choices().filter(option => normalize(`${option.label} ${option.description ?? ''}`).includes(query));
  });
  protected readonly anchorRef = viewChild('triggerElement', { read: ElementRef<HostNode> });
  private readonly selectTheme = inject(NEU_THEME, { optional: true });
  protected readonly chevronColor = computed(() => (this.selectTheme?.() ?? NEU_LIGHT_TOKENS).muted);
  protected readonly chevron = NEU_CHEVRON_DOWN;
  protected readonly open = signal(false);
  protected readonly selectedOptions = computed(() => this.choices().filter(option => this.selectedIds().includes(option.id)));
  protected readonly selectedLabel = computed(() => this.selectedOptions().map(option => option.label).join(', '));
  protected show(): void {
    if (!this.disabled() && !this.readonly()) {
      this.query.set('');
      this.open.set(true);
    }
  }
  protected choose(id: string): void {
    if (
      this.disabled() ||
      this.readonly() ||
      !this.options().some((x) => x.id === id && !x.disabled)
    )
      return;
    if (this.multiple()) {
      this.values.update(values => values.includes(id) ? values.filter(value => value !== id) : [...values, id]);
      this.touch.emit();
    } else {
      this.accept(id);
      this.open.set(false);
    }
  }
}
