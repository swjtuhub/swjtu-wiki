import { getCollection } from 'astro:content';
import { getSiteConfig } from '@m3-astro/theme/blog/config';

const xml = (value: string) => value.replace(/[<>&'"]/g, (character) => ({
  '<': '&lt;',
  '>': '&gt;',
  '&': '&amp;',
  "'": '&apos;',
  '"': '&quot;',
})[character]!);

export async function GET() {
  const config = await getSiteConfig();
  const stories = (await getCollection('stories'))
    .filter((story) => (config.blog.showDrafts || !story.data.draft) && story.data.locale === config.defaultLocale)
    .sort((a, b) => b.data.publishDate.valueOf() - a.data.publishDate.valueOf());

  const items = stories.map((story) => `<item>
    <title>${xml(story.data.title)}</title>
    <description>${xml(story.data.description)}</description>
    <link>${new URL(`/${config.defaultLocale}/stories/${story.id}/`, config.url)}</link>
    <guid>${new URL(`/${config.defaultLocale}/stories/${story.id}/`, config.url)}</guid>
    <pubDate>${story.data.publishDate.toUTCString()}</pubDate>
  </item>`).join('\n');

  return new Response(`<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0">
  <channel>
    <title>${xml(config.name)}</title>
    <description>${xml(config.description)}</description>
    <link>${config.url}</link>
    <language>${config.defaultLocale}</language>
    ${items}
  </channel>
</rss>`, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
}
