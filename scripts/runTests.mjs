import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

console.log('🧪 Pinch (핀치) Comprehensive Test Suite');
console.log('========================================');

const testsDir = join(process.cwd(), '__tests__');
const files = readdirSync(testsDir)
  .filter((f) => f.endsWith('.test.ts') || f.endsWith('.test.js'))
  .map((f) => join(testsDir, f));

for (const file of files) {
  console.log(`Loading test suite: ${file.split(/[/\\]/).pop()}`);
  await import(pathToFileURL(file).href);
}
console.log('All test suites imported successfully!\n');
