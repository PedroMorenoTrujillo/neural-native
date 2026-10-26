import {
  Component,
  input,
  computed,
  effect,
  inject,
} from '@angular/core';
import { View } from '@ng-native/components';
import { Animated, AnimatedStyle, Easing } from '@ng-native/components/animations';
import { Accessibility } from '@ng-native/device';
import { clamp } from '../foundation/mobile.js';
import { NEU_THEME, NEU_LIGHT_TOKENS } from '../foundation/index.js';

export type NeuSkeletonVariant = 'text' | 'rect' | 'circle';
export type NeuSkeletonAnimation = 'pulse' | 'none';

@Component({
  selector: 'neu-skeleton',
  imports: [View, AnimatedStyle],
  template: `<view
    class="stack"
    [accessible]="true"
    accessibilityRole="progressbar"
    [accessibilityLabel]="label()"
    [accessibilityState]="{ busy: true }"
    [style.width]="resolvedWidth()"
    [style.maxWidth]="'100%'"
    [style.gap]="resolvedGap()"
  >
    @for (line of rows(); track line) {
      <view
        class="skeleton"
        [animatedStyle]="animationStyle"
        [style.height]="resolvedHeight()"
        [style.borderRadius]="resolvedRadius()"
        [style.width]="variant() === 'text' && line === rows().length - 1 ? resolvedLastLineWidth() : '100%'"
      />
    }
  </view>`,
  styleUrl: '../foundation/mobile.css',
})
export class NeuSkeletonComponent {
  private readonly accessibility = inject(Accessibility);
  private readonly theme = inject(NEU_THEME, { optional: true });
  private readonly opacity = new Animated.Value(1);
  protected readonly animationStyle = { opacity: this.opacity };
  readonly label = input('Loading');
  readonly lines = input(3);
  readonly variant = input<NeuSkeletonVariant>('text');
  readonly width = input<string | number | undefined>();
  readonly height = input<number | undefined>();
  readonly borderRadius = input(8);
  readonly gap = input(12);
  readonly lastLineWidth = input<string | number>('65%');
  readonly animation = input<NeuSkeletonAnimation>('pulse');
  protected readonly resolvedHeight = computed(() => this.nonnegative(this.height(), this.variant() === 'circle' ? 40 : 16));
  protected readonly resolvedWidth = computed(() => this.dimension(this.width(), this.variant() === 'circle' ? this.resolvedHeight() : '100%'));
  protected readonly resolvedRadius = computed(() => this.variant() === 'circle' ? 9999 : this.nonnegative(this.borderRadius(), 8));
  protected readonly resolvedGap = computed(() => this.nonnegative(this.gap(), 12));
  protected readonly resolvedLastLineWidth = computed(() => this.dimension(this.lastLineWidth(), '65%'));
  protected readonly rows = computed(() =>
    Array.from({ length: this.variant() === 'text' ? Math.floor(clamp(Number.isFinite(this.lines()) ? this.lines() : 3, 1, 20)) : 1 }, (_, i) => i),
  );
  private nonnegative(value: number | undefined, fallback: number): number {
    return typeof value === 'number' && Number.isFinite(value) ? Math.max(0, value) : fallback;
  }
  private dimension(value: number | string | undefined, fallback: number | string): number | string {
    if (typeof value === 'number') return this.nonnegative(value, typeof fallback === 'number' ? fallback : 0);
    if (typeof value !== 'string' || !value.trim()) return fallback;
    const text = value.trim();
    if (/^\d+(?:\.\d+)?%$/.test(text)) return `${Math.min(100, Number.parseFloat(text))}%`;
    if (/^\d+(?:\.\d+)?(?:px)?$/.test(text)) return Number.parseFloat(text);
    return fallback;
  }
  constructor() {
    effect(onCleanup => {
      const duration = this.theme?.().duration ?? NEU_LIGHT_TOKENS.duration;
      this.opacity.setValue(1);
      if (this.animation() === 'none' || this.accessibility.reduceMotion() || duration <= 0) return;
      const half = Math.max(400, Math.min(1500, duration * 6));
      const animation = Animated.sequence([
        Animated.timing(this.opacity, { toValue: 0.4, duration: half, easing: Easing.inOut(Easing.ease), useNativeDriver: true, isInteraction: false }),
        Animated.timing(this.opacity, { toValue: 1, duration: half, easing: Easing.inOut(Easing.ease), useNativeDriver: true, isInteraction: false }),
      ]);
      let active = true;
      const repeat = () => animation.start(({ finished }) => { if (finished && active) repeat(); });
      repeat();
      onCleanup(() => { active = false; animation.stop(); this.opacity.setValue(1); });
    });
  }
}
