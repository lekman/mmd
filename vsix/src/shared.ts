import * as fs from "node:fs";
import * as path from "node:path";
import * as vscode from "vscode";
import type { ThemeConfig } from "../../src/domain/types";
import { isValidThemeConfig } from "../../src/domain/types";
import { BeautifulMermaidRenderer } from "./adapters/beautiful-mermaid-renderer";
import { MmdcRenderer } from "./adapters/mmdc-renderer";

const DEFAULT_CONFIG: ThemeConfig = {
  outputDir: "docs/mmd",
  mode: "light",
  themes: {
    light: {
      theme: "base",
      themeVariables: {
        background: "#ffffff",
        primaryColor: "#ddf4ff",
        primaryTextColor: "#1f2328",
        primaryBorderColor: "#218bff",
        lineColor: "#656d76",
        secondaryColor: "#dafbe1",
        tertiaryColor: "#fff8c5",
        noteBkgColor: "#f6f8fa",
        noteTextColor: "#1f2328",
        fontSize: "14px",
      },
    },
    dark: {
      theme: "base",
      themeVariables: {
        background: "#0d1117",
        primaryColor: "#1f3a5f",
        primaryTextColor: "#e6edf3",
        primaryBorderColor: "#58a6ff",
        lineColor: "#8b949e",
        secondaryColor: "#1a3d2e",
        tertiaryColor: "#3d2e00",
        noteBkgColor: "#161b22",
        noteTextColor: "#e6edf3",
        fontSize: "14px",
      },
    },
  },
  renderer: "beautiful-mermaid",
  fallbackRenderer: "mmdc",
  renderWidth: 1200,
  svgStyle: {
    background: "#ffffff",
    borderColor: "#cccccc",
    borderWidth: 1,
    borderRadius: 10,
    padding: 20,
  },
};

export function getConfigPath(workspaceRoot: string): string {
  return path.join(workspaceRoot, ".mermaid.json");
}

export function getOutputDir(workspaceRoot: string): string {
  const config = vscode.workspace.getConfiguration("mmd");
  return config.get<string>("outputDir", "docs/mmd");
}

export function getConfig(workspaceRoot: string): ThemeConfig {
  const configPath = getConfigPath(workspaceRoot);
  try {
    const raw = fs.readFileSync(configPath, "utf-8");
    const parsed = JSON.parse(raw);
    if (isValidThemeConfig(parsed)) return parsed;
    return DEFAULT_CONFIG;
  } catch {
    return DEFAULT_CONFIG;
  }
}

/**
 * Create the primary renderer (beautiful-mermaid).
 */
export function createRenderer() {
  return new BeautifulMermaidRenderer();
}

/**
 * Create the fallback renderer (mmdc subprocess).
 */
export function createFallbackRenderer(width?: number) {
  return new MmdcRenderer(width);
}
