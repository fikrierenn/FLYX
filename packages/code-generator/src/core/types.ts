/**
 * FLYX Kod Üretici - Temel Tip Tanımları
 * =======================================
 * Bu dosya, tüm kod üretim sisteminin temelini oluşturan arayüz (interface)
 * tanımlarını içerir. Strategy pattern'i desteklemek için generic yapıda
 * tasarlanmıştır.
 *
 * Mimari:
 * - Generator: Tek dosya üreten temel arayüz
 * - MultiFileGenerator: Birden fazla dosya üreten gelişmiş arayüz
 * - GeneratorPlugin: Hook sistemi ile üretim sürecine müdahale imkânı
 *
 * Strategy Pattern Kullanımı:
 *   Her framework (NestJS, React, Express, Vue) kendi Generator implementasyonunu
 *   sağlar. GeneratorEngine, options'a göre doğru strategy'yi seçer ve çalıştırır.
 */

import type { EntityDeclaration } from '@flyx/fsl-compiler';

/**
 * Temel generator arayüzü - tüm generator'lar bu arayüzü uygular.
 *
 * Generic parametreler:
 * @typeParam TInput  - Girdi tipi, varsayılan olarak FSL EntityDeclaration AST düğümü
 * @typeParam TOutput - Çıktı tipi, varsayılan olarak string (üretilen kod)
 */
export interface Generator<TInput = EntityDeclaration, TOutput = string> {
  generate(input: TInput, options?: GeneratorOptions): TOutput;
}

/**
 * Çoklu dosya üreten generator arayüzü.
 * NestJS gibi birden fazla dosya gerektiren framework'ler için kullanılır.
 * Örneğin bir entity'den controller, service, DTO ve module dosyaları üretilir.
 *
 * @typeParam TInput - Girdi tipi, varsayılan olarak FSL EntityDeclaration
 */
export interface MultiFileGenerator<TInput = EntityDeclaration> {
  generate(input: TInput, options?: GeneratorOptions): GeneratedFile[];
}

/**
 * Üretilen tek bir dosyayı temsil eder.
 * Her dosyanın yolu, içeriği ve kategorisi bulunur.
 * Kategori bilgisi, dosyaları filtrelemek ve gruplamak için kullanılır.
 */
export interface GeneratedFile {
  /** Göreceli dosya yolu (örn: "customers/customers.controller.ts") */
  path: string;
  /** Üretilen dosya içeriği (kaynak kod) */
  content: string;
  /** Dosya kategorisi - filtreleme ve gruplama için kullanılır */
  category: 'controller' | 'service' | 'dto' | 'module' | 'page' | 'component' | 'store' | 'other';
}

/**
 * Kod üretim seçenekleri.
 * Bu seçenekler GeneratorEngine'e hangi framework'leri hedefleyeceğini,
 * üretim stilini ve çıktı dizinini belirtir.
 */
export interface GeneratorOptions {
  /** Backend framework seçimi (varsayılan: 'nestjs') */
  backend?: 'nestjs' | 'express';
  /** Frontend framework seçimi (varsayılan: 'react') */
  frontend?: 'react' | 'vue';
  /** Üretim stili - 'crud' basit CRUD, 'advanced' gelişmiş özellikler */
  style?: 'crud' | 'advanced';
  /** Çıktı dizini - üretilen dosyaların yazılacağı klasör */
  outDir?: string;
  /** Belirli generator'ları atla - örneğin sadece backend üretmek için ['frontend'] */
  skip?: ('backend' | 'frontend')[];
}

/**
 * Plugin hook bağlamı (context).
 * afterGenerate hook'una geçirilen bilgileri içerir.
 * Plugin'ler bu bağlam üzerinden üretilen dosyaları okuyabilir ve değiştirebilir.
 */
export interface HookContext {
  /** İşlenen FSL entity tanımı */
  entity: EntityDeclaration;
  /** Kullanılan üretim seçenekleri */
  options: GeneratorOptions;
  /** Şu ana kadar üretilmiş dosya listesi (değiştirilebilir) */
  files: GeneratedFile[];
}

/**
 * Generator plugin arayüzü.
 *
 * Plugin hook sistemi, üretim sürecine müdahale etmeyi sağlar:
 * - beforeGenerate: Üretim başlamadan önce çağrılır (validasyon, ön hazırlık)
 * - afterGenerate: Tüm dosyalar üretildikten sonra çağrılır (dosya ekleme/değiştirme)
 *
 * Kullanım örneği:
 *   const auditPlugin: GeneratorPlugin = {
 *     name: 'audit-logger',
 *     afterGenerate(ctx) {
 *       // Her entity'ye audit log dosyası ekle
 *       return [...ctx.files, { path: 'audit.ts', content: '...', category: 'other' }];
 *     }
 *   };
 */
export interface GeneratorPlugin {
  /** Plugin'in benzersiz adı */
  name: string;
  /** Üretim başlamadan önce çağrılır - validasyon veya ön hazırlık için */
  beforeGenerate?(entity: EntityDeclaration, options: GeneratorOptions): void;
  /** Tüm dosyalar üretildikten sonra çağrılır - dosyaları değiştirebilir veya yeni dosya ekleyebilir */
  afterGenerate?(context: HookContext): GeneratedFile[];
}
