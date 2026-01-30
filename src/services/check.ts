export interface CheckWarning {
  sourceFile: string;
  line: number;
  message: string;
}

const ANCHOR_RE = /^<!-- mmd:[a-z0-9-]+ -->$/;
const MERMAID_FENCE_RE = /^```mermaid\s*$/;

/**
 * Check for orphaned inline Mermaid blocks in files that already have anchor comments.
 * Returns warnings for each inline block found in a file that uses anchors.
 */
export function checkOrphanedBlocks(markdown: string, sourceFile: string): CheckWarning[] {
  const lines = markdown.split("\n");
  let hasAnchors = false;
  const inlineBlockLines: number[] = [];

  for (let i = 0; i < lines.length; i++) {
    const trimmed = (lines[i] as string).trim();
    if (ANCHOR_RE.test(trimmed)) {
      hasAnchors = true;
    }
    if (MERMAID_FENCE_RE.test(trimmed)) {
      inlineBlockLines.push(i + 1); // 1-based
    }
  }

  // Only warn if the file uses anchors AND has inline blocks
  if (!hasAnchors || inlineBlockLines.length === 0) return [];

  return inlineBlockLines.map((line) => ({
    sourceFile,
    line,
    message: `Found inline Mermaid block at line ${line}. Run 'mmd extract' to convert to .mmd file.`,
  }));
}
