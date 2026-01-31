import { Command } from "commander";
import { extractMermaidBlocks, replaceBlocksWithAnchors } from "../../services/extract.ts";
import { createFs, loadConfig } from "../shared.ts";

export const extractCommand = new Command("extract")
  .description("Scan .md files, extract Mermaid blocks to docs/mmd/*.mmd")
  .argument("[files...]", "Specific .md files to scan (default: all **/*.md)")
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

    let total = 0;

    await fs.mkdir(outputDir);

    for (const mdFile of mdFiles) {
      const content = await fs.readFile(mdFile);
      const blocks = extractMermaidBlocks(content, mdFile);
      if (blocks.length === 0) continue;

      for (const block of blocks) {
        const mmdPath = `${outputDir}/${block.name}.mmd`;
        await fs.writeFile(mmdPath, block.content);
        // biome-ignore lint/suspicious/noConsole: CLI output
        console.log(`  extracted: ${mmdPath}`);
      }

      const updated = replaceBlocksWithAnchors(content, blocks, outputDir);
      await fs.writeFile(mdFile, updated);
      total += blocks.length;
    }

    // biome-ignore lint/suspicious/noConsole: CLI output
    console.log(`\nExtracted ${total} diagram(s)`);
  });
