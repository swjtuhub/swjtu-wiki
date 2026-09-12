import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'yaml';

// Shared service facts must stay aligned when notices or contact details change.
// This checks structural coverage and identifiers, not translation semantics.
const root = 'src/content/docs';
const docs = fs.readdirSync(root, { recursive: true })
  .filter(file => file.endsWith('.md'))
  .map(file => {
    const text = fs.readFileSync(path.join(root, file), 'utf8');
    const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
    assert(match, `Invalid frontmatter: ${file}`);
    return { file, data: parse(match[1]), body: match[2] };
  });
const keys = [
  'campus-network', 'campus-card', 'library-guide', 'email-guide',
  'software-guide', 'campus-safety-guide', 'counseling-guide',
  'service-directory-guide', 'academic-services-guide', 'sports-venues',
  'history-museum', 'legacy-service', 'legacy-d2d231',
  'legacy-schoolbus', 'legacy-post', 'medical-care-guide',
  'student-aid-guide',
];
const locales = ['zh-CN', 'zh-TW', 'en', 'ja'];
const unique = values => [...new Set(values)].sort();
const urls = doc => unique([...doc.body.matchAll(/\]\(([^\s)]+)\)/g)]
  .map(match => match[1].replace(/^\/(?:zh-CN|zh-TW|en|ja)\/docs\//, '/docs/')));
const identifiers = doc => unique([...doc.body.matchAll(/`([^`]+)`/g)].map(match => match[1]));
const requiredFacts = {
  'legacy-service': [
    '66366453', '66362886', '86465771', '87601405',
    '66366438', '66367711', '87601400', '13350069244',
    '87600861', '66366445', '87601312', '87603166',
  ],
  'legacy-schoolbus': ['07:15', '09:00', '11:00', '13:00', '16:00', '17:30', '18:00', '13512251501'],
  'legacy-post': ['13699467403', '19808326007', '95311', '95554', '956025', '95546', '950616', '95338', '95543'],
  'medical-care-guide': ['66366120', '87600120', '66366480', '87600480', '66366439', '87601522', '400', '448', '2026-09-30', '2026-09-20'],
  'student-aid-guide': ['66367280', '66366858'],
};
let pages = 0;
for (const key of keys) {
  const source = docs.find(doc => doc.data.translationKey === key && doc.data.locale === 'zh-CN');
  assert(source, `Missing source: ${key}`);
  for (const locale of locales) {
    const matches = docs.filter(doc => doc.data.translationKey === key && doc.data.locale === locale);
    assert.equal(matches.length, 1, `${key}: expected one ${locale} page`);
    const doc = matches[0];
    for (const field of ['slug', 'section', 'order', 'source', 'updatedDate']) {
      assert.deepEqual(doc.data[field], source.data[field], `${doc.file}: ${field} differs`);
    }
    assert.deepEqual(urls(doc), urls(source), `${doc.file}: missing or differing links/phones`);
    assert.deepEqual(identifiers(doc), identifiers(source), `${doc.file}: account identifier differs`);
    for (const fact of requiredFacts[key] ?? []) {
      assert(doc.body.includes(fact), `${doc.file}: missing shared fact ${fact}`);
    }
    for (const link of doc.body.matchAll(/\]\(\/(zh-CN|zh-TW|en|ja)\/docs\//g)) {
      assert.equal(link[1], locale, `${doc.file}: cross-language internal link`);
    }
    if (process.argv.includes('--dist')) {
      const output = path.join('dist', locale, 'docs', doc.data.slug, 'index.html');
      assert(fs.existsSync(output), `Missing translated route: ${output}`);
      const html = fs.readFileSync(output, 'utf8');
      for (const phone of doc.body.matchAll(/\]\((tel:[^)]+)\)/g)) {
        assert(html.includes(phone[1]), `${output}: missing phone link ${phone[1]}`);
      }
    }
    pages++;
  }
}
console.log(JSON.stringify({ topics: keys.length, translatedPages: pages,
  sourcesAndContactsAligned: true, builtPages: process.argv.includes('--dist') ? pages : 'not requested',
  status: 'passed' }, null, 2));
