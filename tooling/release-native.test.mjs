import test from 'node:test';
import assert from 'node:assert/strict';
import { assertReleaseActor, releaseIdentity } from './release-native.mjs';

test('only the maintainer can initiate or retry publication', () => {
  assert.doesNotThrow(() => assertReleaseActor('PedroMorenoTrujillo', 'PedroMorenoTrujillo'));
  for (const [actor, retry] of [
    ['contributor', 'contributor'], ['PedroMorenoTrujillo', 'contributor'],
    ['contributor', 'PedroMorenoTrujillo'], ['github-actions[bot]', 'PedroMorenoTrujillo'],
    [undefined, undefined], ['PedroMorenoTrujillo', undefined],
  ]) assert.throws(() => assertReleaseActor(actor, retry));
});

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
