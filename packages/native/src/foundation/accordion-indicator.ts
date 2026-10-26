import { Component, computed, inject, input } from '@angular/core';
import { View } from '@ng-native/components';
import { NgIcon } from '@ng-native/icons';
import { AnimatedStyle } from '@ng-native/components/animations';
import { NEU_CHEVRON_DOWN } from './icons.js';
import { NEU_THEME, NEU_LIGHT_TOKENS } from './index.js';
import { neuPresence } from './motion.js';

/** Internal animated indicator; not part of the public component API. */
@Component({
  selector: 'neu-accordion-indicator',
  imports: [View, NgIcon, AnimatedStyle],
  template: `<view [animatedStyle]="rotation" [accessible]="false">
    <ng-icon [svg]="chevron" [size]="18" [color]="color()" />
  </view>`,
})
export class NeuAccordionIndicatorComponent {
  readonly open = input(false);
  protected readonly chevron = NEU_CHEVRON_DOWN;
  private readonly theme = inject(NEU_THEME, { optional: true });
  protected readonly color = computed(() => (this.theme?.() ?? NEU_LIGHT_TOKENS).muted);
  private readonly motion = neuPresence(this.open, true, false);
  protected readonly rotation = {
    transform: [{ rotate: this.motion.progress.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] }) }],
  };
}
