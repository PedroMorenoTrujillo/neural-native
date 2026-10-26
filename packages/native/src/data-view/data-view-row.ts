import { Directive, DestroyRef, ElementRef, afterRenderEffect, computed, effect, inject, input } from '@angular/core';
import { type LayoutEvent } from '@ng-native/components';
import { Animated, Easing } from '@ng-native/components/animations';
import { Accessibility } from '@ng-native/device';
import { HostEngine, type HostNode } from '@ng-native/fabric';
import { NEU_LIGHT_TOKENS, NEU_THEME } from '../foundation/index.js';
import { neuMotionDuration, neuPresence } from '../foundation/motion.js';

/** Internal row: retain identity and ease native layout changes after filtering or sorting. */
@Directive({
  selector: 'pressable[neuDataRowIndex]',
  exportAs: 'neuDataRowMotion',
  host: { '(layout)': 'measure($event)' },
})
export class NeuDataViewRowMotionDirective {
  readonly index = input(0, { alias: 'neuDataRowIndex' });
  private readonly node = inject<ElementRef<HostNode>>(ElementRef).nativeElement;
  private readonly engine = inject(HostEngine);
  private readonly destroy = inject(DestroyRef);
  private measurement = 0;
  private readonly accessibility = inject(Accessibility);
  private readonly theme = inject(NEU_THEME, { optional: true });
  private readonly entrance = neuPresence(computed(() => true));
  private readonly offset = new Animated.Value(0);
  private previousY: number | undefined;
  private positionIndex: number | undefined;
  private animating = false;
  private animation = 0;
  readonly animated = { opacity: this.entrance.progress, transform: [{ translateY: this.offset }] };

  constructor() {
    let previousIndex: number | undefined;
    afterRenderEffect(() => {
      const index = this.index();
      const changed = previousIndex !== undefined && previousIndex !== index;
      previousIndex = index;
      const parent = this.node.parent;
      if (!changed || this.previousY === undefined || !parent) return;
      const measurement = ++this.measurement;
      // Web layout events report resizing. Measure reordered rows explicitly, using the same
      // native host contract, so their position changes animate on both renderers.
      this.offset.stopAnimation(value => {
        if (this.destroy.destroyed || measurement !== this.measurement) return;
        this.engine.measure(parent, origin => {
          if (this.destroy.destroyed || measurement !== this.measurement) return;
          this.engine.measure(this.node, frame => {
            if (!this.destroy.destroyed && measurement === this.measurement) this.move(frame.y - origin.y - value, value);
          });
        });
      });
    });
    effect(() => {
      if (this.accessibility.reduceMotion() || this.duration() === 0) {
        this.animation++;
        this.animating = false;
        this.offset.stopAnimation();
        this.offset.setValue(0);
      }
    });
    this.destroy.onDestroy(() => { this.measurement++; this.offset.stopAnimation(); });
  }

  private duration(): number {
    return neuMotionDuration(this.theme?.().duration ?? NEU_LIGHT_TOKENS.duration, true);
  }

  protected measure(event: LayoutEvent): void {
    const y = event.nativeEvent.layout.y;
    if (!Number.isFinite(y)) return;
    // Browser layout notifications can include our visual translation. They must
    // never start another translation or interrupt one already in progress.
    // Index changes own movement; otherwise these events only refresh the baseline.
    if (this.previousY === undefined || (!this.animating && this.positionIndex === this.index())) {
      this.previousY = y;
      this.positionIndex = this.index();
    }
  }

  private move(y: number, value: number): void {
    const delta = this.previousY === undefined ? 0 : this.previousY - y;
    this.previousY = y;
    this.positionIndex = this.index();
    const animation = ++this.animation;
    this.animating = false;
    if (this.accessibility.reduceMotion() || this.duration() === 0 || (delta === 0 && value === 0)) {
      this.offset.setValue(0);
      return;
    }
    // Continue from the current visual position when the user reverses direction mid-animation.
    this.animating = true;
    this.offset.setValue(value + delta);
    Animated.timing(this.offset, {
        toValue: 0, duration: this.duration(), easing: Easing.out(Easing.cubic),
        useNativeDriver: true, isInteraction: false,
    }).start(({ finished }) => {
      if (finished && !this.destroy.destroyed && animation === this.animation) {
        this.animating = false;
        this.offset.setValue(0);
      }
    });
  }
}
