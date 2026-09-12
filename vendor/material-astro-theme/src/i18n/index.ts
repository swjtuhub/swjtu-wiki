export interface LocaleDefinition {
  code: string;
  label: string;
  href?: string;
}

export interface LayoutMessageSet {
  skipToContent: string;
  home: string;
  primaryNavigation: string;
  sectionNavigation: string;
  mobileNavigation: string;
  language: string;
  switchToLightTheme: string;
  switchToDarkTheme: string;
}

export type DefaultLocale = 'en' | 'zh-CN' | 'zh-TW' | 'ja';

export const DEFAULT_LOCALE: DefaultLocale = 'en';
export const DEFAULT_LOCALES: readonly LocaleDefinition[] = [
  { code: 'en', label: 'English' },
  { code: 'zh-CN', label: '简体中文' },
  { code: 'zh-TW', label: '繁體中文' },
  { code: 'ja', label: '日本語' },
] as const;
export const DEFAULT_LOCALE_CODES = DEFAULT_LOCALES.map(({ code }) => code);
export const DEFAULT_LOCALE_ROUTES: Readonly<Record<DefaultLocale, string>> = {
  en: '/en/',
  'zh-CN': '/zh-CN/',
  'zh-TW': '/zh-TW/',
  ja: '/ja/',
};

export const DEFAULT_LAYOUT_MESSAGES: Readonly<Record<DefaultLocale, LayoutMessageSet>> = {
  en: {
    skipToContent: 'Skip to content',
    home: 'Home',
    primaryNavigation: 'Primary navigation',
    sectionNavigation: 'Section navigation',
    mobileNavigation: 'Mobile navigation',
    language: 'Language',
    switchToLightTheme: 'Switch to light theme',
    switchToDarkTheme: 'Switch to dark theme',
  },
  'zh-CN': {
    skipToContent: '跳到主要内容',
    home: '首页',
    primaryNavigation: '主导航',
    sectionNavigation: '章节导航',
    mobileNavigation: '移动端导航',
    language: '语言',
    switchToLightTheme: '切换到浅色主题',
    switchToDarkTheme: '切换到深色主题',
  },
  'zh-TW': {
    skipToContent: '跳到主要內容',
    home: '首頁',
    primaryNavigation: '主導覽',
    sectionNavigation: '章節導覽',
    mobileNavigation: '行動版導覽',
    language: '語言',
    switchToLightTheme: '切換至淺色主題',
    switchToDarkTheme: '切換至深色主題',
  },
  ja: {
    skipToContent: '本文へ移動',
    home: 'ホーム',
    primaryNavigation: 'メインナビゲーション',
    sectionNavigation: 'セクションナビゲーション',
    mobileNavigation: 'モバイルナビゲーション',
    language: '言語',
    switchToLightTheme: 'ライトテーマに切り替え',
    switchToDarkTheme: 'ダークテーマに切り替え',
  },
};

export interface ResolveLocaleOptions {
  supportedLocales?: readonly string[];
  defaultLocale?: string;
  acceptLanguage?: string | null;
  pathname?: string;
  prefixDefaultLocale?: boolean;
}

const normalizeLocale = (locale: string) => locale.trim().replace('_', '-').toLowerCase();

export function getLayoutMessages(locale: string): LayoutMessageSet {
  const matched = matchLocale([locale], DEFAULT_LOCALE_CODES, DEFAULT_LOCALE) as DefaultLocale;
  return DEFAULT_LAYOUT_MESSAGES[matched];
}

export function parseAcceptLanguage(header: string | null | undefined): string[] {
  if (!header) return [];

  return header
    .split(',')
    .map((part, index) => {
      const [tag, ...params] = part.trim().split(';');
      const quality = params.reduce((value, param) => {
        const match = param.trim().match(/^q=([0-9.]+)$/i);
        return match ? Number.parseFloat(match[1]) : value;
      }, 1);
      return { tag: normalizeLocale(tag), quality: Number.isFinite(quality) ? quality : 0, index };
    })
    .filter(({ tag, quality }) => tag && tag !== '*' && quality > 0)
    .sort((a, b) => b.quality - a.quality || a.index - b.index)
    .map(({ tag }) => tag);
}

export function matchLocale(
  requestedLocales: readonly string[],
  supportedLocales: readonly string[] = DEFAULT_LOCALE_CODES,
  defaultLocale: string = DEFAULT_LOCALE,
): string {
  const supported = supportedLocales.map((locale) => ({ original: locale, normalized: normalizeLocale(locale) }));

  for (const requested of requestedLocales.map(normalizeLocale)) {
    const exact = supported.find(({ normalized }) => normalized === requested);
    if (exact) return exact.original;

    const language = requested.split('-')[0];
    const languageMatch = supported.find(({ normalized }) => normalized.split('-')[0] === language);
    if (languageMatch) return languageMatch.original;
  }

  return supported.find(({ normalized }) => normalized === normalizeLocale(defaultLocale))?.original
    ?? supportedLocales[0]
    ?? defaultLocale;
}

export function localeFromPath(
  pathname: string,
  supportedLocales: readonly string[] = DEFAULT_LOCALE_CODES,
): string | undefined {
  const segment = pathname.split('/').filter(Boolean)[0];
  if (!segment) return undefined;
  return supportedLocales.find((locale) => normalizeLocale(locale) === normalizeLocale(segment));
}

export function stripLocaleFromPath(
  pathname: string,
  supportedLocales: readonly string[] = DEFAULT_LOCALE_CODES,
): string {
  const url = new URL(pathname, 'https://m3.local');
  const segments = url.pathname.split('/').filter(Boolean);
  if (segments[0] && localeFromPath(`/${segments[0]}`, supportedLocales)) segments.shift();
  const path = `/${segments.join('/')}${url.pathname.endsWith('/') && segments.length ? '/' : ''}`;
  return `${path}${url.search}${url.hash}`;
}

export function localizePath(
  pathname: string,
  locale: string,
  defaultLocale: string = DEFAULT_LOCALE,
  supportedLocales: readonly string[] = DEFAULT_LOCALE_CODES,
  prefixDefaultLocale = true,
): string {
  const cleanPath = stripLocaleFromPath(pathname, supportedLocales);
  if (!prefixDefaultLocale && normalizeLocale(locale) === normalizeLocale(defaultLocale)) return cleanPath;
  return `/${locale}${cleanPath === '/' ? '/' : cleanPath}`.replace(/\/+/g, '/');
}

export function resolveLocale({
  supportedLocales = DEFAULT_LOCALE_CODES,
  defaultLocale = DEFAULT_LOCALE,
  acceptLanguage,
  pathname = '/',
  prefixDefaultLocale = true,
}: ResolveLocaleOptions = {}): string {
  const pathLocale = localeFromPath(pathname, supportedLocales);
  if (pathLocale) return pathLocale;
  if (!prefixDefaultLocale && pathname !== '/') return defaultLocale;
  return matchLocale(parseAcceptLanguage(acceptLanguage), supportedLocales, defaultLocale);
}
