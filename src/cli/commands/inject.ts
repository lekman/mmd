import { Command } from "commander";
import { injectPictureTags } from "../../services/inject.ts";
import { createFs, loadConfig } from "../shared.ts";

export const injectCommand = new Command("inject")
  .description("Replace anchor comments in .md files with <picture> image refs")
  .action(async () => {
    const config = loadConfig();
    const fs = createFs();
    const outputDir = config.outputDir ?? "docs/mmd";
    const mdFiles = await fs.glob("**/*.md", process.cwd());
    let updated = 0;

    for (const mdFile of mdFiles) {
      const content = await fs.readFile(mdFile);
      const injected = injectPictureTags(content, mdFile, outputDir);
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
