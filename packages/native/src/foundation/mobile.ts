import {
  Directive,
  booleanAttribute,
  computed,
  input,
  model,
  output,
} from '@angular/core';
import { controlLabelId } from './control-label.js';
export interface NeuOption {
  readonly id: string;
  readonly label: string;
  readonly description?: string;
  readonly disabled?: boolean;
}
export interface NeuTreeNode extends NeuOption {
  readonly children?: readonly NeuTreeNode[];
}
export interface NeuImageItem {
  readonly id: string;
  readonly uri: string;
  readonly label: string;
}
export function finite(value: number, fallback = 0): number {
  return Number.isFinite(value) ? value : fallback;
}
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(finite(value, min), min), max);
}
export function bounded(
  value: number,
  min: number,
  max: number,
  step = 1,
): number {
  const lo = finite(min),
    hi = Math.max(lo, finite(max, lo)),
    s = Math.max(Number.EPSILON, Math.abs(finite(step, 1)));
  const n = lo + Math.round((finite(value, lo) - lo) / s) * s;
  return clamp(Number(n.toFixed(10)), lo, hi);
}
export function uniqueOptions(
  options: readonly NeuOption[],
): readonly NeuOption[] {
  const seen = new Set<string>();
  return options.filter((x) => {
    if (seen.has(x.id)) return false;
    seen.add(x.id);
    return true;
  });
}
@Directive()
export abstract class NeuTextControl {
  protected readonly labelNativeId = controlLabelId();
  readonly value = model('');
  readonly label = input.required<string>();
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly readonly = input(false, { transform: booleanAttribute });
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly touched = input(false, { transform: booleanAttribute });
  readonly hint = input('');
  readonly required = input(false, { transform: booleanAttribute });
  readonly requiredLabel = input('Required');
  readonly error = input('');
  readonly touch = output<void>();
  protected readonly fieldHint = computed(() => [
    this.required() ? this.requiredLabel() : '',
    this.invalid() && this.error() ? this.error() : this.hint(),
  ].filter(Boolean).join('. ') || undefined);
  protected accept(value: string): void {
    if (!this.disabled() && !this.readonly()) {
      this.value.set(value);
      this.touch.emit();
    }
  }
}
