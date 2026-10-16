/** Keep Mermaid source readable until the local renderer replaces it with an SVG. */
export default function remarkMermaid() {
  return (tree) => {
    const escape = (value) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const visit = (node) => {
      if (!node.children) return;
      node.children = node.children.map((child) => {
        if (child.type === 'code' && child.lang === 'mermaid') {
          const title = child.value.match(/^\s*accTitle:\s*(.+)$/m)?.[1] || 'Diagram';
          return {
            type: 'html',
            value: `<figure class="orionis-diagram not-content" data-mermaid tabindex="0" aria-label="${escape(title)}"><div data-mermaid-output></div><pre data-mermaid-source>${escape(child.value)}</pre></figure>`,
          };
        }
        visit(child);
        return child;
      });
    };
    visit(tree);
  };
}
