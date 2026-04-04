/**
 * FLYX Kod Yayıcı (Code Emitter)
 * ================================
 * Bağımlılık gerektirmeyen, hafif bir şablon motoru (template engine).
 * Yapılandırılmış veri ile programatik olarak kod üretmeyi sağlar.
 *
 * Neden kendi emitter'ımız var?
 * - Sıfır dış bağımlılık (Handlebars, EJS gibi kütüphanelere gerek yok)
 * - Paket boyutunu küçük tutar
 * - Girinti (indentation) yönetimi otomatik
 * - Fluent API (zincirleme çağrı) desteği ile okunabilir kod üretim kodu
 *
 * Kullanım örneği:
 *   const emitter = new CodeEmitter();
 *   emitter
 *     .line("import { Injectable } from '@nestjs/common';")
 *     .line()
 *     .block('@Injectable()\nexport class MyService', () => {
 *       emitter.line('// servis metotları');
 *     });
 */

export class CodeEmitter {
  /** Üretilen satırlar - toString() ile birleştirilir */
  private lines: string[] = [];
  /** Mevcut girinti seviyesi (0'dan başlar) */
  private currentIndent = 0;
  /** Girinti karakteri - varsayılan olarak 2 boşluk */
  private indentStr = '  ';

  /** Girinti seviyesini bir artırır (iç içe bloklar için) */
  indent(): this {
    this.currentIndent++;
    return this;
  }

  /** Girinti seviyesini bir azaltır (minimum 0) */
  dedent(): this {
    this.currentIndent = Math.max(0, this.currentIndent - 1);
    return this;
  }

  /**
   * Mevcut girinti seviyesinde bir satır ekler.
   * Boş çağrıda (text='') boş satır eklenir (girinti olmadan).
   */
  line(text = ''): this {
    if (text === '') {
      this.lines.push('');
    } else {
      this.lines.push(this.indentStr.repeat(this.currentIndent) + text);
    }
    return this;
  }

  /**
   * Süslü parantezli bir kod bloğu oluşturur.
   * Header'ı yazar, girinti artırır, callback'i çağırır, girintiyi azaltır ve kapatır.
   * Sınıf, fonksiyon, if/for blokları gibi yapılar için idealdir.
   *
   * @param header - Blok başlığı (örn: "export class MyService")
   * @param fn     - Blok içeriğini üreten callback fonksiyonu
   */
  block(header: string, fn: () => void): this {
    this.line(header + ' {');
    this.indent();
    fn();
    this.dedent();
    this.line('}');
    return this;
  }

  /**
   * Ham çok satırlı metin ekler (metnin kendi girintisini korur).
   * Mevcut girinti seviyesi her satırın başına eklenir.
   * Şablon literal'leri ile üretilen kod blokları için kullanışlıdır.
   */
  raw(text: string): this {
    const trimmed = text.replace(/^\n/, '').replace(/\n$/, '');
    for (const line of trimmed.split('\n')) {
      this.lines.push(this.indentStr.repeat(this.currentIndent) + line);
    }
    return this;
  }

  /**
   * Bir dizi öğe için tekrarlayan kod üretir.
   * Her öğe arasına isteğe bağlı ayırıcı satır eklenebilir.
   *
   * @param items     - İşlenecek öğe listesi
   * @param fn        - Her öğe için çağrılacak kod üretim fonksiyonu
   * @param separator - Öğeler arası ayırıcı (örn: boş satır '')
   */
  each<T>(items: T[], fn: (item: T, index: number) => void, separator = ''): this {
    items.forEach((item, i) => {
      fn(item, i);
      if (separator && i < items.length - 1) {
        this.line(separator);
      }
    });
    return this;
  }

  /** Tüm üretilen satırları birleştirip tek bir string olarak döndürür */
  toString(): string {
    return this.lines.join('\n');
  }

  /** Emitter'ı sıfırlar - yeniden kullanım için tüm satırları ve girintiyi temizler */
  reset(): this {
    this.lines = [];
    this.currentIndent = 0;
    return this;
  }
}

/**
 * Basit şablon interpolasyon fonksiyonu.
 * {{anahtar}} kalıplarını data nesnesindeki değerlerle değiştirir.
 * Bulunamayan anahtarlar boş string ile değiştirilir.
 *
 * Örnek: interpolate("Merhaba {{isim}}!", { isim: "Dünya" }) → "Merhaba Dünya!"
 */
export function interpolate(template: string, data: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => data[key] ?? '');
}

/**
 * Şablon literal'den ortak baştaki boşlukları kaldırır (dedent).
 * Tüm satırlardaki en küçük girinti miktarını bulur ve hepsinden çıkarır.
 * Template literal ile yazılan çok satırlı kodların düzgün hizalanması için kullanılır.
 *
 * Örnek:
 *   dedent(`
 *     class Foo {
 *       bar() {}
 *     }
 *   `)
 *   → "class Foo {\n  bar() {}\n}"
 */
export function dedent(str: string): string {
  const lines = str.split('\n');
  // Baş ve sondaki boş satırları kaldır
  if (lines[0]?.trim() === '') lines.shift();
  if (lines[lines.length - 1]?.trim() === '') lines.pop();

  // Tüm dolu satırlardaki en küçük girinti miktarını bul
  const indent = lines
    .filter((l) => l.trim().length > 0)
    .reduce((min, l) => {
      const match = l.match(/^(\s*)/);
      return Math.min(min, match ? match[1].length : 0);
    }, Infinity);

  if (indent === Infinity) return str;
  // Her satırdan ortak girintiyi çıkar
  return lines.map((l) => l.slice(indent)).join('\n');
}
