# Changelog

## 0.1.0-beta.13 - 2026-11-26

- Align with Angular Native 0.29.0 and accept patch releases in the 0.29.x series.

## 0.1.0-beta.11 - 2026-11-24

- Add the grouped `SectionList` with sticky headers and native pull-to-refresh on Android and iOS.
- Allow `DataView` to render long collections in a bounded virtual viewport while retaining its search, ordering and item templates.

## 0.1.0-beta.10 - 2026-11-23

- Align the supported Angular Native baseline with 0.27.0.

## 0.1.0-beta.9 — 2026-11-21

- Align framework dependencies and exact peer requirements with Angular Native 0.25.0, including the Angular 22.3 mount fix, Android color-scheme updates and virtual-list rendering improvements.
- Resolve the isolated package consumer with strict npm peer checks instead of the previous npm 10 workaround.

## 0.1.0-beta.8 — 2026-11-17

- Align framework dependencies and exact peer requirements with Angular Native 0.23.0.
- Check the service availability signal migration and explicit image resize modes across the component catalogue. The configurable Neural haptics adapter continues to use the optional Expo native module.

## 0.1.0-beta.7 — 2026-11-06

- Align framework dependencies and exact peer requirements with Angular Native 0.22.2, including upstream fixes for native input defaults, accessibility state, intrinsic flex layout and inherited color transitions.
- Keep Input Tags and Input Mask placeholders readable in light and dark appearances, including live theme changes and custom muted tokens, by setting their native placeholder color explicitly.
- Preserve the public component APIs and optional configurable haptics. Applications using Angular Native 0.21.0 should retain beta.6 until upgrading the framework.

## 0.1.0-beta.6 — 2026-11-04

- Align Angular Native dependencies and exact peer requirements with 0.21.0. Preserve the public component APIs and optional configurable haptics.

## 0.1.0-beta.5 — 2026-11-02

- Add opt-in, application-configurable haptic feedback through Expo's native module. Keep the adapter and native module optional; support runtime and per-control opt-out, selection-change guards and bounded repeated feedback.

- Size Gallery cells and mosaic columns from the measured container width, including after resizing and layout changes. Intrinsic image dimensions no longer make one column oversized and squeeze its neighbour on iOS and Android.

- Verify the packed candidate in standalone Android and iOS simulator apps: 64 UI components plus a haptics scenario, with actual native actions, real document selection and local upload error/retry checks. These tests do not certify physical vibration or server uploads.

## 0.1.0-beta.4 — 2026-10-30

- Align framework dependencies and exact peer requirements with Angular Native 0.19.2.
- Declare Babel 7 in the library's development dependencies, as recommended by Angular Native, so pnpm 10 does not satisfy React Native's peer with Angular compiler's Babel 8 and install duplicate Expo/React Native trees.
- Component APIs remain unchanged. Angular Native 0.19.2 also fixes native iOS refresh-control presentation, notification payloads and lazy-route provider identity.

## 0.1.0-beta.3 — 2026-10-28

- Align Angular Native dependencies and exact peer requirements with 0.19.1.
- Keep the showcase and consumer test applications on the same Neural Native workspace version so clean installations resolve the library correctly.
- Use React Native's public root tag type in the example applications, including compatibility with React Native 0.88.
- Update the installation guide and compatibility baseline for Angular Native 0.19.1.

## 0.1.0-beta.1

First public beta of Neural Native for Angular Native 0.18.2.

- 64 mobile component entries for actions, forms, selection, navigation, surfaces, data, media and feedback.
- Typed signal models, inputs and outputs, with modular package imports.
- Shared light, dark and system themes with typed token customization.
- Projected content and component-specific collection customization APIs.
- Native text editing, keyboard-aware presentations and editable numeric drafts.
- Accessible action labels, localized control labels and date formatting.
- Native example catalogue and tests for library and packaged-consumer behavior.

This beta targets the compatibility baseline documented in the README. APIs may change before 1.0.
