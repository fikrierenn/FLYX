/**
 * FSL Compiler - Public API
 *
 * Bu dosya, fsl-compiler paketinin dışa açılan genel arayüzüdür.
 * Paketin tüketicileri (diğer paketler, CLI araçları vb.) bu dosya üzerinden
 * derleyici bileşenlerine erişir.
 *
 * Dışa aktarılan bileşenler:
 * - FSLCompiler & CompileResult: Ana derleme sınıfı ve sonuç tipi
 * - FSLLexer: Sözcüksel çözümleyici (doğrudan kullanım için)
 * - FSLParser: Sözdizimsel çözümleyici (doğrudan kullanım için)
 * - CSTToASTVisitor: CST -> AST dönüştürücüsü
 * - Hata sınıfları: Derleme hatalarını yakalamak için
 * - AST node tipleri: Tip güvenli AST manipülasyonu için
 * - allTokens: Token tanımları (özel lexer yapılandırması için)
 */
export { FSLCompiler } from './compiler.js';
export type { CompileResult } from './compiler.js';
export { FSLLexer } from './lexer/lexer.js';
export { FSLParser } from './parser/parser.js';
export { CSTToASTVisitor } from './parser/cst-visitor.js';
export { FSLCompileError, FSLLexicalError, FSLSyntaxError } from './errors.js';
export * from './ast/nodes.js';
export { allTokens } from './lexer/tokens.js';
