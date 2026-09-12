# Material 3 Astro Wiki Theme

A reusable, configuration-first wiki theme built on Astro, Tailwind CSS, and the shared Material 3 design system in `../material-astro-theme`.

## What the theme owns

- Managed routes for locale homes, documents, sections, full archive/category/tag indexes, search, legacy redirects, sitemap, robots, and 404 output.
- Adaptive desktop navigation, a modal mobile drawer, compact and wide search controls, language switching, dark mode, breadcrumbs, page contents, edit links, and previous/next navigation.
- Material 3 typography and surfaces for mixed Latin and CJK text, code, nested quotes, callouts, Markdown tables, and legacy HTML tables.
- Static full-text search plus date archives, category indexes, and tag indexes with no hosted search service or client framework.

Consuming projects do not need local `.astro` page files.

## Minimal setup

```js
// astro.config.mjs
import m3Wiki from '@m3-astro/wiki-theme';

export default defineConfig({
  integrations: [m3Wiki()],
});
```

```ts
// src/content.config.ts
import { createWikiCollections } from '@m3-astro/wiki-theme/content';
export const collections = createWikiCollections();
```

Create `src/config/site.yaml`, homepage Markdown files under `src/content/pages`, and wiki Markdown files under `src/content/docs`. Document frontmatter supports separate `categories` and `tags` arrays. See `../swjtu-wiki-material` for a complete four-language replacement project and migration script.

## VuePress content compatibility

The Markdown pipeline renders `::: note`, `::: tip`, `::: warning`, `::: danger`, `cardList`, and `cardImgList` blocks as native Material callouts and responsive cards. Authors can keep upstream Markdown syntax without adding page components or styles.

## Route overrides

Every managed route can be disabled for a local override:

```js
m3Wiki({ routes: { search: false, legacy: false } })
```

Available route names are exported as `WIKI_ROUTE_NAMES`.
