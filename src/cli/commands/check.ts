import { Command } from "commander";
import { checkOrphanedBlocks } from "../../services/check.ts";
import { createFs } from "../shared.ts";

export const checkCommand = new Command("check")
  .description("Lint: warn on inline Mermaid blocks in managed .md files")
  .action(async () => {
    const fs = createFs();
    const mdFiles = await fs.glob("**/*.md", process.cwd());
    let totalWarnings = 0;

    for (const mdFile of mdFiles) {
      const content = await fs.readFile(mdFile);
      const warnings = checkOrphanedBlocks(content, mdFile);
      for (const w of warnings) {
        // biome-ignore lint/suspicious/noConsole: CLI output
        console.warn(`  ${w.sourceFile}:${w.line}: ${w.message}`);
      }
      totalWarnings += warnings.length;
    }

    if (totalWarnings > 0) {
      // biome-ignore lint/suspicious/noConsole: CLI output
      console.warn(`\n${totalWarnings} warning(s) found`);
      process.exit(1);
    } else {
      // biome-ignore lint/suspicious/noConsole: CLI output
      console.log("No warnings found");
    }
  });
