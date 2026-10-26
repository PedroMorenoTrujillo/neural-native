import {
  Component,
  input,
  computed,
  signal,
  effect,
  inject,
} from '@angular/core';
import { View, Text, Image } from '@ng-native/components';
import {
  NEU_LIGHT_TOKENS,
  NEU_THEME,
  type NeuTone,
  type NeuSize,
} from '../foundation/index.js';
import { neuTonePalette } from '../foundation/tone.js';

@Component({
  selector: 'neu-avatar',
  imports: [View, Text, Image],
  template: `<view
    class="avatar"
    accessibilityRole="image"
    [accessibilityLabel]="label()"
    [style.backgroundColor]="palette().tonal"
    [style.width]="diameter()"
    [style.height]="diameter()"
    [style.borderRadius]="diameter() / 2"
  >
    @if (uri() && !failed()) {
      <image
        class="avatar-image"
        [source]="{ uri: uri() }"
        resizeMode="cover"
        [style.width]="diameter()"
        [style.height]="diameter()"
        [alt]="label()"
        (error)="failed.set(true)"
      />
    } @else {
      <text class="title" [style.color]="palette().ink" [style.fontSize]="initialSize()">{{ initials() }}</text>
    }
  </view>`,
  styleUrl: '../foundation/mobile.css',
})
export class NeuAvatarComponent {
  readonly label = input.required<string>();
  readonly uri = input('');
  readonly tone = input<NeuTone>('brand');
  readonly size = input<NeuSize>('lg');
  protected readonly diameter = computed(() =>
    this.size() === 'sm' ? 32 : this.size() === 'md' ? 40 : 48,
  );
  protected readonly initialSize = computed(() =>
    this.size() === 'sm' ? 12 : this.size() === 'md' ? 14 : 16,
  );
  private readonly theme = inject(NEU_THEME, { optional: true });
  protected readonly palette = computed(() =>
    neuTonePalette(this.theme?.() ?? NEU_LIGHT_TOKENS, this.tone()),
  );
  protected readonly failed = signal(false);
  protected readonly initials = computed(() =>
    this.label()
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((x) => Array.from(x)[0] ?? '')
      .join('')
      .toLocaleUpperCase(),
  );
  constructor() {
    effect(() => {
      this.uri();
      this.failed.set(false);
    });
  }
}
