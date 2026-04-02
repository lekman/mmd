import { describe, expect, test } from "bun:test";
import { findAnchors, generateImageTag, injectImageTags } from "../../../src/services/inject.ts";

describe("findAnchors", () => {
  test("finds a single anchor comment", () => {
    const md = "# Title\n\n<!-- mmd:system-context -->\nold content\n";
    const anchors = findAnchors(md, "README.md");
    expect(anchors).toHaveLength(1);
    expect(anchors[0]!.name).toBe("system-context");
    expect(anchors[0]!.line).toBe(3);
    expect(anchors[0]!.sourceFile).toBe("README.md");
  });

  test("finds multiple anchors", () => {
    const md =
      "<!-- mmd:first -->\n<picture>old</picture>\n\n<!-- mmd:second -->\n<picture>old</picture>\n";
    const anchors = findAnchors(md, "test.md");
    expect(anchors).toHaveLength(2);
    expect(anchors[0]!.name).toBe("first");
    expect(anchors[1]!.name).toBe("second");
  });

  test("returns empty array when no anchors", () => {
    const md = "# No anchors\nJust text.\n";
    const anchors = findAnchors(md, "test.md");
    expect(anchors).toHaveLength(0);
  });

  test("ignores non-mmd comments", () => {
    const md = "<!-- regular comment -->\n<!-- mmd:valid -->\n";
    const anchors = findAnchors(md, "test.md");
    expect(anchors).toHaveLength(1);
    expect(anchors[0]!.name).toBe("valid");
  });
});

describe("generateImageTag", () => {
  test("generates standard markdown image with anchor for root-level file", () => {
    const tag = generateImageTag("system-context", "docs/mmd", "README.md");
    expect(tag).toContain("<!-- mmd:system-context -->");
    expect(tag).toContain("![System Context](docs/mmd/system-context.svg)");
  });

  test("generates relative path for subdirectory file", () => {
    const tag = generateImageTag("architecture-0", "docs/mmd", "docs/ARCHITECTURE.md");
    expect(tag).toContain("<!-- mmd:architecture-0 -->");
    expect(tag).toContain("![Architecture 0](mmd/architecture-0.svg)");
  });

  test("generates relative path for deeply nested file", () => {
    const tag = generateImageTag("guide-0", "docs/mmd", "guides/setup/INSTALL.md");
    expect(tag).toContain("![Guide 0](../../docs/mmd/guide-0.svg)");
  });

  test("computes alt text from diagram name", () => {
    const tag = generateImageTag("ci-pipeline-flow", "docs/mmd", "README.md");
    expect(tag).toContain("![Ci Pipeline Flow]");
  });

  test("does not contain picture tags", () => {
    const tag = generateImageTag("test", "docs/mmd", "README.md");
    expect(tag).not.toContain("<picture>");
    expect(tag).not.toContain("prefers-color-scheme");
  });
});

describe("injectImageTags", () => {
  test("replaces anchor + existing picture tag with markdown image", () => {
    const md = [
      "# Architecture",
      "",
      "<!-- mmd:system-context -->",
      "<picture>",
      '  <source media="(prefers-color-scheme: dark)" srcset="old/path.dark.svg">',
      '  <source media="(prefers-color-scheme: light)" srcset="old/path.light.svg">',
      '  <img alt="System Context" src="old/path.light.svg">',
      "</picture>",
      "",
      "More text",
    ].join("\n");

    const result = injectImageTags(md, "README.md", "docs/mmd");
    expect(result).toContain("<!-- mmd:system-context -->");
    expect(result).toContain("![System Context](docs/mmd/system-context.svg)");
    expect(result).not.toContain("<picture>");
    expect(result).not.toContain("old/path");
    expect(result).toContain("More text");
  });

  test("uses relative paths for subdirectory source files", () => {
    const md = [
      "# Architecture",
      "",
      "<!-- mmd:architecture-0 -->",
      "![Architecture 0](docs/mmd/architecture-0.svg)",
      "",
      "More text",
    ].join("\n");

    const result = injectImageTags(md, "docs/ARCHITECTURE.md", "docs/mmd");
    expect(result).toContain("![Architecture 0](mmd/architecture-0.svg)");
    expect(result).not.toContain("docs/mmd/architecture-0.svg");
    expect(result).toContain("More text");
  });

  test("replaces anchor + old img tag with markdown image", () => {
    const md = [
      "<!-- mmd:diagram -->",
      "![Diagram](docs/mmd/diagram.old.svg)",
      "",
      "Text below",
    ].join("\n");

    const result = injectImageTags(md, "test.md", "docs/mmd");
    expect(result).toContain("![Diagram](docs/mmd/diagram.svg)");
    expect(result).not.toContain("diagram.old.svg");
    expect(result).toContain("Text below");
  });

  test("handles anchor with no following content to replace", () => {
    const md = "# Title\n\n<!-- mmd:standalone -->\n";
    const result = injectImageTags(md, "test.md", "docs/mmd");
    expect(result).toContain("<!-- mmd:standalone -->");
    expect(result).toContain("![Standalone](docs/mmd/standalone.svg)");
  });

  test("returns unchanged content when no anchors", () => {
    const md = "# No anchors\nJust text.\n";
    const result = injectImageTags(md, "test.md", "docs/mmd");
    expect(result).toBe(md);
  });

  test("handles multiple anchors", () => {
    const md = [
      "<!-- mmd:first -->",
      "![First](old.svg)",
      "",
      "<!-- mmd:second -->",
      "![Second](old.svg)",
    ].join("\n");

    const result = injectImageTags(md, "test.md", "docs/mmd");
    expect(result).toContain("![First](docs/mmd/first.svg)");
    expect(result).toContain("![Second](docs/mmd/second.svg)");
  });

  test("does not duplicate image tag on repeated inject", () => {
    const md = [
      "## How It Works",
      "",
      "<!-- mmd:readme-2 -->",
      "![Readme 2](docs/mmd/readme-2.svg)",
      "",
      "## Quick Start",
    ].join("\n");

    const first = injectImageTags(md, "README.md", "docs/mmd");
    const second = injectImageTags(first, "README.md", "docs/mmd");

    const count = (second.match(/!\[Readme 2\]/g) ?? []).length;
    expect(count).toBe(1);
    expect(second).toContain("## Quick Start");
  });

  test("removes duplicate image tags after blank line", () => {
    const md = [
      "## How It Works",
      "",
      "<!-- mmd:readme-2 -->",
      "![Readme 2](docs/mmd/readme-2.svg)",
      "",
      "![Readme 2](docs/mmd/readme-2.svg)",
      "",
      "## Quick Start",
    ].join("\n");

    const result = injectImageTags(md, "README.md", "docs/mmd");
    const count = (result.match(/!\[Readme 2\]/g) ?? []).length;
    expect(count).toBe(1);
    expect(result).toContain("## Quick Start");
  });

  test("removes multiple duplicate image tags", () => {
    const md = [
      "<!-- mmd:readme-2 -->",
      "![Readme 2](docs/mmd/readme-2.svg)",
      "",
      "![Readme 2](docs/mmd/readme-2.svg)",
      "",
      "![Readme 2](docs/mmd/readme-2.svg)",
      "",
      "Next section",
    ].join("\n");

    const result = injectImageTags(md, "README.md", "docs/mmd");
    const count = (result.match(/!\[Readme 2\]/g) ?? []).length;
    expect(count).toBe(1);
    expect(result).toContain("Next section");
  });
});
