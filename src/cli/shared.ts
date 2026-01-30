import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { BeautifulMermaidRenderer } from "../adapters/beautiful-mermaid-renderer.system.ts";
import { NodeFileSystem } from "../adapters/filesystem.system.ts";
import { MmdcRenderer } from "../adapters/mmdc-renderer.system.ts";
import type { ThemeConfig } from "../domain/types.ts";
import { isValidThemeConfig } from "../domain/types.ts";

const DEFAULT_CONFIG: ThemeConfig = {
  outputDir: "docs/mmd",
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
};

export function loadConfig(): ThemeConfig {
  const configPath = resolve(process.cwd(), ".mermaid.json");
  try {
    const raw = readFileSync(configPath, "utf-8");
    const parsed = JSON.parse(raw);
    if (isValidThemeConfig(parsed)) return parsed;
    // biome-ignore lint/suspicious/noConsole: CLI output
    console.warn("Invalid .mermaid.json, using defaults");
    return DEFAULT_CONFIG;
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function createFs() {
  return new NodeFileSystem();
}

export function createRenderer() {
  return new BeautifulMermaidRenderer();
}

export function createFallbackRenderer() {
  return new MmdcRenderer();
}
