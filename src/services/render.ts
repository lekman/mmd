import type { IFileSystem, IRenderer } from "../domain/interfaces.ts";
import type { RenderResult, ThemeConfig, ThemeDef } from "../domain/types.ts";
import { BEAUTIFUL_MERMAID_TYPES, detectDiagramType } from "../domain/types.ts";

/**
 * Prepend a %%{init: ...}%% directive to Mermaid content.
 */
export function prependThemeInit(content: string, theme: ThemeDef): string {
  const init = {
    theme: theme.theme ?? "default",
    themeVariables: theme.themeVariables ?? {},
  };
  return `%%{init: ${JSON.stringify(init)}}%%\n${content}`;
}

export interface RenderOptions {
  renderer: IRenderer;
  fallbackRenderer: IRenderer;
  fs: IFileSystem;
  mmdFiles: string[];
  force?: boolean;
  /** Path to .mermaid.json — used for config mtime staleness. */
  configPath?: string;
}

/**
 * Render .mmd files to single-mode SVGs using the selected theme.
 * Skips files where SVG is newer than both source and config unless force is true.
 * Cleans up old .light.svg / .dark.svg files from the dual-mode era.
 */
export async function renderDiagrams(
  config: ThemeConfig,
  options: RenderOptions
): Promise<RenderResult[]> {
  const { renderer, fallbackRenderer, fs, mmdFiles, force = false, configPath } = options;
  const mode = config.mode ?? "light";
  const theme = config.themes[mode];
  const results: RenderResult[] = [];

  // Get config mtime for staleness comparison
  let configMtime = 0;
  if (configPath) {
    const configExists = await fs.exists(configPath);
    if (configExists) {
      configMtime = await fs.mtime(configPath);
    }
  }

  for (const mmdPath of mmdFiles) {
    const svgPath = mmdPath.replace(/\.mmd$/, ".svg");

    // Staleness check
    if (!force) {
      const svgExists = await fs.exists(svgPath);

      if (svgExists) {
        const sourceMtime = await fs.mtime(mmdPath);
        const svgMtime = await fs.mtime(svgPath);
        const newestSource = Math.max(sourceMtime, configMtime);

        if (svgMtime >= newestSource) {
          continue;
        }
      }
    }

    const content = await fs.readFile(mmdPath);
    const diagramType = detectDiagramType(content);

    // Choose renderer based on diagram type
    const activeRenderer = BEAUTIFUL_MERMAID_TYPES.has(diagramType) ? renderer : fallbackRenderer;

    // Render single SVG with selected theme
    const themed = prependThemeInit(content, theme);
    const svg = await activeRenderer.render(themed);
    await fs.writeFile(svgPath, svg);

    // Clean up old dual-mode files
    const lightPath = mmdPath.replace(/\.mmd$/, ".light.svg");
    const darkPath = mmdPath.replace(/\.mmd$/, ".dark.svg");
    await fs.delete(lightPath);
    await fs.delete(darkPath);

    results.push({
      sourcePath: mmdPath,
      svgPath,
    });
  }

  return results;
}
