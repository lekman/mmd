import { describe, expect, test } from "bun:test";
import type { ThemeConfig } from "../../../src/domain/types.ts";
import { prependThemeInit, renderDiagrams } from "../../../src/services/render.ts";
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
  renderer: "beautiful-mermaid",
  fallbackRenderer: "mmdc",
};

describe("prependThemeInit", () => {
  test("prepends init directive to content", () => {
    const result = prependThemeInit("flowchart TD\n  A --> B", config.themes.light);
    expect(result).toContain("%%{init:");
    expect(result).toContain('"background":"#ffffff"');
    expect(result).toContain("flowchart TD");
  });

  test("uses theme from config", () => {
    const result = prependThemeInit("classDiagram", config.themes.dark);
    expect(result).toContain('"theme":"base"');
    expect(result).toContain('"background":"#0d1117"');
  });
});

describe("renderDiagrams", () => {
  test("renders light and dark SVGs for each .mmd file", async () => {
    const fs = new MockFileSystem();
    fs.setFile("docs/mmd/test.mmd", "flowchart TD\n  A --> B");

    const renderer = new MockRenderer(["flowchart"]);

    const results = await renderDiagrams(config, {
      renderer,
      fallbackRenderer: renderer,
      fs,
      mmdFiles: ["docs/mmd/test.mmd"],
    });

    expect(results).toHaveLength(1);
    expect(results[0]!.lightSvgPath).toBe("docs/mmd/test.light.svg");
    expect(results[0]!.darkSvgPath).toBe("docs/mmd/test.dark.svg");

    // Both SVGs should have been written
    expect(await fs.exists("docs/mmd/test.light.svg")).toBe(true);
    expect(await fs.exists("docs/mmd/test.dark.svg")).toBe(true);

    // Renderer should have been called twice (light + dark)
    expect(renderer.renderCalls).toHaveLength(2);
  });

  test("skips rendering when SVGs are newer than source (mtime check)", async () => {
    const now = Date.now();
    const fs = new MockFileSystem();
    fs.setFile("docs/mmd/test.mmd", "flowchart TD\n  A --> B", now - 1000);
    fs.setFile("docs/mmd/test.light.svg", "<svg>light</svg>", now);
    fs.setFile("docs/mmd/test.dark.svg", "<svg>dark</svg>", now);

    const renderer = new MockRenderer(["flowchart"]);

    const results = await renderDiagrams(config, {
      renderer,
      fallbackRenderer: renderer,
      fs,
      mmdFiles: ["docs/mmd/test.mmd"],
    });

    expect(results).toHaveLength(0);
    expect(renderer.renderCalls).toHaveLength(0);
  });

  test("re-renders when source is newer than SVGs", async () => {
    const now = Date.now();
    const fs = new MockFileSystem();
    fs.setFile("docs/mmd/test.mmd", "flowchart TD\n  A --> B", now);
    fs.setFile("docs/mmd/test.light.svg", "<svg>old</svg>", now - 1000);
    fs.setFile("docs/mmd/test.dark.svg", "<svg>old</svg>", now - 1000);

    const renderer = new MockRenderer(["flowchart"]);

    const results = await renderDiagrams(config, {
      renderer,
      fallbackRenderer: renderer,
      fs,
      mmdFiles: ["docs/mmd/test.mmd"],
    });

    expect(results).toHaveLength(1);
    expect(renderer.renderCalls).toHaveLength(2);
  });

  test("forces re-render with force flag", async () => {
    const now = Date.now();
    const fs = new MockFileSystem();
    fs.setFile("docs/mmd/test.mmd", "flowchart TD\n  A --> B", now - 1000);
    fs.setFile("docs/mmd/test.light.svg", "<svg>light</svg>", now);
    fs.setFile("docs/mmd/test.dark.svg", "<svg>dark</svg>", now);

    const renderer = new MockRenderer(["flowchart"]);

    const results = await renderDiagrams(config, {
      renderer,
      fallbackRenderer: renderer,
      fs,
      mmdFiles: ["docs/mmd/test.mmd"],
      force: true,
    });

    expect(results).toHaveLength(1);
    expect(renderer.renderCalls).toHaveLength(2);
  });

  test("uses fallback renderer for unsupported diagram types", async () => {
    const fs = new MockFileSystem();
    fs.setFile("docs/mmd/c4.mmd", 'C4Context\n  Person(user, "User")');

    const primary = new MockRenderer(["flowchart"]);
    const fallback = new MockRenderer(["c4"]);

    await renderDiagrams(config, {
      renderer: primary,
      fallbackRenderer: fallback,
      fs,
      mmdFiles: ["docs/mmd/c4.mmd"],
    });

    expect(primary.renderCalls).toHaveLength(0);
    expect(fallback.renderCalls).toHaveLength(2);
  });

  test("renders when SVGs do not exist yet", async () => {
    const fs = new MockFileSystem();
    fs.setFile("docs/mmd/new.mmd", "sequenceDiagram\n  A->>B: Hi");

    const renderer = new MockRenderer(["sequence"]);

    const results = await renderDiagrams(config, {
      renderer,
      fallbackRenderer: renderer,
      fs,
      mmdFiles: ["docs/mmd/new.mmd"],
    });

    expect(results).toHaveLength(1);
  });
});
