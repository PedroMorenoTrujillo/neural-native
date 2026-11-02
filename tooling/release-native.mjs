import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

export function assertReleaseActor(actor, triggeringActor) {
  if (actor !== 'PedroMorenoTrujillo' || triggeringActor !== 'PedroMorenoTrujillo') {
    throw new Error('Only PedroMorenoTrujillo may publish or retry a Native release');
  }
}

export function releaseIdentity(tag, version) {
  if (!/^v\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(tag ?? '') || tag !== `v${version}`) {
    throw new Error('Release tag must exactly match the package version');
  }
  const channel = version.includes('-') ? version.split('-')[1].split('.')[0] : 'latest';
  if (!/^[a-z][a-z0-9-]*$/.test(channel)) throw new Error('Unsupported npm distribution channel');
  return { version, tag, channel };
}

const root = path.resolve(import.meta.dirname, '..');
const sha = file => createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const read = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
function identity() {
  if (process.env.GITHUB_ACTIONS === 'true') assertReleaseActor(process.env.GITHUB_ACTOR, process.env.GITHUB_TRIGGERING_ACTOR);
  if (process.env.GITHUB_REF_TYPE !== 'tag') throw new Error('Publishing requires a tag push');
  const pkg = read('packages/native/package.json');
  const release = releaseIdentity(process.env.GITHUB_REF_NAME, pkg.version);
  if (pkg.name !== '@neural-ui/native' || pkg.private) throw new Error('Unexpected public package');
  for (const file of ['package.json', 'apps/showcase/package.json', 'apps/consumer-test/package.json']) {
    const data = read(file);
    if ((file === 'package.json' ? data.version : data.dependencies[pkg.name]) !== pkg.version) throw new Error('Version mismatch: ' + file);
  }
  return { ...release, name: pkg.name };
}
function verify(file, manifest) {
  if (!fs.existsSync(file) || sha(file) !== manifest.sha256) throw new Error('Release archive checksum mismatch');
  const pkg = JSON.parse(execFileSync('tar', ['-xOf', file, 'package/package.json'], { encoding: 'utf8' }));
  if (pkg.name !== manifest.name || pkg.version !== manifest.version || pkg.private) throw new Error('Archive package identity mismatch');
  const names = execFileSync('tar', ['-tzf', file], { encoding: 'utf8' }).trim().split('\n');
  if (names.some(name => name.split('/').includes('..') || !/^package\/(?:dist\/|README\.md$|LICENSE$|package\.json$)/.test(name))) throw new Error('Unexpected file in public npm archive');
  const readme = execFileSync('tar', ['-xOf', file, 'package/README.md'], { encoding: 'utf8' });
  if (!readme.includes(manifest.version) || !readme.includes('https://ng-native.com')) throw new Error('Published README must name the release and official framework documentation');
}
export function main(command) {
  const release = identity();
  const directory = path.join(root, 'artifacts/release');
  if (command === 'identity') { console.log(JSON.stringify(release)); return; }
  if (command === 'prepare') {
    fs.mkdirSync(directory, { recursive: true });
    const result = JSON.parse(execFileSync('npm', ['pack', './packages/native', '--pack-destination', directory, '--json'], { cwd: root, encoding: 'utf8', maxBuffer: 4e6 }))[0];
    const file = path.join(directory, result.filename);
    const manifest = { ...release, file: result.filename, sha256: sha(file), commit: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim() };
    verify(file, manifest);
    fs.writeFileSync(path.join(directory, 'release-manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  } else if (command !== 'verify') throw new Error('Use identity, prepare or verify');
  const manifest = read('artifacts/release/release-manifest.json');
  for (const key of ['name', 'version', 'tag', 'channel']) if (manifest[key] !== release[key]) throw new Error('Manifest identity mismatch: ' + key);
  if (manifest.commit !== execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim()) throw new Error('Manifest was built from another commit');
  if (path.basename(manifest.file) !== manifest.file) throw new Error('Invalid release file path');
  verify(path.join(directory, manifest.file), manifest);
  if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `version=${release.version}\nchannel=${release.channel}\nfile=artifacts/release/${manifest.file}\n`);
  console.log(JSON.stringify({ verified: true, ...release, sha256: manifest.sha256 }));
}
if (process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url) main(process.argv[2]);
