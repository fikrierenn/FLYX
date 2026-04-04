/**
 * FLYX VSCode Extension - Ana Giriş Noktası
 * ============================================
 * FSL dili için VSCode desteği:
 * - Syntax highlighting (TextMate grammar ile)
 * - Kod parçacıkları (entity, form, report, workflow şablonları)
 * - Derleme komutu (FLYX: Compile FSL)
 * - SQL üretme komutu (FLYX: Generate SQL)
 * - Canlı hata gösterimi (diagnostics)
 *
 * Aktivasyon: .fsl dosyası açıldığında otomatik aktif olur
 */

import * as vscode from 'vscode';

/** Hata koleksiyonu - FSL derleme hatalarını editörde gösterir */
let diagnosticCollection: vscode.DiagnosticCollection;

export function activate(context: vscode.ExtensionContext) {
  console.log('FLYX FSL extension activated');

  // Hata koleksiyonunu oluştur (editörde kırmızı/sarı altçizgi)
  diagnosticCollection = vscode.languages.createDiagnosticCollection('fsl');
  context.subscriptions.push(diagnosticCollection);

  // Komut: FSL Derle
  context.subscriptions.push(
    vscode.commands.registerCommand('flyx.compile', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor || editor.document.languageId !== 'fsl') {
        vscode.window.showWarningMessage('Aktif dosya bir FSL dosyası değil');
        return;
      }

      const source = editor.document.getText();
      try {
        // Dinamik import - extension aktivasyonunu hızlandırmak için
        const { FSLCompiler } = await import('@flyx/fsl-compiler');
        const compiler = new FSLCompiler();
        const result = compiler.compile(source);

        diagnosticCollection.clear();
        vscode.window.showInformationMessage(
          `FSL derlendi: ${result.ast.length} bildirim bulundu`,
        );
      } catch (err: any) {
        showCompileErrors(editor.document, err);
      }
    }),
  );

  // Komut: SQL Üret
  context.subscriptions.push(
    vscode.commands.registerCommand('flyx.generateSQL', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor || editor.document.languageId !== 'fsl') {
        vscode.window.showWarningMessage('Aktif dosya bir FSL dosyası değil');
        return;
      }

      const source = editor.document.getText();
      try {
        const { FSLCompiler } = await import('@flyx/fsl-compiler');
        const { TableGenerator } = await import('@flyx/database-engine');
        const compiler = new FSLCompiler();
        const generator = new TableGenerator();

        const result = compiler.compile(source);
        const sqlParts: string[] = [];

        for (const decl of result.ast) {
          if (decl.type === 'EntityDeclaration') {
            sqlParts.push(generator.generateFullSQL(decl as any));
          }
        }

        // SQL'i yeni bir editör sekmesinde göster
        const doc = await vscode.workspace.openTextDocument({
          content: sqlParts.join('\n\n'),
          language: 'sql',
        });
        await vscode.window.showTextDocument(doc, vscode.ViewColumn.Beside);
      } catch (err: any) {
        vscode.window.showErrorMessage(`SQL üretim hatası: ${err.message}`);
      }
    }),
  );

  // Kaydetme sırasında otomatik derleme (canlı hata gösterimi)
  context.subscriptions.push(
    vscode.workspace.onDidSaveTextDocument(async (document) => {
      if (document.languageId !== 'fsl') return;

      try {
        const { FSLCompiler } = await import('@flyx/fsl-compiler');
        const compiler = new FSLCompiler();
        compiler.compile(document.getText());
        diagnosticCollection.delete(document.uri);
      } catch (err: any) {
        showCompileErrors(document, err);
      }
    }),
  );
}

/**
 * Derleme hatalarını VSCode diagnostics olarak gösterir.
 * Editörde hatalı satırların altı kırmızı çizilir.
 */
function showCompileErrors(document: vscode.TextDocument, err: any) {
  const diagnostics: vscode.Diagnostic[] = [];

  if (err.errors && Array.isArray(err.errors)) {
    for (const e of err.errors) {
      const line = (e.line || e.token?.startLine || 1) - 1;
      const col = (e.column || e.token?.startColumn || 1) - 1;
      const range = new vscode.Range(line, col, line, col + 10);
      const message = e.message || String(e);

      diagnostics.push(
        new vscode.Diagnostic(range, message, vscode.DiagnosticSeverity.Error),
      );
    }
  } else {
    // Genel hata mesajı
    const range = new vscode.Range(0, 0, 0, 0);
    diagnostics.push(
      new vscode.Diagnostic(range, err.message, vscode.DiagnosticSeverity.Error),
    );
  }

  diagnosticCollection.set(document.uri, diagnostics);
  vscode.window.showErrorMessage(`FSL derleme hatası: ${err.message}`);
}

export function deactivate() {
  diagnosticCollection?.dispose();
}
