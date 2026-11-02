# Optional haptic feedback / Respuesta háptica opcional

Available from `@neural-ui/native@0.1.0-beta.5`. Earlier versions do not include this optional API.

Haptics are off unless the application installs and configures the adapter. Importing ordinary Neural components does not import the haptics adapter or require `expo-haptics`. The adapter uses Expo's optional native module boundary, also used by Angular Native's Haptics service.

```sh
npx expo install expo-haptics
```

Rebuild the native application after installing the module. In the Angular Native `mount()` options, add the provider:

```ts
import { provideNeuHaptics } from '@neural-ui/native/haptics';

// Inside mount(..., { providers: [...] }):
providers: [provideNeuHaptics({
  enabled: true,
  pressStyle: 'light',
  minimumIntervalMs: 80,
})]
```

Buttons and internal pressable actions use `pressStyle`. Checkbox, Switch, Radio and Slider use a selection tick when their user-controlled value changes. A selected radio, a slider already at its bound, disabled/readonly controls and programmatic model changes do not request an additional selection tick. The shared interval bounds repeated feedback during gestures.

Button, Icon Button, Checkbox, Switch, Radio and Slider accept a `haptic` input. Set `[haptic]="false"` to silence that control, or choose `selection`, `light`, `medium`, `heavy`, `soft`, `rigid`, `success`, `warning` or `error`. Ordinary controls do not infer that a business operation succeeded: the application explicitly requests notification feedback.

```ts
import { inject } from '@angular/core';
import { NeuHaptics } from '@neural-ui/native/haptics';

private readonly haptics = inject(NeuHaptics);

// After a real save succeeds:
this.haptics.play('success');

// For a user preference, without rebuilding or remounting controls:
this.haptics.enabled.set(false);
```

`available` means the native module is linked, not that a motor can currently vibrate. `play()` returns whether a request was dispatched. The operating system may suppress physical feedback; an unavailable module or a failed request does not block the control's action. The iOS simulator can validate module calls and UI behavior, but has no physical Taptic Engine to feel.

For a custom platform integration or tests, `NEU_HAPTICS_DRIVER` and `NEU_HAPTICS_OPTIONS` are also exported from `@neural-ui/native/foundation`; this entry point has no Expo dependency.

En español: la aplicación activa la háptica mediante `provideNeuHaptics()`, puede desactivarla en cualquier momento con `enabled.set(false)` y silenciar un control con `[haptic]="false"`. Los cambios programáticos no producen pulsos de selección. El playground comprueba llamadas al módulo nativo real; las pruebas de simulador no afirman medir una vibración física.

References: [Angular Native Haptics](https://ng-native.com/packages/expo/haptics), [Expo Haptics for SDK 57](https://docs.expo.dev/versions/v57.0.0/sdk/haptics/).
