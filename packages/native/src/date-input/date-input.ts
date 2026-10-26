import { Component, input, computed, signal } from '@angular/core';
import { View, Text } from '@ng-native/components';
import { NeuNativePressable as Pressable } from '../foundation/native-pressable.js';
import { NeuTextControl } from '../foundation/mobile.js';
import { NeuBottomSheetComponent } from '../bottom-sheet/bottom-sheet.js';
import { NeuCalendarComponent } from '../calendar/calendar.js';
import { isoDate } from '../foundation/calendar.js';

@Component({
  selector: 'neu-date-input',
  imports: [
    View,
    Text,
    Pressable,
    NeuBottomSheetComponent,
    NeuCalendarComponent,
  ],
  template: `<view class="stack"
      ><text class="label">{{ label() }}</text
      ><pressable
        class="control"
        accessibilityRole="button"
        [accessibilityLabel]="label()"
        [accessibilityValue]="{ text: formatted() || placeholder() }"
        [accessibilityState]="{
          expanded: open(),
          disabled: disabled() || readonly(),
        }"
        [disabled]="disabled() || readonly()"
        (press)="show()"
        ><text class="label">{{
          formatted() || placeholder()
        }}</text></pressable
      >
      @if (invalid() && error()) {
        <text class="error" accessibilityRole="alert">{{ error() }}</text>
      }</view
    ><neu-bottom-sheet [(open)]="open" [title]="label()" [closeLabel]="closeLabel()"
      ><neu-calendar
        [label]="label()"
        [showAgenda]="false"
        [value]="value()"
        [min]="min()"
        [max]="max()"
        [locale]="locale()"
        [previousLabel]="previousLabel()"
        [nextLabel]="nextLabel()"
        [previousYearLabel]="previousYearLabel()"
        [nextYearLabel]="nextYearLabel()"
        [previousYearsLabel]="previousYearsLabel()"
        [nextYearsLabel]="nextYearsLabel()"
        [disabled]="disabled()"
        [readonly]="readonly()"
        (valueChange)="choose($event)"
    /></neu-bottom-sheet>`,
  styleUrl: '../foundation/mobile.css',
})
export class NeuDateInputComponent extends NeuTextControl {
  readonly min = input('');
  readonly max = input('');
  readonly locale = input('en');
  readonly placeholder = input('Choose date');
  readonly closeLabel = input('Close');
  readonly previousLabel = input('Previous month');
  readonly nextLabel = input('Next month');
  readonly previousYearLabel = input('Previous year');
  readonly nextYearLabel = input('Next year');
  readonly previousYearsLabel = input('Previous 12 years');
  readonly nextYearsLabel = input('Next 12 years');
  protected readonly open = signal(false);
  protected readonly formatted = computed(() => {
    const d = isoDate(this.value());
    if (!d) return '';
    try {
      return new Intl.DateTimeFormat(this.locale(), {
        dateStyle: 'medium',
        timeZone: 'UTC',
      }).format(d);
    } catch {
      return this.value();
    }
  });
  protected show(): void {
    if (!this.disabled() && !this.readonly()) this.open.set(true);
  }
  protected choose(date: string): void {
    if (
      this.disabled() ||
      this.readonly() ||
      !isoDate(date) ||
      (isoDate(this.min()) && date < this.min()) ||
      (isoDate(this.max()) && date > this.max())
    )
      return;
    this.accept(date);
    this.open.set(false);
  }
}
