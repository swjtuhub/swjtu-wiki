import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

// Validate the checked-in migration inventory without requiring the upstream clone.
const report = JSON.parse(fs.readFileSync('scripts/migration-manifest.json', 'utf8'));
const missing = [];
for (const entry of report.generated) {
  if (!fs.existsSync(entry.output)) missing.push(`article: ${entry.output}`);
  for (const route of entry.legacyPaths) {
    if (!fs.existsSync(path.join('dist', route, 'index.html'))) missing.push(`route: ${route}`);
  }
}
for (const entry of report.managed) {
  if (!fs.existsSync(path.join('dist', entry.route, 'index.html'))) missing.push(`managed route: ${entry.route}`);
}
assert.equal(report.generated.length + report.managed.length, report.totalSources, 'Incomplete migration inventory');
console.log(JSON.stringify({originalSources:report.totalSources, migratedArticles:report.generated.length, managedPages:report.managed.length, missing}, null, 2));
if (missing.length) process.exitCode = 1;
