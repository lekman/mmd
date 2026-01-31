import { Command } from "commander";
import { injectImageTags } from "../../services/inject.ts";
import { createFs, loadConfig } from "../shared.ts";

export const injectCommand = new Command("inject")
  .description("Replace anchor comments in .md files with markdown image refs")
  .argument("[files...]", "Specific .md files to inject (default: all **/*.md)")
  .action(async (files: string[]) => {
    const config = loadConfig();
    const fs = createFs();
    const outputDir = config.outputDir ?? "docs/mmd";

    let mdFiles: string[];
    if (files.length > 0) {
      mdFiles = files;
    } else {
      mdFiles = await fs.glob("**/*.md", process.cwd());
    }

    let updated = 0;

    for (const mdFile of mdFiles) {
      const content = await fs.readFile(mdFile);
      const injected = injectImageTags(content, mdFile, outputDir);
      if (injected !== content) {
        await fs.writeFile(mdFile, injected);
        // biome-ignore lint/suspicious/noConsole: CLI output
        console.log(`  injected: ${mdFile}`);
        updated++;
      }
    }

    // biome-ignore lint/suspicious/noConsole: CLI output
    console.log(`\nInjected ${updated} file(s)`);
  });
