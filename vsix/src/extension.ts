import * as vscode from "vscode";
import { MmdCodeLensProvider } from "./codelens";
import { convertAll, convertAtLine, syncAll, editSource, rerender } from "./commands";
import { onDidSave } from "./on-save";

let codeLensProvider: MmdCodeLensProvider;

export function activate(context: vscode.ExtensionContext): void {
  // CodeLens provider for markdown files
  codeLensProvider = new MmdCodeLensProvider();
  context.subscriptions.push(
    vscode.languages.registerCodeLensProvider(
      { language: "markdown", scheme: "file" },
      codeLensProvider
    )
  );

  // Commands
  context.subscriptions.push(
    vscode.commands.registerCommand("mmd.convert", convertAll),
    vscode.commands.registerCommand("mmd.convertAtLine", convertAtLine),
    vscode.commands.registerCommand("mmd.sync", syncAll),
    vscode.commands.registerCommand("mmd.editSource", editSource),
    vscode.commands.registerCommand("mmd.rerender", rerender)
  );

  // On-save handler
  context.subscriptions.push(
    vscode.workspace.onDidSaveTextDocument(async (document) => {
      try {
        await onDidSave(document);
        codeLensProvider.refresh();
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        vscode.window.showErrorMessage(`MMD sync failed: ${msg}`);
      }
    })
  );
}

export function deactivate(): void {
  // Cleanup handled by disposables
}
