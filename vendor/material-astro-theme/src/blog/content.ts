import { defineCollection } from 'astro:content';
import { file, glob } from 'astro/loaders';
import { pageSchema, siteConfigSchema, storySchema } from '../config/index';

export interface BlogCollectionOptions {
  settingsFile?: string;
  pagesBase?: string;
  contentBase?: string;
}

/**
 * Creates the conventional settings, pages, and stories collections used by
 * the managed blog routes. Paths are resolved from the consuming Astro project.
 */
export function createBlogCollections({
  settingsFile = './src/config/site.yaml',
  pagesBase = './src/content/pages',
  contentBase = './src/content',
}: BlogCollectionOptions = {}) {
  const settings = defineCollection({
    loader: file(settingsFile),
    schema: siteConfigSchema,
  });

  const pages = defineCollection({
    loader: glob({ base: pagesBase, pattern: '**/*.{md,mdx}' }),
    schema: pageSchema,
  });

  const stories = defineCollection({
    loader: glob({
      base: contentBase,
      pattern: ['stories/**/*.{md,mdx}', 'generated-stories/**/*.{md,mdx}'],
      generateId: ({ entry }) => entry.split(/[\\/]/).at(-1)?.replace(/\.(md|mdx)$/i, '') ?? entry,
    }),
    schema: storySchema,
  });

  return { settings, pages, stories };
}
