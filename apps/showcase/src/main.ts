// Expo's runtime: its fetch, whose response streams a body, and URL, TextDecoderStream and
// structuredClone. Metro runs it before this file only when something imports it, and nothing
// else does in a release build, which would then get React Native's fetch, with no body.
import 'expo';
import { requireOptionalNativeModule } from 'expo';
import { ErrorHandler } from '@angular/core';
import { AppRegistry, Image, Platform, processColor } from 'react-native';
import { mount } from '@ng-native/platform';
import {
  currentConditions,
  deviceTokens,
  watchConditions,
} from '@ng-native/device';
import {
  getFabricUIManager,
  registerPlatformComponents,
} from '@ng-native/fabric';
import { App } from './app/app.ts';
import {
  deviceValidationRequest,
  DeviceValidationErrorHandler,
  NativeDeviceValidationComponent,
} from './app/device-validation.js';

registerPlatformComponents(Platform.OS);

AppRegistry.registerRunnable(
  'main',
  ({
    rootTag,
    initialProps,
  }: {
    rootTag: number | string;
    initialProps?: { exp?: { initialUri?: string } };
  }) => {
    const validation = __DEV__
      ? deviceValidationRequest(initialProps?.exp?.initialUri)
      : null;
    const app = mount(
      Number(rootTag),
      validation ? NativeDeviceValidationComponent : App,
      getFabricUIManager(),
      {
        providers: validation
          ? [{ provide: ErrorHandler, useClass: DeviceValidationErrorHandler }]
          : [],
        inputs: validation ? { ...validation, platform: Platform.OS } : {},
        // Colours, as the integers the platform wants.
        processColor,
        // What `@media` resolves against. Without it every media query is false and a responsive
        // layout renders as its smallest case.
        conditions: currentConditions(),
        // Values only the device knows - the hairline width, which is a third of a point on a 3x
        // screen. Without it `1px` is what you get, and that is a visibly fat divider.
        tokens: deviceTokens(),
        // Turns a `require('./x.png')` into something native can load. Without it images are blank.
        resolveAssetSource: (value) => Image.resolveAssetSource(value as never),
      },
    );

    // Re-resolves the conditions when the device rotates or the theme changes. A rotation dirties
    // no component and no binding, so without this nothing re-renders and `dark:` stops following
    // the system switch.
    const stopWatching = watchConditions(app.engine);
    app.applicationRef.onDestroy(stopWatching);
    if (validation) {
      const menu = requireOptionalNativeModule<{ hideMenu?(): void }>(
        'ExpoDevMenu',
      );
      setTimeout(() => menu?.hideMenu?.(), 1000);
    }
  },
);
