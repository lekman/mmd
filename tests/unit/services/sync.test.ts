import { describe, expect, test } from "bun:test";
import type { ThemeConfig } from "../../../src/domain/types.ts";
import { sync } from "../../../src/services/sync.ts";
import { MockFileSystem } from "../../mocks/mock-fs.ts";
import { MockRenderer } from "../../mocks/mock-renderer.ts";

const config: ThemeConfig = {
  outputDir: "docs/mmd",
  themes: {
    light: { theme: "base", themeVariables: { background: "#fff" } },
    dark: { theme: "base", themeVariables: { background: "#000" } },
  },
};

describe("sync", () => {
  test("runs extract, render, inject pipeline on markdown files", async () => {
    const fs = new MockFileSystem();
    fs.setFile("README.md", "# Title\n\n```mermaid\nflowchart TD\n  A --> B\n```\n");

    const renderer = new MockRenderer(["flowchart"]);

    const result = await sync({
      config,
      mdFiles: ["README.md"],
      renderer,
      fallbackRenderer: renderer,
      fs,
    });

    // Extract should have created .mmd file
    expect(await fs.exists("docs/mmd/readme-0.mmd")).toBe(true);

    // Render should have created SVGs
    expect(await fs.exists("docs/mmd/readme-0.light.svg")).toBe(true);
    expect(await fs.exists("docs/mmd/readme-0.dark.svg")).toBe(true);

    // Inject should have updated the markdown
    const updatedMd = await fs.readFile("README.md");
    expect(updatedMd).toContain("<!-- mmd:readme-0 -->");
    expect(updatedMd).toContain("<picture>");
    expect(updatedMd).not.toContain("```mermaid");

    expect(result.extracted).toBe(1);
    expect(result.rendered).toBe(1);
  });

  test("handles file with no mermaid blocks", async () => {
    const fs = new MockFileSystem();
    fs.setFile("README.md", "# Title\n\nNo diagrams.\n");

    const renderer = new MockRenderer(["flowchart"]);

    const result = await sync({
      config,
      mdFiles: ["README.md"],
      renderer,
      fallbackRenderer: renderer,
      fs,
    });

    expect(result.extracted).toBe(0);
    expect(result.rendered).toBe(0);
  });
});
