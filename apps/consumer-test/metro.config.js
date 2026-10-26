const { withNxMetro } = require('@nx/expo');
const { getDefaultConfig } = require('expo/metro-config');
const { withAngularNative } = require('@ng-native/metro/config.cjs');

// withNxMetro resolves the workspace's libraries, through its tsconfig path aliases or its package
// manager's links, and watches them. withAngularNative registers the transformer that compiles
// Angular ahead of time, compiles each component's CSS into the sheet the engine reads, and adds
// the polyfills Angular needs before `@angular/core` is first evaluated. It goes on the outside,
// so its resolver can wrap Nx's: a library's `./lib/ui.js` import has to find `ui.ts`.
module.exports = withAngularNative(withNxMetro(getDefaultConfig(__dirname)));
