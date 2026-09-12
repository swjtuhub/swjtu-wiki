const CALLOUTS = new Set(['note', 'tip', 'important', 'warning', 'caution']);

const titleCase = (value) => value.charAt(0).toUpperCase() + value.slice(1);

const visit = (node, callback) => {
  if (!node || typeof node !== 'object') return;
  callback(node);
  if (Array.isArray(node.children)) node.children.forEach((child) => visit(child, callback));
};

const classNames = (node) => {
  const value = node?.properties?.className;
  if (Array.isArray(value)) return value;
  return typeof value === 'string' ? value.split(/\s+/).filter(Boolean) : [];
};

const tableColumnCount = (table) => {
  const head = table.children?.find((child) => child.type === 'element' && child.tagName === 'thead');
  const row = head?.children?.find((child) => child.type === 'element' && child.tagName === 'tr');
  return Math.max(1, row?.children?.filter((child) => child.type === 'element' && (child.tagName === 'th' || child.tagName === 'td')).length ?? 1);
};

const textContent = (node) => {
  if (node?.type === 'text') return node.value ?? '';
  return node?.children?.map(textContent).join('') ?? '';
};

export function remarkM3() {
  return (tree) => {
    visit(tree, (node) => {
      if (node.type === 'link' && typeof node.url === 'string' && /^https?:\/\//.test(node.url)) {
        node.data ??= {};
        node.data.hProperties = {
          ...(node.data.hProperties ?? {}),
          className: ['md-external-link'],
          target: '_blank',
          rel: 'noreferrer noopener',
        };
      }

      if (node.type !== 'blockquote') return;
      const firstParagraph = node.children?.[0];
      const firstText = firstParagraph?.type === 'paragraph' ? firstParagraph.children?.[0] : undefined;
      if (firstText?.type !== 'text') return;

      // A custom title belongs on the marker line; never consume the first body line.
      const match = firstText.value.match(/^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\](?:[ \t]+([^\r\n]+))?/i);
      if (!match) return;

      const kind = match[1].toLowerCase();
      if (!CALLOUTS.has(kind)) return;
      const title = match[2]?.trim() || titleCase(kind);
      firstText.value = firstText.value.slice(match[0].length).replace(/^\s+/, '');

      if (!firstText.value && firstParagraph.children.length === 1) node.children.shift();

      node.data ??= {};
      node.data.hName = 'aside';
      node.data.hProperties = {
        className: ['md-callout', `md-callout-${kind}`],
        'data-callout': kind,
        role: kind === 'warning' || kind === 'caution' ? 'alert' : 'note',
      };
      node.children.unshift({
        type: 'paragraph',
        data: {
          hName: 'p',
          hProperties: { className: ['md-callout-title'] },
        },
        children: [{ type: 'text', value: title }],
      });
    });
  };
}

export function rehypeM3() {
  return (tree) => {
    const wrapTables = (node) => {
      if (!Array.isArray(node?.children)) return;
      if (node.type === 'element' && classNames(node).includes('md-table-scroll')) return;

      node.children = node.children.map((child) => {
        if (child.type === 'element' && child.tagName === 'table') {
          const columns = tableColumnCount(child);
          const head = child.children?.find((item) => item.type === 'element' && item.tagName === 'thead');
          const row = head?.children?.find((item) => item.type === 'element' && item.tagName === 'tr');
          const label = row?.children
            ?.filter((item) => item.type === 'element' && item.tagName === 'th')
            .map((item) => textContent(item).trim())
            .filter(Boolean)
            .join(' / ');
          child.properties ??= {};
          child.properties.className = [...new Set([...classNames(child), 'md-data-table'])];
          child.properties.style = [
            child.properties.style,
            `--md-table-min-width: ${Math.max(17, columns * 8.5)}rem`,
          ].filter(Boolean).join('; ');

          return {
            type: 'element',
            tagName: 'div',
            properties: {
              className: ['md-table-scroll'],
              role: 'region',
              tabIndex: 0,
              ariaLabel: label,
              dataColumnCount: columns,
            },
            children: [child],
          };
        }

        wrapTables(child);
        return child;
      });
    };

    wrapTables(tree);
  };
}
