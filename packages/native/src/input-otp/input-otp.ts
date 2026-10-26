import {
  Component,
  input,
  output,
  computed,
  signal,
  viewChild,
} from '@angular/core';
import {
  View,
  Text,
  type SelectionChangeEvent,
} from '@ng-native/components';
import { NeuNativePressable as Pressable } from '../foundation/native-pressable.js';
import { NeuNativeTextInput as TextInput } from '../foundation/native-text-input.js';
import { NeuTextControl, clamp } from '../foundation/mobile.js';

import { NeuNativeTextSyncDirective } from '../foundation/native-text-sync.js';

@Component({
  selector: 'neu-input-otp',
  imports: [NeuNativeTextSyncDirective, View, Text, Pressable, TextInput],
  template: `<view class="stack"
    ><text class="label">{{ label() }}</text
    ><view class="otp-positions" [class.otp-disabled]="disabled()">
      <text-input
        neuSyncText
        #textSync="neuSyncText"
        (changeText)="textSync.synchronize()"
        class="otp-input"
        [neuralValue]="value()"
        [maxLength]="digits()"
        [accessibilityLabel]="label()"
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        autoCapitalize="none"
        [autoCorrect]="false"
        [spellCheck]="false"
        [caretHidden]="true"
        [disabled]="disabled()"
        [readonly]="readonly()"
        [invalid]="invalid()"
        [touched]="touched()"
        (neuralValueChange)="edit($event)"
        (focus)="focused.set(true)"
        (blur)="focused.set(false)"
        (selectionChange)="selectionChanged($event)"
        (touch)="touch.emit()"
      />
      @for (row of rows(); track $index) {
        <view class="otp-row">
          @for (position of row; track position) {
            <pressable
              class="otp-position"
              [class.otp-active]="focused() && activePosition() === position"
              [class.otp-invalid]="invalid()"
              [accessible]="false"
              [focusable]="false"
              [disabled]="disabled() || readonly()"
              [testID]="'otp-position-' + position"
              (press)="focusPosition(position)"
              ><text
                class="otp-digit"
                [accessible]="false"
                pointerEvents="none"
                >{{ value()[position] || ' ' }}</text
              ></pressable
            >
          }
        </view>
      }
    </view>
    @if (invalid() && error()) {
      <text class="error" accessibilityRole="alert">{{ error() }}</text>
    } @else if (hint()) {
      <text class="muted">{{ hint() }}</text>
    }
  </view>`,
  styleUrl: '../foundation/mobile.css',
  styles: `
    .otp-positions {
      position: relative;
      gap: 6px;
    }
    .otp-row {
      flex-direction: row;
      gap: 6px;
    }
    .otp-position {
      flex-grow: 1;
      flex-basis: 0;
      min-width: 0;
      max-width: 44px;
      min-height: 48px;
      align-items: center;
      justify-content: center;
      border-width: 1px;
      border-radius: 10px;
      border-color: var(--neu-border, #a5afbf);
      background-color: var(--neu-surface, #ffffff);
      transition:
        border-color 150ms ease,
        background-color 150ms ease;
    }
    .otp-active {
      border-color: var(--neu-accent, #3155d9);
      background-color: var(--neu-tonal, #e9edfc);
    }
    .otp-invalid {
      border-color: var(--neu-danger, #b3261e);
    }
    .otp-disabled {
      opacity: 0.5;
    }
    .otp-digit {
      color: var(--neu-text, #172033);
      font-size: 20px;
      font-weight: 500;
    }
    .otp-input {
      position: absolute;
      top: 0;
      left: 0;
      width: 1px;
      height: 48px;
      padding: 0;
      color: transparent;
      opacity: 0.01;
    }
    @media (prefers-reduced-motion: reduce) {
      .otp-position {
        transition: none;
      }
    }
  `,
})
export class NeuInputOtpComponent extends NeuTextControl {
  readonly length = input(6);
  readonly completed = output<string>();
  protected readonly digits = computed(() =>
    Math.floor(clamp(this.length(), 1, 12)),
  );
  private readonly field = viewChild(TextInput);
  protected readonly rows = computed(() => {
    const positions = Array.from(
      { length: this.digits() },
      (_, index) => index,
    );
    return positions.length > 6
      ? [positions.slice(0, 6), positions.slice(6)]
      : [positions];
  });
  protected readonly focused = signal(false);
  private readonly selectionStart = signal(0);
  protected readonly activePosition = computed(() =>
    Math.min(this.selectionStart(), this.digits() - 1),
  );

  protected focusPosition(position: number): void {
    if (this.disabled() || this.readonly()) return;
    const start = Math.min(position, this.value().length);
    this.selectionStart.set(start);
    this.field()?.focus();
    this.field()?.setSelection(start, Math.min(start + 1, this.value().length));
  }

  protected selectionChanged(event: SelectionChangeEvent): void {
    this.selectionStart.set(Math.max(0, event.nativeEvent.selection.start));
  }
  protected edit(value: string): void {
    if (this.disabled() || this.readonly()) return;
    const next = value.replace(/[^0-9]/g, '').slice(0, this.digits());
    const changed = next !== this.value();
    this.accept(next);
    this.selectionStart.set(Math.min(next.length, this.digits() - 1));
    if (changed && next.length === this.digits()) this.completed.emit(next);
  }
}
