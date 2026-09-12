import { remarkM3 as remarkMaterial } from '@m3-astro/theme/markdown';
import { parse } from 'yaml';
import { transformEmbeds } from './embeds.js';

const CALLOUTS = {
  note: 'note',
  info: 'note',
  tip: 'tip',
  important: 'important',
  warning: 'warning',
  danger: 'caution',
  caution: 'caution',
};

const titleCase = (value) => value.charAt(0).toUpperCase() + value.slice(1);

function textContent(node) {
  if (node?.type === 'text') return node.value ?? '';
  return node?.children?.map(textContent).join('') ?? '';
}

function titleNode(title) {
  return {
    type: 'paragraph',
    data: {
      hName: 'p',
      hProperties: { className: ['md-callout-title'] },
    },
    children: [{ type: 'text', value: title }],
  };
}

function calloutNode(kind, title, children) {
  const resolvedKind = CALLOUTS[kind] ?? 'note';
  return {
    type: 'blockquote',
    data: {
      hName: 'aside',
      hProperties: {
        className: ['md-callout', `md-callout-${resolvedKind}`],
        dataCallout: resolvedKind,
        role: resolvedKind === 'warning' || resolvedKind === 'caution' ? 'alert' : 'note',
      },
    },
    children: [titleNode(title || titleCase(kind)), ...children],
  };
}

function exactMarker(node) {
  if (node?.type !== 'paragraph') return undefined;
  const match = textContent(node).trim().match(/^:::\s*([a-z][\w-]*)(?:\s+(.+))?$/i);
  if (!match) return undefined;
  return { kind: match[1].toLowerCase(), title: match[2]?.trim() };
}

function isClosingMarker(node) {
  return node?.type === 'paragraph' && textContent(node).trim() === ':::';
}

function inlineCallout(node) {
  if (node?.type !== 'paragraph' || !Array.isArray(node.children) || node.children.length === 0) return undefined;
  const first = node.children[0];
  const last = node.children[node.children.length - 1];
  if (first?.type !== 'text' || last?.type !== 'text') return undefined;

  const opening = first.value.match(/^:::\s*(note|info|tip|important|warning|danger|caution)(?:[ \t]+([^\r\n]+))?\r?\n/i);
  if (!opening || !/\r?\n:::\s*$/.test(last.value)) return undefined;

  const kind = opening[1].toLowerCase();
  if (first === last) {
    first.value = first.value.slice(opening[0].length).replace(/\r?\n:::\s*$/, '');
  } else {
    first.value = first.value.slice(opening[0].length);
    last.value = last.value.replace(/\r?\n:::\s*$/, '');
  }
  node.children = node.children.filter((child) => child.type !== 'text' || child.value.length > 0);
  return calloutNode(kind, opening[2]?.trim(), [node]);
}

function paragraph(text, className, hName = 'p') {
  return {
    type: 'paragraph',
    data: { hName, hProperties: { className: [className] } },
    children: [{ type: 'text', value: String(text) }],
  };
}

function cardNode(item, imageCard) {
  const children = [];
  const image = imageCard ? item.img : item.avatar;
  if (image) {
    children.push({
      type: 'paragraph',
      data: {
        hName: 'span',
        hProperties: { className: [imageCard ? 'md-vp-card__media' : 'md-vp-card__avatar'] },
      },
      children: [{ type: 'image', url: String(image), alt: String(item.name ?? '') }],
    });
  }
  if (item.name) children.push(paragraph(item.name, 'md-vp-card__title', 'strong'));
  if (item.desc) children.push(paragraph(item.desc, 'md-vp-card__description'));
  if (item.author) children.push(paragraph(item.author, 'md-vp-card__meta'));

  const linked = typeof item.link === 'string' && item.link.length > 0;
  return {
    type: 'blockquote',
    data: {
      hName: linked ? 'a' : 'article',
      hProperties: {
        className: ['md-vp-card', imageCard ? 'md-vp-card--image' : 'md-vp-card--profile'],
        ...(linked ? {
          href: item.link,
          target: /^https?:\/\//.test(item.link) ? '_blank' : undefined,
          rel: /^https?:\/\//.test(item.link) ? 'noreferrer noopener' : undefined,
        } : {}),
      },
    },
    children,
  };
}

function cardContainer(kind, inner, columns) {
  const source = inner.find((node) => node.type === 'code' && (!node.lang || /ya?ml/i.test(node.lang)));
  if (!source) return undefined;

  try {
    const value = parse(source.value);
    const imageCard = kind.toLowerCase() === 'cardimglist';
    const entries = imageCard ? value?.data : value;
    if (!Array.isArray(entries)) return undefined;
    const configuredColumns = Number.parseInt(columns, 10);
    const columnCount = Number.isFinite(configuredColumns)
      ? Math.min(4, Math.max(1, configuredColumns))
      : imageCard ? 2 : 3;
    const configuredHeight = imageCard && typeof value?.config?.imgHeight === 'string'
      && /^\d+(?:\.\d+)?(?:px|rem|em|vh|vw)$/.test(value.config.imgHeight.trim())
      ? value.config.imgHeight.trim()
      : undefined;
    return {
      type: 'blockquote',
      data: {
        hName: 'div',
        hProperties: {
          className: ['md-vp-card-grid', imageCard ? 'md-vp-card-grid--image' : 'md-vp-card-grid--profile'],
          'data-columns': columnCount,
          style: configuredHeight ? `--md-vp-card-image-height: ${configuredHeight}` : undefined,
        },
      },
      children: entries.map((item) => cardNode(item ?? {}, imageCard)),
    };
  } catch {
    return undefined;
  }
}

function transformChildren(parent) {
  if (!Array.isArray(parent?.children)) return;

  for (let index = 0; index < parent.children.length; index += 1) {
    const child = parent.children[index];
    const inline = inlineCallout(child);
    if (inline) {
      parent.children.splice(index, 1, inline);
      continue;
    }

    const marker = exactMarker(child);
    if (marker) {
      const closeIndex = parent.children.findIndex((candidate, candidateIndex) => candidateIndex > index && isClosingMarker(candidate));
      if (closeIndex > index) {
        const inner = parent.children.slice(index + 1, closeIndex);
        const replacement = CALLOUTS[marker.kind]
          ? calloutNode(marker.kind, marker.title, inner)
          : /^card(?:img)?list$/i.test(marker.kind)
            ? cardContainer(marker.kind, inner, marker.title)
            : undefined;
        if (replacement) {
          parent.children.splice(index, closeIndex - index + 1, replacement);
          transformChildren(replacement);
          continue;
        }
      }
    }

    transformChildren(child);
  }
}

export function remarkWiki() {
  const material = remarkMaterial();
  return (tree, file) => {
    transformChildren(tree);
    transformEmbeds(tree);
    return material(tree, file);
  };
}
