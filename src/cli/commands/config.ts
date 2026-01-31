import { existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { Command } from "commander";
import { DEFAULT_CONFIG } from "../shared.ts";

/**
 * Resolve the git repository root directory.
 * Returns null if not inside a git repository.
 */
function resolveRepoRoot(): string | null {
  const proc = Bun.spawnSync(["git", "rev-parse", "--show-toplevel"]);
  if (proc.exitCode !== 0) return null;
  return proc.stdout.toString().trim();
}

export const configCommand = new Command("config")
  .description("Write default .mermaid.json to the repository root")
  .option("--force", "Overwrite existing .mermaid.json", false)
  .action((options: { force: boolean }) => {
    const repoRoot = resolveRepoRoot();
    if (!repoRoot) {
      // biome-ignore lint/suspicious/noConsole: CLI output
      console.error("Error: not inside a git repository");
      process.exit(1);
    }

    const configPath = join(repoRoot, ".mermaid.json");

    if (existsSync(configPath) && !options.force) {
      // biome-ignore lint/suspicious/noConsole: CLI output
      console.log(`.mermaid.json already exists (use --force to overwrite)`);
      return;
    }

    const json = JSON.stringify(DEFAULT_CONFIG, null, 2);
    writeFileSync(configPath, `${json}\n`);

    // biome-ignore lint/suspicious/noConsole: CLI output
    console.log(`  created: ${configPath}`);
  });
