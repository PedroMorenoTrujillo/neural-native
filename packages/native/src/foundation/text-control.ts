import {
  Directive,
  booleanAttribute,
  computed,
  input,
  model,
  output,
} from '@angular/core';
import { controlLabelId } from './control-label.js';

function textLengthLimit(value: number | undefined): number | undefined {
  return value === undefined || !Number.isFinite(value)
    ? undefined
    : Math.max(0, Math.trunc(value));
}

@Directive()
export abstract class NeuTextControl {
  protected readonly labelNativeId = controlLabelId();
  readonly value = model('');
  readonly label = input.required<string>();
  readonly placeholder = input('');
  readonly hint = input('');
  readonly required = input(false, { transform: booleanAttribute });
  readonly requiredLabel = input('Required');
  readonly error = input('');
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly readonly = input(false, { transform: booleanAttribute });
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly touched = input(false, { transform: booleanAttribute });
  readonly maxLength = input<number | undefined, number | undefined>(
    undefined,
    {
      transform: textLengthLimit,
    },
  );
  readonly touch = output<void>();
  protected readonly fieldHint = computed(() => [
    this.required() ? this.requiredLabel() : '',
    this.invalid() && this.error() ? this.error() : this.hint(),
  ].filter(Boolean).join('. ') || undefined);
}
