import { Directive } from '@angular/core';
import { Pressable, type PressEvent } from '@ng-native/components';
import { declareNativeProps, nativePlatform } from '@ng-native/fabric';

declareNativeProps('pressable', ['onAccessibilityTap']);

/** Bridge the iOS accessibility activation event to the normal guarded action. */
@Directive({ selector: 'pressable', exportAs: 'pressable' })
export class NeuNativePressable extends Pressable {
  private stopAccessibilityTap?: () => void;

  override ngOnInit(): void {
    super.ngOnInit();
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
    this.stopAccessibilityTap?.();
    super.ngOnDestroy();
  }
}
