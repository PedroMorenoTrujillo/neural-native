import {
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { View } from '@ng-native/components';
import { ColorScheme } from '@ng-native/device';
import { neuTonePalette } from '../foundation/tone.js';
import {
  NEU_DARK_TOKENS,
  NEU_LIGHT_TOKENS,
  NEU_THEME,
  type NeuColorScheme,
  type NeuTokens,
} from '../foundation/index.js';

@Component({
  selector: 'neu-theme',
  imports: [View],
  providers: [
    {
      provide: NEU_THEME,
      useFactory: () => inject(NeuThemeComponent).resolvedTokens,
    },
  ],
  template: `
    <view
      class="theme"
      [style.--neu-accent]="resolvedTokens().accent"
      [style.--neu-accent-ink]="textInks().brand"
      [style.--neu-danger-ink]="textInks().danger"
      [style.--neu-success-ink]="textInks().success"
      [style.--neu-info-ink]="textInks().info"
      [style.--neu-on-accent]="resolvedTokens().onAccent"
      [style.--neu-surface]="resolvedTokens().surface"
      [style.--neu-canvas]="resolvedTokens().canvas"
      [style.--neu-text]="resolvedTokens().text"
      [style.--neu-muted]="resolvedTokens().muted"
      [style.--neu-border]="resolvedTokens().border"
      [style.--neu-surface-border]="resolvedTokens().surfaceBorder"
      [style.--neu-divider]="resolvedTokens().divider"
      [style.--neu-surface-secondary]="resolvedTokens().surfaceSecondary"
      [style.--neu-control-radius]="resolvedTokens().radius * 5 / 6 + 'px'"
      [style.--neu-surface-radius]="resolvedTokens().radius * 4 / 3 + 'px'"
      [style.--neu-overlay-radius]="resolvedTokens().radius * 4 / 3 + 'px'"
      [style.--neu-dialog-radius]="resolvedTokens().radius * 2 + 'px'"
      [style.--neu-caption-size]="resolvedTokens().fontSize * 0.8125 + 'px'"
      [style.--neu-label-size]="resolvedTokens().fontSize * 0.875 + 'px'"
      [style.--neu-row-size]="resolvedTokens().fontSize * 0.9375 + 'px'"
      [style.--neu-heading-size]="resolvedTokens().fontSize * 1.125 + 'px'"
      [style.--neu-metric-size]="resolvedTokens().fontSize * 2 + 'px'"
      [style.--neu-space-4]="resolvedTokens().spacing * 0.25 + 'px'"
      [style.--neu-space-6]="resolvedTokens().spacing * 0.375 + 'px'"
      [style.--neu-space-8]="resolvedTokens().spacing * 0.5 + 'px'"
      [style.--neu-space-10]="resolvedTokens().spacing * 0.625 + 'px'"
      [style.--neu-space-12]="resolvedTokens().spacing * 0.75 + 'px'"
      [style.--neu-space-16]="resolvedTokens().spacing * 1 + 'px'"
      [style.--neu-space-20]="resolvedTokens().spacing * 1.25 + 'px'"
      [style.--neu-space-24]="resolvedTokens().spacing * 1.5 + 'px'"
      [style.--neu-tonal]="resolvedTokens().tonal"
      [style.--neu-danger]="resolvedTokens().danger"
      [style.--neu-success]="resolvedTokens().success"
      [style.--neu-warning]="resolvedTokens().warning"
      [style.--neu-info]="resolvedTokens().info"
      [style.--neu-radius]="resolvedTokens().radius + 'px'"
      [style.--neu-spacing]="resolvedTokens().spacing + 'px'"
      [style.--neu-font-size]="resolvedTokens().fontSize + 'px'"
      [style.--neu-caption-line]="resolvedTokens().fontSize * 1.125 + 'px'"
      [style.--neu-label-line]="resolvedTokens().fontSize * 1.25 + 'px'"
      [style.--neu-row-line]="resolvedTokens().fontSize * 1.3125 + 'px'"
      [style.--neu-heading-line]="resolvedTokens().fontSize * 1.5 + 'px'"
      [style.--neu-metric-line]="resolvedTokens().fontSize * 2.375 + 'px'"
      [style.--neu-duration]="resolvedTokens().duration + 'ms'"
    >
      <ng-content />
    </view>
  `,
  styles: `
    :host {
      flex: 1;
    }
    .theme {
      flex: 1;
      background-color: var(--neu-canvas);
    }
  `,
})
export class NeuThemeComponent {
  readonly scheme = input<NeuColorScheme>('system');
  readonly tokens = input<Partial<NeuTokens>>({});
  private readonly systemScheme = inject(ColorScheme);
  protected readonly textInks = computed(() => {
    const tokens = this.resolvedTokens();
    return { brand: neuTonePalette(tokens, 'brand').ink, danger: neuTonePalette(tokens, 'danger').ink,
      success: neuTonePalette(tokens, 'success').ink, info: neuTonePalette(tokens, 'info').ink };
  });
  readonly resolvedTokens = computed<Readonly<NeuTokens>>(() => {
    const scheme =
      this.scheme() === 'system' ? this.systemScheme.current() : this.scheme();
    return {
      ...(scheme === 'dark' ? NEU_DARK_TOKENS : NEU_LIGHT_TOKENS),
      ...this.tokens(),
    };
  });
}
