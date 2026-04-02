import * as path from "node:path";
import * as vscode from "vscode";
import { injectImageTags } from "../../src/services/inject";
import { renderDiagrams } from "../../src/services/render";
import { VsCodeFileSystem } from "./adapters/vscode-fs";
import { getConfig, getConfigPath, getOutputDir, createRenderer, createFallbackRenderer } from "./shared";

function getWorkspaceRoot(): string | undefined {
  return vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
}

/**
 * Handle file save events for auto-sync behavior.
 */
export async function onDidSave(document: vscode.TextDocument): Promise<void> {
  const config = vscode.workspace.getConfiguration("mmd");
  if (!config.get<boolean>("syncOnSave", true)) return;

  const root = getWorkspaceRoot();
  if (!root) return;

  const filePath = document.uri.fsPath;
  const relativePath = path.relative(root, filePath);
  const ext = path.extname(filePath).toLowerCase();
  const basename = path.basename(filePath);

  const fs = new VsCodeFileSystem(root);

  if (ext === ".md") {
    // Re-inject image tags for anchors
    const content = await fs.readFile(relativePath);
    const outputDir = getOutputDir(root);
    const injected = injectImageTags(content, relativePath, outputDir);
    if (injected !== content) {
      await fs.writeFile(relativePath, injected);
    }
  } else if (ext === ".mmd") {
    // Re-render this specific diagram
    const mmdConfig = getConfig(root);
    await renderDiagrams(mmdConfig, {
      renderer: createRenderer(),
      fallbackRenderer: createFallbackRenderer(mmdConfig.renderWidth),
      fs,
      mmdFiles: [relativePath],
      force: true,
      configPath: getConfigPath(root),
    });
  } else if (basename === ".mermaid.json") {
    // Re-render all diagrams when config changes
    const mmdConfig = getConfig(root);
    const outputDir = getOutputDir(root);
    const mmdFiles = await fs.glob(`${outputDir}/**/*.mmd`, root);
    if (mmdFiles.length > 0) {
      await renderDiagrams(mmdConfig, {
        renderer: createRenderer(),
        fallbackRenderer: createFallbackRenderer(mmdConfig.renderWidth),
        fs,
        mmdFiles,
        force: true,
        configPath: getConfigPath(root),
      });
    }
  }
}
