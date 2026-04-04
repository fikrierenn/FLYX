/**
 * CST -> AST Dönüştürücü (Visitor)
 *
 * Bu dosya, Chevrotain parser'ının ürettiği CST'yi (Concrete Syntax Tree)
 * FSL AST'sine (Abstract Syntax Tree) dönüştürür. Visitor deseni kullanılır:
 * her parser kuralı için bir visitor metodu tanımlanır.
 *
 * CST ile AST arasındaki temel fark:
 * - CST: Token'lar ve gramer kuralları dahil her detayı içerir (parantezler, virgüller vb.)
 * - AST: Sadece anlamsal olarak önemli bilgiyi tutar (temiz, işlenmeye hazır yapı)
 *
 * _blockType ve _type gibi dahili etiketler, visitor metodları arasında
 * blok tipini aktarmak için kullanılır. Bu etiketler AST'nin dışına sızmaz.
 *
 * BaseCstVisitor, çalışma zamanında parser örneğinden dinamik olarak üretilir.
 * Bu sayede her parser kuralı için otomatik bir visitor metodu beklenir
 * ve validateVisitor() eksik metodları yakalar.
 */
import { CstNode, IToken } from 'chevrotain';
import { FSLParser } from './parser.js';
import type {
  ASTNode,
  ModuleDeclaration,
  Declaration,
  EntityDeclaration,
  FieldDeclaration,
  DataType,
  FieldConstraints,
  MethodDeclaration,
  MethodParam,
  PermissionBlock,
  TriggerBlock,
  TriggerDeclaration,
  ValidationBlock,
  ValidationRule,
  FormDeclaration,
  FormSection,
  FormAction,
  ReportDeclaration,
  ReportParameter,
  ReportColumn,
  ReportVisualization,
  WorkflowDeclaration,
  WorkflowTrigger,
  WorkflowStep,
  DecisionStep,
  ActionStep,
  Statement,
  ReturnStatement,
  VariableDeclaration,
  ExpressionStatement,
  IfStatement,
  ForStatement,
  WhileStatement,
  Expression,
  SourceLocation,
} from '../ast/nodes.js';

// Geçici parser örneği oluşturularak temel visitor sınıfı elde edilir.
// Chevrotain'de visitor sınıfı parser'a bağlıdır çünkü parser kurallarına
// göre beklenen metod imzaları belirlenir.
const parserInstance = new FSLParser();
const BaseCstVisitor = parserInstance.getBaseCstVisitorConstructor();

/**
 * Chevrotain CST'yi FSL AST'ye dönüştüren visitor sınıfı.
 * Her parser kuralı (RULE) için aynı isimde bir metod içerir.
 */
export class CSTToASTVisitor extends BaseCstVisitor {
  constructor() {
    super();
    // Tüm parser kuralları için visitor metodu tanımlandığını doğrular.
    // Eksik metod varsa geliştirme aşamasında hata fırlatır.
    this.validateVisitor();
  }

  // ============================================================
  // Yardımcı Metodlar
  // ============================================================

  /** Token'ın ham metin değerini döndürür (örn: "entity" -> "entity") */
  private extractImage(token: IToken): string {
    return token.image;
  }

  /** String literal token'ından tırnak işaretlerini kaldırır (örn: '"hello"' -> 'hello') */
  private stripQuotes(token: IToken): string {
    return token.image.slice(1, -1);
  }

  /** Token'dan kaynak kod konum bilgisi çıkarır (hata raporlama ve IDE desteği için) */
  private tokenToLocation(token: IToken): SourceLocation {
    return {
      startLine: token.startLine ?? 0,
      startColumn: token.startColumn ?? 0,
      endLine: token.endLine ?? 0,
      endColumn: token.endColumn ?? 0,
    };
  }

  // ============================================================
  // ÜST DÜZEY DÖNÜŞÜMLER
  // ============================================================

  program(ctx: any): Declaration[] {
    if (ctx.declaration) {
      return ctx.declaration.map((d: CstNode) => this.visit(d));
    }
    return [];
  }

  moduleDeclaration(ctx: any): ModuleDeclaration {
    const name = this.stripQuotes(ctx.StringLiteral[0]);
    const declarations: Declaration[] = ctx.declaration
      ? ctx.declaration.map((d: CstNode) => this.visit(d))
      : [];

    const result: ModuleDeclaration = {
      type: 'ModuleDeclaration',
      name,
      declarations,
    };

    // Extract module properties (version, dependencies)
    if (ctx.moduleProperty) {
      for (const prop of ctx.moduleProperty) {
        const { key, value } = this.visit(prop);
        if (key === 'version') result.version = value;
        if (key === 'dependencies') result.dependencies = value;
      }
    }

    return result;
  }

  moduleProperty(ctx: any): { key: string; value: any } {
    const key = this.extractImage(ctx.Identifier[0]);
    let value: any;
    if (ctx.StringLiteral) {
      value = this.stripQuotes(ctx.StringLiteral[0]);
    } else if (ctx.arrayLiteral) {
      value = this.visit(ctx.arrayLiteral[0]);
    }
    return { key, value };
  }

  declaration(ctx: any): Declaration {
    if (ctx.moduleDeclaration) return this.visit(ctx.moduleDeclaration[0]);
    if (ctx.entityDeclaration) return this.visit(ctx.entityDeclaration[0]);
    if (ctx.formDeclaration) return this.visit(ctx.formDeclaration[0]);
    if (ctx.reportDeclaration) return this.visit(ctx.reportDeclaration[0]);
    if (ctx.workflowDeclaration) return this.visit(ctx.workflowDeclaration[0]);
    throw new Error('Unknown declaration type');
  }

  // ============================================================
  // ENTITY DÖNÜŞÜMÜ
  // ============================================================

  /**
   * Entity bildirimini AST'ye dönüştürür. Her alt blok (fields, methods, vb.)
   * _blockType etiketi ile tanınır ve entity nesnesinin ilgili alanına atanır.
   */
  entityDeclaration(ctx: any): EntityDeclaration {
    const name = this.extractImage(ctx.Identifier[0]);
    const entity: EntityDeclaration = {
      type: 'EntityDeclaration',
      name,
      fields: [],
      location: this.tokenToLocation(ctx.Identifier[0]),
    };

    // Her blok ziyaret edilir ve _blockType etiketine göre entity'ye atanır
    if (ctx.entityBlock) {
      for (const block of ctx.entityBlock) {
        const result = this.visit(block);
        if (!result) continue;
        if (result._blockType === 'fields') entity.fields = result.fields;
        if (result._blockType === 'methods') entity.methods = result.methods;
        if (result._blockType === 'permissions') entity.permissions = result.permissions;
        if (result._blockType === 'triggers') entity.triggers = result.triggers;
        if (result._blockType === 'validation') entity.validation = result.validation;
      }
    }

    return entity;
  }

  entityBlock(ctx: any): any {
    if (ctx.fieldsBlock) return this.visit(ctx.fieldsBlock[0]);
    if (ctx.methodsBlock) return this.visit(ctx.methodsBlock[0]);
    if (ctx.permissionsBlock) return this.visit(ctx.permissionsBlock[0]);
    if (ctx.triggersBlock) return this.visit(ctx.triggersBlock[0]);
    if (ctx.validationBlock) return this.visit(ctx.validationBlock[0]);
    return null;
  }

  // ============================================================
  // ALAN DÖNÜŞÜMÜ
  // ============================================================

  fieldsBlock(ctx: any): { _blockType: string; fields: FieldDeclaration[] } {
    const fields = ctx.fieldDeclaration
      ? ctx.fieldDeclaration.map((f: CstNode) => this.visit(f))
      : [];
    return { _blockType: 'fields', fields };
  }

  fieldDeclaration(ctx: any): FieldDeclaration {
    const name = this.extractImage(ctx.Identifier[0]);
    const dataType: DataType = this.visit(ctx.dataType[0]);
    const field: FieldDeclaration = {
      type: 'FieldDeclaration',
      name,
      dataType,
      location: this.tokenToLocation(ctx.Identifier[0]),
    };

    if (ctx.constraintBlock) {
      field.constraints = this.visit(ctx.constraintBlock[0]);
    }

    return field;
  }

  dataType(ctx: any): DataType {
    const name: string = this.visit(ctx.dataTypeName[0]);
    const dt: DataType = { name };

    if (ctx.dataTypeParams) {
      dt.params = this.visit(ctx.dataTypeParams[0]);
    }

    return dt;
  }

  dataTypeName(ctx: any): string {
    // CST'de hangi token eşleştiyse onun metnini döndür (dinamik anahtar tarama)
    const keys = Object.keys(ctx);
    for (const key of keys) {
      if (ctx[key] && ctx[key].length > 0) {
        return this.extractImage(ctx[key][0]);
      }
    }
    return 'Unknown';
  }

  dataTypeParams(ctx: any): (string | number)[] {
    const params: (string | number)[] = [];
    if (ctx.dataTypeParam) {
      for (const p of ctx.dataTypeParam) {
        params.push(this.visit(p));
      }
    }
    return params;
  }

  dataTypeParam(ctx: any): string | number {
    if (ctx.NumberLiteral) return parseFloat(this.extractImage(ctx.NumberLiteral[0]));
    if (ctx.StringLiteral) return this.stripQuotes(ctx.StringLiteral[0]);
    if (ctx.Identifier) return this.extractImage(ctx.Identifier[0]);
    return '';
  }

  // ============================================================
  // KISITLAMA DÖNÜŞÜMÜ
  // ============================================================

  /**
   * Kısıtlama bloğunu FieldConstraints nesnesine dönüştürür.
   * Değersiz kısıtlamalar (required, unique) boolean true olarak,
   * değerli olanlar (min: 5, pattern: "...") ilgili değerleriyle atanır.
   */
  constraintBlock(ctx: any): FieldConstraints {
    const constraints: FieldConstraints = {};

    if (ctx.constraint) {
      for (const c of ctx.constraint) {
        const { name, value } = this.visit(c);
        switch (name) {
          case 'required': constraints.required = true; break;
          case 'unique': constraints.unique = true; break;
          case 'indexed': constraints.indexed = true; break;
          case 'optional': constraints.optional = true; break;
          case 'many': constraints.many = value ?? true; break;
          case 'default': constraints.default = value; break;
          case 'min': constraints.min = value; break;
          case 'max': constraints.max = value; break;
          case 'pattern': constraints.pattern = value; break;
          case 'values': constraints.values = value; break;
          case 'accept': constraints.accept = value; break;
          case 'maxSize': constraints.maxSize = value; break;
          case 'maxWidth': constraints.maxWidth = value; break;
          case 'maxHeight': constraints.maxHeight = value; break;
          case 'expression': constraints.expression = value; break;
        }
      }
    }

    return constraints;
  }

  constraint(ctx: any): { name: string; value: any } {
    const name: string = this.visit(ctx.constraintName[0]);
    let value: any = undefined;
    if (ctx.constraintValue) {
      value = this.visit(ctx.constraintValue[0]);
    }
    return { name, value };
  }

  constraintName(ctx: any): string {
    const keys = Object.keys(ctx);
    for (const key of keys) {
      if (ctx[key] && ctx[key].length > 0) {
        return this.extractImage(ctx[key][0]);
      }
    }
    return '';
  }

  constraintValue(ctx: any): any {
    if (ctx.StringLiteral) return this.stripQuotes(ctx.StringLiteral[0]);
    if (ctx.NumberLiteral) return parseFloat(this.extractImage(ctx.NumberLiteral[0]));
    if (ctx.True) return true;
    if (ctx.False) return false;
    if (ctx.arrayLiteral) return this.visit(ctx.arrayLiteral[0]);
    if (ctx.objectLiteral) return this.visit(ctx.objectLiteral[0]);
    if (ctx.Identifier) return this.extractImage(ctx.Identifier[0]);
    return undefined;
  }

  // ============================================================
  // METOD DÖNÜŞÜMÜ
  // ============================================================

  methodsBlock(ctx: any): { _blockType: string; methods: MethodDeclaration[] } {
    const methods = ctx.methodDeclaration
      ? ctx.methodDeclaration.map((m: CstNode) => this.visit(m))
      : [];
    return { _blockType: 'methods', methods };
  }

  methodDeclaration(ctx: any): MethodDeclaration {
    const name = this.extractImage(ctx.Identifier[0]);
    const method: MethodDeclaration = {
      type: 'MethodDeclaration',
      name,
      body: [],
    };

    if (ctx.paramList) {
      method.params = this.visit(ctx.paramList[0]);
    }

    if (ctx.statement) {
      method.body = ctx.statement.map((s: CstNode) => this.visit(s));
    }

    return method;
  }

  /**
   * Parametre listesini dönüştürür. Parametre-tip eşleşmesi konumsal olarak
   * yapılır: i. parametre i. veri tipine karşılık gelir.
   */
  paramList(ctx: any): MethodParam[] {
    const params: MethodParam[] = [];
    if (ctx.Identifier) {
      for (let i = 0; i < ctx.Identifier.length; i++) {
        const param: MethodParam = {
          name: this.extractImage(ctx.Identifier[i]),
        };
        // Veri tipi eşleşmesi konumsaldır: i. identifier -> i. dataType
        if (ctx.dataType && ctx.dataType[i]) {
          param.dataType = this.visit(ctx.dataType[i]);
        }
        params.push(param);
      }
    }
    return params;
  }

  // ============================================================
  // İZİN DÖNÜŞÜMÜ
  // CRUD eylem adı -> rol listesi eşlemesi yapılır.
  // ============================================================

  permissionsBlock(ctx: any): { _blockType: string; permissions: PermissionBlock } {
    const permissions: PermissionBlock = { type: 'PermissionBlock' };

    if (ctx.permissionRule) {
      for (const rule of ctx.permissionRule) {
        const { action, roles } = this.visit(rule);
        if (action === 'create') permissions.create = roles;
        if (action === 'read') permissions.read = roles;
        if (action === 'update') permissions.update = roles;
        if (action === 'delete') permissions.delete = roles;
      }
    }

    return { _blockType: 'permissions', permissions };
  }

  permissionRule(ctx: any): { action: string; roles: string[] } {
    const action = this.extractImage(ctx.Identifier[0]);
    const roles: string[] = this.visit(ctx.arrayLiteral[0]);
    return { action, roles };
  }

  // ============================================================
  // TETİKLEYİCİ DÖNÜŞÜMÜ
  // ============================================================

  triggersBlock(ctx: any): { _blockType: string; triggers: TriggerBlock } {
    const triggers: TriggerDeclaration[] = ctx.triggerDeclaration
      ? ctx.triggerDeclaration.map((t: CstNode) => this.visit(t))
      : [];
    return {
      _blockType: 'triggers',
      triggers: { type: 'TriggerBlock', triggers },
    };
  }

  triggerDeclaration(ctx: any): TriggerDeclaration {
    const event = this.visit(ctx.triggerEvent[0]);
    const body: Statement[] = ctx.statement
      ? ctx.statement.map((s: CstNode) => this.visit(s))
      : [];
    return { type: 'TriggerDeclaration', event, body };
  }

  triggerEvent(ctx: any): TriggerDeclaration['event'] {
    if (ctx.AfterCreate) return 'after_create';
    if (ctx.AfterUpdate) return 'after_update';
    if (ctx.AfterDelete) return 'after_delete';
    if (ctx.BeforeCreate) return 'before_create';
    if (ctx.BeforeUpdate) return 'before_update';
    if (ctx.BeforeDelete) return 'before_delete';
    return 'after_create';
  }

  // ============================================================
  // DOĞRULAMA DÖNÜŞÜMÜ
  // ============================================================

  validationBlock(ctx: any): { _blockType: string; validation: ValidationBlock } {
    const rules: ValidationRule[] = [];
    const validation: ValidationBlock = { type: 'ValidationBlock', rules };

    if (ctx.validationEntry) {
      for (const entry of ctx.validationEntry) {
        const result = this.visit(entry);
        if (result.isRule) {
          rules.push(result.rule);
        }
      }
    }

    return { _blockType: 'validation', validation };
  }

  validationEntry(ctx: any): any {
    const name = this.extractImage(ctx.Identifier[0]);
    const rule: ValidationRule = { type: 'ValidationRule', name };

    if (ctx.validationProperty) {
      for (const prop of ctx.validationProperty) {
        const { key, value } = this.visit(prop);
        if (key === 'field') rule.field = value;
        if (key === 'pattern') rule.pattern = value;
        if (key === 'message') rule.message = value;
      }
    }

    return { isRule: true, rule };
  }

  validationProperty(ctx: any): { key: string; value: any } {
    const key = this.extractImage(ctx.Identifier[0]);
    const value = this.visit(ctx.constraintValue[0]);
    return { key, value };
  }

  // ============================================================
  // FORM DÖNÜŞÜMÜ
  // Form blokları _type etiketi ile tanınır: 'property', 'sections', 'actions'
  // ============================================================

  formDeclaration(ctx: any): FormDeclaration {
    const name = this.extractImage(ctx.Identifier[0]);
    const form: FormDeclaration = {
      type: 'FormDeclaration',
      name,
      entity: '',
      sections: [],
    };

    if (ctx.formBlock) {
      for (const block of ctx.formBlock) {
        const result = this.visit(block);
        if (!result) continue;
        if (result._type === 'property') {
          if (result.key === 'entity') form.entity = result.value;
          if (result.key === 'layout') form.layout = result.value;
        }
        if (result._type === 'sections') form.sections = result.sections;
        if (result._type === 'actions') form.actions = result.actions;
      }
    }

    return form;
  }

  formBlock(ctx: any): any {
    if (ctx.formProperty) return this.visit(ctx.formProperty[0]);
    if (ctx.formSections) return this.visit(ctx.formSections[0]);
    if (ctx.formActions) return this.visit(ctx.formActions[0]);
    return null;
  }

  formProperty(ctx: any): any {
    const key: string = this.visit(ctx.propertyName[0]);
    let value: string;
    if (ctx.StringLiteral) {
      value = this.stripQuotes(ctx.StringLiteral[0]);
    } else {
      value = this.extractImage(ctx.Identifier[0]);
    }
    return { _type: 'property', key, value };
  }

  propertyName(ctx: any): string {
    const keys = Object.keys(ctx);
    for (const key of keys) {
      if (ctx[key] && ctx[key].length > 0) {
        return this.extractImage(ctx[key][0]);
      }
    }
    return '';
  }

  formSections(ctx: any): any {
    const sections: FormSection[] = ctx.formSection
      ? ctx.formSection.map((s: CstNode) => this.visit(s))
      : [];
    return { _type: 'sections', sections };
  }

  formSection(ctx: any): FormSection {
    const name = this.extractImage(ctx.Identifier[0]);
    const section: FormSection = {
      type: 'FormSection',
      name,
      label: '',
      fields: [],
    };

    if (ctx.formSectionProperty) {
      for (const prop of ctx.formSectionProperty) {
        const { key, value } = this.visit(prop);
        if (key === 'label') section.label = value;
        if (key === 'fields') section.fields = value;
        if (key === 'permissions') section.permissions = value;
      }
    }

    return section;
  }

  formSectionProperty(ctx: any): { key: string; value: any } {
    const key: string = this.visit(ctx.propertyName[0]);
    let value: any;
    if (ctx.StringLiteral) {
      value = this.stripQuotes(ctx.StringLiteral[0]);
    } else if (ctx.arrayLiteral) {
      value = this.visit(ctx.arrayLiteral[0]);
    }
    return { key, value };
  }

  formActions(ctx: any): any {
    const actions: FormAction[] = ctx.formAction
      ? ctx.formAction.map((a: CstNode) => this.visit(a))
      : [];
    return { _type: 'actions', actions };
  }

  formAction(ctx: any): FormAction {
    const name = this.extractImage(ctx.Identifier[0]);
    const action: FormAction = { type: 'FormAction', name, label: '' };

    if (ctx.formSectionProperty) {
      for (const prop of ctx.formSectionProperty) {
        const { key, value } = this.visit(prop);
        if (key === 'label') action.label = value;
        if (key === 'style') action.style = value;
      }
    }

    return action;
  }

  // ============================================================
  // RAPOR DÖNÜŞÜMÜ
  // ============================================================

  reportDeclaration(ctx: any): ReportDeclaration {
    const name = this.extractImage(ctx.Identifier[0]);
    const report: ReportDeclaration = {
      type: 'ReportDeclaration',
      name,
      title: '',
      dataSource: '',
      columns: [],
    };

    if (ctx.reportBlock) {
      for (const block of ctx.reportBlock) {
        const result = this.visit(block);
        if (!result) continue;
        if (result._type === 'property') {
          if (result.key === 'title') report.title = result.value;
          if (result.key === 'data_source') report.dataSource = result.value;
        }
        if (result._type === 'parameters') report.parameters = result.parameters;
        if (result._type === 'columns') report.columns = result.columns;
        if (result._type === 'visualizations') report.visualizations = result.visualizations;
      }
    }

    return report;
  }

  reportBlock(ctx: any): any {
    if (ctx.reportProperty) return this.visit(ctx.reportProperty[0]);
    if (ctx.reportParameters) return this.visit(ctx.reportParameters[0]);
    if (ctx.reportColumns) return this.visit(ctx.reportColumns[0]);
    if (ctx.reportVisualizations) return this.visit(ctx.reportVisualizations[0]);
    return null;
  }

  reportProperty(ctx: any): any {
    const key = this.extractImage(ctx.Identifier[0]);
    let value: string;
    if (ctx.StringLiteral) {
      value = this.stripQuotes(ctx.StringLiteral[0]);
    } else {
      value = this.extractImage(ctx.Identifier[1]);
    }
    return { _type: 'property', key, value };
  }

  /**
   * Rapor parametrelerini dönüştürür. Field tanımlarını yeniden kullanır
   * (fieldDeclaration visitor'ı) ve ardından ReportParameter formatına dönüştürür.
   */
  reportParameters(ctx: any): any {
    const parameters: ReportParameter[] = ctx.fieldDeclaration
      ? ctx.fieldDeclaration.map((f: CstNode) => {
          const field: FieldDeclaration = this.visit(f);
          return {
            type: 'ReportParameter',
            name: field.name,
            dataType: field.dataType,
            optional: field.constraints?.optional,
            default: field.constraints?.default as string | undefined,
          } satisfies ReportParameter;
        })
      : [];
    return { _type: 'parameters', parameters };
  }

  reportColumns(ctx: any): any {
    const columns: ReportColumn[] = ctx.reportColumn
      ? ctx.reportColumn.map((c: CstNode) => this.visit(c))
      : [];
    return { _type: 'columns', columns };
  }

  reportColumn(ctx: any): ReportColumn {
    const name = this.extractImage(ctx.Identifier[0]);
    const col: ReportColumn = { type: 'ReportColumn', name, label: '' };

    if (ctx.formSectionProperty) {
      for (const prop of ctx.formSectionProperty) {
        const { key, value } = this.visit(prop);
        if (key === 'label') col.label = value;
        if (key === 'format') col.format = value;
      }
    }

    return col;
  }

  reportVisualizations(ctx: any): any {
    const visualizations: ReportVisualization[] = ctx.reportVisualization
      ? ctx.reportVisualization.map((v: CstNode) => this.visit(v))
      : [];
    return { _type: 'visualizations', visualizations };
  }

  reportVisualization(ctx: any): ReportVisualization {
    const name = this.extractImage(ctx.Identifier[0]);
    const viz: ReportVisualization = {
      type: 'ReportVisualization',
      name,
      chartType: '',
    };

    if (ctx.formSectionProperty) {
      for (const prop of ctx.formSectionProperty) {
        const { key, value } = this.visit(prop);
        if (key === 'type') viz.chartType = value;
        if (key === 'x_axis') viz.xAxis = value;
        if (key === 'y_axis') viz.yAxis = value;
      }
    }

    return viz;
  }

  // ============================================================
  // İŞ AKIŞI DÖNÜŞÜMÜ
  // ============================================================

  workflowDeclaration(ctx: any): WorkflowDeclaration {
    const name = this.extractImage(ctx.Identifier[0]);
    const wf: WorkflowDeclaration = {
      type: 'WorkflowDeclaration',
      name,
      trigger: { type: 'WorkflowTrigger', event: '', entity: '' },
      steps: [],
    };

    if (ctx.workflowBlock) {
      for (const block of ctx.workflowBlock) {
        const result = this.visit(block);
        if (!result) continue;
        if (result._type === 'trigger') wf.trigger = result.trigger;
        if (result._type === 'steps') wf.steps = result.steps;
      }
    }

    return wf;
  }

  workflowBlock(ctx: any): any {
    if (ctx.workflowTrigger) return this.visit(ctx.workflowTrigger[0]);
    if (ctx.workflowSteps) return this.visit(ctx.workflowSteps[0]);
    return null;
  }

  workflowTrigger(ctx: any): any {
    const trigger: WorkflowTrigger = {
      type: 'WorkflowTrigger',
      event: 'on_create',
      entity: this.extractImage(ctx.Identifier[1]),
    };
    return { _type: 'trigger', trigger };
  }

  workflowSteps(ctx: any): any {
    const steps: WorkflowStep[] = ctx.workflowStep
      ? ctx.workflowStep.map((s: CstNode) => this.visit(s))
      : [];
    return { _type: 'steps', steps };
  }

  workflowStep(ctx: any): WorkflowStep {
    if (ctx.workflowDecisionStep) return this.visit(ctx.workflowDecisionStep[0]);
    if (ctx.statement) return this.visit(ctx.statement[0]);
    return { type: 'ActionStep', name: 'unknown', action: { type: 'Identifier', name: 'unknown' } };
  }

  /**
   * Karar adımını dönüştürür. workflowEntry sonuçları iki tipte olabilir:
   * - 'branch': if_true/if_false dalları (alt adımlar içerir)
   * - 'property': koşul ifadesi gibi özellikler
   */
  workflowDecisionStep(ctx: any): DecisionStep {
    const name = this.extractImage(ctx.Identifier[0]);
    const step: DecisionStep = {
      type: 'DecisionStep',
      name,
      condition: { type: 'BooleanLiteral', value: true },
      ifTrue: [],
      ifFalse: [],
    };

    if (ctx.workflowEntry) {
      for (const entry of ctx.workflowEntry) {
        const result = this.visit(entry);
        if (result._entryType === 'branch') {
          if (result.name === 'if_true') step.ifTrue = result.steps;
          else if (result.name === 'if_false') step.ifFalse = result.steps;
        } else if (result._entryType === 'property') {
          if (result.key === 'condition') step.condition = result.value;
        }
      }
    }

    return step;
  }

  workflowEntry(ctx: any): any {
    const name = this.extractImage(ctx.Identifier[0]);

    if (ctx.LCurly) {
      // Branch
      const steps: WorkflowStep[] = [];
      if (ctx.workflowDecisionStep) {
        for (const ds of ctx.workflowDecisionStep) {
          steps.push(this.visit(ds));
        }
      }
      if (ctx.statement) {
        for (const s of ctx.statement) {
          steps.push(this.visit(s));
        }
      }
      return { _entryType: 'branch', name, steps };
    }

    // Property (Identifier : expression)
    const value = this.visit(ctx.expression[0]);
    return { _entryType: 'property', key: name, value };
  }

  // ============================================================
  // İFADE DÖNÜŞÜMÜ
  // ============================================================

  statement(ctx: any): Statement {
    if (ctx.returnStatement) return this.visit(ctx.returnStatement[0]);
    if (ctx.variableDeclaration) return this.visit(ctx.variableDeclaration[0]);
    if (ctx.ifStatement) return this.visit(ctx.ifStatement[0]);
    if (ctx.forStatement) return this.visit(ctx.forStatement[0]);
    if (ctx.whileStatement) return this.visit(ctx.whileStatement[0]);
    if (ctx.expressionStatement) return this.visit(ctx.expressionStatement[0]);
    throw new Error('Unknown statement type');
  }

  returnStatement(ctx: any): ReturnStatement {
    return {
      type: 'ReturnStatement',
      value: this.visit(ctx.expression[0]),
    };
  }

  variableDeclaration(ctx: any): VariableDeclaration {
    const kind = ctx.Let ? 'let' : 'const';
    const name = this.extractImage(ctx.Identifier[0]);
    const decl: VariableDeclaration = { type: 'VariableDeclaration', kind, name };

    if (ctx.expression) {
      decl.value = this.visit(ctx.expression[0]);
    }

    return decl;
  }

  /**
   * If ifadesini dönüştürür.
   * NOT: Chevrotain'de MANY ve MANY2 ile ayrılan if/else gövdeleri CST'de
   * aynı statement dizisinde yer alabilir. Else bloğunun varlığı Else token'ı
   * kontrol edilerek belirlenir. Bu basitleştirme nedeniyle else gövdesi
   * şimdilik boş dizi olarak işaretlenir.
   */
  ifStatement(ctx: any): IfStatement {
    const condition = this.visit(ctx.expression[0]);
    const consequent: Statement[] = ctx.statement
      ? ctx.statement.map((s: CstNode) => this.visit(s))
      : [];

    const ifStmt: IfStatement = { type: 'IfStatement', condition, consequent };
    if (ctx.Else) {
      // Statements in MANY2 will be in statement array after consequent ones
      // This is a simplification - in practice the CST separates them
      ifStmt.alternate = [];
    }

    return ifStmt;
  }

  forStatement(ctx: any): ForStatement {
    const variable = this.extractImage(ctx.Identifier[0]);
    const iterable = this.visit(ctx.expression[0]);
    const body: Statement[] = ctx.statement
      ? ctx.statement.map((s: CstNode) => this.visit(s))
      : [];

    return { type: 'ForStatement', variable, iterable, body };
  }

  whileStatement(ctx: any): WhileStatement {
    const condition = this.visit(ctx.expression[0]);
    const body: Statement[] = ctx.statement
      ? ctx.statement.map((s: CstNode) => this.visit(s))
      : [];

    return { type: 'WhileStatement', condition, body };
  }

  expressionStatement(ctx: any): ExpressionStatement {
    return {
      type: 'ExpressionStatement',
      expression: this.visit(ctx.expression[0]),
    };
  }

  // ============================================================
  // İFADE DEĞERİ (Expression) DÖNÜŞÜMÜ
  //
  // Precedence climbing yaklaşımı: her seviye soldan sağa birleştirilir.
  // İlk operand ziyaret edilir, ardından kalan operandlar döngüyle
  // BinaryExpression düğümlerine sarılır (sol-ilişkili ağaç yapısı).
  // ============================================================

  expression(ctx: any): Expression {
    return this.visit(ctx.logicalOrExpression[0]);
  }

  logicalOrExpression(ctx: any): Expression {
    let left: Expression = this.visit(ctx.logicalAndExpression[0]);

    if (ctx.logicalAndExpression.length > 1) {
      for (let i = 1; i < ctx.logicalAndExpression.length; i++) {
        const right = this.visit(ctx.logicalAndExpression[i]);
        left = { type: 'BinaryExpression', operator: 'or', left, right };
      }
    }

    return left;
  }

  logicalAndExpression(ctx: any): Expression {
    let left: Expression = this.visit(ctx.comparisonExpression[0]);

    if (ctx.comparisonExpression.length > 1) {
      for (let i = 1; i < ctx.comparisonExpression.length; i++) {
        const right = this.visit(ctx.comparisonExpression[i]);
        left = { type: 'BinaryExpression', operator: 'and', left, right };
      }
    }

    return left;
  }

  comparisonExpression(ctx: any): Expression {
    let left: Expression = this.visit(ctx.additiveExpression[0]);

    if (ctx.comparisonOperator) {
      const operator: string = this.visit(ctx.comparisonOperator[0]);
      const right = this.visit(ctx.additiveExpression[1]);
      left = { type: 'BinaryExpression', operator, left, right };
    }

    return left;
  }

  comparisonOperator(ctx: any): string {
    if (ctx.Equal) return '==';
    if (ctx.NotEqual) return '!=';
    if (ctx.LessThan) return '<';
    if (ctx.GreaterThan) return '>';
    if (ctx.LessEqual) return '<=';
    if (ctx.GreaterEqual) return '>=';
    return '==';
  }

  additiveExpression(ctx: any): Expression {
    let left: Expression = this.visit(ctx.multiplicativeExpression[0]);

    if (ctx.multiplicativeExpression.length > 1) {
      for (let i = 1; i < ctx.multiplicativeExpression.length; i++) {
        const operator = ctx.Plus && ctx.Plus[i - 1] ? '+' : '-';
        const right = this.visit(ctx.multiplicativeExpression[i]);
        left = { type: 'BinaryExpression', operator, left, right };
      }
    }

    return left;
  }

  multiplicativeExpression(ctx: any): Expression {
    let left: Expression = this.visit(ctx.unaryExpression[0]);

    if (ctx.unaryExpression.length > 1) {
      for (let i = 1; i < ctx.unaryExpression.length; i++) {
        let operator = '*';
        if (ctx.Slash && ctx.Slash[i - 1]) operator = '/';
        if (ctx.Percent && ctx.Percent[i - 1]) operator = '%';
        const right = this.visit(ctx.unaryExpression[i]);
        left = { type: 'BinaryExpression', operator, left, right };
      }
    }

    return left;
  }

  unaryExpression(ctx: any): Expression {
    if (ctx.Not || ctx.Exclamation || ctx.Minus) {
      let operator = '!';
      if (ctx.Not) operator = 'not';
      if (ctx.Minus) operator = '-';
      const operand = this.visit(ctx.unaryExpression[0]);
      return { type: 'UnaryExpression', operator, operand };
    }

    return this.visit(ctx.postfixExpression[0]);
  }

  /**
   * Postfix ifadelerini (üye erişimi ve fonksiyon çağrısı) dönüştürür.
   * Zincir yapısını destekler: this.items.filter() gibi.
   */
  postfixExpression(ctx: any): Expression {
    let expr: Expression = this.visit(ctx.primaryExpression[0]);

    // Nokta (.) ile üye erişimi zincirleri
    if (ctx.Dot) {
      // Process dots
      for (let i = 0; i < ctx.Dot.length; i++) {
        const prop = this.extractImage(ctx.Identifier[i]);
        expr = { type: 'MemberExpression', object: expr, property: prop };
      }
    }

    // Fonksiyon çağrısı: argümanlı veya argümansız
    if (ctx.argumentList) {
      for (const args of ctx.argumentList) {
        const argValues: Expression[] = this.visit(args);
        expr = { type: 'CallExpression', callee: expr, arguments: argValues };
      }
    } else if (ctx.LParen) {
      // Argümansız fonksiyon çağrısı: foo()
      expr = { type: 'CallExpression', callee: expr, arguments: [] };
    }

    return expr;
  }

  argumentList(ctx: any): Expression[] {
    if (ctx.argument) {
      return ctx.argument.map((a: CstNode) => this.visit(a));
    }
    return [];
  }

  argument(ctx: any): Expression {
    return this.visit(ctx.expression[0]);
  }

  primaryExpression(ctx: any): Expression {
    if (ctx.StringLiteral) {
      return { type: 'StringLiteral', value: this.stripQuotes(ctx.StringLiteral[0]) };
    }
    if (ctx.NumberLiteral) {
      return { type: 'NumberLiteral', value: parseFloat(this.extractImage(ctx.NumberLiteral[0])) };
    }
    if (ctx.True) {
      return { type: 'BooleanLiteral', value: true };
    }
    if (ctx.False) {
      return { type: 'BooleanLiteral', value: false };
    }
    if (ctx.This) {
      return { type: 'Identifier', name: 'this' };
    }
    if (ctx.Identifier) {
      return { type: 'Identifier', name: this.extractImage(ctx.Identifier[0]) };
    }
    if (ctx.expression) {
      return this.visit(ctx.expression[0]);
    }
    if (ctx.arrayLiteral) {
      return this.visit(ctx.arrayLiteral[0]);
    }
    if (ctx.objectLiteral) {
      return this.visit(ctx.objectLiteral[0]);
    }

    return { type: 'Identifier', name: 'undefined' };
  }

  // ============================================================
  // LİTERAL DÖNÜŞÜMÜ
  // ============================================================

  /**
   * Dizi literalini dönüştürür. Basit değerler (string, number, boolean)
   * AST düğümünden çıkarılarak düz JavaScript değerlerine indirgenir.
   * Bu, kısıtlama değerleri gibi yerlerde kullanımı kolaylaştırır.
   */
  arrayLiteral(ctx: any): any[] {
    if (ctx.expression) {
      return ctx.expression.map((e: CstNode) => {
        const val = this.visit(e);
        // Basit literal'leri düz değerlere indir (AST sarmalayıcısını kaldır)
        if (val && val.type === 'StringLiteral') return val.value;
        if (val && val.type === 'NumberLiteral') return val.value;
        if (val && val.type === 'BooleanLiteral') return val.value;
        return val;
      });
    }
    return [];
  }

  objectLiteral(ctx: any): any {
    const properties: { key: string; value: any }[] = [];

    if (ctx.objectProperty) {
      for (const prop of ctx.objectProperty) {
        properties.push(this.visit(prop));
      }
    }

    return { type: 'ObjectExpression', properties };
  }

  objectProperty(ctx: any): { key: string; value: Expression } {
    let key: string;
    if (ctx.Identifier) {
      key = this.extractImage(ctx.Identifier[0]);
    } else {
      key = this.stripQuotes(ctx.StringLiteral[0]);
    }
    const value = this.visit(ctx.expression[0]);
    return { key, value };
  }
}
