import type { IRenderer } from "../../src/domain/interfaces.ts";
import type { DiagramType } from "../../src/domain/types.ts";

export class MockRenderer implements IRenderer {
  readonly supportedTypes: ReadonlySet<DiagramType>;
  renderCalls: string[] = [];

  constructor(types: DiagramType[]) {
    this.supportedTypes = new Set(types);
  }

  async render(content: string): Promise<string> {
    this.renderCalls.push(content);
    return `<svg>${content}</svg>`;
  }
}
