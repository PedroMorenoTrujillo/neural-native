import { Injectable, InjectionToken, inject, signal } from '@angular/core';

export type NeuHapticImpact = 'light' | 'medium' | 'heavy' | 'soft' | 'rigid';
export type NeuHapticFeedback = 'press' | 'selection' | NeuHapticImpact | 'success' | 'warning' | 'error';
export interface NeuHapticsOptions {
  /** Explicitly enabling a provider opts the application into feedback. */
  enabled?: boolean;
  /** Coalesce rapid feedback, including continuous sliders. Defaults to 80 ms. */
  minimumIntervalMs?: number;
  pressStyle?: NeuHapticImpact;
}
export interface NeuHapticsDriver {
  available(): boolean;
  play(feedback: Exclude<NeuHapticFeedback, 'press'>): void | Promise<void>;
}
export const NEU_HAPTICS_OPTIONS = new InjectionToken<NeuHapticsOptions>('Neural haptics options', {
  providedIn: 'root', factory: () => ({ enabled: false }),
});
/** Platform boundary, replaceable by consumers and contract tests. */
export const NEU_HAPTICS_DRIVER = new InjectionToken<NeuHapticsDriver | null>('Neural haptics driver', {
  providedIn: 'root', factory: () => null,
});

/** Optional feedback: a missing motor or failed vibration must never block an action. */
@Injectable({ providedIn: 'root' })
export class NeuHaptics {
  private readonly options = inject(NEU_HAPTICS_OPTIONS);
  private readonly driver = inject(NEU_HAPTICS_DRIVER);
  readonly enabled = signal(this.options.enabled ?? false);
  private lastAt = -Infinity;

  get available(): boolean {
    try { return this.driver?.available() ?? false; } catch { return false; }
  }

  /** True means a request was dispatched, not that hardware physically vibrated. */
  play(feedback: NeuHapticFeedback | false = 'press'): boolean {
    if (!feedback || !this.enabled() || !this.available || !this.driver) return false;
    const configured = this.options.minimumIntervalMs ?? 80;
    const interval = Number.isFinite(configured) ? Math.max(0, Math.min(1000, configured)) : 80;
    const now = Date.now();
    if (now >= this.lastAt && now - this.lastAt < interval) return false;
    try {
      const result = this.driver.play(feedback === 'press' ? (this.options.pressStyle ?? 'light') : feedback);
      this.lastAt = now;
      // A consumer-supplied asynchronous driver must not leak rejected promises.
      if (result) void Promise.resolve(result).catch(() => undefined);
      return true;
    } catch { return false; }
  }
}
