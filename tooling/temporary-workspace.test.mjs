import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { withTemporaryWorkspace } from './temporary-workspace.mjs';

function fixture(work) {
  const parent = mkdtempSync(join(tmpdir(), 'neural-native-hygiene-unit-'));
  try { work(parent); } finally { rmSync(parent, { recursive: true, force: true }); }
}
test('completed work is measured and removed; its report survives', () => fixture(parent => {
  const reportFile = join(parent, 'report.json');
  const result = withTemporaryWorkspace('neural-native-unit-', directory => {
    writeFileSync(join(directory, 'module.mjs'), 'export const value = 1;'); return 42;
  }, { parent, reportFile });
  const report = JSON.parse(readFileSync(reportFile));
  assert.equal(result, 42); assert.equal(report.status, 'passed');
  assert.equal(report.beforeCleanup.files, 1); assert.ok(report.beforeCleanup.bytes > 0);
  assert.equal(report.removed, true); assert.equal(existsSync(report.directory), false);
}));
test('failure removes partial files and preserves the original error', () => fixture(parent => {
  const reportFile = join(parent, 'report.json'), failure = new Error('consumer failed');
  assert.throws(() => withTemporaryWorkspace('neural-native-unit-', directory => {
    writeFileSync(join(directory, 'partial'), 'data'); throw failure;
  }, { parent, reportFile }), error => error === failure);
  const report = JSON.parse(readFileSync(reportFile));
  assert.equal(report.status, 'failed'); assert.equal(report.removed, true);
}));
test('cleanup leaves external symlink targets intact', () => fixture(parent => {
  const external = join(parent, 'keep.txt'); writeFileSync(external, 'keep');
  withTemporaryWorkspace('neural-native-unit-', directory => symlinkSync(external, join(directory, 'link')), { parent });
  assert.equal(readFileSync(external, 'utf8'), 'keep');
}));
test('diagnostics can survive a failed consumer', () => fixture(parent => {
  const saved = join(parent, 'saved.log');
  assert.throws(() => withTemporaryWorkspace('neural-native-unit-', directory => {
    writeFileSync(join(directory, 'last.log'), 'useful failure'); throw new Error('failed');
  }, { parent, beforeCleanup: directory => writeFileSync(saved, readFileSync(join(directory, 'last.log'))) }));
  assert.equal(readFileSync(saved, 'utf8'), 'useful failure'); assert.deepEqual(readdirSync(parent), ['saved.log']);
}));
test('diagnostic preservation failure still cleans the owned workspace', () => fixture(parent => {
  assert.throws(() => withTemporaryWorkspace('neural-native-unit-', () => {}, {
    parent, beforeCleanup: () => { throw new Error('cannot preserve'); },
  }), /cannot preserve/);
  assert.deepEqual(readdirSync(parent), []);
}));
test('unscoped prefixes cannot create a cleanup target', () => fixture(parent => {
  assert.throws(() => withTemporaryWorkspace('../other-', () => {}, { parent }), /scoped/);
  assert.deepEqual(readdirSync(parent), []);
}));
