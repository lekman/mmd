import * as vscode from "vscode";

const MERMAID_FENCE_RE = /^```mermaid\s*$/;
const ANCHOR_RE = /^<!-- mmd:([a-z0-9-]+) -->$/;

/**
 * Provides CodeLens actions above mermaid fenced blocks and mmd anchors.
 */
export class MmdCodeLensProvider implements vscode.CodeLensProvider {
  private _onDidChangeCodeLenses = new vscode.EventEmitter<void>();
  readonly onDidChangeCodeLenses = this._onDidChangeCodeLenses.event;

  refresh(): void {
    this._onDidChangeCodeLenses.fire();
  }

  provideCodeLenses(document: vscode.TextDocument): vscode.CodeLens[] {
    const lenses: vscode.CodeLens[] = [];

    for (let i = 0; i < document.lineCount; i++) {
      const line = document.lineAt(i).text.trim();

      // Mermaid fenced block opener
      if (MERMAID_FENCE_RE.test(line)) {
        const range = new vscode.Range(i, 0, i, line.length);
        lenses.push(
          new vscode.CodeLens(range, {
            title: "Convert to SVG",
            command: "mmd.convertAtLine",
            arguments: [document.uri, i],
          })
        );
      }

      // mmd anchor comment
      const anchorMatch = line.match(ANCHOR_RE);
      if (anchorMatch?.[1]) {
        const name = anchorMatch[1];
        const range = new vscode.Range(i, 0, i, line.length);
        lenses.push(
          new vscode.CodeLens(range, {
            title: "Edit Source",
            command: "mmd.editSource",
            arguments: [name],
          }),
          new vscode.CodeLens(range, {
            title: "Re-render",
            command: "mmd.rerender",
            arguments: [name],
          })
        );
      }
    }

    return lenses;
  }
}
