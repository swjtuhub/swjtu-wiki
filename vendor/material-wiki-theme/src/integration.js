const managedRoutes = [
  ['root', '/', './pages/index.astro'],
  ['home', '/[locale]', './pages/[locale]/index.astro'],
  ['search', '/[locale]/search', './pages/[locale]/search/index.astro'],
  ['browse', '/[locale]/browse/[view]', './pages/[locale]/browse/[view].astro'],
  ['section', '/[locale]/sections/[section]', './pages/[locale]/sections/[section].astro'],
  ['doc', '/[locale]/docs/[...slug]', './pages/[locale]/docs/[...slug].astro'],
  ['robots', '/robots.txt', './pages/robots.txt.ts'],
  ['sitemap', '/sitemap.xml', './pages/sitemap.xml.ts'],
  ['notFound', '/404', './pages/404.astro'],
  ['legacy', '/[...legacy]', './pages/[...legacy].astro'],
];

export function m3Wiki({ routes = {} } = {}) {
  return {
    name: '@m3-astro/wiki-theme',
    hooks: {
      'astro:config:setup': ({ injectRoute }) => {
        for (const [name, pattern, entrypoint] of managedRoutes) {
          if (routes[name] === false) continue;
          injectRoute({ pattern, entrypoint: new URL(entrypoint, import.meta.url), prerender: true });
        }
      },
    },
  };
}

export const WIKI_ROUTE_NAMES = Object.freeze(managedRoutes.map(([name]) => name));
export default m3Wiki;
