/**
 * FLYX Studio Core Types
 * ========================
 * Framework-agnostic tip tanimlari.
 * Bu dosyadaki HICBIR sey React, Solid, Vue vs. bilmez.
 * Sadece is mantigi ve veri yapilari.
 *
 * Kural: Bu dosyaya ASLA 'react', 'jsx', 'tsx' import ekleme.
 */

// ============================================================
// FORM SCHEMA (FSL'den gelen ekran tanimi)
// ============================================================

export interface FormSchema {
  entityName: string;
  viewType: 'list' | 'detail' | 'master_detail';
  title: string;
  fields: FieldSchema[];
  sections?: SectionSchema[];
  linesEntity?: string;
  linesFields?: FieldSchema[];
  totals?: TotalSchema[];
  statusFlow?: string[];
  actions?: ActionSchema[];
  numbering?: string;
  permissions?: { create?: boolean; update?: boolean; delete?: boolean };
}

export interface FieldSchema {
  name: string;
  label: string;
  type: string;
  params?: any[];
  required?: boolean;
  unique?: boolean;
  readOnly?: boolean;
  defaultValue?: any;
  enumValues?: string[];
  lookupEntity?: string;
  hidden?: boolean;
  width?: string;
}

export interface SectionSchema {
  name: string;
  label: string;
  fields: string[];
  columns?: number;
}

export interface TotalSchema {
  field: string;
  label: string;
  type: 'sum' | 'count' | 'avg';
  sourceField: string;
}

export interface ActionSchema {
  name: string;
  label: string;
  style: 'primary' | 'success' | 'danger' | 'default';
  visibleWhen?: string[];
  endpoint?: string;
}

// ============================================================
// FORM STATE (runtime veri durumu)
// ============================================================

export interface FormState {
  data: Record<string, any>;
  lines: Record<string, any>[];
  mode: 'view' | 'edit' | 'create';
  status?: string;
  saving: boolean;
  errors: Record<string, string>;
}

// ============================================================
// RENDER ADAPTER (framework soyutlama katmani)
// ============================================================

/**
 * RenderAdapter - tum framework'lerin uygulamasi gereken arayuz.
 *
 * React, Solid, Vue, React Native → hepsi bu interface'i implement eder.
 * FormController is mantigini yonetir, RenderAdapter goruntulemeyi yapar.
 *
 * Neden boyle? React 18→19→20 gecisinde sadece ReactAdapter degisir,
 * FormController ve FSL kodu HIC degismez.
 */
export interface RenderAdapter {
  /** Tam form ekranini render et */
  renderForm(props: RenderFormProps): any;

  /** Tek bir alani render et (input, select, checkbox vs.) */
  renderField(props: RenderFieldProps): any;

  /** Kalem tablosunu render et (master-detail grid) */
  renderGrid(props: RenderGridProps): any;

  /** Toplam blogunu render et */
  renderTotals(props: RenderTotalsProps): any;

  /** Aksiyon butonlarini render et */
  renderActions(props: RenderActionsProps): any;

  /** Ekran duzenleme modal'ini render et (1C FormCustomizer) */
  renderCustomizer(props: RenderCustomizerProps): any;
}

// ============================================================
// RENDER PROPS (adapter'a gecirilen veriler)
// ============================================================

export interface RenderFormProps {
  schema: FormSchema;
  state: FormState;
  onFieldChange: (name: string, value: any) => void;
  onSave: () => void;
  onAction: (action: string) => void;
  onLookup: (entity: string, query?: string) => Promise<any[]>;
  onCustomize: () => void;
  sections: SectionSchema[];
  fields: FieldSchema[];
}

export interface RenderFieldProps {
  field: FieldSchema;
  value: any;
  onChange: (value: any) => void;
  readOnly: boolean;
  lookupData?: any[];
}

export interface RenderGridProps {
  fields: FieldSchema[];
  lines: Record<string, any>[];
  onLinesChange: (lines: Record<string, any>[]) => void;
  readOnly: boolean;
}

export interface RenderTotalsProps {
  totals: TotalSchema[];
  lines: Record<string, any>[];
}

export interface RenderActionsProps {
  actions: ActionSchema[];
  currentStatus?: string;
  onAction: (action: string) => void;
  disabled: boolean;
}

export interface RenderCustomizerProps {
  entityName: string;
  fields: FieldSchema[];
  sections: SectionSchema[];
  onSave: (customization: any) => void;
  onCancel: () => void;
}

// ============================================================
// FORM CONTROLLER CALLBACKS
// ============================================================

export interface FormCallbacks {
  onSave: (data: Record<string, any>, lines?: Record<string, any>[]) => Promise<void>;
  onAction: (action: string) => Promise<void>;
  onLookup: (entity: string, query?: string) => Promise<any[]>;
  onDelete: (id: string) => Promise<void>;
}
