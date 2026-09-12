# @m3-astro/theme

A reusable Astro + Tailwind CSS v4 theme inspired by Material 3 Expressive. It provides:

- semantic light/dark color roles and Tailwind utilities
- fluid Material-like typography roles
- an expressive shape, elevation, and motion scale
- accessible Astro components with state layers and 48px touch targets
- an adaptive app shell with top app bar, navigation rail, and bottom navigation
- an optional managed blog application with localized routes, feeds, search, and content collections
- a full specimen site at `src/pages/index.astro`

## Use from a neighboring Astro project

```json
{
  "dependencies": {
    "@m3-astro/theme": "file:../material-astro-theme"
  }
}
```

```astro
---
import AdaptiveLayout from '@m3-astro/theme/layouts/AdaptiveLayout';
import Button from '@m3-astro/theme/components/Button';
---

<AdaptiveLayout title="My site" description="My expressive Astro site">
  <Button href="/start">Start</Button>
</AdaptiveLayout>
```

Components are exported from `@m3-astro/theme/components/*`; the layout is exported from `@m3-astro/theme/layouts/AdaptiveLayout`; styles can be imported directly from `@m3-astro/theme/styles.css` when using a custom layout.

## Managed blog mode

Use the blog integration when readers should be able to customize a complete
publication through configuration and Markdown instead of maintaining Astro
page components.

```js
// astro.config.mjs
import { defineConfig } from 'astro/config';
import m3Blog from '@m3-astro/theme/blog';

export default defineConfig({
  integrations: [m3Blog()],
});
```

```ts
// src/content.config.ts
import { createBlogCollections } from '@m3-astro/theme/blog/content';

export const collections = createBlogCollections();
```

The integration supplies Home, About, Stories, article, Archive, Topics,
Search, author, Guide, RSS, sitemap, robots, locale-selection, and localized
routes. A consumer project therefore needs no `.astro` files unless it chooses
to override a managed route. Disable an individual route before adding an
override:

```js
m3Blog({ routes: { guide: false } })
```

Site identity, navigation, appearance, labels, feature flags, and locale data
remain in `src/config/site.yaml`; pages and articles remain in `src/content/`.

## Configuration and Markdown authoring

The package exports validated schemas from `@m3-astro/theme/config` and the
`remarkM3` and `rehypeM3` processors from `@m3-astro/theme/markdown`. The
example uses these to make YAML and Markdown the routine authoring surfaces.
Shared editorial artwork, reading progress, guide patterns, form controls, and
the copyable `CodeBlock` component require no consumer stylesheet. The package
also exports the blog collection factory from `@m3-astro/theme/blog/content`.

Safe layout options are exposed directly on `AdaptiveLayout`:

- palettes: `violet`, `ocean`, `forest`, `sunset`
- shapes: `compact`, `soft`, `expressive`
- densities: `compact`, `comfortable`, `spacious`
- color mode: `system`, `light`, `dark`

The Markdown processors add Material-styled callouts, safe external-link
metadata, and semantic responsive table containers. Few columns fill the prose
measure; wide tables scroll locally; long cell content wraps without breaking words.

## Internationalization

English, Simplified Chinese, Traditional Chinese and Japanese are built in.

- `LanguageSwitcher` renders an accessible Material popover and remembers explicit choices.
- `LocaleRedirect` uses the saved choice or `navigator.languages` for static routes.
- `resolveLocale()` matches URL prefixes or an SSR `Accept-Language` header.

`AdaptiveLayout` automatically localizes its built-in accessibility labels from
`currentLocale`. `DEFAULT_LOCALES`, `DEFAULT_LOCALE_ROUTES`, and message bundles
are exported from `@m3-astro/theme/i18n`.

The specimen publishes content at `/en/`, `/zh-CN/`, `/zh-TW/`, and `/ja/`.
The unprefixed `/` route only selects a saved or browser-preferred language.

## Design rationale

The implementation follows official guidance:

- [Material 3](https://m3.material.io/) for the system-level foundations and component patterns.
- [Material 3 Expressive research](https://design.google/library/expressive-material-design-google-research) for purposeful use of color, size, shape, motion, and containment.
- [Material Web theming](https://material-web.dev/theming/material-theming/) for the reference → system → component token model.
- [Material Web color](https://material-web.dev/theming/color/), [typography](https://material-web.dev/theming/typography/), and [shape](https://material-web.dev/theming/shape/) for token naming and role behavior.
- [Material Web components](https://material-web.dev/components/) for control hierarchy and interaction patterns.
- [Astro components](https://docs.astro.build/en/basics/astro-components/) for zero-runtime-by-default reusable UI.
- [Tailwind CSS Vite setup](https://tailwindcss.com/docs/installation/using-vite) for the Tailwind v4 integration.

This is an independent adaptation and is not an official Google or Material project. The current Material Web repository is in maintenance mode, so this package uses native Astro markup and CSS tokens rather than taking a runtime dependency on its web components.

## Scripts

```sh
npm install
npm run dev
npm run build
```
