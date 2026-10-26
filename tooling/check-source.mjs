import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
const errors = [];
function walk(dir) {
  for (const item of readdirSync(dir, { withFileTypes: true })) {
    const file = join(dir, item.name);
    if (item.isDirectory()) walk(file);
    else if (file.endsWith('.ts') && !file.endsWith('.test.ts')) {
      const source = readFileSync(file, 'utf8');
      for (const forbidden of [
        '@neural-ui/core',
        'zone.js',
        'document.',
        'window.',
        '@angular/platform-browser',
      ])
        if (source.includes(forbidden))
          errors.push(file + ': forbidden platform dependency ' + forbidden);
      if (source.includes(': any') || source.includes('<any>'))
        errors.push(file + ': explicit any');
    }
  }
}
walk('packages/native/src');
if (errors.length) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
} else console.log('Native source policy checks passed.');
