import { rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
rmSync('packages/native/dist', { recursive: true, force: true });
const result = spawnSync(
  process.execPath,
  [
    'node_modules/@angular/compiler-cli/bundles/src/bin/ngc.js',
    '-p',
    'packages/native/tsconfig.build.json',
  ],
  { stdio: 'inherit' },
);
process.exitCode = result.status ?? 1;
