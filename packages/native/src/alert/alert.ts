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
import { NgIcon } from '@ng-native/icons';
import { NeuIconButtonComponent } from '../icon-button/icon-button.js';
import { NEU_CLOSE, NEU_CHECK } from '../foundation/icons.js';
import { NEU_LIGHT_TOKENS, NEU_THEME, type NeuTone } from '../foundation/index.js';
import { neuTonePalette } from '../foundation/tone.js';
import { NeuCollapseComponent } from '../foundation/collapse.js';
export type NeuAlertVariant = 'soft' | 'outline';
const INFO = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7v.1"/></svg>';
const WARNING = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3 10 18H2ZM12 9v5M12 17v.1"/></svg>';

@Component({
  selector: 'neu-alert',
  imports: [View, Text, NgIcon, NeuIconButtonComponent, NeuCollapseComponent],
  template: `<neu-collapse [open]="visible()">
    <view class="surface outline alert" accessibilityRole="alert" [style.backgroundColor]="variant() === 'soft' ? palette().tonal : 'transparent'"
      [style.borderColor]="variant() === 'outline' ? palette().color : palette().tonal">
      @if (showIcon()) { <view class="alert-icon"><ng-icon [svg]="icon()" [size]="20" [color]="palette().color" /></view> }
      <view class="alert-copy">@if (title()) { <text class="title">{{ title() }}</text> }
        <text class="label">{{ message() }}</text><ng-content />
      </view>
      @if (closable()) {
        <neu-icon-button [label]="closeLabel()" [svg]="closeIcon" [tone]="tone()" variant="text" (pressed)="close()" />
      }
    </view>
  </neu-collapse>`,
  styleUrl: '../foundation/mobile.css',
  styles: `.alert { min-width: 0; flex-direction: row; align-items: center; gap: 10px; padding: var(--neu-space-16, 16px); border-radius: var(--neu-surface-radius, 16px); } .alert .title { font-size: var(--neu-row-size, 15px); line-height: var(--neu-row-line, 21px); } .alert .label { font-size: var(--neu-label-size, 14px); line-height: var(--neu-label-line, 20px); } .alert-copy { flex: 1; min-width: 0; gap: 6px; } .alert-icon { flex-shrink: 0; align-items: center; justify-content: center; }`,
})
export class NeuAlertComponent {
  readonly title = input('');
  readonly tone = input<NeuTone>('info');
  readonly variant = input<NeuAlertVariant>('soft');
  readonly showIcon = input(true, { transform: booleanAttribute });
  readonly svg = input('');
  readonly message = input.required<string>();
  readonly visible = model(true);
  readonly closable = input(false, { transform: booleanAttribute });
  readonly closeLabel = input('Close');
  readonly closed = output<void>();
  private readonly theme = inject(NEU_THEME, { optional: true });
  protected readonly palette = computed(() => neuTonePalette(this.theme?.() ?? NEU_LIGHT_TOKENS, this.tone()));
  protected readonly closeIcon = NEU_CLOSE;
  protected readonly icon = computed(() => this.svg() || (this.tone() === 'success' ? NEU_CHECK : this.tone() === 'warning' ? WARNING : this.tone() === 'danger' ? NEU_CLOSE : INFO));
  protected close(): void {
    this.visible.set(false);
    this.closed.emit();
  }
}
