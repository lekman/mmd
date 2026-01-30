import type { MermaidBlock } from "../domain/types.ts";
import { detectDiagramType } from "../domain/types.ts";

const MERMAID_FENCE_RE = /^```mermaid\s*$/;
const FENCE_CLOSE_RE = /^```\s*$/;

/**
 * Extract all fenced mermaid blocks from markdown content.
 * Returns an array of MermaidBlock with content, line numbers, and auto-generated names.
 */
export function extractMermaidBlocks(markdown: string, sourceFile: string): MermaidBlock[] {
  const lines = markdown.split("\n");
  const blocks: MermaidBlock[] = [];
  let blockIndex = 0;
  let inBlock = false;
  let blockStart = -1;
  let contentLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] as string;
    if (!inBlock && MERMAID_FENCE_RE.test(line.trim())) {
      inBlock = true;
      blockStart = i + 1; // 1-based
      contentLines = [];
    } else if (inBlock && FENCE_CLOSE_RE.test(line.trim())) {
      const content = contentLines.join("\n");
      blocks.push({
        content,
        sourceFile,
        startLine: blockStart,
        endLine: i + 1, // 1-based, inclusive of closing fence
        name: generateDiagramName(sourceFile, blockIndex),
        diagramType: detectDiagramType(content),
      });
      blockIndex++;
      inBlock = false;
      contentLines = [];
    } else if (inBlock) {
      contentLines.push(line);
    }
  }

  return blocks;
}

/**
 * Generate a diagram name from the source file path and block index.
 * "docs/ARCHITECTURE.md" + index 0 → "architecture-0"
 */
export function generateDiagramName(sourceFile: string, index: number): string {
  const parts = sourceFile.split("/");
  const filename = parts[parts.length - 1] ?? sourceFile;
  const stem = filename.replace(/\.md$/i, "").toLowerCase();
  return `${stem}-${index}`;
}

/**
 * Generate the <picture> tag HTML for an anchor.
 */
function pictureTag(name: string, outputDir: string): string {
  const alt = name
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
  return [
    `<!-- mmd:${name} -->`,
    "<picture>",
    `  <source media="(prefers-color-scheme: dark)" srcset="${outputDir}/${name}.dark.svg">`,
    `  <source media="(prefers-color-scheme: light)" srcset="${outputDir}/${name}.light.svg">`,
    `  <img alt="${alt}" src="${outputDir}/${name}.light.svg">`,
    "</picture>",
  ].join("\n");
}

/**
 * Replace fenced mermaid blocks in markdown content with anchor comments and <picture> tags.
 * Blocks are replaced in reverse order to preserve line numbers.
 */
export function replaceBlocksWithAnchors(
  markdown: string,
  blocks: MermaidBlock[],
  outputDir: string
): string {
  if (blocks.length === 0) return markdown;

  const lines = markdown.split("\n");

  // Replace in reverse order to preserve line numbers
  for (let i = blocks.length - 1; i >= 0; i--) {
    const block = blocks[i] as MermaidBlock;
    const start = block.startLine - 1; // 0-based index of opening fence
    const end = block.endLine; // 0-based index after closing fence

    const replacement = pictureTag(block.name, outputDir);
    lines.splice(start, end - start, replacement);
  }

  return lines.join("\n");
}
