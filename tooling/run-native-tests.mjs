import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { withTemporaryWorkspace } from './temporary-workspace.mjs';

const cwd = process.cwd(), require = createRequire(join(cwd, 'package.json'));
const vitest = join(dirname(require.resolve('vitest/package.json')), 'vitest.mjs');
let exitCode = 1;
try {
  withTemporaryWorkspace('neural-native-vitest-', directory => {
    const result = spawnSync(process.execPath, [vitest, 'run', ...process.argv.slice(2)], {
      cwd,
      env: { ...process.env, TMPDIR: directory, TMP: directory, TEMP: directory, NODE_COMPILE_CACHE: join(directory, 'node-compile-cache') },
      stdio: 'inherit', timeout: 240000,
    });
    exitCode = result.status ?? 1;
    if (result.error) throw result.error;
    if (exitCode !== 0) throw new Error(`Vitest exited with status ${exitCode}`);
  }, { reportFile: resolve(cwd, '../../reports/test-temporaries.json') });
} catch (error) { console.error(error.message); process.exitCode = exitCode || 1; }
