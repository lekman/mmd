import type { IFileSystem, IRenderer } from "../domain/interfaces.ts";
import type { ThemeConfig } from "../domain/types.ts";
import { extractMermaidBlocks, replaceBlocksWithAnchors } from "./extract.ts";
import { injectImageTags } from "./inject.ts";
import { renderDiagrams } from "./render.ts";

export interface ConvertOptions {
  config: ThemeConfig;
  mdFile: string;
  renderer: IRenderer;
  fallbackRenderer: IRenderer;
  fs: IFileSystem;
  /** Convert only the block at this index (0-based). Omit to convert all blocks. */
  blockIndex?: number;
  /** Path to .mermaid.json for config mtime staleness. */
  configPath?: string;
}

export interface ConvertResult {
  extracted: number;
  rendered: number;
}

/**
 * Convert mermaid fenced blocks in a single markdown file to SVG references.
 * Runs extract → render → inject scoped to one file and optionally one block.
 * Skips writing .mmd files that already exist (multi-location anchor support).
 */
export async function convertBlocks(options: ConvertOptions): Promise<ConvertResult> {
  const { config, mdFile, renderer, fallbackRenderer, fs, blockIndex, configPath } = options;
  const outputDir = config.outputDir ?? "docs/mmd";

  const content = await fs.readFile(mdFile);
  const allBlocks = extractMermaidBlocks(content, mdFile);

  if (allBlocks.length === 0) return { extracted: 0, rendered: 0 };

  // Filter to specific block if requested
  const blocks =
    blockIndex !== undefined ? allBlocks.filter((_, i) => i === blockIndex) : allBlocks;

  if (blocks.length === 0) return { extracted: 0, rendered: 0 };

  // Phase 1: Write .mmd files (skip if already exist for multi-location support)
  const mmdFiles: string[] = [];
  await fs.mkdir(outputDir);
  for (const block of blocks) {
    const mmdPath = `${outputDir}/${block.name}.mmd`;
    const exists = await fs.exists(mmdPath);
    if (!exists) {
      await fs.writeFile(mmdPath, block.content);
    }
    mmdFiles.push(mmdPath);
  }

  // Phase 2: Replace fenced blocks with anchors in the markdown
  const updated = replaceBlocksWithAnchors(content, blocks, outputDir);
  await fs.writeFile(mdFile, updated);

  // Phase 3: Render .mmd files to SVGs
  const renderResults = await renderDiagrams(config, {
    renderer,
    fallbackRenderer,
    fs,
    mmdFiles,
    force: true,
    configPath,
  });

  // Phase 4: Inject image tags (re-read updated markdown)
  const afterExtract = await fs.readFile(mdFile);
  const injected = injectImageTags(afterExtract, mdFile, outputDir);
  if (injected !== afterExtract) {
    await fs.writeFile(mdFile, injected);
  }

  return {
    extracted: blocks.length,
    rendered: renderResults.length,
  };
}
