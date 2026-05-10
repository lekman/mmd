import type { IFileSystem, IRenderer } from "../domain/interfaces.ts";
import type { RenderResult, ThemeConfig, ThemeDef } from "../domain/types.ts";
import { hasFrontmatter } from "../domain/types.ts";
import { postProcessSvg } from "./svg-post-process.ts";

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
  fs: IFileSystem;
  mmdFiles: string[];
  force?: boolean;
  /** Path to .mermaid.json — used for config mtime staleness. */
  configPath?: string;
}

async function isSvgFresh(
  fs: IFileSystem,
  mmdPath: string,
  svgPath: string,
  configMtime: number
): Promise<boolean> {
  if (!(await fs.exists(svgPath))) return false;
  const sourceMtime = await fs.mtime(mmdPath);
  const svgMtime = await fs.mtime(svgPath);
  return svgMtime >= Math.max(sourceMtime, configMtime);
}

/**
 * Render .mmd files to single-mode SVGs.
 *
 * Author frontmatter wins: when a diagram declares its own `---config:---`
 * block, the workspace theme is not injected. Otherwise the configured theme
 * is prepended as a %%{init}%% directive.
 *
 * Skips files where SVG is newer than both source and config unless force is true.
 * Cleans up old .light.svg / .dark.svg files from the dual-mode era.
 */
export async function renderDiagrams(
  config: ThemeConfig,
  options: RenderOptions
): Promise<RenderResult[]> {
  const { renderer, fs, mmdFiles, force = false, configPath } = options;
  const mode = config.mode ?? "light";
  const theme = config.themes[mode];
  const results: RenderResult[] = [];

  let configMtime = 0;
  if (configPath && (await fs.exists(configPath))) {
    configMtime = await fs.mtime(configPath);
  }

  for (const mmdPath of mmdFiles) {
    const svgPath = mmdPath.replace(/\.mmd$/, ".svg");

    if (!force && (await isSvgFresh(fs, mmdPath, svgPath, configMtime))) {
      continue;
    }

    const content = await fs.readFile(mmdPath);
    const themed = hasFrontmatter(content) ? content : prependThemeInit(content, theme);
    const raw = await renderer.render(themed);
    const svg = config.svgStyle ? postProcessSvg(raw, config.svgStyle) : raw;
    await fs.writeFile(svgPath, svg);

    // Clean up old dual-mode files
    await fs.delete(mmdPath.replace(/\.mmd$/, ".light.svg"));
    await fs.delete(mmdPath.replace(/\.mmd$/, ".dark.svg"));

    results.push({ sourcePath: mmdPath, svgPath });
  }

  return results;
}
