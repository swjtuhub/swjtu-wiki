import { getSiteConfig } from '@m3-astro/theme/blog/config';

export async function GET() {
  const config = await getSiteConfig();
  return new Response(`User-agent: *
Allow: /
Sitemap: ${new URL('/sitemap.xml', config.url)}
`, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
