import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'yaml';

// Regression checks for the 2026-09-06 editorial refresh, not a live source verifier.
// Update these checks when a later verified notice replaces a location or directory.
const docsRoot = 'src/content/docs';
const docs = fs.readdirSync(docsRoot, { recursive: true })
  .filter(file => file.endsWith('.md'))
  .map(file => {
    const text = fs.readFileSync(path.join(docsRoot, file), 'utf8');
    const match = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
    assert(match, `Invalid Markdown frontmatter: ${file}`);
    return {file, data: parse(match[1]), body: match[2]};
  });
const locales = ['zh-CN', 'zh-TW', 'en', 'ja'];
const selfRepository = /https?:\/\/github\.com\/swjtuhub\/swjtu-wiki(?:[/?#]|$)/i;
for (const doc of docs) {
  const expectedFile = path.join(doc.data.locale, `${doc.data.slug}.md`);
  assert.equal(path.normalize(doc.file), path.normalize(expectedFile), `${doc.file}: path must match locale and slug`);
  assert(!doc.data.editPath, `${doc.file}: editPath is derived from the organized document path`);
  assert(!selfRepository.test(doc.data.source ?? ''), `${doc.file}: current repository cannot be its own source`);
  assert(!selfRepository.test(doc.body), `${doc.file}: remove links to the current repository from article content`);
}
const homeRoot = 'src/content/pages';
const homeFiles = fs.readdirSync(homeRoot, { recursive: true }).filter(file => file.endsWith('.md'));
assert.deepEqual(
  homeFiles.map(file => path.normalize(file)).sort(),
  locales.map(locale => path.normalize(path.join(locale, 'index.md'))).sort(),
  'Homepages must use src/content/pages/<locale>/index.md',
);
const keys = [
  'legacy-groups', 'legacy-post', 'legacy-schoolbus', 'legacy-service', 'legacy-11231a',
  'legacy-activity', 'legacy-free-analysis', 'legacy-course-grade',
  'legacy-finance', 'legacy-about', 'legacy-d2d231', 'legacy-free-major', 'legacy-free-contest',
];
let checked = 0;
for (const key of keys) {
  for (const locale of locales) {
    const matches = docs.filter(doc => doc.data.translationKey === key && doc.data.locale === locale);
    assert.equal(matches.length, 1, `${key}: expected one ${locale} translation`);
    const doc = matches[0];
    if (key !== 'legacy-about') assert(doc.data.source?.startsWith('https://'), `${doc.file}: missing source`);
    assert(doc.data.updatedDate, `${doc.file}: missing editorial date`);
    assert(!/bidding\.swjtu\.edu\.cn/.test(doc.body), `${doc.file}: procurement is not a service location`);
    if (key === 'legacy-post') {
      // User-supplied 2026-08-31 campus notice, transcribed on 2026-09-07.
      const xipuRows = doc.body.split('\n').filter(line=>line.includes('](tel:19808326007)') || line.includes('](tel:13699467403)'));
      assert.equal(xipuRows.length, 2, doc.file + " requires two Xipu station contacts");
      assert(xipuRows.some(line=>line.includes('校内南区天佑斋2栋西侧菜鸟驿站') && line.includes('tel:19808326007')), 'South address/phone mismatch');
      assert(xipuRows.some(line=>line.includes('校内北区五食堂北侧菜鸟驿站') && line.includes('tel:13699467403')), 'North address/phone mismatch');
      for (const phone of ['95311','95554','956025','95546','950616','95338','95543']) assert(doc.body.includes('](tel:'+phone+')'), 'Carrier hotline missing: '+phone);
      assert.equal(doc.body.split('【备注：请投递至校内，请勿放置校外点位】').length-1,2,'Both addresses need the on-campus delivery note');

      const firstTable = doc.body.match(/\|[^\n]+\n\|[^\n]+\n((?:\|[^\n]+\n)+)/);
      assert(firstTable, `${doc.file}: collection table missing`);
      // The existing 2026-09-08 content removed the unverified Jiuli row.
      // Keep the five sourced entries; do not restore a location just to meet a count.
      assert.equal(firstTable[1].trim().split('\n').length, 5, `${doc.file}: incomplete location table`);
      assert(!/西北一门|校医院对面|northern commercial street|unified operator/.test(doc.body), `${doc.file}: old parcel locations`);
    }
    if (key === 'legacy-schoolbus') {
      assert(!/7:10|9:40|12:40|81512\.htm|94441\.htm/.test(doc.body), `${doc.file}: expired shuttle schedule`);
      for (const fact of ['07:20', '08:50', '22:20', '22:50', '87600474', '66362888']) {
        assert(doc.body.includes(fact), `${doc.file}: missing Jiuli-Xipu shuttle fact ${fact}`);
      }
    }
    if (key === 'legacy-service') {
      for (const phone of ['66366453', '66362886', '86465771', '87601405', '66366438', '66367711', '87601400', '13350069244', '87600861', '66366445', '87601312', '87603166']) {
        assert(doc.body.includes(phone), `${doc.file}: missing retained logistics contact ${phone}`);
      }
      assert(!/SUNNY\.cpp|xiaohongshu|小红书|小紅書|现场体验|現場體驗|現場体験|opening-day experience/i.test(doc.body), `${doc.file}: student-experience copy must not be published`);
      assert(!/13881995809|求实路口旁.*快递|Qiushi Road.*parcel|求実路.*宅配/.test(doc.body), `${doc.file}: superseded Jiuli parcel point`);
    }
    if (key === 'legacy-activity') {
      assert(!/2023|2025|send2me|红包|紅包|京东卡/.test(doc.body), `${doc.file}: expired reward campaign`);
    }
    if (key === 'legacy-11231a') {
      for (const phone of ['66361116', '87601400', '08335198979', '66361616', '66361189']) {
        assert(doc.body.includes(phone), `${doc.file}: missing residence repair contact ${phone}`);
      }
    }
    if (key === 'legacy-d2d231') {
      assert(!/已结束|已結束|; closed|（終了）|missed online registration/.test(doc.body), `${doc.file}: expired registration text`);
    }
    if (key === 'legacy-free-contest') {
      assert.equal(doc.body.split('\n').filter(line=>/^\|\s*\d+\s*\|/.test(line)).length, 58, `${doc.file}: incomplete official competition list`);
      assert(!/①|②|③|④|Changes from the old|與舊頁面|旧記事との/.test(doc.body), `${doc.file}: stale competition details`);
    }
    for (const link of doc.body.matchAll(/\]\(\/(zh-CN|zh-TW|en|ja)\/docs\//g)) {
      assert.equal(link[1], locale, `${doc.file}: cross-language internal link`);
    }
    checked++;
  }
}
const groups = docs.find(doc=>doc.data.translationKey === 'legacy-groups' && doc.data.locale === 'zh-CN');
assert(!/\|[^\n]*(?:2025| 25 级)/.test(groups.body), 'Expired cohort invitation in group directory');
if (process.argv.includes('--dist')) {
  for (const key of keys) {
    for (const locale of locales) {
      const doc = docs.find(doc=>doc.data.translationKey === key && doc.data.locale === locale);
      const file = path.join('dist', locale, 'docs', doc.data.slug, 'index.html');
      assert(fs.existsSync(file), `Missing built article: ${file}`);
      const html = fs.readFileSync(file,'utf8');
      if (key === 'legacy-post') {
        // Quotes belong outside emphasis delimiters: punctuation adjacent to CJK
        // can otherwise leave literal Markdown in the rendered delivery note.
        const deliveryNotes = {
          "zh-CN": "请投递至校内，请勿放置校外点位",
          "zh-TW": "請投遞至校內，請勿放置校外點位",
          "en": "Deliver inside campus; do not leave the parcel at an off-campus point.",
          "ja": "学内へ配送し、学外の受取所には置かないでください"
        };
        assert(html.includes('<strong>' + deliveryNotes[locale] + '</strong>'), 'Delivery note must render as bold: ' + file);
        assert(!html.includes('**'), 'Unrendered emphasis in postal article: ' + file);
      }
      assert(!/2026 年 8 月学校启动统一快递服务商遴选|有奖资料征集活动 2025|9 月 2–4 日核对期已结束/.test(html), `Expired copy in ${file}`);
    }
  }
}
console.log(JSON.stringify({editorialSnapshot:'2026-09-06', translatedArticles:checked, groupDirectory:true, builtPages:process.argv.includes('--dist') ? checked : 'not requested', status:'passed'},null,2));
