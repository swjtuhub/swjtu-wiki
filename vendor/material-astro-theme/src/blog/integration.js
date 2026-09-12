const managedRoutes = [
  ['root', '/', './pages/index.astro'],
  ['home', '/[locale]', './pages/[locale]/index.astro'],
  ['about', '/[locale]/about', './pages/[locale]/about.astro'],
  ['archive', '/[locale]/archive', './pages/[locale]/archive/index.astro'],
  ['author', '/[locale]/authors/[author]', './pages/[locale]/authors/[author]/index.astro'],
  ['guide', '/[locale]/guide', './pages/[locale]/guide.astro'],
  ['search', '/[locale]/search', './pages/[locale]/search/index.astro'],
  ['stories', '/[locale]/stories', './pages/[locale]/stories/index.astro'],
  ['story', '/[locale]/stories/[id]', './pages/[locale]/stories/[id].astro'],
  ['topics', '/[locale]/topics', './pages/[locale]/topics/index.astro'],
  ['robots', '/robots.txt', './pages/robots.txt.ts'],
  ['rss', '/rss.xml', './pages/rss.xml.ts'],
  ['sitemap', '/sitemap.xml', './pages/sitemap.xml.ts'],
];

/**
 * Installs the complete Material 3 blog route set.
 *
 * Individual routes can be disabled when a site needs a local override:
 * `m3Blog({ routes: { guide: false, search: false } })`.
 *
 * @param {{ routes?: Partial<Record<string, boolean>> }} options
 * @returns {import('astro').AstroIntegration}
 */
export function m3Blog({ routes = {} } = {}) {
  return {
    name: '@m3-astro/theme-blog',
    hooks: {
      'astro:config:setup': ({ injectRoute }) => {
        for (const [name, pattern, entrypoint] of managedRoutes) {
          if (routes[name] === false) continue;
          injectRoute({
            pattern,
            entrypoint: new URL(entrypoint, import.meta.url),
            prerender: true,
          });
        }
      },
    },
  };
}

export const BLOG_ROUTE_NAMES = Object.freeze(
  managedRoutes.map(([name]) => name),
);

export default m3Blog;
