import test from 'node:test';
import assert from 'node:assert/strict';
import { releaseIdentity } from './release-native.mjs';

test('native release tag exactly selects its declared stable or prerelease version', () => {
  assert.deepEqual(releaseIdentity('v0.1.0-beta.5', '0.1.0-beta.5'), { tag: 'v0.1.0-beta.5', version: '0.1.0-beta.5', channel: 'beta' });
  assert.equal(releaseIdentity('v1.0.0', '1.0.0').channel, 'latest');
  assert.equal(releaseIdentity('v1.0.0-rc.1', '1.0.0-rc.1').channel, 'rc');
});
test('branch names, mismatched tags and unsupported channels cannot authorize publishing', () => {
  for (const [tag, version] of [['main', '1.0.0'], ['v1.0.1', '1.0.0'], [undefined, '1.0.0'], ['v1.0.0; echo bad', '1.0.0'], ['v1.0.0-1', '1.0.0-1']]) {
    assert.throws(() => releaseIdentity(tag, version));
  }
});
