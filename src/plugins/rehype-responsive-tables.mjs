/** Keep a native table grid inside an independently scrollable container. */
export default function rehypeResponsiveTables() {
  return (tree) => {
    const textContent = (node) => node.value || (node.children || []).map(textContent).join(' ');
    const visit = (node) => {
      if (!node.children) return;
      node.children = node.children.map((child) => {
        if (child.type === 'element' && child.tagName === 'table') {
          const heading = child.children.find((part) => part.tagName === 'thead');
          const label = textContent(heading || child).replace(/\s+/g, ' ').trim();
          return {
            type: 'element',
            tagName: 'div',
            properties: {
              className: ['orionis-table-scroll'],
              tabIndex: 0,
              role: 'region',
              ariaLabel: label,
            },
            children: [child],
          };
        }
        visit(child);
        return child;
      });
    };
    visit(tree);
  };
}
