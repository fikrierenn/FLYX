/**
 * FLYX Studio - Form Controller
 * ================================
 * Framework-AGNOSTIC is mantigi.
 * Bu dosyada HICBIR React/Solid/Vue kodu yok.
 * Sadece veri islemleri, validasyon, hesaplama.
 *
 * Kural: Bu dosyaya ASLA UI framework import'u ekleme.
 */

import type {
  FormSchema, FormState, FieldSchema, TotalSchema, FormCallbacks,
} from './types.js';

export class FormController {
  private schema: FormSchema;
  private state: FormState;
  private callbacks: FormCallbacks;
  private listeners: Set<() => void> = new Set();

  constructor(schema: FormSchema, callbacks: FormCallbacks, initialData?: Record<string, any>, initialLines?: Record<string, any>[]) {
    this.schema = schema;
    this.callbacks = callbacks;
    this.state = {
      data: initialData || {},
      lines: initialLines || [],
      mode: initialData?.id ? 'edit' : 'create',
      status: initialData?.status,
      saving: false,
      errors: {},
    };
  }

  /** Mevcut state'i dondur */
  getState(): FormState {
    return { ...this.state };
  }

  /** State degisiklik dinleyicisi ekle */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((l) => l());
  }

  // ============================================================
  // FIELD ISLEMLERI
  // ============================================================

  /** Alan degerini degistir */
  setField(name: string, value: any): void {
    this.state = {
      ...this.state,
      data: { ...this.state.data, [name]: value },
      errors: { ...this.state.errors, [name]: '' }, // Hatayi temizle
    };
    this.notify();
  }

  /** Alanlari toplu degistir */
  setFields(fields: Record<string, any>): void {
    this.state = {
      ...this.state,
      data: { ...this.state.data, ...fields },
    };
    this.notify();
  }

  // ============================================================
  // KALEM (GRID) ISLEMLERI
  // ============================================================

  /** Satirlari guncelle */
  setLines(lines: Record<string, any>[]): void {
    this.state = { ...this.state, lines };
    this.notify();
  }

  /** Satir ekle */
  addLine(defaultValues?: Record<string, any>): void {
    const newLine: Record<string, any> = {};
    if (this.schema.linesFields) {
      for (const f of this.schema.linesFields) {
        newLine[f.name] = defaultValues?.[f.name] ?? f.defaultValue ?? '';
      }
    }
    this.state = { ...this.state, lines: [...this.state.lines, newLine] };
    this.notify();
  }

  /** Satir sil */
  removeLine(index: number): void {
    this.state = {
      ...this.state,
      lines: this.state.lines.filter((_, i) => i !== index),
    };
    this.notify();
  }

  /** Satir guncelle */
  updateLine(index: number, field: string, value: any): void {
    const lines = [...this.state.lines];
    lines[index] = { ...lines[index], [field]: value };
    this.state = { ...this.state, lines };
    this.notify();
  }

  // ============================================================
  // TOPLAM HESAPLAMA
  // ============================================================

  /** Toplam hesapla */
  calculateTotals(): Record<string, number> {
    const result: Record<string, number> = {};
    if (!this.schema.totals) return result;

    for (const t of this.schema.totals) {
      if (t.type === 'sum') {
        result[t.field] = this.state.lines.reduce((sum, line) => sum + (Number(line[t.sourceField]) || 0), 0);
      } else if (t.type === 'count') {
        result[t.field] = this.state.lines.length;
      } else if (t.type === 'avg' && this.state.lines.length > 0) {
        result[t.field] = this.state.lines.reduce((sum, line) => sum + (Number(line[t.sourceField]) || 0), 0) / this.state.lines.length;
      }
      result[t.field] = Math.round((result[t.field] || 0) * 100) / 100;
    }

    return result;
  }

  // ============================================================
  // VALIDASYON
  // ============================================================

  /** Form dogrulama */
  validate(): boolean {
    const errors: Record<string, string> = {};

    for (const field of this.schema.fields) {
      if (field.required && !this.state.data[field.name]) {
        errors[field.name] = `${field.label} zorunludur`;
      }
    }

    this.state = { ...this.state, errors };
    this.notify();
    return Object.keys(errors).length === 0;
  }

  // ============================================================
  // AKSIYONLAR
  // ============================================================

  /** Kaydet */
  async save(): Promise<boolean> {
    if (!this.validate()) return false;

    this.state = { ...this.state, saving: true };
    this.notify();

    try {
      await this.callbacks.onSave(
        this.state.data,
        this.schema.viewType === 'master_detail' ? this.state.lines : undefined,
      );
      return true;
    } catch (err: any) {
      this.state = { ...this.state, errors: { _form: err.message } };
      return false;
    } finally {
      this.state = { ...this.state, saving: false };
      this.notify();
    }
  }

  /** Durum degistir (onayla, sevk et, iptal) */
  async executeAction(action: string): Promise<void> {
    this.state = { ...this.state, saving: true };
    this.notify();

    try {
      await this.callbacks.onAction(action);
    } finally {
      this.state = { ...this.state, saving: false };
      this.notify();
    }
  }

  /** Lookup verisi cek */
  async lookup(entity: string, query?: string): Promise<any[]> {
    return this.callbacks.onLookup(entity, query);
  }

  // ============================================================
  // AKSIYON GORUNURLUK
  // ============================================================

  /** Hangi aksiyonlar gorunur */
  getVisibleActions(): typeof this.schema.actions {
    if (!this.schema.actions) return [];
    return this.schema.actions.filter((a) => {
      if (!a.visibleWhen || a.visibleWhen.length === 0) return true;
      return this.state.status && a.visibleWhen.includes(this.state.status);
    });
  }

  /** Duzenlenebilir mi */
  isEditable(): boolean {
    return this.state.mode === 'create' || this.state.mode === 'edit';
  }
}
