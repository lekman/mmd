import type { IFileSystem, IRenderer } from "../domain/interfaces.ts";
import type { ThemeConfig } from "../domain/types.ts";
import { extractMermaidBlocks, replaceBlocksWithAnchors } from "./extract.ts";
import { injectImageTags } from "./inject.ts";
import { renderDiagrams } from "./render.ts";

export interface SyncOptions {
  config: ThemeConfig;
  mdFiles: string[];
  renderer: IRenderer;
  fallbackRenderer: IRenderer;
  fs: IFileSystem;
  force?: boolean;
  /** Path to .mermaid.json for config mtime staleness. */
  configPath?: string;
}

export interface SyncResult {
  extracted: number;
  rendered: number;
}

/**
 * Run the full pipeline: extract → render → inject.
 */
export async function sync(options: SyncOptions): Promise<SyncResult> {
  const { config, mdFiles, renderer, fallbackRenderer, fs, force, configPath } = options;
  const outputDir = config.outputDir ?? "docs/mmd";
  let totalExtracted = 0;
  const mmdFiles: string[] = [];

  // Phase 1: Extract mermaid blocks from markdown files
  for (const mdFile of mdFiles) {
    const content = await fs.readFile(mdFile);
    const blocks = extractMermaidBlocks(content, mdFile);

    if (blocks.length === 0) continue;

    // Write .mmd files
    await fs.mkdir(outputDir);
    for (const block of blocks) {
      const mmdPath = `${outputDir}/${block.name}.mmd`;
      await fs.writeFile(mmdPath, block.content);
      mmdFiles.push(mmdPath);
    }

    // Replace fenced blocks with anchors in the markdown
    const updated = replaceBlocksWithAnchors(content, blocks, outputDir);
    await fs.writeFile(mdFile, updated);
    totalExtracted += blocks.length;
  }

  // Phase 2: Render .mmd files to SVGs
  const renderResults = await renderDiagrams(config, {
    renderer,
    fallbackRenderer,
    fs,
    mmdFiles,
    force,
    configPath,
  });

  // Phase 3: Inject image tags (re-read updated markdown)
  for (const mdFile of mdFiles) {
    const content = await fs.readFile(mdFile);
    const injected = injectImageTags(content, mdFile, outputDir);
    if (injected !== content) {
      await fs.writeFile(mdFile, injected);
    }
  }

  return {
    extracted: totalExtracted,
    rendered: renderResults.length,
  };
}
