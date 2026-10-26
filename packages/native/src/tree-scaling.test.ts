import { expect, test } from 'vitest';
import type { NeuTreeNode } from './foundation/mobile.ts';
import { findTreeNode, visibleTree } from './foundation/tree.ts';

test('a 20,000-level hierarchy preserves depth and inherited disabled state', () => {
  const depth = 20_000;
  let node: NeuTreeNode = { id: 'leaf', label: 'Leaf' };
  const expanded: string[] = [];
  for (let i = depth - 1; i >= 0; i--) {
    const id = 'branch-' + i;
    expanded.push(id);
    node = { id, label: id, disabled: i === 0, children: [node] };
  }
  const rows = visibleTree([node], expanded);
  expect(rows).toHaveLength(depth + 1);
  expect(rows[depth]).toEqual({
    node: { id: 'leaf', label: 'Leaf' },
    depth,
    disabled: true,
    branch: false,
  });
  expect(findTreeNode([node], 'leaf')).toEqual({ node: rows[depth].node, disabled: true });
  expect(findTreeNode([node], 'absent')).toBeNull();
});

test('traversal preserves preorder, collapsed branches and first duplicate ownership', () => {
  const first: NeuTreeNode = { id: 'shared', label: 'First' };
  const nodes: NeuTreeNode[] = [
    { id: 'a', label: 'A', disabled: true, children: [first] },
    { id: 'b', label: 'B', children: [{ id: 'shared', label: 'Duplicate' }, { id: 'last', label: 'Last' }] },
  ];
  expect(visibleTree(nodes, ['b']).map(({ node, depth, disabled }) => [node.label, depth, disabled]))
    .toEqual([['A', 0, true], ['B', 0, false], ['Duplicate', 1, false], ['Last', 1, false]]);
  expect(visibleTree(nodes, ['a', 'b']).map(({ node }) => node.label)).toEqual(['A', 'First', 'B', 'Last']);
  expect(findTreeNode(nodes, 'shared')).toEqual({ node: first, disabled: true });
});

test('lookup terminates for cycles and keeps disabled ancestry', () => {
  const root: { id: string; label: string; disabled: boolean; children?: NeuTreeNode[] } = {
    id: 'root', label: 'Root', disabled: true,
  };
  root.children = [root, { id: 'leaf', label: 'Leaf' }];
  expect(visibleTree([root], ['root']).map(({ node }) => node.id)).toEqual(['root', 'leaf']);
  expect(findTreeNode([root], 'leaf')?.disabled).toBe(true);
  expect(findTreeNode([root], 'absent')).toBeNull();
});
