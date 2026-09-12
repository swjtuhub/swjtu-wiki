import { getCollection } from 'astro:content';
import { enabledItems, getSiteConfig } from '@m3-astro/theme/blog/config';

export async function GET() {
  const config = await getSiteConfig();
  const stories = await getCollection('stories');
  const localeCodes = enabledItems(config.locales).map(({ code }) => code);
  const paths = localeCodes.flatMap((locale) => [
    `/${locale}/`,
    `/${locale}/stories/`,
    `/${locale}/archive/`,
    `/${locale}/topics/`,
    `/${locale}/search/`,
    `/${locale}/authors/${config.authorSlug}/`,
    `/${locale}/about/`,
    ...(config.features.guide ? [`/${locale}/guide/`] : []),
  ]);
  paths.push(...stories.filter((story) => (config.blog.showDrafts || !story.data.draft) && localeCodes.includes(story.data.locale)).map((story) => `/${story.data.locale}/stories/${story.id}/`));
  const urls = paths.map((path) => `<url><loc>${new URL(path, config.url)}</loc></url>`).join('');
  return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}
