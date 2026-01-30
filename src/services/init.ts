import { homedir } from "node:os";
import { join } from "node:path";
import type { IFileSystem } from "../domain/interfaces.ts";

export type AiTool = "claude" | "cursor" | "copilot";

export interface InitOptions {
  tools?: AiTool[];
  global?: boolean;
  force?: boolean;
  all?: boolean;
}

/**
 * Detect which AI coding tools are present in the current project.
 */
export async function detectAiTools(fs: IFileSystem): Promise<AiTool[]> {
  const tools: AiTool[] = [];

  if ((await fs.exists(".claude/settings.json")) || (await fs.exists("CLAUDE.md"))) {
    tools.push("claude");
  }
  if ((await fs.exists(".cursor/settings.json")) || (await fs.exists(".cursorrules"))) {
    tools.push("cursor");
  }
  if (await fs.exists(".github/workflows/ci.yml")) {
    tools.push("copilot");
  }

  return tools;
}

/**
 * Get the install path for a given AI tool.
 * Returns null if the tool does not support global scope.
 */
export function getInstallPaths(tool: AiTool, global: boolean): string | null {
  if (global) {
    if (tool === "claude") {
      return join(homedir(), ".claude/skills/mermaid/SKILL.md");
    }
    // Cursor and Copilot do not support global install
    return null;
  }

  switch (tool) {
    case "claude":
      return ".claude/skills/mermaid/SKILL.md";
    case "cursor":
      return ".cursor/rules/mermaid.mdc";
    case "copilot":
      return ".github/instructions/mermaid.instructions.md";
  }
}

/**
 * Template source paths within the package.
 */
export function getTemplatePath(tool: AiTool): string {
  switch (tool) {
    case "claude":
      return "src/templates/claude-skill.md";
    case "cursor":
      return "src/templates/cursor-rule.mdc";
    case "copilot":
      return "src/templates/copilot-instructions.md";
  }
}
