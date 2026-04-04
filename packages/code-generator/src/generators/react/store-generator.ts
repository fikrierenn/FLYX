/**
 * FLYX React/Zustand Store Üretici
 * ==================================
 * FSL entity tanımından Zustand state management store'u üretir.
 * Üretilen store, entity için tam CRUD operasyonlarını ve
 * ilgili TypeScript arayüzlerini içerir.
 *
 * Üretilen store özellikleri:
 * - Entity TypeScript interface'i (alan tipleri ve opsiyonellik dahil)
 * - Store interface'i (state + actions tanımı)
 * - Zustand create() ile store oluşturma
 * - CRUD aksiyonları: fetch, create, update, delete
 * - Loading ve error state yönetimi
 * - REST API entegrasyonu (fetch API ile)
 * - İyimser (optimistic) güncelleme: Sunucu yanıtı ile state güncellenir
 *
 * API Endpoint Konvansiyonu:
 *   Tüm istekler /api/{plural} yoluna yapılır.
 *   Örnek: Customer → /api/customers
 *
 * Neden Zustand?
 * - Redux'a göre çok daha az boilerplate kod
 * - Context API'ye göre daha iyi performans (gereksiz re-render yok)
 * - TypeScript ile mükemmel tip güvenliği
 * - Middleware desteği (persist, devtools vb.)
 */

import type { EntityDeclaration } from '@flyx/fsl-compiler';
import { toCamelCase, toPlural } from '../../core/naming/index.js';
import { mapToTSType } from '../../core/type-mapper/index.js';

/**
 * React/Zustand store üretici sınıfı.
 * Entity tanımından TypeScript interface'leri ve Zustand store kodu üretir.
 */
export class ReactStoreGenerator {
  /**
   * Verilen entity için Zustand store kodu üretir.
   * Çıktı iki interface ve bir store oluşturma bloğu içerir.
   *
   * @param entity - FSL entity tanımı
   * @returns Zustand store TypeScript kaynak kodu
   */
  generate(entity: EntityDeclaration): string {
    const name = entity.name;
    const nameVar = toCamelCase(name);
    const plural = toPlural(name);

    // Entity interface'i için alan tanımları (opsiyonellik dahil)
    const interfaceFields = entity.fields
      .map((f) => `  ${f.name}${!f.constraints?.required ? '?' : ''}: ${mapToTSType(f.dataType)};`)
      .join('\n');

    return `import { create } from 'zustand';

export interface ${name} {
  id: string;
${interfaceFields}
}

interface ${name}Store {
  ${plural}: ${name}[];
  loading: boolean;
  error: string | null;
  fetch${name}s: () => Promise<void>;
  create${name}: (data: Omit<${name}, 'id'>) => Promise<void>;
  update${name}: (id: string, data: Partial<${name}>) => Promise<void>;
  delete${name}: (id: string) => Promise<void>;
}

export const use${name}Store = create<${name}Store>((set) => ({
  ${plural}: [],
  loading: false,
  error: null,

  fetch${name}s: async () => {
    set({ loading: true, error: null });
    try {
      const res = await fetch('/api/${plural}');
      const data = await res.json();
      set({ ${plural}: data.data || data, loading: false });
    } catch (err: any) {
      set({ error: err.message, loading: false });
    }
  },

  create${name}: async (data) => {
    try {
      const res = await fetch('/api/${plural}', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const created = await res.json();
      set((s) => ({ ${plural}: [...s.${plural}, created] }));
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  update${name}: async (id, data) => {
    try {
      const res = await fetch(\`/api/${plural}/\${id}\`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const updated = await res.json();
      set((s) => ({
        ${plural}: s.${plural}.map((item) => (item.id === id ? updated : item)),
      }));
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  delete${name}: async (id) => {
    try {
      await fetch(\`/api/${plural}/\${id}\`, { method: 'DELETE' });
      set((s) => ({
        ${plural}: s.${plural}.filter((item) => item.id !== id),
      }));
    } catch (err: any) {
      set({ error: err.message });
    }
  },
}));`;
  }

}
