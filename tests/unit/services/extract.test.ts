import { describe, expect, test } from "bun:test";
import {
  extractMermaidBlocks,
  generateDiagramName,
  replaceBlocksWithAnchors,
} from "../../../src/services/extract.ts";

describe("extractMermaidBlocks", () => {
  test("finds a single fenced mermaid block", () => {
    const md = "# Title\n\n```mermaid\nflowchart TD\n  A --> B\n```\n";
    const blocks = extractMermaidBlocks(md, "README.md");
    expect(blocks).toHaveLength(1);
    expect(blocks[0]!.content).toBe("flowchart TD\n  A --> B");
    expect(blocks[0]!.sourceFile).toBe("README.md");
    expect(blocks[0]!.diagramType).toBe("flowchart");
    expect(blocks[0]!.startLine).toBe(3);
    expect(blocks[0]!.endLine).toBe(6);
  });

  test("returns empty array when no mermaid blocks exist", () => {
    const md = "# Title\n\nNo diagrams here.\n";
    const blocks = extractMermaidBlocks(md, "README.md");
    expect(blocks).toHaveLength(0);
  });

  test("finds multiple mermaid blocks", () => {
    const md = [
      "# Title",
      "",
      "```mermaid",
      "flowchart TD",
      "  A --> B",
      "```",
      "",
      "Some text",
      "",
      "```mermaid",
      "sequenceDiagram",
      "  Alice->>Bob: Hello",
      "```",
      "",
    ].join("\n");
    const blocks = extractMermaidBlocks(md, "docs/ARCH.md");
    expect(blocks).toHaveLength(2);
    expect(blocks[0]!.diagramType).toBe("flowchart");
    expect(blocks[1]!.diagramType).toBe("sequence");
  });

  test("ignores non-mermaid code blocks", () => {
    const md = "```typescript\nconst x = 1;\n```\n\n```mermaid\nflowchart TD\n  A --> B\n```\n";
    const blocks = extractMermaidBlocks(md, "README.md");
    expect(blocks).toHaveLength(1);
    expect(blocks[0]!.diagramType).toBe("flowchart");
  });

  test("handles empty content", () => {
    const blocks = extractMermaidBlocks("", "empty.md");
    expect(blocks).toHaveLength(0);
  });

  test("assigns correct line numbers for blocks", () => {
    const md = "line1\nline2\n```mermaid\nflowchart TD\n  A-->B\n```\nline7\n";
    const blocks = extractMermaidBlocks(md, "test.md");
    expect(blocks).toHaveLength(1);
    expect(blocks[0]!.startLine).toBe(3);
    expect(blocks[0]!.endLine).toBe(6);
  });
});

describe("generateDiagramName", () => {
  test("generates name from file path and index", () => {
    expect(generateDiagramName("README.md", 0)).toBe("readme-0");
  });

  test("generates name from nested file path", () => {
    expect(generateDiagramName("docs/ARCHITECTURE.md", 0)).toBe("architecture-0");
  });

  test("generates name with incrementing index", () => {
    expect(generateDiagramName("README.md", 2)).toBe("readme-2");
  });

  test("lowercases and strips extension", () => {
    expect(generateDiagramName("docs/My-Guide.md", 0)).toBe("my-guide-0");
  });
});

describe("replaceBlocksWithAnchors", () => {
  test("replaces a single block with anchor and markdown image", () => {
    const md = "# Title\n\n```mermaid\nflowchart TD\n  A --> B\n```\n\nMore text\n";
    const blocks = extractMermaidBlocks(md, "README.md");
    const result = replaceBlocksWithAnchors(md, blocks, "docs/mmd");

    expect(result).toContain("<!-- mmd:readme-0 -->");
    expect(result).toContain("![Readme 0](docs/mmd/readme-0.svg)");
    expect(result).not.toContain("<picture>");
    expect(result).not.toContain("```mermaid");
    expect(result).toContain("# Title");
    expect(result).toContain("More text");
  });

  test("replaces multiple blocks", () => {
    const md = [
      "# Title",
      "",
      "```mermaid",
      "flowchart TD",
      "  A --> B",
      "```",
      "",
      "```mermaid",
      "sequenceDiagram",
      "  Alice->>Bob: Hello",
      "```",
      "",
    ].join("\n");
    const blocks = extractMermaidBlocks(md, "README.md");
    const result = replaceBlocksWithAnchors(md, blocks, "docs/mmd");

    expect(result).toContain("<!-- mmd:readme-0 -->");
    expect(result).toContain("<!-- mmd:readme-1 -->");
    expect(result).not.toContain("```mermaid");
  });

  test("preserves content outside blocks", () => {
    const md = "Before\n\n```mermaid\nflowchart TD\n  A-->B\n```\n\nAfter\n";
    const blocks = extractMermaidBlocks(md, "test.md");
    const result = replaceBlocksWithAnchors(md, blocks, "docs/mmd");

    expect(result).toContain("Before");
    expect(result).toContain("After");
  });

  test("returns unchanged content when no blocks", () => {
    const md = "# No diagrams\n\nJust text.\n";
    const result = replaceBlocksWithAnchors(md, [], "docs/mmd");
    expect(result).toBe(md);
  });
});
