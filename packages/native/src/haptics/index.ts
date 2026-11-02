import { InjectionToken, inject, makeEnvironmentProviders, type EnvironmentProviders } from '@angular/core';
import { requireOptionalNativeModule } from 'expo-modules-core';
import {
  NEU_HAPTICS_DRIVER, NEU_HAPTICS_OPTIONS,
  type NeuHapticsDriver, type NeuHapticsOptions, type NeuHapticImpact,
} from '../foundation/haptics.js';

export * from '../foundation/haptics.js';

export interface NeuNativeHaptics {
  impactAsync(style: NeuHapticImpact): Promise<void>;
  notificationAsync(type: 'success' | 'warning' | 'error'): Promise<void>;
  selectionAsync(): Promise<void>;
}
/** The same optional native boundary used by Angular Native's Haptics service. */
export const NEU_NATIVE_HAPTICS = new InjectionToken<NeuNativeHaptics | null>('Neural native haptics module', {
  providedIn: 'root',
  factory: () => {
    try { return requireOptionalNativeModule<NeuNativeHaptics>('ExpoHaptics'); }
    catch { return null; }
  },
});

/** Import this optional entry point only after installing expo-haptics and rebuilding the app. */
export function provideNeuHaptics(options: NeuHapticsOptions = {}): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: NEU_HAPTICS_OPTIONS, useValue: { ...options, enabled: options.enabled ?? true } },
    { provide: NEU_HAPTICS_DRIVER, useFactory: (): NeuHapticsDriver => {
      const native = inject(NEU_NATIVE_HAPTICS);
      return {
        available: () => native !== null,
        play: feedback => {
          if (feedback === 'selection') return native?.selectionAsync();
          if (feedback === 'success' || feedback === 'warning' || feedback === 'error') return native?.notificationAsync(feedback);
          return native?.impactAsync(feedback);
        },
      };
    } },
  ]);
}
