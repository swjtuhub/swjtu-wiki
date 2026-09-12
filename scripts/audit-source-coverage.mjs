import { createHash } from 'node:crypto';
import { execFile } from 'node:child_process';
import { readFile, readdir, stat } from 'node:fs/promises';
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
  console.error('Usage: npm run audit:source -- --source /path/to/vuepress/docs | --source-ref origin/master');
  process.exit(1);
}

async function walk(directory, predicate = () => true) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(absolute, predicate));
    else if (predicate(absolute)) files.push(absolute);
  }
  return files;
}

function relativeTo(root, file) {
  return path.relative(root, file).split(path.sep).join('/');
}

function routeFile(route) {
  const clean = route.replace(/^\/+|\/+$/g, '');
  return path.resolve('dist', clean, 'index.html');
}

function digest(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

if (source) {
  await stat(source).catch(() => {
    console.error(`Source directory does not exist: ${source}`);
    process.exit(1);
  });
}

async function sourceFiles() {
  if (source) {
    return (await walk(source)).map((file) => relativeTo(source, file));
  }
  const { stdout } = await run('git', ['-c', 'core.quotepath=false', 'ls-tree', '-r', '--name-only', sourceRef, '--', 'docs'], { maxBuffer: 16 * 1024 * 1024 });
  return stdout.split(/\r?\n/).filter(Boolean).map((file) => file.replace(/^docs\//, ''));
}

async function sourceBuffer(relative) {
  if (source) return readFile(path.join(source, relative));
  const { stdout } = await run('git', ['show', `${sourceRef}:docs/${relative}`], { encoding: 'buffer', maxBuffer: 64 * 1024 * 1024 });
  return stdout;
}

const report = JSON.parse(await readFile('scripts/migration-manifest.json', 'utf8'));
const customizedPublicAssets = new Set(['html/supervisor.html']);
const upstreamFiles = await sourceFiles();
const expectedSources = new Set(upstreamFiles.filter((file) => file.endsWith('.md')));
const mappedSources = new Set([
  ...report.generated.map((entry) => entry.source),
  ...report.managed.map((entry) => entry.source),
]);
const missing = [];

for (const file of expectedSources) {
  if (!mappedSources.has(file)) missing.push(`unmapped Markdown: ${file}`);
}
for (const entry of report.generated) {
  if (!expectedSources.has(entry.source)) missing.push(`stale report source: ${entry.source}`);
  if (!(await stat(path.resolve(entry.output)).catch(() => undefined))) missing.push(`missing migrated article: ${entry.output}`);
  for (const route of entry.legacyPaths) {
    if (!(await stat(routeFile(route)).catch(() => undefined))) missing.push(`missing legacy route: ${route}`);
  }
}
for (const entry of report.managed) {
  if (!(await stat(routeFile(entry.route)).catch(() => undefined))) missing.push(`missing managed route: ${entry.route}`);
}

const publicFiles = upstreamFiles.filter((file) => file.startsWith('.vuepress/public/'));
for (const upstreamFile of publicFiles) {
  const relative = upstreamFile.replace(/^\.vuepress\/public\//, '');
  const replacementFile = path.resolve('public', relative);
  const replacement = await readFile(replacementFile).catch(() => undefined);
  if (!replacement) {
    missing.push(`missing public asset: ${relative}`);
    continue;
  }
  const upstream = await sourceBuffer(upstreamFile);
  if (digest(upstream) !== digest(replacement) && !customizedPublicAssets.has(relative)) {
    missing.push(`changed upstream asset: ${relative}`);
  }
}

const result = {
  markdownSources: expectedSources.size,
  generatedArticles: report.generated.length,
  managedPages: report.managed.length,
  publicAssets: publicFiles.length,
  customizedPublicAssets: customizedPublicAssets.size,
  unmappedPages: report.skipped.length,
  missing,
};
console.log(JSON.stringify(result, null, 2));

if (mappedSources.size !== expectedSources.size || report.skipped.length > 0 || missing.length > 0) {
  process.exitCode = 1;
}
