import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { main as verifyRelease } from './release-native.mjs';

export function publicationDecision(status, published, release, archive) {
  if (status === 404) return 'publish';
  if (status !== 200) throw new Error(`Cannot establish npm publication state: HTTP ${status}`);
  const integrity = 'sha512-' + createHash('sha512').update(archive).digest('base64');
  if (published?.name !== release.name || published.version !== release.version || published.dist?.integrity !== integrity) {
    throw new Error('Existing npm version differs from the verified release archive');
  }
  return 'reuse';
}

async function publish() {
  verifyRelease('verify');
  const directory = path.resolve(import.meta.dirname, '../artifacts/release');
  const release = JSON.parse(fs.readFileSync(path.join(directory, 'release-manifest.json')));
  const file = path.join(directory, release.file);
  const response = await fetch(`https://registry.npmjs.org/${encodeURIComponent(release.name)}/${release.version}`, {
    signal: AbortSignal.timeout(30_000),
  });
  const published = response.status === 200 ? await response.json() : null;
  const decision = publicationDecision(response.status, published, release, fs.readFileSync(file));
  if (decision === 'reuse') {
    console.log(`The exact ${release.name}@${release.version} archive is already published; continuing the remaining release steps.`);
    return;
  }
  execFileSync('npm', ['publish', file, '--access', 'public', '--tag', release.channel, '--provenance'], {
    stdio: 'inherit', timeout: 5 * 60_000,
  });
}

if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) await publish();
