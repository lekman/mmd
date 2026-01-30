import { describe, expect, test } from "bun:test";
import {
  findAnchors,
  generatePictureTag,
  injectPictureTags,
} from "../../../src/services/inject.ts";

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

describe("generatePictureTag", () => {
  test("generates valid picture tag with dark and light sources", () => {
    const tag = generatePictureTag("system-context", "docs/mmd");
    expect(tag).toContain("<!-- mmd:system-context -->");
    expect(tag).toContain("<picture>");
    expect(tag).toContain('media="(prefers-color-scheme: dark)"');
    expect(tag).toContain('srcset="docs/mmd/system-context.dark.svg"');
    expect(tag).toContain('srcset="docs/mmd/system-context.light.svg"');
    expect(tag).toContain('alt="System Context"');
    expect(tag).toContain('src="docs/mmd/system-context.light.svg"');
    expect(tag).toContain("</picture>");
  });

  test("computes alt text from diagram name", () => {
    const tag = generatePictureTag("ci-pipeline-flow", "docs/mmd");
    expect(tag).toContain('alt="Ci Pipeline Flow"');
  });
});

describe("injectPictureTags", () => {
  test("replaces anchor + existing picture tag with fresh picture tag", () => {
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

    const result = injectPictureTags(md, "README.md", "docs/mmd");
    expect(result).toContain("<!-- mmd:system-context -->");
    expect(result).toContain("docs/mmd/system-context.dark.svg");
    expect(result).toContain("docs/mmd/system-context.light.svg");
    expect(result).not.toContain("old/path");
    expect(result).toContain("More text");
  });

  test("replaces anchor + img tag (non-picture format)", () => {
    const md = ["<!-- mmd:diagram -->", "![Diagram](docs/mmd/diagram.svg)", "", "Text below"].join(
      "\n"
    );

    const result = injectPictureTags(md, "test.md", "docs/mmd");
    expect(result).toContain("<picture>");
    expect(result).toContain("docs/mmd/diagram.dark.svg");
    expect(result).not.toContain("![Diagram]");
    expect(result).toContain("Text below");
  });

  test("handles anchor with no following content to replace", () => {
    const md = "# Title\n\n<!-- mmd:standalone -->\n";
    const result = injectPictureTags(md, "test.md", "docs/mmd");
    expect(result).toContain("<!-- mmd:standalone -->");
    expect(result).toContain("<picture>");
    expect(result).toContain("docs/mmd/standalone.dark.svg");
  });

  test("returns unchanged content when no anchors", () => {
    const md = "# No anchors\nJust text.\n";
    const result = injectPictureTags(md, "test.md", "docs/mmd");
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

    const result = injectPictureTags(md, "test.md", "docs/mmd");
    expect(result).toContain("docs/mmd/first.dark.svg");
    expect(result).toContain("docs/mmd/second.dark.svg");
  });
});
