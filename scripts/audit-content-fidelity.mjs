import { readFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';
import { promisify } from 'node:util';

const args = process.argv.slice(2);
const sourceIndex = args.indexOf('--source');
const sourceRefIndex = args.indexOf('--source-ref');
const source = sourceIndex >= 0 ? path.resolve(args[sourceIndex + 1]) : undefined;
const sourceRef = sourceRefIndex >= 0 ? args[sourceRefIndex + 1] : undefined;
const run = promisify(execFile);
if ((!source || sourceIndex < 0) && (!sourceRef || sourceRefIndex < 0)) {
  console.error('Usage: npm run audit:content -- --source /path/to/vuepress/docs | --source-ref origin/master');
  process.exit(1);
}

const report = JSON.parse(await readFile('scripts/migration-manifest.json', 'utf8'));
const differences = [];

async function readSource(relative) {
  if (source) return readFile(path.join(source, relative), 'utf8');
  const { stdout } = await run('git', ['show', `${sourceRef}:docs/${relative}`], { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
  return stdout;
}

function bodyOf(markdown) {
  return markdown.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '');
}

function clean(body) {
  return body.replace(/<!--\s*markdownlint-disable[^>]*-->/gi, '').trim();
}

for (const entry of report.generated) {
  const upstream = clean(bodyOf(await readSource(entry.source)));
  const migrated = clean(bodyOf(await readFile(path.resolve(entry.output), 'utf8')));
  const withoutRepeatedTitle = upstream.replace(/^#\s+.+?\s*(?:\r?\n)+/, '').trim();

  if (migrated !== upstream && migrated !== withoutRepeatedTitle) {
    differences.push(entry.source);
  }
}

console.log(JSON.stringify({
  migratedArticles: report.generated.length,
  exactArticleBodies: report.generated.length - differences.length,
  differences,
}, null, 2));

if (differences.length > 0) process.exitCode = 1;
