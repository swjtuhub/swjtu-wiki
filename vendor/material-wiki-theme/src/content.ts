import { defineCollection } from 'astro:content';
import { file, glob } from 'astro/loaders';
import { wikiDocSchema, wikiPageSchema, wikiSiteConfigSchema } from './config';

export interface WikiCollectionOptions {
  settingsFile?: string;
  pagesBase?: string;
  docsBase?: string;
}

export function createWikiCollections({
  settingsFile = './src/config/site.yaml',
  pagesBase = './src/content/pages',
  docsBase = './src/content/docs',
}: WikiCollectionOptions = {}) {
  const wikiSettings = defineCollection({ loader: file(settingsFile), schema: wikiSiteConfigSchema });
  const wikiPages = defineCollection({ loader: glob({ base: pagesBase, pattern: '**/*.{md,mdx}' }), schema: wikiPageSchema });
  const wikiDocs = defineCollection({
    loader: glob({
      base: docsBase,
      pattern: '**/*.{md,mdx}',
      generateId: ({ entry }) => entry.replace(/\.(md|mdx)$/i, ''),
    }),
    schema: wikiDocSchema,
  });
  return { wikiSettings, wikiPages, wikiDocs };
}
