/**
 * FSL Hata Sınıfları
 *
 * Bu dosya, derleme sürecinde oluşabilecek hataları temsil eden sınıf hiyerarşisini
 * tanımlar. Tüm FSL hataları FSLCompileError'dan türer:
 *
 *   FSLCompileError (temel sınıf)
 *   ├── FSLLexicalError  - Sözcüksel analiz hataları (tanınmayan karakterler vb.)
 *   └── FSLSyntaxError   - Sözdizimsel analiz hataları (gramer ihlalleri vb.)
 *
 * Her hata sınıfı, Chevrotain'in ürettiği ham hata nesnelerini saklar ve
 * kullanıcı dostu bir hata mesajı oluşturur. Bu sayede hata yakalayan kod
 * hem okunabilir mesaja hem de detaylı hata bilgisine erişebilir.
 */
import type { ILexingError, IRecognitionException } from 'chevrotain';

/**
 * Tüm FSL derleme hatalarının temel sınıfı.
 * catch bloğunda `instanceof FSLCompileError` ile tüm derleme hataları yakalanabilir.
 */
export class FSLCompileError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FSLCompileError';
  }
}

/**
 * Sözcüksel analiz (lexing) sırasında oluşan hatalar.
 * Örneğin: tanınmayan karakter, geçersiz string literal vb.
 * Chevrotain'in ILexingError dizisini sarar ve satır/sütun bilgisi içeren mesaj üretir.
 */
export class FSLLexicalError extends FSLCompileError {
  public errors: ILexingError[];

  constructor(errors: ILexingError[]) {
    const messages = errors.map(
      (e) => `Unexpected character "${e.message}" at line ${e.line}, column ${e.column}`,
    );
    super(`Lexical errors:\n${messages.join('\n')}`);
    this.name = 'FSLLexicalError';
    this.errors = errors;
  }
}

/**
 * Sözdizimsel analiz (parsing) sırasında oluşan hatalar.
 * Örneğin: beklenmeyen token, eksik kapanış parantezi vb.
 * Chevrotain'in IRecognitionException dizisini sarar.
 */
export class FSLSyntaxError extends FSLCompileError {
  public errors: IRecognitionException[];

  constructor(errors: IRecognitionException[]) {
    const messages = errors.map((e) => e.message);
    super(`Syntax errors:\n${messages.join('\n')}`);
    this.name = 'FSLSyntaxError';
    this.errors = errors;
  }
}
