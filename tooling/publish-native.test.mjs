import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import test from 'node:test';
import { publicationDecision } from './publish-native.mjs';

const archive = Buffer.from('verified npm archive');
const release = { name: '@neural-ui/native', version: '0.1.0-beta.6' };
const published = { ...release, dist: { integrity: 'sha512-' + createHash('sha512').update(archive).digest('base64') } };

test('only an explicit absent registry version permits a new publication', () => {
  assert.equal(publicationDecision(404, null, release, archive), 'publish');
  for (const status of [401, 403, 429, 500]) assert.throws(() => publicationDecision(status, null, release, archive), /publication state/);
});

test('a retry resumes after publication only for the identical immutable archive', () => {
  assert.equal(publicationDecision(200, published, release, archive), 'reuse');
  for (const changed of [null, { ...published, name: 'other' }, { ...published, version: '0.1.0-beta.5' }, { ...published, dist: {} }]) {
    assert.throws(() => publicationDecision(200, changed, release, archive), /differs/);
  }
  assert.throws(() => publicationDecision(200, published, release, Buffer.from('different archive')), /differs/);
});
