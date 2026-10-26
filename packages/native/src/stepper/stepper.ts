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
import { NeuOption, clamp } from '../foundation/mobile.js';
import { NeuButtonComponent } from '../button/button.js';
import { NgIcon } from '@ng-native/icons';
import { NEU_CHECK } from '../foundation/icons.js';

@Component({
  selector: 'neu-stepper',
  imports: [View, Text, Pressable, NgIcon, NeuButtonComponent],
  template: `<view class="stack"
    ><view class="stepper-header">
      @for (step of steps(); track step.id; let i = $index; let last = $last) {
        <view class="stepper-item">
          @if (!last) { <view class="stepper-connector" [class.stepper-connector-complete]="completed().includes(step.id)" /> }
        <pressable
          class="stepper-action"
          accessibilityRole="button"
          [accessibilityLabel]="step.label"
          [accessibilityState]="{
            selected: current() === i,
            disabled: !canGo(i),
          }"
          [disabled]="!canGo(i)"
          (press)="goTo(i)"
          >
          <view class="stepper-circle" [class.stepper-current]="current() === i" [class.stepper-complete]="completed().includes(step.id)">
            @if (completed().includes(step.id)) { <ng-icon [svg]="checkIcon" [size]="18" color="var(--neu-on-accent, #ffffff)" /> }
            @else { <text [class]="current() === i ? 'selected-text' : 'muted'">{{ i + 1 }}</text> }
          </view>
          <text class="stepper-label" [class.stepper-active-label]="current() === i">{{ step.label }}</text>
          </pressable
        >
        </view>
      }</view
    ><ng-content /><view class="row"
      ><neu-button
        [label]="previousLabel()"
        variant="outline"
        [disabled]="disabled() || current() <= 0"
        (pressed)="goTo(current() - 1)" /><neu-button
        [label]="current() === steps().length - 1 ? finishLabel() : nextLabel()"
        [disabled]="!canAdvance()"
        (pressed)="next()" /></view
  ></view>`,
  styleUrls: ['../foundation/mobile.css', './stepper.css'],
})
export class NeuStepperComponent {
  readonly steps = input<readonly NeuOption[]>([]);
  readonly activeStep = model(0);
  readonly linear = input(false, { transform: booleanAttribute });
  readonly completed = input<readonly string[]>([]);
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly previousLabel = input('Previous');
  readonly nextLabel = input('Next');
  readonly finishLabel = input('Finish');
  readonly finished = output<void>();
  protected readonly checkIcon = NEU_CHECK;
  protected readonly current = computed(() =>
    Math.floor(
      clamp(this.activeStep(), 0, Math.max(0, this.steps().length - 1)),
    ),
  );
  protected canGo(index: number): boolean {
    return (
      !this.disabled() &&
      index >= 0 &&
      index < this.steps().length &&
      !this.steps()[index]?.disabled &&
      (!this.linear() ||
        index <= this.current() ||
        this.steps()
          .slice(0, index)
          .every((x) => this.completed().includes(x.id)))
    );
  }
  protected canAdvance(): boolean {
    return (
      !this.disabled() &&
      this.steps().length > 0 &&
      (!this.linear() ||
        this.completed().includes(this.steps()[this.current()]!.id)) &&
      (this.current() === this.steps().length - 1 ||
        this.canGo(this.current() + 1))
    );
  }
  goTo(index: number): void {
    if (this.canGo(index)) this.activeStep.set(index);
  }
  protected next(): void {
    if (!this.canAdvance()) return;
    if (this.current() === this.steps().length - 1) this.finished.emit();
    else this.goTo(this.current() + 1);
  }
}
