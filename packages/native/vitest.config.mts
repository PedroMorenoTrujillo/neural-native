import { ngNative } from '@ng-native/testing/vitest';
import { defineConfig } from 'vitest/config';
import { createRequire } from 'node:module';
import path from 'node:path';
const require = createRequire(import.meta.url);
// Exercise the framework's browser animation graph in Node; native motion is checked on devices.
const animations = path.join(path.dirname(require.resolve('@ng-native/components/package.json')), 'dist/animations-web.js');
export default defineConfig({
  plugins: [ngNative()],
  resolve: { alias: [{ find: /^@ng-native\/components\/animations$/, replacement: animations }] },
  test: {
    include: ['src/**/*.test.ts'],
    testTimeout: 10000,
    setupFiles: ['./test/setup-motion.mjs'],
    coverage: {
      enabled: true,
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/**/*.d.ts'],
      reportsDirectory: '../../coverage/native',
      reporter: ['text', 'json-summary', 'json', 'html'],
      thresholds: { lines: 95, statements: 95, functions: 95, branches: 95 },
    },
  },
});
