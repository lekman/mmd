import { Command } from "commander";
import { sync } from "../../services/sync.ts";
import { createFallbackRenderer, createFs, createRenderer, loadConfig } from "../shared.ts";

export const syncCommand = new Command("sync")
  .description("Run extract + render + inject in sequence")
  .option("--force", "Re-render all diagrams regardless of timestamps", false)
  .action(async (options: { force: boolean }) => {
    const config = loadConfig();
    const fs = createFs();
    const mdFiles = await fs.glob("**/*.md", process.cwd());

    const result = await sync({
      config,
      mdFiles,
      renderer: createRenderer(),
      fallbackRenderer: createFallbackRenderer(),
      fs,
      force: options.force,
    });

    // biome-ignore lint/suspicious/noConsole: CLI output
    console.log(`Extracted ${result.extracted} diagram(s), rendered ${result.rendered} diagram(s)`);
  });
