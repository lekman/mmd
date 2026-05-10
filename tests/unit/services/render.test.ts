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
      fs,
      mmdFiles: ["docs/mmd/test.mmd"],
    });

    expect(results).toHaveLength(1);
    expect(results[0]!.svgPath).toBe("docs/mmd/test.svg");
    expect(await fs.exists("docs/mmd/test.svg")).toBe(true);
    expect(renderer.renderCalls).toHaveLength(1);
    expect(renderer.renderCalls[0]).toContain('"background":"#ffffff"');
  });

  test("renders with dark mode when config.mode is dark", async () => {
    const darkConfig: ThemeConfig = { ...config, mode: "dark" };
    const fs = new MockFileSystem();
    fs.setFile("docs/mmd/test.mmd", "flowchart TD\n  A --> B");

    const renderer = new MockRenderer(["flowchart"]);

    await renderDiagrams(darkConfig, {
      renderer,
      fs,
      mmdFiles: ["docs/mmd/test.mmd"],
    });

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
      fs,
      mmdFiles: ["docs/mmd/test.mmd"],
      force: true,
    });

    expect(results).toHaveLength(1);
    expect(renderer.renderCalls).toHaveLength(1);
  });

  test("renders when SVG does not exist yet", async () => {
    const fs = new MockFileSystem();
    fs.setFile("docs/mmd/new.mmd", "sequenceDiagram\n  A->>B: Hi");

    const renderer = new MockRenderer(["sequence"]);

    const results = await renderDiagrams(config, {
      renderer,
      fs,
      mmdFiles: ["docs/mmd/new.mmd"],
    });

    expect(results).toHaveLength(1);
  });

  test("applies SVG post-processing when svgStyle is configured", async () => {
    const styledConfig: ThemeConfig = {
      ...config,
      svgStyle: { background: "#ffffff", borderColor: "#cccccc", borderRadius: 10, padding: 20 },
    };
    const fs = new MockFileSystem();
    fs.setFile("docs/mmd/test.mmd", "flowchart TD\n  A --> B");

    const renderer = new MockRenderer(["flowchart"]);

    await renderDiagrams(styledConfig, {
      renderer,
      fs,
      mmdFiles: ["docs/mmd/test.mmd"],
    });

    const svg = await fs.readFile("docs/mmd/test.svg");
    expect(svg).toContain('fill="#ffffff"');
    expect(svg).toContain('rx="10"');
    expect(svg).toContain('stroke="#cccccc"');
    expect(svg).toContain('viewBox="-20 -20 240 140"');
  });

  test("skips SVG post-processing when svgStyle is undefined", async () => {
    const fs = new MockFileSystem();
    fs.setFile("docs/mmd/test.mmd", "flowchart TD\n  A --> B");

    const renderer = new MockRenderer(["flowchart"]);

    await renderDiagrams(config, {
      renderer,
      fs,
      mmdFiles: ["docs/mmd/test.mmd"],
    });

    const svg = await fs.readFile("docs/mmd/test.svg");
    // Raw mock output viewBox should be preserved untouched
    expect(svg).toContain('viewBox="0 0 200 100"');
    expect(svg).not.toContain('fill="#ffffff"');
  });

  test("passes author frontmatter through unchanged (workspace theme not injected)", async () => {
    const fs = new MockFileSystem();
    fs.setFile(
      "docs/mmd/authored.mmd",
      "---\nconfig:\n  theme: dark\n---\nflowchart TD\n  A --> B"
    );

    const renderer = new MockRenderer(["flowchart"]);

    await renderDiagrams(config, {
      renderer,
      fs,
      mmdFiles: ["docs/mmd/authored.mmd"],
    });

    expect(renderer.renderCalls).toHaveLength(1);
    const rendered = renderer.renderCalls[0]!;
    // Author frontmatter preserved
    expect(rendered).toContain("---");
    expect(rendered).toContain("theme: dark");
    // Workspace theme not injected
    expect(rendered).not.toContain("%%{init:");
  });

  test("injects workspace theme when no author frontmatter is present", async () => {
    const fs = new MockFileSystem();
    fs.setFile("docs/mmd/plain.mmd", "C4Deployment\n  title System");

    const renderer = new MockRenderer(["c4"]);

    await renderDiagrams(config, {
      renderer,
      fs,
      mmdFiles: ["docs/mmd/plain.mmd"],
    });

    expect(renderer.renderCalls).toHaveLength(1);
    const rendered = renderer.renderCalls[0]!;
    expect(rendered).toContain("%%{init:");
    expect(rendered).toContain("C4Deployment");
  });

  test("cleans up old .light.svg and .dark.svg files", async () => {
    const fs = new MockFileSystem();
    fs.setFile("docs/mmd/test.mmd", "flowchart TD\n  A --> B");
    fs.setFile("docs/mmd/test.light.svg", "<svg>old-light</svg>");
    fs.setFile("docs/mmd/test.dark.svg", "<svg>old-dark</svg>");

    const renderer = new MockRenderer(["flowchart"]);

    await renderDiagrams(config, {
      renderer,
      fs,
      mmdFiles: ["docs/mmd/test.mmd"],
    });

    expect(await fs.exists("docs/mmd/test.svg")).toBe(true);
    expect(await fs.exists("docs/mmd/test.light.svg")).toBe(false);
    expect(await fs.exists("docs/mmd/test.dark.svg")).toBe(false);
  });
});
