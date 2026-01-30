import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { Command } from "commander";
import {
  type AiTool,
  detectAiTools,
  getInstallPaths,
  getTemplatePath,
} from "../../services/init.ts";
import { createFs } from "../shared.ts";

interface InitFlags {
  global: boolean;
  all: boolean;
  claude: boolean;
  cursor: boolean;
  copilot: boolean;
  force: boolean;
}

export const initCommand = new Command("init")
  .description("Install AI coding assistant rule files (Claude, Cursor, Copilot)")
  .option("--global", "Install to global/user-level paths", false)
  .option("--all", "Install all rule files regardless of detection", false)
  .option("--claude", "Install only Claude Code skill", false)
  .option("--cursor", "Install only Cursor rule", false)
  .option("--copilot", "Install only GitHub Copilot instructions", false)
  .option("--force", "Overwrite existing rule files", false)
  .action(async (flags: InitFlags) => {
    const fs = createFs();
    let tools: AiTool[];

    // Determine which tools to install
    if (flags.all) {
      tools = ["claude", "cursor", "copilot"];
    } else if (flags.claude || flags.cursor || flags.copilot) {
      tools = [];
      if (flags.claude) tools.push("claude");
      if (flags.cursor) tools.push("cursor");
      if (flags.copilot) tools.push("copilot");
    } else {
      tools = await detectAiTools(fs);
      if (tools.length === 0) {
        // biome-ignore lint/suspicious/noConsole: CLI output
        console.log("No AI tools detected. Use --all to install all rule files.");
        return;
      }
    }

    // Walk up from the script location to find the package root (where package.json lives).
    // Works both in source (src/cli/commands/) and bundle (dist/).
    let packageRoot = dirname(new URL(import.meta.url).pathname);
    while (!existsSync(resolve(packageRoot, "package.json"))) {
      const parent = dirname(packageRoot);
      if (parent === packageRoot) break;
      packageRoot = parent;
    }

    for (const tool of tools) {
      const destPath = getInstallPaths(tool, flags.global);
      if (destPath === null) {
        // biome-ignore lint/suspicious/noConsole: CLI output
        console.warn(`  skip: ${tool} (global install not supported)`);
        continue;
      }

      if (!flags.force && existsSync(destPath)) {
        // biome-ignore lint/suspicious/noConsole: CLI output
        console.log(`  skip: ${destPath} (exists, use --force to overwrite)`);
        continue;
      }

      const templatePath = resolve(packageRoot, getTemplatePath(tool));
      try {
        const template = readFileSync(templatePath, "utf-8");
        mkdirSync(dirname(destPath), { recursive: true });
        writeFileSync(destPath, template);
        // biome-ignore lint/suspicious/noConsole: CLI output
        console.log(`  installed: ${destPath}`);
      } catch (err) {
        // biome-ignore lint/suspicious/noConsole: CLI output
        console.error(`  error: ${tool} — ${err}`);
      }
    }

    // Add VS Code extension recommendation
    const vscodeExtPath = ".vscode/extensions.json";
    if (!flags.global) {
      try {
        let extensions: { recommendations?: string[] } = {};
        if (existsSync(vscodeExtPath)) {
          extensions = JSON.parse(readFileSync(vscodeExtPath, "utf-8"));
        }
        const recs = extensions.recommendations ?? [];
        const ext = "MermaidChart.vscode-mermaid-chart";
        if (!recs.includes(ext)) {
          recs.push(ext);
          extensions.recommendations = recs;
          mkdirSync(".vscode", { recursive: true });
          writeFileSync(vscodeExtPath, `${JSON.stringify(extensions, null, 2)}\n`);
          // biome-ignore lint/suspicious/noConsole: CLI output
          console.log(`  installed: ${vscodeExtPath}`);
        }
      } catch {
        // ignore VS Code extension errors
      }
    }
  });
