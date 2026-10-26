let nextLabelId = 0;

/** Native label references must remain unique across control types and instances. */
export function controlLabelId(): string {
  return `neu-control-label-${++nextLabelId}`;
}
