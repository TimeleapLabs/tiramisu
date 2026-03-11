import * as vscode from "vscode";
import { format } from "@timeleap/tiramisu";

export function activate(context: vscode.ExtensionContext) {
  const formatter = vscode.languages.registerDocumentFormattingEditProvider(
    { language: "tiramisu", scheme: "file" },
    {
      provideDocumentFormattingEdits(
        document: vscode.TextDocument
      ): vscode.TextEdit[] {
        const text = document.getText();
        try {
          const formatted = format(text);
          if (formatted === text) return [];
          const fullRange = new vscode.Range(
            document.positionAt(0),
            document.positionAt(text.length)
          );
          return [vscode.TextEdit.replace(fullRange, formatted)];
        } catch (err) {
          const msg =
            err instanceof Error ? err.message : "Unknown formatting error";
          vscode.window.showErrorMessage(`Tiramisu format error: ${msg}`);
          return [];
        }
      },
    }
  );
  context.subscriptions.push(formatter);
}

export function deactivate() {}
