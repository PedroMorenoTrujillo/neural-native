import { DestroyRef, ElementRef, effect, inject, signal, untracked, type Signal } from '@angular/core';
import { Animated, Easing } from '@ng-native/components/animations';
import { Accessibility } from '@ng-native/device';
import { HostEngine, type HostNode } from '@ng-native/fabric';
import { snapshotNativeText } from './native-text-snapshot.ts';
import { NEU_THEME, NEU_LIGHT_TOKENS } from './index.js';

export function neuMotionDuration(configured: number, entering: boolean): number {
  const base = Number.isFinite(configured) ? configured : NEU_LIGHT_TOKENS.duration;
  return Math.max(0, Math.min(1000, base * (entering ? 1.8 : 1.5)));
}

/** Keep an outgoing native view alive until its closing animation has completed. */
export function neuPresence(open: Signal<boolean>, nativeDriver = true, animateInitially = true) {
  const accessibility = inject(Accessibility);
  const destroy = inject(DestroyRef);
  const theme = inject(NEU_THEME, { optional: true });
  const host = inject<ElementRef<HostNode>>(ElementRef, { optional: true });
  const engine = inject(HostEngine, { optional: true });
  const visible = signal(open());
  const progress = new Animated.Value(!animateInitially && open() ? 1 : 0);
  let initial = true;
  effect(onCleanup => {
    const first = initial;
    initial = false;
    const entering = open(), reduced = accessibility.reduceMotion();
    if (!entering && visible()) untracked(() => {
      if (!host) return;
      // A submit button can clear the engine's focus record before closing the
      // presentation, without delivering the edited field's blur handler.
      snapshotNativeText(host.nativeElement);
      const focused = engine?.focusedField;
      if (!engine || !focused) return;
      for (let node: HostNode | null = focused; node; node = node.parent) {
        if (node === host.nativeElement) {
          // Android can retain field focus when a presentation disappears.
          // End editing while its native view still exists, even without motion.
          engine.dispatchCommand(focused, 'blur');
          break;
        }
      }
    });
    const configured = theme?.().duration ?? NEU_LIGHT_TOKENS.duration;
    const duration = neuMotionDuration(configured, entering);
    if (entering) visible.set(true);
    if ((first && !animateInitially) || reduced || duration === 0 || (!entering && !visible())) {
      progress.setValue(entering ? 1 : 0);
      visible.set(entering);
      return;
    }
    const animation = Animated.timing(progress, {
      toValue: entering ? 1 : 0,
      duration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: nativeDriver,
      isInteraction: false,
    });
    let active = true;
    animation.start(({ finished }) => {
      if (active && finished && !destroy.destroyed && !open()) visible.set(false);
    });
    onCleanup(() => { active = false; animation.stop(); });
  });
  destroy.onDestroy(() => progress.stopAnimation());
  return { visible, progress };
}

/** Keep the settled layer underneath the next one until its pixels are ready. */
export function neuCrossfade<T>(current: Signal<T | undefined>, enabled: Signal<boolean>, same: (a: T, b: T) => boolean, waitForLoad = false) {
  const accessibility = inject(Accessibility);
  const destroy = inject(DestroyRef);
  const theme = inject(NEU_THEME, { optional: true });
  const outgoing = signal<T | undefined>(undefined);
  const ready = signal<T | undefined>(undefined);
  const progress = new Animated.Value(1);
  let previous: T | undefined;
  let wasEnabled = false;
  effect(onCleanup => {
    const item = current(), open = enabled();
    const duration = Math.min(1000, neuMotionDuration(theme?.().duration ?? NEU_LIGHT_TOKENS.duration, true) * 4 / 3);
    const reduced = accessibility.reduceMotion();
    const animate = open && wasEnabled && previous !== undefined && item !== undefined && !same(previous, item) && !reduced && duration > 0;
    outgoing.set(animate ? previous : undefined);
    wasEnabled = open;
    progress.setValue(animate ? 0 : 1);
    if (!animate) {
      previous = item;
      return;
    }
    const loaded = ready();
    if (waitForLoad && (!loaded || !same(loaded, item!))) return;
    const animation = Animated.timing(progress, {
      toValue: 1, duration, easing: Easing.inOut(Easing.cubic), useNativeDriver: true, isInteraction: false,
    });
    let active = true;
    animation.start(({ finished }) => {
      if (active && finished && !destroy.destroyed) {
        previous = item;
        outgoing.set(undefined);
      }
    });
    onCleanup(() => { active = false; animation.stop(); });
  });
  destroy.onDestroy(() => progress.stopAnimation());
  return {
    outgoing,
    loaded: (item: T) => ready.set(item),
    incomingStyle: { opacity: progress },
    outgoingStyle: { opacity: progress.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) },
    settledStyle: { opacity: 1 },
  };
}
