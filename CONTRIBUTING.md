# SWJTU Wiki — Material 3 replacement

This project is a complete Material 3 replacement for `wiki.swjtu.top`, rebuilt from the public `swjtuhub/swjtu-wiki` source. It uses the reusable Material Wiki theme, snapshotted under `vendor/` for self-contained builds and deployment, and keeps site authors in two places:

- `src/config/site.yaml` controls branding, languages, navigation, labels, features, repository links, and legacy redirects.
- `src/content/**/*.md` contains homepage and wiki content.

There are no project-specific Astro page components; site pages come from the vendored wiki theme.

## Local development

```bash
npm install
npm run dev
```

## Add a page

Create a Markdown file under `src/content/docs`. The route and section come from frontmatter:

```yaml
---
title: Library hours
description: Opening hours and access information for campus libraries.
locale: en
slug: campus-services/library-hours
translationKey: library-hours
section: campus-services
categories: [Campus services]
tags: [services, campus]
order: 10
updatedDate: 2026-09-01
---
```

Store documents under `src/content/docs/{locale}/{section}/{page}.md`. Keep the directory and filename aligned with the frontmatter `slug`; for example, `slug: campus-services/library-hours` belongs at `src/content/docs/en/campus-services/library-hours.md`. Use the same `translationKey` for equivalent pages in other languages. The language menu will keep readers on the translated page when one exists and return them to the selected-language homepage otherwise.

Essential and frequently used campus-life information must be maintained in `zh-CN`, `zh-TW`, `en`, and `ja`. Keep dates, contacts, source links, eligibility and unresolved verification limits aligned. Use links within the reader's language and preserve original Chinese account names or menu labels when needed to find a service. Run `npm run audit:services` after building to check the covered service pages for translation coverage, matching sources/contact links and generated routes; manually review translated meaning as well. Add newly covered service topics to that audit's key list.

## Markdown formatting checks

Every build checks all four languages for unrendered emphasis, links and callout markers. You can also run `npm run audit:markdown` without building. The checks include mixed CJK/Latin text, inline code, code blocks, tables, nested blockquotes, external links, and both supported callout formats.

Keep quotation marks and sentence-ending punctuation outside emphasis when adjoining Chinese or Japanese text: use `“**校内配送**”`, `「**学内配送**」`, and `**重要提醒**。参见通知`. Put literal Markdown examples in backticks or escape their delimiters.

For a GitHub-style callout, an optional title belongs on the marker line (`> [!TIP] 提醒`); text on the next quoted line is body content. VuePress-style `::: tip` / `:::` blocks remain supported.

## Migrate the complete upstream site

Clone or download `https://github.com/swjtuhub/swjtu-wiki`, then run:

```bash
npm run content:migrate -- --source ../swjtu-wiki/docs
cp -a ../swjtu-wiki/docs/.vuepress/public/. public/
npm run build
npm run audit:source -- --source ../swjtu-wiki/docs
npm run audit:content -- --source ../swjtu-wiki/docs
```

The migration accounts for every upstream Markdown source. Content articles become wiki documents in the locale and section directories; VuePress-generated home, catalogue, archive, category, and tag sources map to their functional Material routes. `scripts/migration-manifest.json` records every source-to-route decision without local machine paths. Categories and tags remain separate; VuePress callouts and card containers render as native Material components; original permalinks become static redirects, edit links follow the organized document paths, and all public assets are preserved.

For the current upstream snapshot this is 44 Markdown sources: 30 imported articles and 14 managed Material pages, with zero unsupported pages.

## Production replacement checklist

1. Review dates, phone numbers, external links, and imported HTML tables.
2. Confirm every old path listed in `scripts/migration-manifest.json` reaches its new page.
3. Run `npm run build`, then `npm run audit:build` to verify every generated internal link.
4. Push the reviewed commit to `develop`; the GitHub Pages workflow builds and publishes the site.

## GitHub Pages deployment

The checked-in theme snapshots make this project independently buildable with `npm ci` and `npm run build`. When working beside the original theme projects, run `npm run sync:themes` after theme changes, then rebuild and validate before publishing. Content authors continue editing only YAML and Markdown.

The canonical origin is configured in `src/config/site.yaml`. The workflow in `.github/workflows/deploy-pages.yml` deploys from `develop`. Run `npm run audit:current`, `npm run audit:build`, and `npm run audit:routes` before publishing.
