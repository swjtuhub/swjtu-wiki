import type { APIRoute } from 'astro';
import { getWikiConfig } from '../lib/wiki';

export const prerender = true;
export const GET: APIRoute = async () => {
  const config = await getWikiConfig();
  return new Response(`User-agent: *\nAllow: /\nSitemap: ${new URL('/sitemap.xml', config.url)}\n`, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
