import { readFileSync } from 'node:fs';
import { defineConfig } from 'astro/config';
import { unified } from '@astrojs/markdown-remark';
import tailwindcss from '@tailwindcss/vite';
import { parse } from 'yaml';
import m3Wiki from '@m3-astro/wiki-theme';
import { rehypeM3, remarkM3 } from '@m3-astro/wiki-theme/markdown';

const siteConfig = parse(readFileSync(new URL('./src/config/site.yaml', import.meta.url), 'utf8')).site;

export default defineConfig({
  site: siteConfig.url,
  markdown: {
    processor: unified({ remarkPlugins: [remarkM3], rehypePlugins: [rehypeM3] }),
    shikiConfig: { theme: 'github-dark-default', wrap: false },
  },
  integrations: [m3Wiki()],
  vite: { plugins: [tailwindcss()] },
});
