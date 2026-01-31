import { Command } from "commander";
import { sync } from "../../services/sync.ts";
import {
  CONFIG_PATH,
  createFallbackRenderer,
  createFs,
  createRenderer,
  loadConfig,
} from "../shared.ts";

export const syncCommand = new Command("sync")
  .description("Run extract + render + inject in sequence")
  .option("--force", "Re-render all diagrams regardless of timestamps", false)
  .argument("[files...]", "Specific .md files to process (default: all **/*.md)")
  .action(async (files: string[], options: { force: boolean }) => {
    const config = loadConfig();
    const fs = createFs();

    let mdFiles: string[];
    if (files.length > 0) {
      mdFiles = files;
    } else {
      mdFiles = await fs.glob("**/*.md", process.cwd());
    }

    const result = await sync({
      config,
      mdFiles,
      renderer: createRenderer(),
      fallbackRenderer: createFallbackRenderer(),
      fs,
      force: options.force,
      configPath: CONFIG_PATH,
    });

    // biome-ignore lint/suspicious/noConsole: CLI output
    console.log(`Extracted ${result.extracted} diagram(s), rendered ${result.rendered} diagram(s)`);
  });
