import { Directive, inject, input, type OutputRefSubscription } from '@angular/core';
import { Pressable, type PressEvent } from '@ng-native/components';
import { declareNativeProps, nativePlatform } from '@ng-native/fabric';
import { NeuHaptics, type NeuHapticFeedback } from './haptics.js';

declareNativeProps('pressable', ['onAccessibilityTap']);

/** Bridge the iOS accessibility activation event to the normal guarded action. */
@Directive({ selector: 'pressable', exportAs: 'pressable' })
export class NeuNativePressable extends Pressable {
  readonly haptic = input<NeuHapticFeedback | false>('press');
  private readonly haptics = inject(NeuHaptics);
  private stopHaptics?: OutputRefSubscription;
  private stopAccessibilityTap?: () => void;

  override ngOnInit(): void {
    super.ngOnInit();
    this.stopHaptics = this.press.subscribe(() => {
      if (this.claims()) this.haptics.play(this.haptic());
    });
    if (nativePlatform() !== 'ios') return;
    // Fabric's iOS view emits this event only when the native opt-in is present.
    this.engine.setProp(this.node, 'onAccessibilityTap', true);
    this.stopAccessibilityTap = this.engine.setEventListener(this.node, 'topAccessibilityTap', raw => {
      const event = raw as PressEvent;
      if (event.target !== this.node) return;
      if (this.claims()) this.press.emit(event as PressEvent);
    });
  }

  override ngOnDestroy(): void {
    this.stopHaptics?.unsubscribe();
    this.stopAccessibilityTap?.();
    super.ngOnDestroy();
  }
}
