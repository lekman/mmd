import type { IRenderer } from "../../../src/domain/interfaces";
import type { DiagramType } from "../../../src/domain/types";
import { BEAUTIFUL_MERMAID_TYPES } from "../../../src/domain/types";

/**
 * Renderer using beautiful-mermaid (zero-DOM, TypeScript-native).
 * Node.js-compatible version for the VSCode extension.
 */
export class BeautifulMermaidRenderer implements IRenderer {
  readonly supportedTypes: ReadonlySet<DiagramType> = BEAUTIFUL_MERMAID_TYPES;

  async render(content: string): Promise<string> {
    const { renderMermaid } = await import("beautiful-mermaid");
    return renderMermaid(content);
  }
}
