import type { MermaidBlock } from "../domain/types.ts";
import { detectDiagramType } from "../domain/types.ts";
import { generateImageTag } from "./inject.ts";

const MERMAID_FENCE_RE = /^```mermaid\s*$/;
const FENCE_CLOSE_RE = /^```\s*$/;
const BACKTICK_RUN_RE = /^(`{3,})/;

/**
 * Extract all fenced mermaid blocks from markdown content.
 * Returns an array of MermaidBlock with content, line numbers, and auto-generated names.
 *
 * Skips mermaid blocks nested inside higher-level code fences (e.g. ````markdown examples).
 */
export function extractMermaidBlocks(markdown: string, sourceFile: string): MermaidBlock[] {
  const lines = markdown.split("\n");
  const blocks: MermaidBlock[] = [];
  let blockIndex = 0;
  let inMermaidBlock = false;
  let inOtherFence = false;
  let otherFenceLength = 0;
  let blockStart = -1;
  let contentLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] as string;
    const trimmed = line.trim();

    // Inside a non-mermaid code fence — skip until matching close
    if (inOtherFence) {
      const backticks = trimmed.match(BACKTICK_RUN_RE)?.[1];
      if (backticks && backticks.length >= otherFenceLength && trimmed === backticks) {
        inOtherFence = false;
      }
      continue;
    }

    // Inside a mermaid block — collect content or close
    if (inMermaidBlock) {
      if (FENCE_CLOSE_RE.test(trimmed)) {
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
        inMermaidBlock = false;
        contentLines = [];
      } else {
        contentLines.push(line);
      }
      continue;
    }

    // Not in any fence — check for openers
    if (MERMAID_FENCE_RE.test(trimmed)) {
      inMermaidBlock = true;
      blockStart = i + 1; // 1-based
      contentLines = [];
    } else {
      const backticks = trimmed.match(BACKTICK_RUN_RE)?.[1];
      if (backticks) {
        inOtherFence = true;
        otherFenceLength = backticks.length;
      }
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
 * Replace fenced mermaid blocks in markdown with anchor comments and image tags.
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

    const replacement = generateImageTag(block.name, outputDir);
    lines.splice(start, end - start, replacement);
  }

  return lines.join("\n");
}
