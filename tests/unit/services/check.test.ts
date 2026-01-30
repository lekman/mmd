import { describe, expect, test } from "bun:test";
import { checkOrphanedBlocks } from "../../../src/services/check.ts";

describe("checkOrphanedBlocks", () => {
  test("detects orphaned mermaid block in file with anchors", () => {
    const md = [
      "<!-- mmd:existing -->",
      "<picture>...</picture>",
      "",
      "```mermaid",
      "flowchart TD",
      "  A --> B",
      "```",
    ].join("\n");

    const warnings = checkOrphanedBlocks(md, "README.md");
    expect(warnings).toHaveLength(1);
    expect(warnings[0]!.sourceFile).toBe("README.md");
    expect(warnings[0]!.line).toBe(4);
    expect(warnings[0]!.message).toContain("inline Mermaid block");
  });

  test("returns no warnings for file with only anchors (no inline blocks)", () => {
    const md = [
      "<!-- mmd:first -->",
      "<picture>...</picture>",
      "",
      "<!-- mmd:second -->",
      "<picture>...</picture>",
    ].join("\n");

    const warnings = checkOrphanedBlocks(md, "test.md");
    expect(warnings).toHaveLength(0);
  });

  test("returns no warnings for file with only inline blocks (no anchors)", () => {
    const md = ["# Title", "", "```mermaid", "flowchart TD", "  A --> B", "```"].join("\n");

    const warnings = checkOrphanedBlocks(md, "test.md");
    expect(warnings).toHaveLength(0);
  });

  test("returns no warnings for file with no mermaid content", () => {
    const md = "# Title\n\nJust regular text.\n";
    const warnings = checkOrphanedBlocks(md, "test.md");
    expect(warnings).toHaveLength(0);
  });

  test("detects multiple orphaned blocks", () => {
    const md = [
      "<!-- mmd:first -->",
      "<picture>...</picture>",
      "",
      "```mermaid",
      "flowchart TD",
      "  A --> B",
      "```",
      "",
      "```mermaid",
      "sequenceDiagram",
      "  Alice->>Bob: Hi",
      "```",
    ].join("\n");

    const warnings = checkOrphanedBlocks(md, "test.md");
    expect(warnings).toHaveLength(2);
  });
});
