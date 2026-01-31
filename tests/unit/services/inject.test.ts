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
  test("generates standard markdown image with anchor", () => {
    const tag = generateImageTag("system-context", "docs/mmd");
    expect(tag).toContain("<!-- mmd:system-context -->");
    expect(tag).toContain("![System Context](docs/mmd/system-context.svg)");
  });

  test("computes alt text from diagram name", () => {
    const tag = generateImageTag("ci-pipeline-flow", "docs/mmd");
    expect(tag).toContain("![Ci Pipeline Flow]");
  });

  test("does not contain picture tags", () => {
    const tag = generateImageTag("test", "docs/mmd");
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
});
