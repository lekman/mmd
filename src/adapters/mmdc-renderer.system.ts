import { existsSync } from "node:fs";
import { join } from "node:path";
import type { IRenderer } from "../domain/interfaces.ts";
import type { DiagramType } from "../domain/types.ts";

/**
 * Resolve the mmdc binary path. Checks:
 * 1. Local node_modules/.bin/mmdc
 * 2. Global PATH lookup via `which`
 *
 * Returns the resolved path, or null if not found.
 */
function resolveMmdcBinary(): string | null {
  // Check local node_modules/.bin/mmdc
  const localBin = join(process.cwd(), "node_modules", ".bin", "mmdc");
  if (existsSync(localBin)) return localBin;

  // Check PATH
  const whichProc = Bun.spawnSync(["which", "mmdc"]);
  if (whichProc.exitCode === 0) {
    const resolved = whichProc.stdout.toString().trim();
    if (resolved) return resolved;
  }

  return null;
}

/**
 * Fallback renderer using @mermaid-js/mermaid-cli (mmdc).
 * Supports all Mermaid diagram types via Puppeteer-based rendering.
 *
 * This is a system adapter — excluded from unit test coverage.
 */
export class MmdcRenderer implements IRenderer {
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
    const { writeFileSync, readFileSync, unlinkSync } = await import("node:fs");
    const { tmpdir } = await import("node:os");

    const mmdcPath = resolveMmdcBinary();
    if (!mmdcPath) {
      throw new Error(
        "mmdc is required for this diagram type but @mermaid-js/mermaid-cli is not installed.\n" +
          "Install it with: bun add -g @mermaid-js/mermaid-cli"
      );
    }

    const inputPath = join(tmpdir(), `mmd-input-${Date.now()}.mmd`);
    const outputPath = join(tmpdir(), `mmd-output-${Date.now()}.svg`);

    try {
      writeFileSync(inputPath, content);
      const proc = Bun.spawnSync([mmdcPath, "-i", inputPath, "-o", outputPath, "-e", "svg"]);
      if (proc.exitCode !== 0) {
        const stderr = proc.stderr.toString();
        throw new Error(`mmdc failed (exit ${proc.exitCode}): ${stderr}`);
      }
      return readFileSync(outputPath, "utf-8");
    } finally {
      try {
        unlinkSync(inputPath);
      } catch {
        // ignore cleanup errors
      }
      try {
        unlinkSync(outputPath);
      } catch {
        // ignore cleanup errors
      }
    }
  }
}
