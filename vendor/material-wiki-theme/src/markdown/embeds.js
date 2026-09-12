const IFRAME = /^\s*<iframe\b([^>]*)>\s*<\/iframe>\s*$/i;
const ATTRIBUTE = /([:\w-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;

const text = (value) => ({ type: 'text', value });

function attributes(source) {
  const result = {};
  for (const match of source.matchAll(ATTRIBUTE)) {
    result[match[1].toLowerCase()] = match[2] ?? match[3] ?? match[4] ?? '';
  }
  return result;
}

function safeSource(value) {
  if (typeof value !== 'string') return undefined;
  const source = value.trim();
  if (!source || /^(?:javascript|data):/i.test(source)) return undefined;
  return source.startsWith('//') ? `https:${source}` : source;
}

function sourceLabel(source) {
  try {
    const url = new URL(source, 'https://local.invalid');
    if (url.hostname !== 'local.invalid') return url.hostname;
    return decodeURIComponent(url.pathname.split('/').filter(Boolean).pop() ?? url.pathname);
  } catch {
    return source;
  }
}

function escapeAttribute(value) {
  return value.replaceAll('&', '&amp;').replaceAll('"', '&quot;');
}

function iframeNode(node) {
  if (node?.type !== 'html') return undefined;
  const match = node.value.match(IFRAME);
  if (!match) return undefined;

  const attrs = attributes(match[1]);
  const src = safeSource(attrs.src);
  if (!src) return undefined;
  const label = attrs.title?.trim() || sourceLabel(src) || 'Embedded page';
  const requestedHeight = Number.parseInt(attrs.height, 10);
  const height = Number.isFinite(requestedHeight) ? Math.min(1200, Math.max(320, requestedHeight)) : 720;

  return {
    type: 'blockquote',
    data: {
      hName: 'figure',
      hProperties: {
        className: ['md-embed'],
        dataEmbed: 'page',
        style: `--md-embed-height: ${height}px`,
      },
    },
    children: [
      {
        type: 'paragraph',
        data: { hName: 'figcaption', hProperties: { className: ['md-embed__bar'] } },
        children: [
          {
            type: 'emphasis',
            data: { hName: 'span', hProperties: { className: ['material-symbols-rounded', 'md-embed__icon'], ariaHidden: 'true' } },
            children: [text('web_asset')],
          },
          {
            type: 'strong',
            data: { hName: 'span', hProperties: { className: ['md-embed__label'], title: label } },
            children: [text(label)],
          },
          {
            type: 'emphasis',
            data: {
              hName: 'a',
              hProperties: {
                className: ['md-embed__open', 'md-state-layer'],
                href: src,
                target: '_blank',
                rel: 'noreferrer noopener',
                ariaLabel: label,
                title: label,
              },
            },
            children: [
              {
                type: 'emphasis',
                data: { hName: 'span', hProperties: { className: ['material-symbols-rounded'], ariaHidden: 'true' } },
                children: [text('open_in_new')],
              },
            ],
          },
        ],
      },
      {
        type: 'html',
        value: `<iframe src="${escapeAttribute(src)}" title="${escapeAttribute(label)}" loading="lazy" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>`,
      },
    ],
  };
}

function transform(parent) {
  if (!Array.isArray(parent?.children)) return;
  parent.children = parent.children.map((child) => {
    const replacement = iframeNode(child);
    if (replacement) return replacement;
    transform(child);
    return child;
  });
}

export function transformEmbeds(tree) {
  transform(tree);
}
