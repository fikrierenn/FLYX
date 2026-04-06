/**
 * FLYX Studio - Schema Builder
 * ===============================
 * API'den gelen FSL entity/document schema'sini
 * Studio FormSchema formatina cevirir.
 *
 * Akis:
 *   GET /v1/data/_meta/schema/Customer → raw schema
 *   SchemaBuilder.build(raw) → FormSchema
 *   FormEngine(schema) → ERP ekrani
 */

import type { FormSchema, FieldSchema, SectionSchema, TotalSchema, ActionSchema } from './FormEngine';

/** API'den gelen ham entity schema */
interface RawEntitySchema {
  name: string;
  tableName: string;
  fields: RawField[];
  ast?: any; // EntityDeclaration veya DocumentDeclaration
}

interface RawField {
  name: string;
  dataType: { name: string; params?: any[] };
  constraints?: Record<string, any>;
}

/** Turkce alan etiketleri */
const LABELS: Record<string, string> = {
  code: 'Kod', name: 'Ad', description: 'Aciklama', notes: 'Notlar',
  status: 'Durum', is_active: 'Aktif', email: 'E-posta', phone: 'Telefon',
  address: 'Adres', city: 'Sehir', country: 'Ulke', currency: 'Para Birimi',
  customer: 'Musteri', supplier: 'Tedarikci', product: 'Urun', warehouse: 'Depo',
  tax_id: 'Vergi No', credit_limit: 'Kredi Limiti', category: 'Kategori',
  order_no: 'Siparis No', order_date: 'Siparis Tarihi', delivery_date: 'Teslim Tarihi',
  subtotal: 'Ara Toplam', discount_total: 'Iskonto', tax_amount: 'KDV Tutari',
  total: 'Genel Toplam', sales_order: 'Siparis',
  barcode: 'Barkod', unit: 'Birim', weight: 'Agirlik', sale_price: 'Satis Fiyati',
  unit_cost: 'Maliyet', tax_rate: 'KDV Orani', min_stock: 'Min Stok', max_stock: 'Max Stok',
  product_type: 'Urun Tipi', movement_no: 'Hareket No', movement_type: 'Hareket Tipi',
  quantity: 'Miktar', movement_date: 'Hareket Tarihi', reference_type: 'Referans Tipi',
  reference_no: 'Referans No', unit_price: 'Birim Fiyat', discount_rate: 'Iskonto %',
  discount_amount: 'Iskonto Tutari', line_total: 'Satir Toplami', net_total: 'Net Toplam',
  payment_term_days: 'Odeme Vadesi', expected_date: 'Beklenen Tarih',
  purchase_order: 'Satinalma Siparisi', receipt_no: 'Kabul No', receipt_date: 'Kabul Tarihi',
  account: 'Hesap', account_type: 'Hesap Tipi', balance: 'Bakiye',
  entry_no: 'Fis No', entry_date: 'Fis Tarihi', debit: 'Borc', credit: 'Alacak',
  employee: 'Calisan', employee_no: 'Sicil No', first_name: 'Ad', last_name: 'Soyad',
  department: 'Departman', position: 'Pozisyon', hire_date: 'Ise Giris',
  salary: 'Maas', manager: 'Yonetici', leave_type: 'Izin Turu',
  start_date: 'Baslangic', end_date: 'Bitis', days: 'Gun',
  price_list: 'Fiyat Listesi', rating: 'Degerlendirme',
};

/** Sistem alanlari - formda gosterilmez */
const SYSTEM_FIELDS = new Set(['id', 'tenant_id', 'created_by', 'updated_by', 'created_at', 'updated_at']);

/** Genis alanlar - 2 sutun kaplar */
const WIDE_TYPES = new Set(['Text', 'JSON']);

export class SchemaBuilder {

  /** Entity/Document schema'sindan FormSchema olustur */
  static build(raw: RawEntitySchema, options?: {
    viewType?: 'list' | 'detail' | 'master_detail';
    linesEntity?: string;
    linesSchema?: RawEntitySchema;
    title?: string;
  }): FormSchema {
    const ast = raw.ast;
    const isDocument = ast?.type === 'DocumentDeclaration';

    // Alanlari donustur
    const fields = raw.fields
      .filter((f) => !SYSTEM_FIELDS.has(f.name))
      .map((f) => this.buildField(f));

    // View type belirle
    let viewType = options?.viewType || 'detail';
    if (isDocument && ast?.linesEntity) viewType = 'master_detail';

    // Kalem alanlari (master-detail icin)
    let linesFields: FieldSchema[] | undefined;
    if (options?.linesSchema) {
      linesFields = options.linesSchema.fields
        .filter((f) => !SYSTEM_FIELDS.has(f.name) && f.name !== 'sales_order')
        .map((f) => this.buildField(f));
    }

    // Section'lari olustur
    const sections = this.buildSections(fields, raw.name);

    // Toplam alanlari
    const totals = this.buildTotals(fields, linesFields);

    // Aksiyon butonlari
    const actions = this.buildActions(ast);

    return {
      entityName: raw.name,
      viewType,
      title: options?.title || raw.name,
      fields,
      sections,
      linesEntity: options?.linesEntity || ast?.linesEntity,
      linesFields,
      totals,
      statusFlow: ast?.statusFlow,
      actions,
      numbering: ast?.numbering,
    };
  }

  /** Tek alan donusumu */
  private static buildField(raw: RawField): FieldSchema {
    const field: FieldSchema = {
      name: raw.name,
      label: LABELS[raw.name] || raw.name.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      type: raw.dataType.name,
      params: raw.dataType.params,
      required: raw.constraints?.required || false,
      unique: raw.constraints?.unique || false,
      defaultValue: raw.constraints?.default,
    };

    // Enum values
    if (raw.dataType.name === 'Enum' && raw.constraints?.values) {
      field.enumValues = raw.constraints.values;
    }

    // Relation → lookup
    if (raw.dataType.name === 'Relation' && raw.dataType.params?.[0]) {
      field.lookupEntity = String(raw.dataType.params[0]);
    }

    // Para alanlari readonly (hesaplanir)
    if (['subtotal', 'discount_total', 'tax_amount', 'total', 'line_total', 'discount_amount', 'net_total'].includes(raw.name)) {
      field.readOnly = true;
    }

    return field;
  }

  /** Akilli section olusturma - alan adlarina gore gruplama */
  private static buildSections(fields: FieldSchema[], entityName: string): SectionSchema[] {
    const sections: SectionSchema[] = [];

    // Genel bilgiler (ilk 4-5 alan)
    const generalFields = fields.filter((f) =>
      ['code', 'name', 'order_no', 'entry_no', 'movement_no', 'receipt_no', 'employee_no',
       'customer', 'supplier', 'status', 'order_date', 'entry_date', 'movement_date', 'receipt_date'].includes(f.name),
    );
    if (generalFields.length > 0) {
      sections.push({ name: 'general', label: 'Genel Bilgiler', fields: generalFields.map((f) => f.name), columns: 2 });
    }

    // Detay bilgiler (geri kalan alanlar)
    const detailFields = fields.filter((f) =>
      !generalFields.find((g) => g.name === f.name) &&
      !['subtotal', 'discount_total', 'tax_amount', 'total', 'notes'].includes(f.name),
    );
    if (detailFields.length > 0) {
      sections.push({ name: 'details', label: 'Detay Bilgiler', fields: detailFields.map((f) => f.name), columns: 2 });
    }

    // Notlar (varsa)
    const noteField = fields.find((f) => f.name === 'notes');
    if (noteField) {
      sections.push({ name: 'notes', label: 'Notlar', fields: ['notes'], columns: 1 });
    }

    // Hicbir section olusturulamadiysa tum alanlari tek section'a koy
    if (sections.length === 0) {
      sections.push({ name: 'main', label: '', fields: fields.map((f) => f.name), columns: 2 });
    }

    return sections;
  }

  /** Toplam alanlari */
  private static buildTotals(fields: FieldSchema[], linesFields?: FieldSchema[]): TotalSchema[] {
    const totals: TotalSchema[] = [];

    // Kalem satirlarindan toplamlar
    if (linesFields) {
      if (linesFields.find((f) => f.name === 'line_total')) {
        totals.push({ field: 'subtotal', label: 'Ara Toplam', type: 'sum', sourceField: 'line_total' });
      }
      if (linesFields.find((f) => f.name === 'discount_amount')) {
        totals.push({ field: 'discount', label: 'Iskonto', type: 'sum', sourceField: 'discount_amount' });
      }
      if (linesFields.find((f) => f.name === 'tax_amount')) {
        totals.push({ field: 'tax', label: 'KDV', type: 'sum', sourceField: 'tax_amount' });
      }
      if (linesFields.find((f) => f.name === 'net_total')) {
        totals.push({ field: 'grand_total', label: 'Genel Toplam', type: 'sum', sourceField: 'net_total' });
      }
    }

    return totals;
  }

  /** Aksiyon butonlari - status_flow'dan veya varsayilan */
  private static buildActions(ast?: any): ActionSchema[] {
    const actions: ActionSchema[] = [];

    // Document ise durum gecis butonlari
    if (ast?.statusFlow || ast?.fields?.find((f: any) => f.name === 'status')) {
      actions.push({ name: 'confirm', label: 'Onayla', style: 'success', visibleWhen: ['draft'] });
      actions.push({ name: 'ship', label: 'Sevk Et', style: 'primary', visibleWhen: ['confirmed'] });
      actions.push({ name: 'cancel', label: 'Iptal', style: 'danger', visibleWhen: ['draft', 'confirmed'] });
    }

    return actions;
  }

  /** Entity listesi icin basit tablo schema'si */
  static buildListSchema(raw: RawEntitySchema, title?: string): FormSchema {
    return this.build(raw, { viewType: 'list', title: title || raw.name });
  }
}
