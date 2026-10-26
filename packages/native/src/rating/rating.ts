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
import { clamp } from '../foundation/mobile.js';
const STAR =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-2.9-5.6 2.9 1.1-6.2L3 9.6l6.2-.9Z"/></svg>';
const FILLED_STAR = STAR.replace('fill="none"', 'fill="currentColor"');

@Component({
  selector: 'neu-rating',
  imports: [View, Text, Pressable, NgIcon],
  template: `<view class="stack rating"
    ><view class="rating-heading"
      ><text class="label grow">{{ label() }}</text
      ><text class="rating-value"
        >{{ value() }}/{{ stars().length }}</text
      ></view
    ><view
      class="rating-stars"
      accessibilityRole="radiogroup"
      [accessibilityLabel]="label()"
    >
      @for (star of stars(); track star) {
        <pressable
          class="rating-target"
          accessibilityRole="radio"
          [accessibilityLabel]="star + ' / ' + stars().length"
          [accessibilityState]="{
            checked: value() === star,
            disabled: disabled() || readonly(),
          }"
          [disabled]="disabled() || readonly()"
          (press)="rate(star)"
          ><ng-icon
            [svg]="star <= value() ? filledStar : emptyStar"
            [size]="24"
            [color]="
              star <= value() ? 'var(--neu-accent)' : 'var(--neu-muted)'
            "
        /></pressable>
      }
    </view>
    @if (clearable()) {
      <pressable
        class="rating-clear"
        accessibilityRole="button"
        [accessibilityLabel]="clearLabel()"
        [disabled]="disabled() || readonly()"
        (press)="rate(0)"
        ><text class="rating-clear-label">{{ clearLabel() }}</text></pressable
      >
    }
  </view>`,
  styleUrl: '../foundation/mobile.css',
  styles: `
    .rating {
      gap: 4px;
    }
    .rating-heading {
      flex-direction: row;
      align-items: center;
      gap: 8px;
    }
    .rating-value {
      color: var(--neu-muted, #64748b);
      font-size: 14px;
    }
    .rating-stars {
      width: 100%;
      max-width: 220px;
      flex-direction: row;
      flex-wrap: wrap;
      gap: 0;
    }
    .rating-target {
      width: 20%;
      min-width: 0;
      min-height: 48px;
      align-items: center;
      justify-content: center;
    }
    .rating-clear {
      min-height: 44px;
      padding: 8px 0;
      align-self: flex-start;
      justify-content: center;
    }
    .rating-clear-label {
      color: var(--neu-muted, #64748b);
      font-size: 14px;
      font-weight: 500;
    }
  `,
})
export class NeuRatingComponent {
  protected readonly emptyStar = STAR;
  protected readonly filledStar = FILLED_STAR;
  readonly label = input.required<string>();
  readonly value = model(0);
  readonly max = input(5);
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly readonly = input(false, { transform: booleanAttribute });
  readonly clearable = input(true, { transform: booleanAttribute });
  readonly clearLabel = input('Clear rating');
  readonly touch = output<void>();
  protected readonly stars = computed(() =>
    Array.from(
      { length: Math.floor(clamp(this.max(), 1, 10)) },
      (_, i) => i + 1,
    ),
  );
  protected rate(n: number): void {
    if (!this.disabled() && !this.readonly()) {
      this.value.set(clamp(n, 0, this.stars().length));
      this.touch.emit();
    }
  }
}
