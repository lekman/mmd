import { Command } from "commander";
import { convertBlocks } from "../../services/convert.ts";
import {
  CONFIG_PATH,
  createFallbackRenderer,
  createFs,
  createRenderer,
  loadConfig,
} from "../shared.ts";

export const convertCommand = new Command("convert")
  .description("Convert mermaid fenced blocks to SVG references")
  .argument("<file>", "Markdown file to convert")
  .option("--block <index>", "Convert only the block at this index (0-based)")
  .action(async (file: string, options: { block?: string }) => {
    const config = loadConfig();
    const fs = createFs();

    const result = await convertBlocks({
      config,
      mdFile: file,
      renderer: createRenderer(),
      fallbackRenderer: createFallbackRenderer(config.renderWidth),
      fs,
      blockIndex: options.block !== undefined ? Number(options.block) : undefined,
      configPath: CONFIG_PATH,
    });

    // biome-ignore lint/suspicious/noConsole: CLI output
    console.log(`Converted ${result.extracted} block(s), rendered ${result.rendered} SVG(s)`);
  });
