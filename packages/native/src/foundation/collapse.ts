import { Component, DestroyRef, effect, inject, input, signal } from '@angular/core';
import { View, type LayoutEvent } from '@ng-native/components';
import { Animated, AnimatedStyle, Easing } from '@ng-native/components/animations';
import { Accessibility } from '@ng-native/device';
import { NEU_THEME, NEU_LIGHT_TOKENS } from './index.js';
import { neuMotionDuration, neuPresence } from './motion.js';

@Component({
  selector: 'neu-collapse',
  imports: [View, AnimatedStyle],
  template: `@if (motion.visible()) {
    <view class="collapse" [animatedStyle]="animated" [pointerEvents]="open() ? 'auto' : 'none'"
      [accessibilityElementsHidden]="!open()" [importantForAccessibility]="open() ? 'auto' : 'no-hide-descendants'">
      <view class="collapse-content" (layout)="measure($event)"><ng-content /></view>
    </view>
  }`,
  styles: `
    .collapse { position: relative; overflow: hidden; }
    .collapse-content { position: absolute; top: 0; left: 0; right: 0; gap: 12px; }
  `,
})
export class NeuCollapseComponent {
  readonly open = input(false);
  // Already-open content must start fully visible before its first native
  // measurement binds the animated height. User toggles still animate.
  protected readonly motion = neuPresence(this.open, false, false);
  private readonly height = signal(0);
  private readonly animatedHeight = new Animated.Value(0);
  private readonly accessibility = inject(Accessibility);
  private readonly theme = inject(NEU_THEME, { optional: true });
  // Keep one animation graph attached while native layout measurements arrive.
  // Replacing an interpolation during a running animation detaches its graph.
  protected readonly animated = {
    height: this.animatedHeight,
    opacity: this.motion.progress,
  };
  constructor() {
    let initialOpen: boolean | undefined;
    let measured = false;
    effect(onCleanup => {
      const open = this.open(), height = this.height();
      initialOpen ??= open;
      const firstMeasurement = height > 0 && !measured;
      if (height > 0) measured = true;
      const duration = neuMotionDuration(this.theme?.().duration ?? NEU_LIGHT_TOKENS.duration, open);
      const toValue = open ? height : 0;
      if (height === 0 || this.accessibility.reduceMotion() || duration === 0 || (initialOpen && firstMeasurement)) {
        this.animatedHeight.setValue(toValue);
        return;
      }
      const animation = Animated.timing(this.animatedHeight, {
        toValue, duration, easing: Easing.out(Easing.cubic), useNativeDriver: false,
      });
      animation.start();
      onCleanup(() => animation.stop());
    });
    inject(DestroyRef).onDestroy(() => this.animatedHeight.stopAnimation());
  }
  protected measure(event: LayoutEvent): void {
    const height = event.nativeEvent.layout.height;
    if (Number.isFinite(height)) this.height.set(Math.max(0, height));
  }
}
