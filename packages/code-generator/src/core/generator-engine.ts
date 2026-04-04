/**
 * FLYX Generator Engine - Ana Kod Üretim Motoru
 * ==============================================
 * Strategy pattern ile farklı backend/frontend framework'lerini destekleyen
 * ana kod üretim motorudur. Plugin sistemi sayesinde genişletilebilir yapıdadır.
 *
 * Mimari Tasarım:
 * - Strategy Pattern: Her framework (NestJS, React, Express, Vue) kendi
 *   generator'ını kaydeder. Motor, options'a göre doğru strategy'yi seçer.
 * - Plugin Hook Sistemi: Plugin'ler beforeGenerate ve afterGenerate hook'ları
 *   ile üretim sürecine müdahale edebilir.
 *
 * Üretim Akışı:
 *   1. Plugin'lerin beforeGenerate hook'ları çağrılır (ön hazırlık/validasyon)
 *   2. options.backend ve options.frontend'e göre uygun generator'lar seçilir
 *   3. Seçilen generator'lar entity'yi işler ve dosyaları üretir
 *   4. Plugin'lerin afterGenerate hook'ları çağrılır (son düzenlemeler)
 *
 * Kullanım:
 *   const engine = new GeneratorEngine();
 *   engine.registerGenerator('nestjs', 'backend', nestjsGenerator);
 *   engine.registerGenerator('react', 'frontend', reactGenerator);
 *   engine.registerPlugin(auditPlugin);
 *   const files = engine.generate(entity, { backend: 'nestjs', frontend: 'react' });
 */

import type { EntityDeclaration } from '@flyx/fsl-compiler';
import type {
  GeneratedFile,
  GeneratorOptions,
  GeneratorPlugin,
  MultiFileGenerator,
} from './types.js';

/**
 * Kayıtlı generator bilgisi.
 * Her generator bir framework hedefi (target) ve taraf (side) bilgisi taşır.
 * Bu bilgiler, options'a göre doğru generator'ın seçilmesini sağlar.
 *
 * @property target - Framework adı: 'nestjs', 'react', 'vue', 'express'
 * @property side   - 'backend' veya 'frontend' - skip seçeneğinde filtreleme için
 * @property generator - Asıl generator instance'ı (MultiFileGenerator arayüzünü uygular)
 */
interface RegisteredGenerator {
  target: string;
  side: 'backend' | 'frontend';
  generator: MultiFileGenerator;
}

/**
 * Ana kod üretim motoru sınıfı.
 *
 * Bu sınıf, Strategy pattern'i kullanarak farklı framework'ler için
 * kod üretimini yönetir. Generator'lar ve plugin'ler dinamik olarak
 * kaydedilir ve üretim sırasında otomatik olarak çalıştırılır.
 */
export class GeneratorEngine {
  /** Kayıtlı generator listesi - her biri bir framework strategy'sidir */
  private generators: RegisteredGenerator[] = [];

  /** Kayıtlı plugin listesi - üretim sürecine hook ile müdahale ederler */
  private plugins: GeneratorPlugin[] = [];

  /**
   * Yeni bir generator kaydet.
   * Kaydedilen generator, target ve side bilgilerine göre eşleştirilir.
   *
   * @param target    - Framework adı (örneğin 'nestjs', 'react')
   * @param side      - 'backend' veya 'frontend'
   * @param generator - MultiFileGenerator arayüzünü uygulayan generator instance'ı
   */
  registerGenerator(target: string, side: 'backend' | 'frontend', generator: MultiFileGenerator): void {
    this.generators.push({ target, side, generator });
  }

  /**
   * Plugin kaydet.
   * Plugin'ler beforeGenerate ve afterGenerate hook'larını kullanarak
   * üretim sürecine müdahale edebilir. Birden fazla plugin kaydedilebilir
   * ve hepsi sırayla çalıştırılır.
   */
  registerPlugin(plugin: GeneratorPlugin): void {
    this.plugins.push(plugin);
  }

  /**
   * Entity'den kod üret - ana üretim metodu.
   *
   * Üretim adımları:
   * 1. Varsayılan seçenekler uygulanır (nestjs, react, crud)
   * 2. Plugin'lerin beforeGenerate hook'u çağrılır
   * 3. options.skip listesine göre filtrelenen generator'lar çalıştırılır
   * 4. Backend/frontend eşleşmesi kontrol edilerek sadece uygun olanlar seçilir
   * 5. Plugin'lerin afterGenerate hook'u çağrılır (dosya değiştirme/ekleme imkânı)
   *
   * @param entity  - FSL EntityDeclaration AST düğümü (derleyiciden gelen entity tanımı)
   * @param options - Üretim seçenekleri (backend, frontend, style, skip)
   * @returns Üretilen dosya listesi (GeneratedFile[])
   */
  generate(entity: EntityDeclaration, options: GeneratorOptions = {}): GeneratedFile[] {
    // Varsayılan seçenekleri uygula - belirtilmeyen değerler için varsayılanlar kullanılır
    const opts: GeneratorOptions = {
      backend: 'nestjs',
      frontend: 'react',
      style: 'crud',
      skip: [],
      ...options,
    };

    // Adım 1: beforeGenerate hook'larını çağır (validasyon, loglama vb.)
    for (const plugin of this.plugins) {
      plugin.beforeGenerate?.(entity, opts);
    }

    // Adım 2: Uygun generator'ları çalıştır ve dosyaları topla
    let files: GeneratedFile[] = [];

    for (const reg of this.generators) {
      // skip listesinde olan taraf (backend/frontend) atlanır
      if (opts.skip?.includes(reg.side)) continue;

      // Generator'ın framework hedefi, seçilen framework ile eşleşmeli
      if (reg.side === 'backend' && opts.backend !== reg.target) continue;
      if (reg.side === 'frontend' && opts.frontend !== reg.target) continue;

      const generated = reg.generator.generate(entity, opts);
      files.push(...generated);
    }

    // Adım 3: afterGenerate hook'larını çağır - plugin'ler dosyaları değiştirebilir
    for (const plugin of this.plugins) {
      const modified = plugin.afterGenerate?.({ entity, options: opts, files });
      if (modified) {
        // Plugin yeni bir dosya listesi döndürdüyse, mevcut listeyi değiştir
        files = modified;
      }
    }

    return files;
  }

  /** Kayıtlı generator sayısını döndürür (test ve debug için) */
  get generatorCount(): number {
    return this.generators.length;
  }

  /** Kayıtlı plugin sayısını döndürür (test ve debug için) */
  get pluginCount(): number {
    return this.plugins.length;
  }
}
