import { mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
mkdirSync('artifacts', { recursive: true });
const result = spawnSync(
  process.platform === 'win32' ? 'npm.cmd' : 'npm',
  ['pack', './packages/native', '--pack-destination', 'artifacts'],
  { stdio: 'inherit' },
);
process.exitCode = result.status ?? 1;
