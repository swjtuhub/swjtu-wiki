import type { APIRoute } from 'astro';
import { docHref, enabled, getWikiConfig, publishedDocs, sectionHref } from '../lib/wiki';

export const prerender = true;
const escape = (value: string) => value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[char]!));

export const GET: APIRoute = async () => {
  const config = await getWikiConfig();
  const docs = await publishedDocs(config);
  const urls = new Set<string>();
  for (const locale of enabled(config.locales)) {
    urls.add(locale.href);
    for (const view of ["archives", "categories", "tags"]) urls.add("/" + locale.code + "/browse/" + view + "/");
  }
  for (const doc of docs) {
    urls.add(docHref(doc));
    urls.add(sectionHref(doc.data.locale, doc.data.section));
  }
  const body = [...urls].map((path) => `  <url><loc>${escape(new URL(path, config.url).href)}</loc></url>`).join('\n');
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
};
