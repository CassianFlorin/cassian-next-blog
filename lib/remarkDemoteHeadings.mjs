import { visit } from 'unist-util-visit';

/**
 * Shift every heading in a post body down one level when the body contains an
 * `# H1`.
 *
 * The layout already renders the frontmatter `title` as the page's `<h1>`, so a
 * body `#` would produce a second one and flatten the outline. Shifting the
 * whole body keeps the author's relative hierarchy intact (`#` -> `##`,
 * `##` -> `###`, ...) while leaving exactly one `<h1>` on the page.
 *
 * Posts that already start at `##` are left untouched, so this stays a no-op
 * for correctly structured content.
 */
export default function remarkDemoteHeadings() {
  return (tree) => {
    let hasTopLevelHeading = false;
    visit(tree, 'heading', (node) => {
      if (node.depth === 1) hasTopLevelHeading = true;
    });

    if (!hasTopLevelHeading) return;

    visit(tree, 'heading', (node) => {
      // Markdown/HTML only go up to h6; deeper headings stay put.
      node.depth = Math.min(node.depth + 1, 6);
    });
  };
}
