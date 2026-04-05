/**
 * Record Context - FSL'deki "this" nesnesi
 * ==========================================
 * FSL method ve trigger icinde "this.name", "this.total" gibi
 * erisimler bu context uzerinden gerceklesir.
 *
 * ABAP'taki work area (wa_) kavrami gibi - kaydin tum alanlarina
 * erisim saglar ve degisiklikleri takip eder.
 */

export class RecordContext {
  private data: Record<string, any>;
  private original: Record<string, any>;
  private changes: Set<string> = new Set();

  constructor(data: Record<string, any>) {
    this.original = { ...data };
    this.data = { ...data };
  }

  /** Alan degerini oku (this.name gibi) */
  get(field: string): any {
    return this.data[field];
  }

  /** Alan degerini yaz (this.total = 100 gibi) */
  set(field: string, value: any): void {
    this.data[field] = value;
    this.changes.add(field);
  }

  /** Tum veriyi dondur */
  toObject(): Record<string, any> {
    return { ...this.data };
  }

  /** Degisen alanlari dondur (UPDATE icin sadece degisenleri gondermek) */
  getChanges(): Record<string, any> {
    const result: Record<string, any> = {};
    for (const field of this.changes) {
      result[field] = this.data[field];
    }
    return result;
  }

  /** Degisiklik var mi? */
  hasChanges(): boolean {
    return this.changes.size > 0;
  }

  /** Orijinal degeri dondur (before/after karsilastirma icin) */
  getOriginal(field: string): any {
    return this.original[field];
  }
}
