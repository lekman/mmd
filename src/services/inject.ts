import type { AnchorRef } from "../domain/types.ts";

const ANCHOR_RE = /^<!-- mmd:([a-z0-9-]+) -->$/;

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
 * Generate a standard markdown image tag for an anchor.
 */
export function generateImageTag(name: string, outputDir: string): string {
  const alt = name
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  return [`<!-- mmd:${name} -->`, `![${alt}](${outputDir}/${name}.svg)`].join("\n");
}

/**
 * Inject markdown image tags at anchor positions in markdown content.
 * Replaces the anchor line and any following content block (picture tag, img tag, etc.)
 * until the next blank line or anchor.
 */
export function injectImageTags(markdown: string, _sourceFile: string, outputDir: string): string {
  const lines = markdown.split("\n");
  const result: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i] as string;
    const match = ANCHOR_RE.exec(line.trim());

    if (match?.[1]) {
      const name = match[1];
      // Replace anchor and consume any following content block
      result.push(generateImageTag(name, outputDir));
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

  return result.join("\n");
}
