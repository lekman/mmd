import { dirname, posix } from "node:path";
import type { AnchorRef } from "../domain/types.ts";

const ANCHOR_RE = /^<!-- mmd:([a-z0-9-]+) -->$/;
const IMAGE_TAG_RE = /^!\[.*\]\(.*\.svg\)$/;

/**
 * Find all <!-- mmd:name --> anchor comments in markdown content.
 */
export function findAnchors(markdown: string, sourceFile: string): AnchorRef[] {
  const lines = markdown.split("\n");
  const anchors: AnchorRef[] = [];

  for (let i = 0; i < lines.length; i++) {
    const match = ANCHOR_RE.exec((lines[i] as string).trim());
    if (match?.[1]) {
      anchors.push({
        name: match[1],
        line: i + 1, // 1-based
        sourceFile,
      });
    }
  }

  return anchors;
}

/**
 * Compute the relative path from a markdown file's directory to the output directory.
 */
function relativeOutputDir(outputDir: string, sourceFile: string): string {
  const sourceDir = dirname(sourceFile).split("\\").join("/");
  const normalizedOutput = outputDir.split("\\").join("/");
  return posix.relative(sourceDir, normalizedOutput);
}

/**
 * Generate a standard markdown image tag for an anchor.
 * Computes relative path from the source markdown file to the SVG.
 */
export function generateImageTag(name: string, outputDir: string, sourceFile: string): string {
  const alt = name
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  const relDir = relativeOutputDir(outputDir, sourceFile);
  return [`<!-- mmd:${name} -->`, `![${alt}](${relDir}/${name}.svg)`].join("\n");
}

/**
 * Inject markdown image tags at anchor positions in markdown content.
 * Replaces the anchor line and any following content block (picture tag, img tag, etc.)
 * until the next blank line or anchor.
 */
export function injectImageTags(markdown: string, sourceFile: string, outputDir: string): string {
  const lines = markdown.split("\n");
  const result: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i] as string;
    const match = ANCHOR_RE.exec(line.trim());

    if (match?.[1]) {
      const name = match[1];
      // Replace anchor and consume any following content block
      result.push(generateImageTag(name, outputDir, sourceFile));
      i++;

      // Skip lines until we hit a blank line, another anchor, or end of file
      while (i < lines.length) {
        const nextLine = (lines[i] as string).trim();
        if (nextLine === "") break;
        if (ANCHOR_RE.test(nextLine)) break;
        i++;
      }
    } else {
      result.push(line);
      i++;
    }
  }

  return deduplicateImageTags(result.join("\n").split("\n"));
}

/**
 * Remove duplicate SVG image tags that appear after an anchor's image tag.
 * Handles the case where on-save re-injection produces duplicates.
 */
function deduplicateImageTags(lines: string[]): string {
  const output: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i] as string;
    output.push(line);
    i++;

    // After an image tag line, consume any blank + duplicate image pattern
    if (IMAGE_TAG_RE.test(line.trim())) {
      while (i < lines.length) {
        const next = (lines[i] as string).trim();
        if (next === "") {
          // Peek ahead: if a duplicate image tag follows, skip both
          if (i + 1 < lines.length && IMAGE_TAG_RE.test((lines[i + 1] as string).trim())) {
            i += 2; // skip blank + duplicate
          } else {
            break; // normal blank line, keep it
          }
        } else {
          break;
        }
      }
    }
  }

  return output.join("\n");
}
