/**
 * FSL Derleyici (Compiler) - Ana Derleme Pipeline'ı
 *
 * Bu dosya, FSL kaynak kodunu AST'ye dönüştüren üç aşamalı derleme sürecini
 * yönetir. Her aşama bir öncekinin çıktısını girdi olarak alır:
 *
 *   1. Sözcüksel Analiz (Lexing):  Kaynak kod -> Token dizisi
 *   2. Sözdizimsel Analiz (Parsing): Token dizisi -> CST (Somut Sözdizim Ağacı)
 *   3. AST Üretimi (Visiting):      CST -> AST (Soyut Sözdizim Ağacı)
 *
 * Her aşamada hata oluşursa, ilgili hata sınıfı (FSLLexicalError veya FSLSyntaxError)
 * fırlatılır ve derleme durur. Bu sayede kullanıcıya hangi aşamada sorun olduğu
 * net bir şekilde bildirilir.
 */
import { FSLLexer } from './lexer/lexer.js';
import { FSLParser } from './parser/parser.js';
import { CSTToASTVisitor } from './parser/cst-visitor.js';
import { FSLLexicalError, FSLSyntaxError } from './errors.js';
import type { ASTNode, Declaration } from './ast/nodes.js';

/** Derleme sonucu: üretilen AST ve orijinal kaynak kod */
export interface CompileResult {
  ast: Declaration[];
  source: string;
}

export class FSLCompiler {
  private lexer = new FSLLexer();
  private parser = new FSLParser();
  private visitor = new CSTToASTVisitor();

  /**
   * FSL kaynak kodunu derler ve AST üretir.
   * Üç aşamalı pipeline sırayla çalışır; herhangi bir aşamada hata olursa durur.
   */
  compile(source: string): CompileResult {
    // Aşama 1: Sözcüksel analiz - kaynak kodu token'lara ayır
    const lexResult = this.lexer.tokenize(source);
    if (lexResult.errors.length > 0) {
      throw new FSLLexicalError(lexResult.errors);
    }

    // Aşama 2: Sözdizimsel analiz - token'lardan CST oluştur
    // parser.input atanarak önceki tokenize sonucu parser'a verilir
    this.parser.input = lexResult.tokens;
    const cst = this.parser.program();
    if (this.parser.errors.length > 0) {
      throw new FSLSyntaxError(this.parser.errors);
    }

    // Aşama 3: CST'den AST'ye dönüşüm - visitor deseni ile
    const ast: Declaration[] = this.visitor.visit(cst);

    return { ast, source };
  }
}
