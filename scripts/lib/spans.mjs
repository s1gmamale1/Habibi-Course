/**
 * Move `index` outward to a grapheme-cluster edge.
 * direction -1 = span start (walk left off combining marks onto the base letter)
 * direction +1 = span end   (walk right to swallow trailing combining marks)
 */
export function clusterSafe(text, index, direction) {
  const isMark = (cp) => cp !== undefined && /\p{Mn}/u.test(String.fromCodePoint(cp));
  let i = Math.max(0, Math.min(index, text.length));
  if (direction < 0) {
    while (i > 0 && isMark(text.codePointAt(i))) i--;
    return i;
  }
  while (i < text.length && isMark(text.codePointAt(i))) i++;
  return i;
}

/**
 * Flatten possibly-overlapping annotations into disjoint segments.
 * Each output segment lists every rule active across it, ordered by the
 * position of the annotation it came from (outermost/leftmost first) so the
 * result does not depend on the order the annotations were supplied in.
 */
export function flatten(annotations) {
  if (annotations.length === 0) return [];
  const sorted = [...annotations].sort(
    (a, b) => a.start - b.start || a.end - b.end || String(a.rule).localeCompare(String(b.rule)),
  );
  const edges = new Set();
  for (const a of sorted) { edges.add(a.start); edges.add(a.end); }
  const points = [...edges].sort((x, y) => x - y);
  const out = [];
  for (let i = 0; i < points.length - 1; i++) {
    const start = points[i];
    const end = points[i + 1];
    const rules = sorted
      .filter((a) => a.start < end && a.end > start)
      .map((a) => a.rule);
    if (rules.length > 0) out.push({ start, end, rules });
  }
  return out;
}
