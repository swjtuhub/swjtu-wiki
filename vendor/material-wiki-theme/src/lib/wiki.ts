import { getCollection, getEntry, type CollectionEntry } from 'astro:content';
import type { WikiNavigationItem, WikiSiteConfig } from '../config';

export async function getWikiConfig(): Promise<WikiSiteConfig> {
  const entry = await getEntry('wikiSettings', 'site');
  if (!entry) throw new Error('Missing src/config/site.yaml entry named "site".');
  return entry.data;
}

export function enabled<T extends { enabled: boolean }>(items: T[]): T[] {
  return items.filter((item) => item.enabled);
}

export function localeConfig(config: WikiSiteConfig, locale: string) {
  return config.locales.find((item) => item.code.toLowerCase() === locale.toLowerCase());
}

export function wikiLabels(config: WikiSiteConfig, locale: string) {
  return { ...config.labels, ...(localeConfig(config, locale)?.labels ?? {}) };
}

export function wikiHome(config: WikiSiteConfig, locale: string) {
  return { ...config.home, ...(localeConfig(config, locale)?.home ?? {}) };
}

export function wikiNavigation(config: WikiSiteConfig, locale: string): WikiNavigationItem[] {
  const local = localeConfig(config, locale)?.navigation ?? [];
  return enabled(local.length > 0 ? local : config.navigation);
}

export function docHref(doc: CollectionEntry<'wikiDocs'>): string {
  return `/${doc.data.locale}/docs/${doc.data.slug.replace(/^\/+|\/+$/g, '')}/`;
}

export function sectionHref(locale: string, section: string): string {
  return `/${locale}/sections/${section}/`;
}

export async function publishedDocs(config: WikiSiteConfig) {
  return getCollection('wikiDocs', ({ data }) => config.features.showDrafts || !data.draft);
}

export function sortedDocs(docs: CollectionEntry<'wikiDocs'>[]) {
  return [...docs].sort((a, b) => a.data.section.localeCompare(b.data.section) || a.data.order - b.data.order || a.data.title.localeCompare(b.data.title));
}

export function sectionItem(items: WikiNavigationItem[], id: string): WikiNavigationItem | undefined {
  for (const item of items) {
    if (item.id === id) return item;
    const nested = sectionItem(item.children ?? [], id);
    if (nested) return nested;
  }
  return undefined;
}

export function formatUpdated(date: Date, locale: string, timezone = 'UTC') {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeZone: timezone }).format(date);
}

export function localeDocPaths(doc: CollectionEntry<'wikiDocs'>, docs: CollectionEntry<'wikiDocs'>[], locales: Array<{ code: string; href: string }>) {
  return Object.fromEntries(locales.map((locale) => {
    const translation = doc.data.translationKey
      ? docs.find((candidate) => candidate.data.translationKey === doc.data.translationKey && candidate.data.locale === locale.code)
      : undefined;
    return [locale.code, translation ? docHref(translation) : locale.href];
  }));
}

export function stripMarkdown(value: string) {
  return value
    .replace(/:::[^\n]*/g, " ")
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[#>*_`~|\-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
