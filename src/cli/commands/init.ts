import { Command } from "commander";

// Init command is a placeholder — full implementation in Task 9
export const initCommand = new Command("init")
  .description("Install AI coding assistant rule files (Claude, Cursor, Copilot)")
  .option("--global", "Install to global/user-level paths", false)
  .option("--all", "Install all rule files regardless of detection", false)
  .option("--claude", "Install only Claude Code skill", false)
  .option("--cursor", "Install only Cursor rule", false)
  .option("--copilot", "Install only GitHub Copilot instructions", false)
  .option("--force", "Overwrite existing rule files", false)
  .action(async () => {
    // biome-ignore lint/suspicious/noConsole: CLI output
    console.log("Init command — will be implemented in Task 9");
  });
