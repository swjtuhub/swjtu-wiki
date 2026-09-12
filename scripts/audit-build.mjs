import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve('dist');

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory()
      ? walk(path.join(directory, entry.name))
      : [path.join(directory, entry.name)],
  );
}

const htmlFiles = walk(root).filter((file) => file.endsWith('.html'));
const missing = [];
let internalReferences = 0;

for (const file of htmlFiles) {
  const html = fs.readFileSync(file, 'utf8');

  for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const raw = match[1];
    if (
      !raw ||
      raw.startsWith('#') ||
      /^(?:https?:|mailto:|tel:|data:|javascript:|\/\/)/.test(raw)
    ) {
      continue;
    }

    internalReferences += 1;
    const encodedPath = raw.split(/[?#]/)[0];
    if (!encodedPath) continue;

    let cleanPath = encodedPath;
    try {
      cleanPath = decodeURIComponent(encodedPath);
    } catch {
      // Keep the encoded path when a legacy URL is not valid URI syntax.
    }

    const target = cleanPath.startsWith('/')
      ? path.join(root, cleanPath)
      : path.resolve(path.dirname(file), cleanPath);
    const candidates = [target, `${target}.html`, path.join(target, 'index.html')];

    if (!candidates.some((candidate) => fs.existsSync(candidate))) {
      missing.push(`${path.relative(root, file)} -> ${raw}`);
    }
  }
}

const uniqueMissing = [...new Set(missing)];
console.log(
  JSON.stringify(
    {
      htmlPages: htmlFiles.length,
      internalReferences,
      missing: uniqueMissing,
    },
    null,
    2,
  ),
);

if (uniqueMissing.length > 0) process.exitCode = 1;
