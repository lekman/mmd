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
}

/**
 * Render .mmd files to dual light/dark SVGs using theme config.
 * Skips files where SVGs are newer than source unless force is true.
 */
export async function renderDiagrams(
  config: ThemeConfig,
  options: RenderOptions
): Promise<RenderResult[]> {
  const { renderer, fallbackRenderer, fs, mmdFiles, force = false } = options;
  const results: RenderResult[] = [];

  for (const mmdPath of mmdFiles) {
    const lightPath = mmdPath.replace(/\.mmd$/, ".light.svg");
    const darkPath = mmdPath.replace(/\.mmd$/, ".dark.svg");

    // Staleness check
    if (!force) {
      const lightExists = await fs.exists(lightPath);
      const darkExists = await fs.exists(darkPath);

      if (lightExists && darkExists) {
        const sourceMtime = await fs.mtime(mmdPath);
        const lightMtime = await fs.mtime(lightPath);
        const darkMtime = await fs.mtime(darkPath);

        if (lightMtime >= sourceMtime && darkMtime >= sourceMtime) {
          continue;
        }
      }
    }

    const content = await fs.readFile(mmdPath);
    const diagramType = detectDiagramType(content);

    // Choose renderer based on diagram type
    const activeRenderer = BEAUTIFUL_MERMAID_TYPES.has(diagramType) ? renderer : fallbackRenderer;

    // Render light variant
    const lightContent = prependThemeInit(content, config.themes.light);
    const lightSvg = await activeRenderer.render(lightContent);
    await fs.writeFile(lightPath, lightSvg);

    // Render dark variant
    const darkContent = prependThemeInit(content, config.themes.dark);
    const darkSvg = await activeRenderer.render(darkContent);
    await fs.writeFile(darkPath, darkSvg);

    results.push({
      sourcePath: mmdPath,
      lightSvgPath: lightPath,
      darkSvgPath: darkPath,
    });
  }

  return results;
}
