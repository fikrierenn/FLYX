/**
 * FSL Lexer (Sözcüksel Çözümleyici)
 *
 * Bu dosya, FSL kaynak kodunu token dizisine dönüştüren lexer sınıfını içerir.
 * Derleme sürecinin ilk aşamasıdır: kaynak metin -> token listesi.
 *
 * Chevrotain'in Lexer sınıfını sarmalayarak, FSL'e özel token tanımlarını
 * (tokens.ts'den) kullanır. `ensureOptimizations` bayrağı, performans
 * optimizasyonlarının uygulandığını garanti eder.
 */
import { Lexer, ILexingResult } from 'chevrotain';
import { allTokens } from './tokens.js';

export class FSLLexer {
  private lexer: Lexer;

  constructor() {
    // ensureOptimizations: Chevrotain'in token eşleştirme optimizasyonlarını
    // zorunlu kılar. Optimizasyon yapılamazsa hata fırlatır (geliştirme güvenliği).
    this.lexer = new Lexer(allTokens, {
      ensureOptimizations: true,
    });
  }

  /**
   * Verilen FSL kaynak kodunu token'lara ayırır.
   * Dönen ILexingResult içinde hem token dizisi hem de olası hatalar bulunur.
   */
  tokenize(input: string): ILexingResult {
    const result = this.lexer.tokenize(input);
    return result;
  }
}
