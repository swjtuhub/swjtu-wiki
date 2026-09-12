import assert from 'node:assert/strict';
import fs from 'node:fs';
import { parse } from 'yaml';
import { isWikiSection } from '../vendor/material-wiki-theme/src/lib/navigation.js';

const topic = { id: 'campus-life', href: '/zh-CN/sections/campus-life/', enabled: true };
const cases = [
  ['local topic', topic, true],
  ['default section URL', { id: 'campus-life' }, true],
  ['disabled', { ...topic, enabled: false }, false],
  ['no section ID', { href: '/zh-CN/' }, false],
  ['explicit external', { ...topic, external: true }, false],
  ['HTTPS without flag', { ...topic, href: 'https://swjtuhub.cn/' }, false],
  ['HTTP without flag', { ...topic, href: 'http://example.com/' }, false],
  ['protocol relative', { ...topic, href: '//example.com/' }, false],
  ['URL whitespace and case', { ...topic, href: ' HTTPS://example.com/ ' }, false],
  ['email link', { ...topic, href: 'mailto:editor@example.com' }, false],
  ['archive', { ...topic, href: '/zh-CN/browse/archives/' }, false],
];
for (const [name, item, expected] of cases) assert.equal(isWikiSection(item), expected, name);

const checked = [];
if (process.argv.includes('--dist')) {
  const config = parse(fs.readFileSync('src/config/site.yaml', 'utf8')).site;
  for (const locale of config.locales.filter(item => item.enabled !== false)) {
    const navigation = (locale.navigation?.length ? locale.navigation : config.navigation).filter(item => item.enabled !== false);
    const html = fs.readFileSync(`dist/${locale.code}/index.html`, 'utf8');
    const anchors = [...html.matchAll(/<a\b[^>]*>/g)].map(match => match[0]);
    const attr = (tag, key) => tag.match(new RegExp('\\b' + key + '="([^"]*)"'))?.[1];
    const hasClass = (tag, name) => (attr(tag, 'class') ?? '').split(/\s+/).includes(name);
    const cards = anchors.filter(tag => hasClass(tag, 'wiki-category-card')).map(tag => attr(tag, 'href'));
    const expected = navigation.filter(isWikiSection).map(item => item.href || `/${locale.code}/sections/${item.id}/`);
    assert.deepEqual(cards, expected, `${locale.code}: homepage cards must contain only internal topics`);
    for (const item of navigation.filter(item => item.external || /^(?:https?:|\/\/)/i.test(item.href ?? ''))) {
      assert(!cards.includes(item.href), `${locale.code}: external link shown as a topic`);
      assert(anchors.some(tag => hasClass(tag, 'wiki-nav-link') && attr(tag, 'href') === item.href), `${locale.code}: external navigation link must remain available`);
    }
    checked.push({ locale: locale.code, topicCards: cards.length });
  }
}
console.log(JSON.stringify({ fixtures: cases.length, homepages: checked, status: 'passed' }, null, 2));
