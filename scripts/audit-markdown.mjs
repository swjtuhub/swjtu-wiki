import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createMarkdownProcessor } from '@astrojs/markdown-remark';
import { parse } from 'yaml';
import { remarkM3, rehypeM3 } from '@m3-astro/wiki-theme/markdown';

// Check the same remark/rehype pipeline used by the site, not raw asterisk counts.
// Code examples and explicitly escaped Markdown are intentional literal text.
const artifacts = /\*\*|__[^_\n]+__|(?<!\*)\*[^*\n]+\*(?!\*)|(?:^|\s)_[^_\n]+_|(?:^|\n)\s*:::(?:\s|$)|\[!(?:NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]|!?\[[^\]\n]+\]\s*\([^\n]+\)/i;
let currentSource = '';
let currentFile = '';
let currentIssues = [];
const totals = { strong: 0, emphasis: 0, links: 0, callouts: 0, tables: 0 };
let countElements = false;
function inspectRenderedMarkdown() {
  return (tree) => {
    const visit = (node) => {
      if (node.type === 'element') {
        if (['code', 'pre', 'script', 'style', 'textarea'].includes(node.tagName)) return;
        if (countElements) {
          const counter = { strong: 'strong', em: 'emphasis', a: 'links', table: 'tables' }[node.tagName];
          if (counter) totals[counter]++;
          if (node.properties?.className?.includes('md-callout')) totals.callouts++;
        }
      }
      if (node.type === 'text' && artifacts.test(node.value)) {
        const start = node.position?.start?.offset;
        const end = node.position?.end?.offset;
        const source = start === undefined ? node.value : currentSource.slice(start, end);
        // If all suspicious syntax disappears when escaped delimiters are removed,
        // the author explicitly requested literal Markdown rather than formatting.
        if (artifacts.test(source.replace(/\\([*_[\]!:])/g, ''))) {
          currentIssues.push({ file: currentFile, line: node.position?.start?.line, text: node.value });
        }
      }
      for (const child of node.children ?? []) visit(child);
    };
    visit(tree);
  };
}
const processor = await createMarkdownProcessor({
  syntaxHighlight: false,
  remarkPlugins: [remarkM3],
  rehypePlugins: [rehypeM3, inspectRenderedMarkdown],
});
async function render(source, file) {
  currentSource = source;
  currentFile = file;
  currentIssues = [];
  const result = await processor.render(source, { fileURL: pathToFileURL(path.resolve(file)) });
  return { html: result.code, issues: currentIssues };
}

const fixtures = [
  ['CJK quotation marks', '保留“**校内配送**”；保留「**校內配送**」；「**学内配送**」です。', ['“<strong>校内配送</strong>”', '「<strong>校內配送</strong>」', '「<strong>学内配送</strong>」']],
  ['English emphasis', 'Keep **important text**, *emphasis* and a [useful link](https://example.com/).', ['<strong>important text</strong>', '<em>emphasis</em>', 'class="md-external-link"', 'rel="noreferrer noopener"']],
  ['sentence punctuation', '**重要提醒**。参见[通知](https://example.com/)。', ['<strong>重要提醒</strong>。参见<a']],
  ['inline code', '**使用 `npm run build` 命令**。', ['<strong>使用 <code>npm run build</code> 命令</strong>']],
  ['nested quotation', '> 外层 **重点**\n>\n> > 内层 *说明*', ['<blockquote>\n<p>外层 <strong>重点</strong>', '<blockquote>\n<p>内层 <em>说明</em>']],
  ['table cell', '| 项目 | 内容 |\n| --- | --- |\n| **地址** | 「**校内**」 |', ['class="md-table-scroll"', '<td><strong>地址</strong></td>', '<td>「<strong>校内</strong>」</td>']],
  ['VuePress callout', '::: warning\n请保留「**校内配送**」。\n:::', ['class="md-callout md-callout-warning"', '<p>请保留「<strong>校内配送</strong>」。</p>']],
  ['GFM callout body', '> [!TIP]\n> 首行正文\n> 第二行正文', ['class="md-callout md-callout-tip"', 'class="md-callout-title">Tip</p>', '<p>首行正文\n第二行正文</p>']],
  ['GFM named callout', '> [!WARNING] 提醒\n> 正文 **重点**', ['class="md-callout-title">提醒</p>', '<p>正文 <strong>重点</strong></p>']],
  ['literal code', '`**示例**`\n\n```md\n::: tip\n**example**\n:::\n```', ['<code>**示例**</code>', '**example**']],
  ['escaped syntax', '\\*\\*按原样显示\\*\\*', ['**按原样显示**']],
];
const failures = [];
for (const [name, source, expected] of fixtures) {
  const result = await render(source, `fixture-${name}.md`);
  for (const snippet of expected) if (!result.html.includes(snippet)) failures.push({ fixture: name, missing: snippet, html: result.html });
  failures.push(...result.issues);
}
// Make sure the regression detector itself catches both previously observed bugs.
for (const source of ['保留**“校内配送”**。', '**重要提醒。**参见通知']) {
  assert((await render(source, 'known-broken.md')).issues.length > 0, 'Failed to detect broken CJK emphasis');
}
const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
  const file = path.join(dir, entry.name);
  return entry.isDirectory() ? walk(file) : file.endsWith('.md') ? [file] : [];
});
let markdownFiles = 0;
const languages = {};
countElements = true;
for (const file of walk('src/content')) {
  const source = fs.readFileSync(file, 'utf8');
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  assert(match, 'Missing frontmatter: ' + file);
  const data = parse(match[1]);
  const relativeDoc = path.relative(path.join('src', 'content', 'docs'), file);
  if (!relativeDoc.startsWith('..') && !path.isAbsolute(relativeDoc)) {
    const localeDirectory = relativeDoc.split(path.sep)[0];
    assert(['zh-CN', 'zh-TW', 'en', 'ja'].includes(localeDirectory),
      `Document is outside a locale directory: ${file}`);
    assert.equal(localeDirectory, data.locale,
      `Document locale directory differs from frontmatter locale: ${file}`);
  }
  if (data.draft) continue;
  const result = await render(match[2], file);
  failures.push(...result.issues);
  markdownFiles++;
  languages[data.locale] = (languages[data.locale] ?? 0) + 1;
}
console.log(JSON.stringify({ markdownFiles, languages, fixtures: fixtures.length, rendered: totals, failures }, null, 2));
if (failures.length) process.exitCode = 1;
