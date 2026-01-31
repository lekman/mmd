import { Command } from "commander";
import { renderDiagrams } from "../../services/render.ts";
import {
  CONFIG_PATH,
  createFallbackRenderer,
  createFs,
  createRenderer,
  loadConfig,
} from "../shared.ts";

export const renderCommand = new Command("render")
  .description("Render stale docs/mmd/*.mmd to *.svg")
  .option("--force", "Re-render all diagrams regardless of timestamps", false)
  .argument("[files...]", "Specific .mmd files to render (default: all in outputDir)")
  .action(async (files: string[], options: { force: boolean }) => {
    const config = loadConfig();
    const fs = createFs();
    const outputDir = config.outputDir ?? "docs/mmd";

    let fullPaths: string[];
    if (files.length > 0) {
      fullPaths = files;
    } else {
      const mmdFiles = await fs.glob("*.mmd", outputDir);
      fullPaths = mmdFiles.map((f) => `${outputDir}/${f}`);
    }

    const results = await renderDiagrams(config, {
      renderer: createRenderer(),
      fallbackRenderer: createFallbackRenderer(),
      fs,
      mmdFiles: fullPaths,
      force: options.force,
      configPath: CONFIG_PATH,
    });

    for (const r of results) {
      // biome-ignore lint/suspicious/noConsole: CLI output
      console.log(`  rendered: ${r.svgPath}`);
    }
    // biome-ignore lint/suspicious/noConsole: CLI output
    console.log(`\nRendered ${results.length} diagram(s)`);
  });
