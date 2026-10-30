# Changelog

## 0.1.0-beta.4 — Unreleased

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
