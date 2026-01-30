import type { IRenderer } from "../domain/interfaces.ts";
import type { DiagramType } from "../domain/types.ts";

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
    const { join } = await import("node:path");

    const inputPath = join(tmpdir(), `mmd-input-${Date.now()}.mmd`);
    const outputPath = join(tmpdir(), `mmd-output-${Date.now()}.svg`);

    try {
      writeFileSync(inputPath, content);
      const proc = Bun.spawnSync(["npx", "mmdc", "-i", inputPath, "-o", outputPath, "-e", "svg"]);
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
