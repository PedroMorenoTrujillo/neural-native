import { existsSync, lstatSync, mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

function usage(directory) {
  const pending = [directory], seen = new Set();
  let files = 0, bytes = 0, allocatedBytes = 0;
  while (pending.length) {
    const path = pending.pop(), stat = lstatSync(path), key = `${stat.dev}:${stat.ino}`;
    if (seen.has(key)) continue;
    seen.add(key);
    allocatedBytes += stat.blocks * 512;
    if (stat.isSymbolicLink()) continue;
    if (stat.isDirectory()) {
      for (const name of readdirSync(path)) pending.push(join(path, name));
    } else { files++; bytes += stat.size; }
  }
  return { files, bytes, allocatedBytes };
}

/** Own one workspace per invocation; never purge shared caches or other runs. */
export function withTemporaryWorkspace(prefix, work, { parent = tmpdir(), reportFile, beforeCleanup } = {}) {
  if (!/^neural-native-[a-z-]+-$/.test(prefix)) throw new Error('Use a scoped Neural Native temporary prefix');
  const directory = mkdtempSync(join(parent, prefix)), startedAt = new Date().toISOString();
  let status = 'failed';
  try {
    const result = work(directory);
    if (result?.then) throw new Error('Temporary workspace work must be synchronous');
    status = 'passed';
    return result;
  } finally {
    let remaining = null, failure;
    try { beforeCleanup?.(directory); remaining = usage(directory); } catch (error) { failure = error; }
    try { rmSync(directory, { recursive: true, force: true }); } finally {
      const report = { startedAt, finishedAt: new Date().toISOString(), status, directory, beforeCleanup: remaining, removed: !existsSync(directory) };
      if (reportFile) {
        mkdirSync(dirname(reportFile), { recursive: true });
        writeFileSync(reportFile, JSON.stringify(report, null, 2) + '\n');
      }
    }
    if (failure) throw failure;
  }
}
