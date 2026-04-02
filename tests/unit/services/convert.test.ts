import { describe, expect, test } from "bun:test";
import type { ThemeConfig } from "../../../src/domain/types.ts";
import { convertBlocks } from "../../../src/services/convert.ts";
import { MockFileSystem } from "../../mocks/mock-fs.ts";
import { MockRenderer } from "../../mocks/mock-renderer.ts";

const config: ThemeConfig = {
  outputDir: "docs/mmd",
  themes: {
    light: {
      theme: "base",
      themeVariables: { background: "#ffffff", primaryColor: "#ddf4ff" },
    },
    dark: {
      theme: "base",
      themeVariables: { background: "#0d1117", primaryColor: "#1f3a5f" },
    },
  },
};

function createDeps(fs: MockFileSystem) {
  return {
    config,
    renderer: new MockRenderer(["flowchart"]),
    fallbackRenderer: new MockRenderer(["c4", "sequence"]),
    fs,
  };
}

const MD_ONE_BLOCK = [
  "# Title",
  "",
  "```mermaid",
  "flowchart TD",
  "  A --> B",
  "```",
  "",
  "Some text",
].join("\n");

const MD_TWO_BLOCKS = [
  "# Title",
  "",
  "```mermaid",
  "flowchart TD",
  "  A --> B",
  "```",
  "",
  "Middle text",
  "",
  "```mermaid",
  "sequenceDiagram",
  "  A->>B: Hi",
  "```",
  "",
  "End text",
].join("\n");

describe("convertBlocks", () => {
  test("converts all blocks in a file", async () => {
    const fs = new MockFileSystem();
    fs.setFile("README.md", MD_ONE_BLOCK);

    const result = await convertBlocks({
      ...createDeps(fs),
      mdFile: "README.md",
    });

    expect(result.extracted).toBe(1);
    expect(result.rendered).toBe(1);

    // .mmd file was written
    expect(await fs.exists("docs/mmd/readme-0.mmd")).toBe(true);

    // .svg file was written
    expect(await fs.exists("docs/mmd/readme-0.svg")).toBe(true);

    // Markdown was updated with anchor and image tag
    const updated = await fs.readFile("README.md");
    expect(updated).toContain("<!-- mmd:readme-0 -->");
    expect(updated).toContain("![Readme 0](docs/mmd/readme-0.svg)");
    expect(updated).not.toContain("```mermaid");
    expect(updated).toContain("Some text");
  });

  test("converts a specific block by index", async () => {
    const fs = new MockFileSystem();
    fs.setFile("README.md", MD_TWO_BLOCKS);

    const result = await convertBlocks({
      ...createDeps(fs),
      mdFile: "README.md",
      blockIndex: 0,
    });

    expect(result.extracted).toBe(1);
    expect(result.rendered).toBe(1);

    const updated = await fs.readFile("README.md");
    // First block converted
    expect(updated).toContain("<!-- mmd:readme-0 -->");
    // Second block remains as fenced mermaid
    expect(updated).toContain("sequenceDiagram");
    expect(updated).toContain("```mermaid");
  });

  test("converts second block by index", async () => {
    const fs = new MockFileSystem();
    fs.setFile("README.md", MD_TWO_BLOCKS);

    const result = await convertBlocks({
      ...createDeps(fs),
      mdFile: "README.md",
      blockIndex: 1,
    });

    expect(result.extracted).toBe(1);

    const updated = await fs.readFile("README.md");
    // Second block converted
    expect(updated).toContain("<!-- mmd:readme-1 -->");
    // First block remains as fenced mermaid
    expect(updated).toContain("flowchart TD");
  });

  test("converts all blocks when no blockIndex specified", async () => {
    const fs = new MockFileSystem();
    fs.setFile("README.md", MD_TWO_BLOCKS);

    const result = await convertBlocks({
      ...createDeps(fs),
      mdFile: "README.md",
    });

    expect(result.extracted).toBe(2);
    expect(result.rendered).toBe(2);

    const updated = await fs.readFile("README.md");
    expect(updated).toContain("<!-- mmd:readme-0 -->");
    expect(updated).toContain("<!-- mmd:readme-1 -->");
    expect(updated).not.toContain("```mermaid");
  });

  test("returns zero counts when file has no mermaid blocks", async () => {
    const fs = new MockFileSystem();
    fs.setFile("README.md", "# Title\n\nNo diagrams here.\n");

    const result = await convertBlocks({
      ...createDeps(fs),
      mdFile: "README.md",
    });

    expect(result.extracted).toBe(0);
    expect(result.rendered).toBe(0);
  });

  test("returns zero counts when blockIndex is out of range", async () => {
    const fs = new MockFileSystem();
    fs.setFile("README.md", MD_ONE_BLOCK);

    const result = await convertBlocks({
      ...createDeps(fs),
      mdFile: "README.md",
      blockIndex: 5,
    });

    expect(result.extracted).toBe(0);
    expect(result.rendered).toBe(0);
  });

  test("skips writing .mmd if it already exists", async () => {
    const fs = new MockFileSystem();
    fs.setFile("README.md", MD_ONE_BLOCK);
    fs.setFile("docs/mmd/readme-0.mmd", "existing content");

    const result = await convertBlocks({
      ...createDeps(fs),
      mdFile: "README.md",
    });

    expect(result.extracted).toBe(1);
    // .mmd file should NOT be overwritten
    const mmdContent = await fs.readFile("docs/mmd/readme-0.mmd");
    expect(mmdContent).toBe("existing content");
  });

  test("uses relative paths for subdirectory source files", async () => {
    const fs = new MockFileSystem();
    fs.setFile("docs/ARCHITECTURE.md", MD_ONE_BLOCK);

    await convertBlocks({
      ...createDeps(fs),
      mdFile: "docs/ARCHITECTURE.md",
    });

    const updated = await fs.readFile("docs/ARCHITECTURE.md");
    expect(updated).toContain("![Architecture 0](mmd/architecture-0.svg)");
    expect(updated).not.toContain("docs/mmd/architecture-0.svg");
  });
});
