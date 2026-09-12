import { createHash } from 'node:crypto';
import { mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { parse, stringify } from 'yaml';

const args = process.argv.slice(2);
const valueAfter = (flag) => {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : undefined;
};
const sourceArg = valueAfter('--source');
const outputArg = valueAfter('--output') ?? './src/content/docs/zh-CN/migrated';

if (!sourceArg) {
  console.error('Usage: npm run content:migrate -- --source /path/to/vuepress/docs [--output ./src/content/docs/zh-CN/migrated]');
  process.exit(1);
}

const source = path.resolve(sourceArg);
const output = path.resolve(outputArg);

const sectionRules = [
  [/^01\.学习\/01\.推免\//, 'recommendation'],
  [/^01\.学习\/02\.转专业\//, 'major-transfer'],
  [/^01\.学习\/10\.评价信息\//, 'evaluation'],
  [/^02\.黄页\//, 'campus-services'],
  [/^03\.生活\//, 'campus-life'],
  [/^20\.专题\/01\.VIS\//, 'visual-identity'],
  [/^20\.专题\/02\.新生入学指南\//, 'freshman'],
  [/^11\.更多\//, 'community'],
];

const icons = {
  recommendation: 'workspace_premium',
  'major-transfer': 'swap_horiz',
  evaluation: 'fact_check',
  'campus-services': 'contact_phone',
  'campus-life': 'directions_bus',
  'visual-identity': 'palette',
  freshman: 'school',
  community: "diversity_3",
};

const managedPages = new Map([
  ["index.md", { kind: "home", route: "/zh-CN/" }],
  ["01.学习/01.推免/index.md", { kind: "section", route: "/zh-CN/sections/recommendation/" }],
  ["01.学习/02.转专业/index.md", { kind: "section", route: "/zh-CN/sections/major-transfer/" }],
  ["01.学习/10.评价信息/index.md", { kind: "section", route: "/zh-CN/sections/evaluation/" }],
  ["20.专题/01.VIS/index.md", { kind: "section", route: "/zh-CN/sections/visual-identity/" }],
  ["20.专题/02.新生入学指南/index.md", { kind: "section", route: "/zh-CN/sections/freshman/" }],
  ["20.专题/02.新生入学指南/20.社团组织介绍.md", { kind: "section", route: "/zh-CN/sections/freshman/" }],
  ["@pages/archivesPage.md", { kind: "archive", route: "/zh-CN/browse/archives/" }],
  ["@pages/categoriesPage.md", { kind: "categories", route: "/zh-CN/browse/categories/" }],
  ["@pages/tagsPage.md", { kind: "tags", route: "/zh-CN/browse/tags/" }],
  ["_content/01.学习.md", { kind: "catalog", route: "/zh-CN/" }],
  ["_content/02.黄页.md", { kind: "section", route: "/zh-CN/sections/campus-services/" }],
  ["_content/03.生活.md", { kind: "section", route: "/zh-CN/sections/campus-life/" }],
  ["_content/04.周边.md", { kind: "section", route: "/zh-CN/sections/campus-life/" }],
]);

const slugOverrides = new Map([
  ["free-analysis", "statistics"],
  ["free-contest", "competition-list"],
  ["free-major", "major-data"],
  ["exchange-major-exp-01", "computer-science-experience"],
  ["exchange-major-exp-02", "software-engineering-experience-2023"],
  ["exchange-major-exp-03", "software-engineering-experience-2025"],
  ["d2d231", "introduction"],
  ["ce3461", "transportation"],
  ["11231a", "dormitories"],
  ["1bcdf2", "organization-transfer"],
  ["6ef921", "campus-map"],
  ["2de403", "university-anthem"],
  ["vis-a", "foundation"],
  ["vis-b", "office-materials"],
  ["vis-c", "administrative-materials"],
  ["vis-d", "official-documents"],
  ["vis-e", "conferences"],
  ["vis-f", "public-relations-materials"],
  ["vis-g", "vehicles"],
  ["vis-h", "signage"],
  ["schoolbus", "shuttle-bus"],
  ["finance", "reimbursements"],
  ["groups", "group-chats"],
  ["post", "postal-and-delivery"],
  ["service", "logistics-services"],
  ["activity", "activities"],
  ["friends", "links"],
  ["course-grade", "course-grades"],
  ["supervisor", "supervisor-reviews"],
]);

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(absolute));
    else if (entry.name.endsWith('.md')) files.push(absolute);
  }
  return files;
}

function splitFrontmatter(sourceText) {
  const match = sourceText.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) return { data: {}, body: sourceText };
  return { data: parse(match[1]) ?? {}, body: sourceText.slice(match[0].length) };
}

function sectionFor(relative) {
  return sectionRules.find(([pattern]) => pattern.test(relative))?.[1];
}

function safeSlug(value) {
  const cleaned = value
    .replace(/^\/+|\/+$/g, '')
    .replace(/^pages\//, '')
    .replace(/[_\s]+/g, '-')
    .replace(/[^a-zA-Z0-9/-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^[-/]+|[-/]+$/g, '')
    .toLowerCase();
  return cleaned || createHash('sha1').update(value).digest('hex').slice(0, 10);
}

function textDescription(body, title) {
  const paragraph = body
    .split(/\r?\n\s*\r?\n/)
    .map((part) => part.trim())
    .find((part) => part && !part.startsWith('#') && !part.startsWith('<!--') && !part.startsWith('<') && !part.startsWith('![') && !part.startsWith('|'));
  const plain = (paragraph ?? title)
    .replace(/^:::[ \t]*[a-z][\w-]*(?:[ \t]+[^\r\n]+)?\r?\n?/i, "")
    .replace(/\r?\n?:::\s*$/, "")
    .replace(/<[^>]+>/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[*_`>#~-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return plain.slice(0, 180) || title;
}

function normalizeBody(body, title) {
  const withoutLint = body.replace(/<!--\s*markdownlint-disable[^>]*-->/gi, '').trim();
  const escaped = title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return withoutLint.replace(new RegExp(`^#\\s+${escaped}\\s*(?:\\r?\\n)+`, 'i'), '').trim() + '\n';
}

function array(value) {
  if (!value) return [];
  const values = Array.isArray(value) ? value : [value];
  return values.filter((item) => item != null && String(item).trim() && String(item).toLowerCase() !== "null").map(String);
}

await stat(source).catch(() => {
  console.error(`Source directory does not exist: ${source}`);
  process.exit(1);
});
await mkdir(output, { recursive: true });

const report = { totalSources: 0, generated: [], managed: [], skipped: [] };
for (const file of (await walk(source)).sort()) {
  const relative = path.relative(source, file).split(path.sep).join('/');
  const base = path.basename(file).toLowerCase();
  report.totalSources += 1;
  const section = sectionFor(relative);
  const managed = managedPages.get(relative);
  if (managed) {
    report.managed.push({ source: relative, ...managed });
    continue;
  }
  if (!section || base === 'index.md' || relative.startsWith('@pages/') || relative.startsWith('_content/')) {
    report.skipped.push(relative);
    continue;
  }

  const original = await readFile(file, 'utf8');
  const { data, body } = splitFrontmatter(original);
  const heading = body.match(/^#\s+(.+)$/m)?.[1]?.trim();
  const title = String(data.title ?? heading ?? path.basename(file, path.extname(file))).trim();
  const permalink = String(data.permalink ?? '').split('#')[0].trim();
  const legacyId = safeSlug(permalink || relative);
  const slugId = slugOverrides.get(legacyId) ?? legacyId;
  const slug = `${section}/${slugId}`;
  const orderMatch = path.basename(file).match(/^(\d+)/);
  const author = typeof data.author === 'object' ? data.author?.name : data.author;
  const updated = data.date ? new Date(data.date) : (await stat(file)).mtime;
  const legacyPaths = [
    ...(permalink ? [`/${permalink.replace(/^\/+|\/+$/g, '')}/`] : []),
    ...(slugId !== legacyId ? [`/zh-CN/docs/${section}/${legacyId}/`] : []),
  ];

  const frontmatter = {
    title,
    description: (() => { const value = textDescription(body, title); return value.length >= 12 ? value : 'SWJTU Wiki 资料页：' + title + '。请结合页面更新时间与官方来源核对信息。'; })(),
    locale: 'zh-CN',
    slug,
    translationKey: `legacy-${legacyId}`,
    section,
    order: orderMatch ? Number(orderMatch[1]) + 20 : 100,
    icon: icons[section],
    categories: [...new Set(array(data.categories))],
    tags: [...new Set(array(data.tags))],
    updatedDate: Number.isNaN(updated.getTime()) ? undefined : updated.toISOString().slice(0, 10),
    contributors: author ? [String(author)] : ['SWJTUHub'],
    featured: false,
    draft: false,
    legacyPaths,
    editPath: relative,
  };
  Object.keys(frontmatter).forEach((key) => frontmatter[key] === undefined && delete frontmatter[key]);

  const filename = `${slug.replaceAll('/', '__')}.md`;
  const destination = path.join(output, filename);
  const next = `---\n${stringify(frontmatter, { lineWidth: 0 }).trim()}\n---\n\n${normalizeBody(body, title)}`;
  await writeFile(destination, next, 'utf8');
  report.generated.push({ source: relative, output: path.relative(process.cwd(), destination), slug, legacyPaths });
}

const manifestPath = path.resolve('scripts/migration-manifest.json');
await writeFile(manifestPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
console.log(`[migrate] Generated ${report.generated.length} documents in ${output}`);
console.log("[migrate] Mapped " + report.managed.length + " VuePress-generated pages to Material routes.");
console.log("[migrate] Unmapped " + report.skipped.length + " unsupported pages.");
console.log(`[migrate] Review ${path.relative(process.cwd(), manifestPath)} before publishing.`);
