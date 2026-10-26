import type { HostNode } from '@ng-native/fabric';

// A projected field can outlive its native presentation. Retain its accepted
// buffer before that presentation detaches and can no longer deliver blur.
const snapshots = new WeakMap<HostNode, () => void>();

export function registerNativeTextSnapshot(node: HostNode, snapshot: () => void): () => void {
  snapshots.set(node, snapshot);
  return () => { snapshots.delete(node); };
}

export function snapshotNativeText(node: HostNode): void {
  const pending = [node];
  while (pending.length) {
    const current = pending.pop();
    if (!current) continue;
    snapshots.get(current)?.();
    for (const child of current.childList) pending.push(child);
  }
}
