import { describe, expect, test } from "bun:test";
import {
  type AnchorRef,
  BEAUTIFUL_MERMAID_TYPES,
  detectDiagramType,
  isValidThemeConfig,
  type MermaidBlock,
  type RenderResult,
  type ThemeConfig,
} from "../../../src/domain/types.ts";

describe("DiagramType detection", () => {
  test("detects flowchart TD", () => {
    expect(detectDiagramType("flowchart TD\n  A --> B")).toBe("flowchart");
  });

  test("detects flowchart LR", () => {
    expect(detectDiagramType("flowchart LR\n  A --> B")).toBe("flowchart");
  });

  test("detects graph (alias for flowchart)", () => {
    expect(detectDiagramType("graph TD\n  A --> B")).toBe("flowchart");
  });

  test("detects sequenceDiagram", () => {
    expect(detectDiagramType("sequenceDiagram\n  Alice->>Bob: Hello")).toBe("sequence");
  });

  test("detects classDiagram", () => {
    expect(detectDiagramType("classDiagram\n  class Animal")).toBe("class");
  });

  test("detects stateDiagram-v2", () => {
    expect(detectDiagramType("stateDiagram-v2\n  [*] --> Active")).toBe("state");
  });

  test("detects stateDiagram", () => {
    expect(detectDiagramType("stateDiagram\n  [*] --> Active")).toBe("state");
  });

  test("detects erDiagram", () => {
    expect(detectDiagramType("erDiagram\n  CUSTOMER ||--o{ ORDER : places")).toBe("er");
  });

  test("detects C4Context", () => {
    expect(detectDiagramType('C4Context\n  Person(user, "User")')).toBe("c4");
  });

  test("detects C4Container", () => {
    expect(detectDiagramType('C4Container\n  Container(api, "API")')).toBe("c4");
  });

  test("detects C4Component", () => {
    expect(detectDiagramType('C4Component\n  Component(svc, "Service")')).toBe("c4");
  });

  test("detects gantt", () => {
    expect(detectDiagramType("gantt\n  title A Gantt Chart")).toBe("gantt");
  });

  test("detects pie", () => {
    expect(detectDiagramType('pie title Pets\n  "Dogs" : 386')).toBe("pie");
  });

  test("detects gitGraph", () => {
    expect(detectDiagramType('gitGraph\n  commit id: "init"')).toBe("gitgraph");
  });

  test("detects mindmap", () => {
    expect(detectDiagramType("mindmap\n  root((Main))")).toBe("mindmap");
  });

  test("detects timeline", () => {
    expect(detectDiagramType("timeline\n  title History")).toBe("timeline");
  });

  test("detects quadrantChart", () => {
    expect(detectDiagramType("quadrantChart\n  x-axis Low --> High")).toBe("quadrant");
  });

  test("detects kanban", () => {
    expect(detectDiagramType("kanban\n  Todo")).toBe("kanban");
  });

  test("detects requirementDiagram", () => {
    expect(detectDiagramType("requirementDiagram\n  requirement req1 {")).toBe("requirement");
  });

  test("detects architecture-beta", () => {
    expect(detectDiagramType("architecture-beta\n  service api(server)[API]")).toBe("architecture");
  });

  test("skips comment lines and detects diagram type", () => {
    expect(detectDiagramType("%%{init: {}}%%\nflowchart TD\n  A --> B")).toBe("flowchart");
  });

  test("skips empty lines before diagram type", () => {
    expect(detectDiagramType("\n\nsequenceDiagram\n  A->>B: msg")).toBe("sequence");
  });

  test("returns unknown for unrecognized content", () => {
    expect(detectDiagramType("not a diagram")).toBe("unknown");
  });

  test("returns unknown for empty content", () => {
    expect(detectDiagramType("")).toBe("unknown");
  });
});

describe("BEAUTIFUL_MERMAID_TYPES", () => {
  test("includes flowchart, state, sequence, class, er", () => {
    expect(BEAUTIFUL_MERMAID_TYPES).toContain("flowchart");
    expect(BEAUTIFUL_MERMAID_TYPES).toContain("state");
    expect(BEAUTIFUL_MERMAID_TYPES).toContain("sequence");
    expect(BEAUTIFUL_MERMAID_TYPES).toContain("class");
    expect(BEAUTIFUL_MERMAID_TYPES).toContain("er");
  });

  test("does not include c4 or gantt", () => {
    expect(BEAUTIFUL_MERMAID_TYPES).not.toContain("c4");
    expect(BEAUTIFUL_MERMAID_TYPES).not.toContain("gantt");
  });
});

describe("isValidThemeConfig", () => {
  test("validates a valid theme config", () => {
    const config: ThemeConfig = {
      outputDir: "docs/mmd",
      themes: {
        light: {
          theme: "base",
          themeVariables: { background: "#fff", primaryColor: "#ddf4ff" },
        },
        dark: {
          theme: "base",
          themeVariables: { background: "#0d1117", primaryColor: "#1f3a5f" },
        },
      },
      renderer: "beautiful-mermaid",
      fallbackRenderer: "mmdc",
    };
    expect(isValidThemeConfig(config)).toBe(true);
  });

  test("rejects config missing outputDir", () => {
    expect(isValidThemeConfig({ themes: { light: {}, dark: {} } })).toBe(false);
  });

  test("rejects config missing themes", () => {
    expect(isValidThemeConfig({ outputDir: "docs/mmd" })).toBe(false);
  });

  test("rejects config missing light theme", () => {
    expect(isValidThemeConfig({ outputDir: "docs/mmd", themes: { dark: { theme: "base" } } })).toBe(
      false
    );
  });

  test("rejects config missing dark theme", () => {
    expect(
      isValidThemeConfig({ outputDir: "docs/mmd", themes: { light: { theme: "base" } } })
    ).toBe(false);
  });

  test("rejects non-object values", () => {
    expect(isValidThemeConfig(null)).toBe(false);
    expect(isValidThemeConfig(undefined)).toBe(false);
    expect(isValidThemeConfig("string")).toBe(false);
    expect(isValidThemeConfig(42)).toBe(false);
  });
});

describe("MermaidBlock type", () => {
  test("MermaidBlock has required properties", () => {
    const block: MermaidBlock = {
      content: "flowchart TD\n  A --> B",
      sourceFile: "README.md",
      startLine: 10,
      endLine: 13,
      name: "architecture-0",
      diagramType: "flowchart",
    };
    expect(block.content).toBe("flowchart TD\n  A --> B");
    expect(block.sourceFile).toBe("README.md");
    expect(block.startLine).toBe(10);
    expect(block.endLine).toBe(13);
    expect(block.name).toBe("architecture-0");
    expect(block.diagramType).toBe("flowchart");
  });
});

describe("RenderResult type", () => {
  test("RenderResult has required properties", () => {
    const result: RenderResult = {
      sourcePath: "docs/mmd/system-context.mmd",
      lightSvgPath: "docs/mmd/system-context.light.svg",
      darkSvgPath: "docs/mmd/system-context.dark.svg",
    };
    expect(result.sourcePath).toBe("docs/mmd/system-context.mmd");
    expect(result.lightSvgPath).toBe("docs/mmd/system-context.light.svg");
    expect(result.darkSvgPath).toBe("docs/mmd/system-context.dark.svg");
  });
});

describe("AnchorRef type", () => {
  test("AnchorRef has required properties", () => {
    const anchor: AnchorRef = {
      name: "system-context",
      line: 5,
      sourceFile: "docs/ARCHITECTURE.md",
    };
    expect(anchor.name).toBe("system-context");
    expect(anchor.line).toBe(5);
    expect(anchor.sourceFile).toBe("docs/ARCHITECTURE.md");
  });
});
