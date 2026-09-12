import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Snapshot the two local, unpublished packages so a Sites checkout is self-contained.
// Run explicitly after updating either sibling theme, before validating a release.
const project = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
for (const name of ['material-astro-theme', 'material-wiki-theme']) {
  const source = path.resolve(project, '..', name);
  if (!fs.existsSync(path.join(source, 'package.json'))) {
    throw new Error(`Sibling theme not found: ${name}; use the committed vendor snapshot on standalone checkouts.`);
  }
  const destination = path.join(project, 'vendor', name);
  fs.mkdirSync(destination, { recursive: true });
  for (const entry of ['package.json', 'README.md', 'src']) {
    fs.cpSync(path.join(source, entry), path.join(destination, entry), { recursive: true });
  }
  console.log(`Synced ${name}`);
}
