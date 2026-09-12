import { z } from 'astro/zod';

const iconName = z.string().min(1).default('article');

export const wikiNavigationItemSchema: z.ZodType<any> = z.lazy(() => z.object({
  id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
  label: z.string(),
  description: z.string().default(''),
  href: z.string().default(''),
  icon: iconName,
  badge: z.string().optional(),
  enabled: z.boolean().default(true),
  collapsed: z.boolean().default(false),
  external: z.boolean().default(false),
  children: z.array(wikiNavigationItemSchema).default([]),
}));

export const wikiLabelsSchema = z.object({
  home: z.string().default('Home'),
  menu: z.string().default('Browse wiki'),
  closeMenu: z.string().default('Close navigation'),
  navigation: z.string().default('Wiki navigation'),
  search: z.string().default('Search'),
  searchLabel: z.string().default('Search the wiki'),
  searchPlaceholder: z.string().default('Search guides, services, and topics'),
  searchHint: z.string().default('Press / to search'),
  searchResults: z.string().default('results'),
  searchEmptyTitle: z.string().default('No matching pages'),
  searchEmptyDescription: z.string().default('Try a shorter phrase or browse a section.'),
  archive: z.string().default('Archive'),
  categories: z.string().default('Categories'),
  tags: z.string().default('Tags'),
  browseDescription: z.string().default('Browse the complete wiki collection.'),
  onThisPage: z.string().default('On this page'),
  breadcrumbs: z.string().default('Breadcrumbs'),
  lastUpdated: z.string().default('Last updated'),
  editPage: z.string().default('Edit this page'),
  previousPage: z.string().default('Previous'),
  nextPage: z.string().default('Next'),
  browseSection: z.string().default('Browse section'),
  featured: z.string().default('Start here'),
  recentlyUpdated: z.string().default('Recently updated'),
  allPages: z.string().default('All pages'),
  pageCount: z.string().default('pages'),
  contributedBy: z.string().default('Contributors'),
  language: z.string().default('Language'),
  languagePrompt: z.string().default('Choose your language'),
  languageDescription: z.string().default('The site opens in its default language. You can switch languages at any time.'),
  switchToLightTheme: z.string().default('Switch to light theme'),
  switchToDarkTheme: z.string().default('Switch to dark theme'),
  skipToContent: z.string().default('Skip to content'),
  unavailableTranslation: z.string().default('This page is not available in the selected language.'),
});

export const wikiHomeSchema = z.object({
  eyebrow: z.string().default('Community knowledge'),
  headline: z.string().default('Find the answer, then get on with your day.'),
  intro: z.string().default('Clear, maintained guidance for the moments that matter.'),
  primaryActionLabel: z.string().default('Browse the wiki'),
  primaryActionHref: z.string().default(''),
  contributeTitle: z.string().default('Help keep this wiki useful'),
  contributeDescription: z.string().default('Found something outdated or missing? Improvements are welcome.'),
  contributeLabel: z.string().default('Contribute'),
  contributeHref: z.string().default(''),
});

export const wikiLocaleSchema = z.object({
  code: z.string(),
  label: z.string(),
  href: z.string(),
  enabled: z.boolean().default(true),
  navigation: z.array(wikiNavigationItemSchema).default([]),
  labels: wikiLabelsSchema.partial().default({}),
  home: wikiHomeSchema.partial().default({}),
  footer: z.object({ text: z.string(), copyright: z.string().optional() }).optional(),
});

export const wikiSiteConfigSchema = z.object({
  name: z.string(),
  shortName: z.string().optional(),
  description: z.string(),
  url: z.string().url(),
  socialImage: z.string().startsWith('/').optional(),
  favicon: z.string().startsWith('/').optional(),
  defaultLocale: z.string().default('en'),
  locales: z.array(wikiLocaleSchema).min(1),
  appearance: z.object({
    palette: z.enum(['violet', 'ocean', 'forest', 'sunset']).default('ocean'),
    shape: z.enum(['compact', 'soft', 'expressive']).default('soft'),
    density: z.enum(['compact', 'comfortable', 'spacious']).default('comfortable'),
    defaultColorMode: z.enum(['system', 'light', 'dark']).default('system'),
    showColorModeToggle: z.boolean().default(true),
  }).default({}),
  features: z.object({
    search: z.boolean().default(true),
    breadcrumbs: z.boolean().default(true),
    tableOfContents: z.boolean().default(true),
    editLinks: z.boolean().default(true),
    lastUpdated: z.boolean().default(true),
    readingProgress: z.boolean().default(true),
    showDrafts: z.boolean().default(false),
  }).default({}),
  repository: z.object({
    label: z.string().default('GitHub'),
    url: z.string().url(),
    editBaseUrl: z.string().url().optional(),
  }).optional(),
  navigation: z.array(wikiNavigationItemSchema).default([]),
  labels: wikiLabelsSchema.default({}),
  home: wikiHomeSchema.default({}),
  footer: z.object({
    text: z.string().default('Community knowledge, maintained with care.'),
    copyright: z.string().optional(),
  }).default({}),
  redirects: z.array(z.object({ from: z.string().startsWith('/'), to: z.string().startsWith('/') })).default([]),
});

export const wikiDocSchema = z.object({
  title: z.string(),
  description: z.string(),
  locale: z.string().default('en'),
  slug: z.string().min(1),
  translationKey: z.string().optional(),
  section: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  order: z.number().int().default(100),
  icon: iconName.optional(),
  categories: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  updatedDate: z.coerce.date().optional(),
  contributors: z.array(z.string()).default([]),
  featured: z.boolean().default(false),
  draft: z.boolean().default(false),
  legacyPaths: z.array(z.string().startsWith('/')).default([]),
  editPath: z.string().optional(),
  source: z.string().url().optional(),
});

export const wikiPageSchema = z.object({
  title: z.string(),
  description: z.string(),
  locale: z.string().default('en'),
  kind: z.enum(['home']).default('home'),
});

export type WikiSiteConfig = z.infer<typeof wikiSiteConfigSchema>;
export type WikiDocData = z.infer<typeof wikiDocSchema>;
export type WikiNavigationItem = z.infer<typeof wikiNavigationItemSchema>;
