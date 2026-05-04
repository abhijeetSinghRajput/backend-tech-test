function findMarkPositions(html: string): number[] {
  const positions: number[] = [];
  let searchFrom = 0;
  while (true) {
    const idx = html.indexOf("<mark>", searchFrom);
    if (idx === -1) break;
    positions.push(idx);
    searchFrom = idx + 1;
  }
  return positions;
}

function findBestStart(markPositions: number[], windowSize: number): number {
  let bestStart = markPositions[0] ?? 0;
  let bestCount = 0;

  for (const pos of markPositions) {
    const windowEnd = pos + windowSize;
    const count = markPositions.filter((p) => p >= pos && p <= windowEnd).length;
    if (count > bestCount) {
      bestCount = count;
      bestStart = pos;
    }
  }
  return bestStart;
}

export function extractAlgoliaSnippet(
  highlightedHtml: string,
  windowSize = 300
): string {
  if (!highlightedHtml) return "";

  const markPositions = findMarkPositions(highlightedHtml);

  // No marks — return plain start of text
  if (markPositions.length === 0) {
    const plain = highlightedHtml.replace(/<[^>]+>/g, "");
    return plain.length > windowSize ? `${plain.slice(0, windowSize)}…` : plain;
  }

  const bestStart = findBestStart(markPositions, windowSize);
  const start = Math.max(0, bestStart - 80); // 80 chars of leading context
  const end = Math.min(highlightedHtml.length, bestStart + windowSize);

  let snippet = highlightedHtml.slice(start, end);

  // Sanitize partial HTML tags at boundaries
  snippet = snippet.replace(/^[^<]*>/, "");
  snippet = snippet.replace(/<[^>]*$/, "");

  // Trim to word boundary
  if (start > 0) {
    const firstSpace = snippet.indexOf(" ");
    if (firstSpace > 0 && firstSpace < 20) snippet = snippet.slice(firstSpace + 1);
  }
  if (end < highlightedHtml.length) {
    const lastSpace = snippet.lastIndexOf(" ");
    if (lastSpace > snippet.length - 20) snippet = snippet.slice(0, lastSpace);
  }

  const prefix = start > 0 ? "…" : "";
  const suffix = end < highlightedHtml.length ? "…" : "";

  return `${prefix}${snippet}${suffix}`;
}
