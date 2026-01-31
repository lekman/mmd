import type { DiagramType, MermaidBlock } from "./types.ts";

/** Renders .mmd content to SVG. */
export interface IRenderer {
  /** Diagram types this renderer supports. */
  readonly supportedTypes: ReadonlySet<DiagramType>;

  /** Render mermaid content with theme init directive to SVG string. */
  render(content: string): Promise<string>;
}

/** Filesystem abstraction for testability. */
export interface IFileSystem {
  readFile(path: string): Promise<string>;
  writeFile(path: string, content: string): Promise<void>;
  exists(path: string): Promise<boolean>;
  /** Return file modification time in milliseconds since epoch. */
  mtime(path: string): Promise<number>;
  /** List files matching a glob pattern. */
  glob(pattern: string, cwd: string): Promise<string[]>;
  mkdir(path: string): Promise<void>;
  /** Delete a file. No error if file does not exist. */
  delete(path: string): Promise<void>;
}

/** Extracts Mermaid blocks from Markdown files. */
export interface IExtractor {
  /** Extract all fenced mermaid blocks from markdown content. */
  extract(markdownContent: string, sourceFile: string): MermaidBlock[];
}

/** Injects markdown image tags into Markdown files at anchor positions. */
export interface IInjector {
  /** Find all anchor comments and generate image tags. */
  inject(markdownContent: string, sourceFile: string, outputDir: string): string;
}
