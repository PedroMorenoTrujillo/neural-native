import type { NeuTreeNode } from './mobile.js';
export interface NeuTreeRow {
  readonly node: NeuTreeNode;
  readonly depth: number;
  readonly disabled: boolean;
  readonly branch: boolean;
}
export function visibleTree(
  nodes: readonly NeuTreeNode[],
  expanded: readonly string[],
): readonly NeuTreeRow[] {
  const expandedIds = new Set(expanded);
  return Array.from(walkTree(nodes, (node) => expandedIds.has(node.id)));
}
export function findTreeNode(
  nodes: readonly NeuTreeNode[],
  id: string,
): { node: NeuTreeNode; disabled: boolean } | null {
  for (const row of walkTree(nodes, () => true)) {
    if (row.node.id === id) return { node: row.node, disabled: row.disabled };
  }
  return null;
}

function* walkTree(
  nodes: readonly NeuTreeNode[],
  descend: (node: NeuTreeNode) => boolean,
): Generator<NeuTreeRow> {
  const seen = new Set<string>();
  const stack = [{ nodes, index: 0, depth: 0, disabled: false }];
  while (stack.length) {
    const frame = stack[stack.length - 1];
    if (frame.index === frame.nodes.length) {
      stack.pop();
      continue;
    }
    const node = frame.nodes[frame.index++];
    if (seen.has(node.id)) continue;
    seen.add(node.id);
    const disabled = frame.disabled || !!node.disabled;
    const children = node.children;
    const branch = !!children?.length;
    yield { node, depth: frame.depth, disabled, branch };
    if (children?.length && descend(node)) {
      stack.push({
        nodes: children,
        index: 0,
        depth: frame.depth + 1,
        disabled,
      });
    }
  }
}
