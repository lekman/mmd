import * as path from "node:path";
import * as vscode from "vscode";
import { extractMermaidBlocks } from "../../src/services/extract";
import { convertBlocks } from "../../src/services/convert";
import { renderDiagrams } from "../../src/services/render";
import { sync } from "../../src/services/sync";
import { getConfig, getConfigPath, getOutputDir, createRenderer, createFallbackRenderer } from "./shared";
import { VsCodeFileSystem } from "./adapters/vscode-fs";

function getWorkspaceRoot(): string {
  const folders = vscode.workspace.workspaceFolders;
  if (!folders?.[0]) {
    throw new Error("No workspace folder open");
  }
  return folders[0].uri.fsPath;
}

/**
 * Convert all mermaid blocks in the active document.
 */
export async function convertAll(): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor || editor.document.languageId !== "markdown") {
    vscode.window.showWarningMessage("Open a Markdown file to convert diagrams");
    return;
  }

  const root = getWorkspaceRoot();
  const fs = new VsCodeFileSystem(root);
  const relativePath = path.relative(root, editor.document.uri.fsPath);

  await editor.document.save();

  const result = await convertBlocks({
    config: getConfig(root),
    mdFile: relativePath,
    renderer: createRenderer(),
    fallbackRenderer: createFallbackRenderer(getConfig(root).renderWidth),
    fs,
    configPath: getConfigPath(root),
  });

  vscode.window.showInformationMessage(
    `Converted ${result.extracted} block(s), rendered ${result.rendered} SVG(s)`
  );
}

/**
 * Convert the mermaid block at a specific line in the document.
 */
export async function convertAtLine(uri: vscode.Uri, line: number): Promise<void> {
  const root = getWorkspaceRoot();
  const fs = new VsCodeFileSystem(root);
  const relativePath = path.relative(root, uri.fsPath);

  const doc = await vscode.workspace.openTextDocument(uri);
  await doc.save();

  const content = doc.getText();
  const blocks = extractMermaidBlocks(content, relativePath);

  // Find which block contains this line
  const blockIndex = blocks.findIndex(
    (b) => line >= b.startLine - 1 && line < b.endLine
  );
  if (blockIndex < 0) {
    vscode.window.showWarningMessage("No mermaid block found at this line");
    return;
  }

  const result = await convertBlocks({
    config: getConfig(root),
    mdFile: relativePath,
    renderer: createRenderer(),
    fallbackRenderer: createFallbackRenderer(getConfig(root).renderWidth),
    fs,
    blockIndex,
    configPath: getConfigPath(root),
  });

  vscode.window.showInformationMessage(
    `Converted ${result.extracted} block(s), rendered ${result.rendered} SVG(s)`
  );
}

/**
 * Sync all diagrams in the workspace (extract + render + inject).
 */
export async function syncAll(): Promise<void> {
  const root = getWorkspaceRoot();
  const fs = new VsCodeFileSystem(root);

  const mdFiles = await fs.glob("**/*.md", root);

  const result = await sync({
    config: getConfig(root),
    mdFiles,
    renderer: createRenderer(),
    fallbackRenderer: createFallbackRenderer(getConfig(root).renderWidth),
    fs,
    configPath: getConfigPath(root),
  });

  vscode.window.showInformationMessage(
    `Extracted ${result.extracted} diagram(s), rendered ${result.rendered} SVG(s)`
  );
}

/**
 * Open the .mmd source file for a named anchor.
 */
export async function editSource(name: string): Promise<void> {
  const root = getWorkspaceRoot();
  const outputDir = getOutputDir(root);
  const mmdPath = path.join(root, outputDir, `${name}.mmd`);

  try {
    const doc = await vscode.workspace.openTextDocument(vscode.Uri.file(mmdPath));
    await vscode.window.showTextDocument(doc);
  } catch {
    vscode.window.showWarningMessage(`Source file not found: ${outputDir}/${name}.mmd`);
  }
}

/**
 * Re-render a specific diagram by anchor name.
 */
export async function rerender(name: string): Promise<void> {
  const root = getWorkspaceRoot();
  const fs = new VsCodeFileSystem(root);
  const outputDir = getOutputDir(root);
  const mmdPath = `${outputDir}/${name}.mmd`;

  const exists = await fs.exists(mmdPath);
  if (!exists) {
    vscode.window.showWarningMessage(`Source file not found: ${mmdPath}`);
    return;
  }

  const results = await renderDiagrams(getConfig(root), {
    renderer: createRenderer(),
    fallbackRenderer: createFallbackRenderer(getConfig(root).renderWidth),
    fs,
    mmdFiles: [mmdPath],
    force: true,
    configPath: getConfigPath(root),
  });

  vscode.window.showInformationMessage(
    `Re-rendered ${results.length} diagram(s)`
  );
}
