import { createRequire } from 'node:module';
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  realpathSync,
  writeFileSync,
} from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve, join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { withTemporaryWorkspace } from './temporary-workspace.mjs';
const root = process.cwd();
const report = withTemporaryWorkspace('neural-native-consumer-', directory => {
const env = { ...process.env, EXPO_NO_TELEMETRY: '1', CI: 'true', TMPDIR: directory, TMP: directory, TEMP: directory, NODE_COMPILE_CACHE: join(directory, 'node-compile-cache') };
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
function run(command, args, cwd) {
  const result = spawnSync(command, args, {
    cwd,
    env,
    encoding: 'utf8',
    timeout: 240000,
    maxBuffer: 20 * 1024 * 1024,
  });
  const log = (result.stdout ?? '') + (result.stderr ?? '');
  writeFileSync(join(directory, 'last-command.log'), log);
  if (result.status !== 0)
    throw new Error(command + ' ' + args.join(' ') + '\n' + log.slice(-6000));
  return result.stdout;
}
const packed = JSON.parse(
  run(
    npm,
    ['pack', './packages/native', '--json', '--pack-destination', directory],
    root,
  ),
)[0];
if (
  packed.files.some((f) =>
    /src\/|test\.ts|tsbuildinfo|node_modules/.test(f.path),
  )
)
  throw new Error('Unexpected files in packed library');
const consumer = join(directory, 'app');
cpSync(join(root, 'apps/consumer-test'), consumer, {
  recursive: true,
  filter: (file) => !/node_modules|\.expo|dist/.test(file),
});
// Compile, render and bundle every public catalogue entry from the tarball.
// The examples import the package API; no library source is copied here.
for (const file of ['catalogue.ts', 'catalogue-data.ts', 'slot-demos.ts', 'catalogue.test.ts']) {
  cpSync(join(root, 'apps/showcase/src/app', file), join(consumer, 'src/app', file));
}
const consumerApp = join(consumer, 'src/app/app.ts');
const appSource = readFileSync(consumerApp, 'utf8');
if (!appSource.includes('    CatalogueConsumer,') || !appSource.includes('<catalogue-consumer/>')) {
  throw new Error('Consumer catalogue insertion points changed');
}
writeFileSync(consumerApp,
  "import { NativeCatalogueComponent } from './catalogue.js';\n" + appSource
    .replace('    CatalogueConsumer,', '    CatalogueConsumer,\n    NativeCatalogueComponent,')
    .replace('<catalogue-consumer/>', '<catalogue-consumer/><native-catalogue/>'),
);
const manifest = JSON.parse(
  readFileSync(join(consumer, 'package.json'), 'utf8'),
);
delete manifest.nx;
manifest.dependencies['@neural-ui/native'] =
  'file:' + join(directory, packed.filename);
manifest.dependencies['@ng-native/icons'] = JSON.parse(
  readFileSync(join(root, 'packages/native/package.json'), 'utf8'),
).peerDependencies['@ng-native/icons'];
manifest.dependencies['@ng-icons/core'] = JSON.parse(
  readFileSync(join(root, 'node_modules/@ng-icons/core/package.json'), 'utf8'),
).version;
manifest.dependencies['react-native-svg'] = '15.15.4';
manifest.dependencies.rxjs = JSON.parse(
  readFileSync(join(root, 'node_modules/rxjs/package.json'), 'utf8'),
).version;
manifest.devDependencies.typescript = '6.0.3';
// Vitest's Vite peer must remain available even when npm's peer resolver is
// bypassed for an isolated consumer. Use the exact already-tested local version.
manifest.devDependencies.vite = JSON.parse(
  readFileSync(createRequire(join(root, 'packages/native/package.json')).resolve('vite/package.json'), 'utf8'),
).version;
writeFileSync(
  join(consumer, 'package.json'),
  JSON.stringify(manifest, null, 2),
);
writeFileSync(
  join(consumer, 'metro.config.js'),
  "const { getDefaultConfig } = require('expo/metro-config');\nconst { withAngularNative } = require('@ng-native/metro/config.cjs');\nmodule.exports = withAngularNative(getDefaultConfig(__dirname));\n",
);
writeFileSync(
  join(consumer, 'tsconfig.json'),
  JSON.stringify(
    {
      compilerOptions: {
        target: 'es2022',
        module: 'nodenext',
        moduleResolution: 'nodenext',
        strict: true,
        skipLibCheck: true,
        noEmit: true,
        allowImportingTsExtensions: true,
        experimentalDecorators: true,
      },
      angularCompilerOptions: {
        strictTemplates: true,
        typeCheckHostBindings: false,
        strictDomEventTypes: false,
      },
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts'],
    },
    null,
    2,
  ),
);
run(
  npm,
  // All framework dependencies and required peers above are explicit. Avoid
  // npm 10's edgesOut crash while resolving this fresh, isolated fixture.
  ['install', '--no-audit', '--no-fund', '--workspaces=false', '--legacy-peer-deps'],
  consumer,
);
const library = realpathSync(join(consumer, 'node_modules/@neural-ui/native'));
if (!library.startsWith(realpathSync(directory)))
  throw new Error('Consumer is using a workspace library');
run(
  process.execPath,
  [
    'node_modules/@angular/compiler-cli/bundles/src/bin/ngc.js',
    '-p',
    'tsconfig.json',
  ],
  consumer,
);
const testLog = run(npm, ['exec', '--', 'vitest', 'run'], consumer);
const bundleLog =
  run(
    npm,
    [
      'exec',
      '--',
      'expo',
      'export',
      '--platform',
      'ios',
      '--output-dir',
      'bundle/ios',
    ],
    consumer,
  ) +
  run(
    npm,
    [
      'exec',
      '--',
      'expo',
      'export',
      '--platform',
      'android',
      '--output-dir',
      'bundle/android',
    ],
    consumer,
  );
const report = {
  package: packed.filename,
  packageSha256: createHash('sha256').update(readFileSync(join(directory, packed.filename))).digest('hex'),
  size: packed.size,
  unpackedSize: packed.unpackedSize,
  files: packed.files.length,
  consumerDirectory: consumer,
  libraryDirectory: library,
  typecheck: 'passed',
  nativeInteractionAndStyles: 'passed',
  catalogueExamples: JSON.parse(readFileSync(join(root, 'docs/components.json'), 'utf8')).length,
  iosBundle: 'passed',
  androidBundle: 'passed',
  nativeDeviceValidation: 'separate',
  testSummary: testLog.split('\n').filter((l) => /passed|Tests/.test(l)),
  bundleSummary: bundleLog
    .split('\n')
    .filter((l) => /bundle|Exported|assets/.test(l))
    .slice(-10),
};
return report;
}, {
  reportFile: join(root, 'reports/consumer-temporaries.json'),
  beforeCleanup: directory => {
    mkdirSync(join(root, 'reports'), { recursive: true });
    if (existsSync(join(directory, 'last-command.log'))) {
      cpSync(join(directory, 'last-command.log'), join(root, 'reports/consumer-last-command.log'));
    }
    const packageFile = readdirSync(directory).find(file => file.endsWith('.tgz'));
    if (packageFile) cpSync(join(directory, packageFile), join(root, 'reports/consumer-artifact.tgz'));
  },
});
report.temporaryConsumerRemoved = true;
mkdirSync(join(root, 'reports'), { recursive: true });
writeFileSync(
  join(root, 'reports/consumer.json'),
  JSON.stringify(report, null, 2),
);
console.log(JSON.stringify(report, null, 2));
