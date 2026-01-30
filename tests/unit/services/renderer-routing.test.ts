import { describe, expect, test } from "bun:test";
import type { DiagramType } from "../../../src/domain/types.ts";
import { BEAUTIFUL_MERMAID_TYPES } from "../../../src/domain/types.ts";

describe("renderer routing", () => {
  const beautifulTypes: DiagramType[] = ["flowchart", "state", "sequence", "class", "er"];
  const mmdcOnlyTypes: DiagramType[] = [
    "c4",
    "gantt",
    "pie",
    "gitgraph",
    "mindmap",
    "timeline",
    "quadrant",
    "kanban",
    "requirement",
    "architecture",
  ];

  test("beautiful-mermaid handles flowchart, state, sequence, class, er", () => {
    for (const type of beautifulTypes) {
      expect(BEAUTIFUL_MERMAID_TYPES.has(type)).toBe(true);
    }
  });

  test("mmdc handles all other types", () => {
    for (const type of mmdcOnlyTypes) {
      expect(BEAUTIFUL_MERMAID_TYPES.has(type)).toBe(false);
    }
  });

  test("unknown type falls back to mmdc", () => {
    expect(BEAUTIFUL_MERMAID_TYPES.has("unknown")).toBe(false);
  });
});
