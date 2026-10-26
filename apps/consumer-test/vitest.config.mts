import { ngNative } from '@ng-native/testing/vitest';
import { defineConfig } from 'vitest/config';
import { createRequire } from 'node:module';
import path from 'node:path';
const require = createRequire(import.meta.url);
// Node cannot load the native animation driver. Device runs verify native motion.
const animations = path.join(path.dirname(require.resolve('@ng-native/components/package.json')), 'dist/animations-web.js');
export default defineConfig({ plugins: [ngNative({ inline: ['@neural-ui/native'] })], resolve: { alias: [{ find: /^@ng-native\/components\/animations$/, replacement: animations }] }, test: { include: ['src/**/*.test.ts'], setupFiles: ['./test/setup-motion.mjs'] } });
