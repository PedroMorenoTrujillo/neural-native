import {
  Component,
  booleanAttribute,
  computed,
  inject,
  input,
  model,
  output,
} from '@angular/core';
import { Switch, Text, View } from '@ng-native/components';
import {
  NEU_LIGHT_TOKENS,
  NEU_THEME,
  type NeuSize,
} from '../foundation/index.js';

@Component({
  selector: 'neu-switch',
  imports: [Switch, Text, View],
  template: `
    <view [class]="labelPosition() === 'right' ? 'row label-right' : 'row'">
      <view class="copy"
        ><text class="label">{{ label() }}</text>
        @if (invalid() && error()) {
          <text class="error" accessibilityRole="alert">{{ error() }}</text>
        } @else if (hint()) {
          <text class="hint">{{ hint() }}</text>
        }
      </view>
      <view [class]="'toggle ' + size()">
        <switch
          class="control"
          [checked]="checked()"
          (checkedChange)="acceptChange($event)"
          [accessibilityLabel]="label()"
          [accessibilityHint]="invalid() && error() ? error() : hint()"
          [attr.aria-invalid]="invalid() ? 'true' : null"
          [disabled]="disabled() || readonly()"
          [invalid]="invalid()"
          [touched]="touched()"
          [trackColor]="trackColor()"
          [hitSlop]="{ top: 10, bottom: 10, left: 8, right: 8 }"
          (touch)="markTouched()"
        />
      </view>
    </view>
  `,
  styles: `
    .row {
      min-height: 48px;
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }
    .copy {
      flex: 1;
      min-width: 0;
      gap: 4px;
    }
    .label-right {
      flex-direction: row-reverse;
    }
    .toggle {
      min-height: 48px;
      width: 64px;
      flex-shrink: 0;
      align-items: center;
      justify-content: center;
    }
    .toggle.sm {
      width: 64px;
    }
    .toggle.lg {
      width: 72px;
    }
    .control {
      transform: scale(1);
    }
    .sm .control {
      transform: scale(0.85);
    }
    .lg .control {
      transform: scale(1.15);
    }
    .error {
      font-size: 13px;
      color: var(--neu-danger-ink, #b3261e);
    }
    .label {
      font-size: var(--neu-row-size, 15px);
      line-height: 21px;
      color: var(--neu-text, #172033);
    }
    .hint {
      font-size: 13px;
      color: var(--neu-muted, #596477);
    }
  `,
})
export class NeuSwitchComponent {
  readonly label = input.required<string>();
  readonly labelPosition = input<'left' | 'right'>('left');
  readonly size = input<NeuSize>('md');
  readonly hint = input('');
  readonly error = input('');
  readonly checked = model(false);
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly readonly = input(false, { transform: booleanAttribute });
  readonly invalid = input(false, { transform: booleanAttribute });
  readonly touched = input(false, { transform: booleanAttribute });
  readonly touch = output<void>();
  protected acceptChange(value: boolean): void {
    if (!this.disabled() && !this.readonly()) this.checked.set(value);
  }
  protected markTouched(): void {
    if (!this.disabled() && !this.readonly()) this.touch.emit();
  }
  private readonly theme = inject(NEU_THEME, { optional: true });
  protected readonly trackColor = computed(() => {
    const t = this.theme?.() ?? NEU_LIGHT_TOKENS;
    return this.invalid()
      ? { true: t.danger, false: t.danger }
      : { true: t.accent, false: t.border };
  });
}
