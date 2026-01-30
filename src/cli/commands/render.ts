import { Command } from "commander";
import { renderDiagrams } from "../../services/render.ts";
import { createFallbackRenderer, createFs, createRenderer, loadConfig } from "../shared.ts";

export const renderCommand = new Command("render")
  .description("Render stale docs/mmd/*.mmd to *.light.svg + *.dark.svg")
  .option("--force", "Re-render all diagrams regardless of timestamps", false)
  .action(async (options: { force: boolean }) => {
    const config = loadConfig();
    const fs = createFs();
    const outputDir = config.outputDir ?? "docs/mmd";
    const mmdFiles = await fs.glob("*.mmd", outputDir);
    const fullPaths = mmdFiles.map((f) => `${outputDir}/${f}`);

    const results = await renderDiagrams(config, {
      renderer: createRenderer(),
      fallbackRenderer: createFallbackRenderer(),
      fs,
      mmdFiles: fullPaths,
      force: options.force,
    });

    for (const r of results) {
      // biome-ignore lint/suspicious/noConsole: CLI output
      console.log(`  rendered: ${r.lightSvgPath}, ${r.darkSvgPath}`);
    }
    // biome-ignore lint/suspicious/noConsole: CLI output
    console.log(`\nRendered ${results.length} diagram(s)`);
  });
