import { execFileSync, execSync } from "node:child_process";
import { existsSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { IRenderer } from "../../../src/domain/interfaces";
import type { DiagramType } from "../../../src/domain/types";

/**
 * Resolve the mmdc binary path.
 */
function resolveMmdcBinary(): string | null {
  const localBin = join(process.cwd(), "node_modules", ".bin", "mmdc");
  if (existsSync(localBin)) return localBin;

  try {
    const cmd = process.platform === "win32" ? "where mmdc" : "which mmdc";
    const resolved = execSync(cmd, { encoding: "utf-8" }).trim().split(/\r?\n/)[0];
    if (resolved) return resolved;
  } catch {
    // not found
  }

  return null;
}

/**
 * Fallback renderer using @mermaid-js/mermaid-cli (mmdc).
 * Node.js-compatible version for the VSCode extension.
 */
export class MmdcRenderer implements IRenderer {
  private readonly width: number;

  constructor(width = 1200) {
    this.width = width;
  }

  readonly supportedTypes: ReadonlySet<DiagramType> = new Set<DiagramType>([
    "flowchart",
    "sequence",
    "class",
    "state",
    "er",
    "c4",
    "gantt",
    "pie",
    "gitgraph",
    "mindmap",
    "timeline",
    "quadrant",
    "kanban",
    "requirement",
    "architecture",
  ]);

  async render(content: string): Promise<string> {
    const mmdcPath = resolveMmdcBinary();
    if (!mmdcPath) {
      throw new Error(
        "mmdc is required for this diagram type but @mermaid-js/mermaid-cli is not installed.\n" +
          "Install it with: npm install -g @mermaid-js/mermaid-cli"
      );
    }

    const inputPath = join(tmpdir(), `mmd-input-${Date.now()}.mmd`);
    const outputPath = join(tmpdir(), `mmd-output-${Date.now()}.svg`);

    try {
      writeFileSync(inputPath, content);
      execFileSync(mmdcPath, ["-i", inputPath, "-o", outputPath, "-e", "svg", "-w", String(this.width)]);
      return readFileSync(outputPath, "utf-8");
    } finally {
      try { unlinkSync(inputPath); } catch { /* ignore */ }
      try { unlinkSync(outputPath); } catch { /* ignore */ }
    }
  }
}
