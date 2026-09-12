/** Return whether a navigation item represents an internal wiki topic. */
export function isWikiSection(item) {
  const href = (item.href ?? '').trim();
  return Boolean(item.id)
    && item.enabled !== false
    && !item.external
    // Detect absolute and protocol-relative URLs even without external: true.
    && !/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(href)
    && !href.includes('/browse/');
}
