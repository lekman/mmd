/**
 * Supported Mermaid diagram types.
 * "unknown" is returned when the type cannot be detected.
 */
export type DiagramType =
  | "flowchart"
  | "sequence"
  | "class"
  | "state"
  | "er"
  | "c4"
  | "gantt"
  | "pie"
  | "gitgraph"
  | "mindmap"
  | "timeline"
  | "quadrant"
  | "kanban"
  | "requirement"
  | "architecture"
  | "unknown";

/**
 * Diagram types supported by the beautiful-mermaid renderer.
 * All other types fall back to mmdc.
 */
export const BEAUTIFUL_MERMAID_TYPES: ReadonlySet<DiagramType> = new Set<DiagramType>([
  "flowchart",
  "state",
  "sequence",
  "class",
  "er",
]);

/** An extracted fenced Mermaid block from a Markdown file. */
export interface MermaidBlock {
  content: string;
  sourceFile: string;
  startLine: number;
  endLine: number;
  name: string;
  diagramType: DiagramType;
}

/** Theme definition for a single mode (light or dark). */
export interface ThemeDef {
  theme?: string;
  themeVariables?: Record<string, string>;
}

/** Parsed .mermaid.json configuration. */
export interface ThemeConfig {
  outputDir: string;
  themes: {
    light: ThemeDef;
    dark: ThemeDef;
  };
  renderer?: string;
  fallbackRenderer?: string;
}

/** Result of rendering a single .mmd file. */
export interface RenderResult {
  sourcePath: string;
  lightSvgPath: string;
  darkSvgPath: string;
}

/** A parsed <!-- mmd:name --> anchor comment in a Markdown file. */
export interface AnchorRef {
  name: string;
  line: number;
  sourceFile: string;
}

/**
 * Mapping from first-line keywords to DiagramType.
 * Order matters: more specific patterns are checked first.
 */
const DIAGRAM_PATTERNS: ReadonlyArray<[RegExp, DiagramType]> = [
  [/^C4(Context|Container|Component|Deployment|Dynamic)\b/, "c4"],
  [/^architecture-beta\b/, "architecture"],
  [/^sequenceDiagram\b/, "sequence"],
  [/^classDiagram\b/, "class"],
  [/^stateDiagram(-v2)?\b/, "state"],
  [/^erDiagram\b/, "er"],
  [/^(flowchart|graph)\b/, "flowchart"],
  [/^gantt\b/, "gantt"],
  [/^pie\b/, "pie"],
  [/^gitGraph\b/, "gitgraph"],
  [/^mindmap\b/, "mindmap"],
  [/^timeline\b/, "timeline"],
  [/^quadrantChart\b/, "quadrant"],
  [/^kanban\b/, "kanban"],
  [/^requirementDiagram\b/, "requirement"],
];

/**
 * Detect the diagram type from the content of a .mmd file.
 * Skips comment lines (starting with %%) and empty lines.
 */
export function detectDiagramType(content: string): DiagramType {
  const lines = content.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === "" || trimmed.startsWith("%%")) continue;
    for (const [pattern, type] of DIAGRAM_PATTERNS) {
      if (pattern.test(trimmed)) return type;
    }
    return "unknown";
  }
  return "unknown";
}

/**
 * Validate that a value is a valid ThemeConfig shape.
 */
export function isValidThemeConfig(value: unknown): value is ThemeConfig {
  if (value === null || value === undefined || typeof value !== "object") return false;
  const obj = value as Record<string, unknown>;
  if (typeof obj.outputDir !== "string") return false;
  if (obj.themes === null || typeof obj.themes !== "object") return false;
  const themes = obj.themes as Record<string, unknown>;
  if (themes.light === null || typeof themes.light !== "object") return false;
  if (themes.dark === null || typeof themes.dark !== "object") return false;
  return true;
}
