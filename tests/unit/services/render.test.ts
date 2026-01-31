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
  test("renders single SVG per .mmd file using light mode by default", async () => {
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
    expect(results[0]!.svgPath).toBe("docs/mmd/test.svg");

    // Single SVG written
    expect(await fs.exists("docs/mmd/test.svg")).toBe(true);

    // Renderer called once (not twice)
    expect(renderer.renderCalls).toHaveLength(1);
    expect(renderer.renderCalls[0]).toContain('"background":"#ffffff"');
  });

  test("renders with dark mode when config.mode is dark", async () => {
    const darkConfig: ThemeConfig = { ...config, mode: "dark" };
    const fs = new MockFileSystem();
    fs.setFile("docs/mmd/test.mmd", "flowchart TD\n  A --> B");

    const renderer = new MockRenderer(["flowchart"]);

    const results = await renderDiagrams(darkConfig, {
      renderer,
      fallbackRenderer: renderer,
      fs,
      mmdFiles: ["docs/mmd/test.mmd"],
    });

    expect(results).toHaveLength(1);
    expect(renderer.renderCalls).toHaveLength(1);
    expect(renderer.renderCalls[0]).toContain('"background":"#0d1117"');
  });

  test("skips rendering when SVG is newer than source (mtime check)", async () => {
    const now = Date.now();
    const fs = new MockFileSystem();
    fs.setFile("docs/mmd/test.mmd", "flowchart TD\n  A --> B", now - 1000);
    fs.setFile("docs/mmd/test.svg", "<svg>cached</svg>", now);

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

  test("re-renders when source is newer than SVG", async () => {
    const now = Date.now();
    const fs = new MockFileSystem();
    fs.setFile("docs/mmd/test.mmd", "flowchart TD\n  A --> B", now);
    fs.setFile("docs/mmd/test.svg", "<svg>old</svg>", now - 1000);

    const renderer = new MockRenderer(["flowchart"]);

    const results = await renderDiagrams(config, {
      renderer,
      fallbackRenderer: renderer,
      fs,
      mmdFiles: ["docs/mmd/test.mmd"],
    });

    expect(results).toHaveLength(1);
    expect(renderer.renderCalls).toHaveLength(1);
  });

  test("re-renders when config is newer than SVG", async () => {
    const now = Date.now();
    const fs = new MockFileSystem();
    fs.setFile("docs/mmd/test.mmd", "flowchart TD\n  A --> B", now - 2000);
    fs.setFile("docs/mmd/test.svg", "<svg>old</svg>", now - 1000);
    fs.setFile(".mermaid.json", "{}", now);

    const renderer = new MockRenderer(["flowchart"]);

    const results = await renderDiagrams(config, {
      renderer,
      fallbackRenderer: renderer,
      fs,
      mmdFiles: ["docs/mmd/test.mmd"],
      configPath: ".mermaid.json",
    });

    expect(results).toHaveLength(1);
    expect(renderer.renderCalls).toHaveLength(1);
  });

  test("forces re-render with force flag", async () => {
    const now = Date.now();
    const fs = new MockFileSystem();
    fs.setFile("docs/mmd/test.mmd", "flowchart TD\n  A --> B", now - 1000);
    fs.setFile("docs/mmd/test.svg", "<svg>cached</svg>", now);

    const renderer = new MockRenderer(["flowchart"]);

    const results = await renderDiagrams(config, {
      renderer,
      fallbackRenderer: renderer,
      fs,
      mmdFiles: ["docs/mmd/test.mmd"],
      force: true,
    });

    expect(results).toHaveLength(1);
    expect(renderer.renderCalls).toHaveLength(1);
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
    expect(fallback.renderCalls).toHaveLength(1);
  });

  test("renders when SVG does not exist yet", async () => {
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

  test("cleans up old .light.svg and .dark.svg files", async () => {
    const fs = new MockFileSystem();
    fs.setFile("docs/mmd/test.mmd", "flowchart TD\n  A --> B");
    fs.setFile("docs/mmd/test.light.svg", "<svg>old-light</svg>");
    fs.setFile("docs/mmd/test.dark.svg", "<svg>old-dark</svg>");

    const renderer = new MockRenderer(["flowchart"]);

    await renderDiagrams(config, {
      renderer,
      fallbackRenderer: renderer,
      fs,
      mmdFiles: ["docs/mmd/test.mmd"],
    });

    expect(await fs.exists("docs/mmd/test.svg")).toBe(true);
    expect(await fs.exists("docs/mmd/test.light.svg")).toBe(false);
    expect(await fs.exists("docs/mmd/test.dark.svg")).toBe(false);
  });
});
