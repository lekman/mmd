import type { IRenderer } from "../domain/interfaces.ts";
import type { DiagramType } from "../domain/types.ts";
import { BEAUTIFUL_MERMAID_TYPES } from "../domain/types.ts";

/**
 * Renderer using beautiful-mermaid (zero-DOM, TypeScript-native).
 * Supports: flowchart, state (v0.1.x).
 *
 * This is a system adapter — excluded from unit test coverage.
 */
export class BeautifulMermaidRenderer implements IRenderer {
  readonly supportedTypes: ReadonlySet<DiagramType> = BEAUTIFUL_MERMAID_TYPES;

  async render(content: string): Promise<string> {
    // Dynamic import to avoid hard dependency when not used
    const { renderMermaid } = await import("beautiful-mermaid");
    return renderMermaid(content);
  }
}
