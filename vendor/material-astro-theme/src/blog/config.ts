import { getEntry } from 'astro:content';

export async function getSiteConfig() {
  const entry = await getEntry('settings', 'site');
  if (!entry) throw new Error('Missing src/config/site.yaml entry named "site".');
  return entry.data;
}

export function enabledItems<T extends { enabled: boolean }>(items: T[]): T[] {
  return items.filter(({ enabled }) => enabled);
}

export function formatStoryDate(date: Date, locale: string, style: 'short' | 'medium' | 'long' | 'full', timezone: string): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: style, timeZone: timezone }).format(date);
}
