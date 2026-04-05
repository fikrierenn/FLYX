/**
 * FSL AST (Soyut Sözdizim Ağacı) Node Tanımları
 *
 * Bu dosya, FSL kaynak kodunun derlenmesi sonucunda üretilen AST'nin tüm
 * node tiplerini tanımlar. AST, kaynak kodun yapısal temsilini sunar ve
 * kod üretimi, analiz veya doğrulama gibi işlemler için kullanılır.
 *
 * Hiyerarşi:
 *   ModuleDeclaration (kök)
 *   └── Declaration (entity, form, report, workflow, dashboard)
 *       ├── EntityDeclaration -> fields, methods, permissions, triggers, validation
 *       ├── FormDeclaration -> sections, actions
 *       ├── ReportDeclaration -> parameters, columns, visualizations
 *       ├── WorkflowDeclaration -> trigger, steps
 *       └── DashboardDeclaration -> widgets
 */

// ============================================================
// Temel Tipler
// ============================================================

/** Kaynak koddaki konum bilgisi - hata raporlama ve IDE entegrasyonu için */
export interface SourceLocation {
  startLine: number;
  startColumn: number;
  endLine: number;
  endColumn: number;
}

/** Tüm AST node'larının temel arayüzü. Her node bir tip ve opsiyonel konum bilgisi taşır. */
export interface ASTNode {
  type: string;
  location?: SourceLocation;
}

// ============================================================
// Modül
// FSL'de en üst düzey kapsayıcı. Bir modül birden fazla bildirim içerebilir
// ve versiyon/bağımlılık bilgisi taşıyabilir.
// ============================================================

export interface ModuleDeclaration extends ASTNode {
  type: 'ModuleDeclaration';
  name: string;
  version?: string;
  dependencies?: string[];
  declarations: Declaration[];
}

/** FSL'in desteklediği tüm üst düzey bildirim tipleri */
export type Declaration =
  | EntityDeclaration
  | FormDeclaration
  | ReportDeclaration
  | WorkflowDeclaration
  | DashboardDeclaration;

// ============================================================
// Entity (Varlık)
// Veritabanı tablosuna karşılık gelen temel veri modeli.
// Alanlar, metodlar, izinler, tetikleyiciler ve doğrulama kuralları içerir.
// ============================================================

export interface EntityDeclaration extends ASTNode {
  type: 'EntityDeclaration';
  name: string;
  fields: FieldDeclaration[];
  methods?: MethodDeclaration[];
  permissions?: PermissionBlock;
  triggers?: TriggerBlock;
  validation?: ValidationBlock;
}

// ============================================================
// Alan (Field)
// Entity alanlarını tanımlar. Her alan bir isim, veri tipi ve
// opsiyonel kısıtlamalar (required, unique, min/max vb.) içerir.
// ============================================================

export interface FieldDeclaration extends ASTNode {
  type: 'FieldDeclaration';
  name: string;
  dataType: DataType;
  constraints?: FieldConstraints;
}

/** Veri tipi: isim ve opsiyonel parametreler. Örn: String(255), Decimal(10,2) */
export interface DataType {
  name: string;
  params?: (string | number)[];
}

/** Alan kısıtlamaları - veritabanı seviyesi ve uygulama seviyesi doğrulama kuralları */
export interface FieldConstraints {
  required?: boolean;
  unique?: boolean;
  indexed?: boolean;
  default?: string | number | boolean | Record<string, unknown>;
  min?: number;
  max?: number;
  pattern?: string;
  optional?: boolean;
  many?: boolean;
  values?: string[];
  accept?: string[];
  maxSize?: string;
  maxWidth?: number;
  maxHeight?: number;
  expression?: string;
}

// ============================================================
// Metod
// Entity'ye ait iş mantığı fonksiyonları. Parametreli veya parametresiz
// olabilir ve bir dizi ifade (statement) içerir.
// ============================================================

export interface MethodDeclaration extends ASTNode {
  type: 'MethodDeclaration';
  name: string;
  params?: MethodParam[];
  body: Statement[];
}

export interface MethodParam {
  name: string;
  dataType?: DataType;
}

// ============================================================
// İfadeler (Statements) ve İfade Değerleri (Expressions)
//
// Statement: Yan etkisi olan yapılar (atama, döngü, koşul, dönüş vb.)
// Expression: Bir değer üreten yapılar (aritmetik, karşılaştırma, fonksiyon çağrısı vb.)
//
// Bu ayrım, FSL'in metod gövdelerinde ve trigger'larda kullanılan
// mini programlama dilinin temelini oluşturur.
// ============================================================

export type Statement =
  | ReturnStatement
  | VariableDeclaration
  | ExpressionStatement
  | IfStatement
  | ForStatement
  | WhileStatement;

export interface ReturnStatement extends ASTNode {
  type: 'ReturnStatement';
  value: Expression;
}

export interface VariableDeclaration extends ASTNode {
  type: 'VariableDeclaration';
  kind: 'let' | 'const';
  name: string;
  value?: Expression;
}

export interface ExpressionStatement extends ASTNode {
  type: 'ExpressionStatement';
  expression: Expression;
}

export interface IfStatement extends ASTNode {
  type: 'IfStatement';
  condition: Expression;
  consequent: Statement[];
  alternate?: Statement[];
}

export interface ForStatement extends ASTNode {
  type: 'ForStatement';
  variable: string;
  iterable: Expression;
  body: Statement[];
}

export interface WhileStatement extends ASTNode {
  type: 'WhileStatement';
  condition: Expression;
  body: Statement[];
}

/**
 * İfade değeri (Expression) birleşim tipi.
 * Öncelik sıralaması parser tarafından yönetilir (bkz. parser.ts'deki
 * precedence climbing yaklaşımı). AST'de bu öncelik ağaç yapısına yansır.
 */
export type Expression =
  | StringLiteralExpr
  | NumberLiteralExpr
  | BooleanLiteralExpr
  | IdentifierExpr
  | MemberExpr
  | CallExpr
  | BinaryExpr
  | UnaryExpr
  | ArrayExpr
  | ObjectExpr;

export interface StringLiteralExpr extends ASTNode {
  type: 'StringLiteral';
  value: string;
}

export interface NumberLiteralExpr extends ASTNode {
  type: 'NumberLiteral';
  value: number;
}

export interface BooleanLiteralExpr extends ASTNode {
  type: 'BooleanLiteral';
  value: boolean;
}

export interface IdentifierExpr extends ASTNode {
  type: 'Identifier';
  name: string;
}

export interface MemberExpr extends ASTNode {
  type: 'MemberExpression';
  object: Expression;
  property: string;
}

export interface CallExpr extends ASTNode {
  type: 'CallExpression';
  callee: Expression;
  arguments: Expression[];
}

export interface BinaryExpr extends ASTNode {
  type: 'BinaryExpression';
  operator: string;
  left: Expression;
  right: Expression;
}

export interface UnaryExpr extends ASTNode {
  type: 'UnaryExpression';
  operator: string;
  operand: Expression;
}

export interface ArrayExpr extends ASTNode {
  type: 'ArrayExpression';
  elements: Expression[];
}

export interface ObjectExpr extends ASTNode {
  type: 'ObjectExpression';
  properties: { key: string; value: Expression }[];
}

// ============================================================
// İzinler (Permissions)
// CRUD operasyonlarına rol bazlı erişim kontrolü sağlar.
// Her operasyon için izin verilen rollerin listesi tutulur.
// ============================================================

export interface PermissionBlock extends ASTNode {
  type: 'PermissionBlock';
  create?: string[];
  read?: string[];
  update?: string[];
  delete?: string[];
}

// ============================================================
// Tetikleyiciler (Triggers)
// Entity yaşam döngüsü olaylarına bağlı otomatik çalışan kod blokları.
// before_* : İşlem öncesi (doğrulama, engelleme)
// after_*  : İşlem sonrası (loglama, bildirim, zincirleme işlemler)
// ============================================================

export interface TriggerBlock extends ASTNode {
  type: 'TriggerBlock';
  triggers: TriggerDeclaration[];
}

export interface TriggerDeclaration extends ASTNode {
  type: 'TriggerDeclaration';
  event: 'after_create' | 'after_update' | 'after_delete' | 'before_create' | 'before_update' | 'before_delete';
  body: Statement[];
}

// ============================================================
// Doğrulama (Validation)
// Alan bazlı doğrulama kuralları. Regex desenleri ve özel hata mesajları
// ile veri bütünlüğünü sağlar.
// ============================================================

export interface ValidationBlock extends ASTNode {
  type: 'ValidationBlock';
  rules: ValidationRule[];
  onCreate?: Statement[];
  onUpdate?: Statement[];
}

export interface ValidationRule extends ASTNode {
  type: 'ValidationRule';
  name: string;
  field?: string;
  pattern?: string;
  message?: string;
}

// ============================================================
// Form
// Kullanıcı arayüzü form tanımı. Bir entity'ye bağlıdır ve
// bölümler (sections) ile kullanıcının göreceği alanları, aksiyonlar
// (actions) ile form butonlarını tanımlar.
// ============================================================

export interface FormDeclaration extends ASTNode {
  type: 'FormDeclaration';
  name: string;
  entity: string;
  layout?: string;
  sections: FormSection[];
  actions?: FormAction[];
  conditionalDisplay?: ConditionalDisplayRule[];
}

export interface ConditionalDisplayRule extends ASTNode {
  type: 'ConditionalDisplayRule';
  name: string;
  condition: string;
  targets: string[];
  action?: 'show' | 'hide' | 'disable';
}

export interface FormSection extends ASTNode {
  type: 'FormSection';
  name: string;
  label: string;
  fields: string[];
  permissions?: string[];
}

export interface FormAction extends ASTNode {
  type: 'FormAction';
  name: string;
  label: string;
  style?: string;
}

// ============================================================
// Rapor
// Veri raporlama tanımı. Bir veri kaynağından (entity) sütunlar çeker,
// parametreler ile filtreleme sağlar ve görselleştirme (grafik) tanımları içerir.
// ============================================================

export interface ReportDeclaration extends ASTNode {
  type: 'ReportDeclaration';
  name: string;
  title: string;
  parameters?: ReportParameter[];
  dataSource: string;
  columns: ReportColumn[];
  visualizations?: ReportVisualization[];
}

export interface ReportParameter extends ASTNode {
  type: 'ReportParameter';
  name: string;
  dataType: DataType;
  optional?: boolean;
  default?: string;
}

export interface ReportColumn extends ASTNode {
  type: 'ReportColumn';
  name: string;
  label: string;
  format?: string;
}

export interface ReportVisualization extends ASTNode {
  type: 'ReportVisualization';
  name: string;
  chartType: string;
  xAxis?: string;
  yAxis?: string;
}

// ============================================================
// İş Akışı (Workflow)
// Olay tabanlı iş süreçleri tanımı. Bir tetikleyici ile başlar ve
// karar adımları (decision), onay adımları (approval) ve aksiyon adımları
// (action) içerebilir. Karmaşık iş mantığını deklaratif olarak ifade eder.
// ============================================================

export interface WorkflowDeclaration extends ASTNode {
  type: 'WorkflowDeclaration';
  name: string;
  trigger: WorkflowTrigger;
  steps: WorkflowStep[];
}

export interface WorkflowTrigger extends ASTNode {
  type: 'WorkflowTrigger';
  event: string;
  entity: string;
}

export type WorkflowStep = DecisionStep | ApprovalStep | ActionStep;

export interface DecisionStep extends ASTNode {
  type: 'DecisionStep';
  name: string;
  condition: Expression;
  ifTrue: WorkflowStep[];
  ifFalse: WorkflowStep[];
}

export interface ApprovalStep extends ASTNode {
  type: 'ApprovalStep';
  name: string;
  assignee: string;
  timeout?: string;
}

export interface ActionStep extends ASTNode {
  type: 'ActionStep';
  name: string;
  action: Expression;
}

// ============================================================
// Gösterge Paneli (Dashboard) - şimdilik temel yapı
// Widget tabanlı veri görselleştirme paneli tanımı.
// ============================================================

export interface DashboardDeclaration extends ASTNode {
  type: 'DashboardDeclaration';
  name: string;
  title: string;
  widgets: DashboardWidget[];
}

export interface DashboardWidget extends ASTNode {
  type: 'DashboardWidget';
  name: string;
  widgetType: string;
  dataSource?: string;
}
