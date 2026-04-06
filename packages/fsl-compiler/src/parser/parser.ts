/**
 * FSL Parser (Sözdizimsel Çözümleyici)
 *
 * Bu dosya, token dizisini CST'ye (Concrete Syntax Tree - Somut Sözdizim Ağacı)
 * dönüştüren parser'ı içerir. Chevrotain'in CstParser sınıfından türer.
 *
 * Gramer yapısı yukarıdan aşağıya (top-down) tanımlanmıştır:
 *   program -> declaration* -> entityDeclaration | formDeclaration | ...
 *
 * İfade (expression) ayrıştırması için "precedence climbing" tekniği kullanılır:
 *   expression -> logicalOr -> logicalAnd -> comparison -> additive -> multiplicative -> unary -> postfix -> primary
 *
 * Her seviye bir öncekini sararak operatör önceliğini doğru şekilde uygular.
 *
 * recoveryEnabled: true olduğu için parser, hata durumunda kurtarma yaparak
 * birden fazla hatayı tek seferde raporlayabilir.
 */
import { CstParser } from 'chevrotain';
import {
  allTokens,
  // Keywords - Declaration
  Module, Entity, Form, Report, Workflow, Dashboard,
  // Keywords - Blocks
  Fields, Methods, Permissions, Validation, Triggers,
  Sections, Actions, Parameters, Columns, Visualizations, Steps,
  // Keywords - Control Flow
  If, Else, For, While, Return, Let, Const,
  // Keywords - Logical
  And, Or, Not,
  // Keywords - Triggers
  AfterCreate, AfterUpdate, AfterDelete,
  BeforeCreate, BeforeUpdate, BeforeDelete, OnCreate, OnUpdate, OnDelete,
  // Data Types
  StringType, NumberType, DecimalType, BooleanType,
  DateType, DateTimeType, EmailType, PhoneType, URLType,
  TextType, JSONType, EnumType, RelationType, FileType,
  ImageType, ArrayType, MoneyType, ComputedType, LookupType, DateRangeType,
  // Constraints
  Required, Unique, Indexed, Default, Min, Max, Pattern, Optional, Many,
  // Built-in
  True, False, This,
  // Symbols
  LCurly, RCurly, LParen, RParen, LBracket, RBracket,
  Colon, Comma, Dot, Semicolon,
  // Operators
  NotEqual, LessEqual, GreaterEqual, Equal, Assign,
  Plus, Minus, Star, Slash, Percent,
  LessThan, GreaterThan, Exclamation, Ampersand, Pipe,
  // Literals
  StringLiteral, NumberLiteral,
  // Identifier
  Identifier,
} from '../lexer/tokens.js';

export class FSLParser extends CstParser {
  constructor() {
    super(allTokens, {
      // recoveryEnabled: Sözdizimi hatası olduğunda parser durmaz, kurtarma yaparak
      // devam eder. Bu sayede tek seferde birden fazla hata raporlanabilir.
      recoveryEnabled: true,
      // maxLookahead: Parser'ın karar vermek için öne bakacağı maksimum token sayısı.
      // 3 seviye çoğu FSL gramer kuralı için yeterlidir.
      maxLookahead: 3,
    });
    // Chevrotain'in gramer kurallarını analiz edip optimizasyon yapmasını sağlar.
    // Constructor'ın sonunda çağrılmalıdır.
    this.performSelfAnalysis();
  }

  // ============================================================
  // ÜST DÜZEY KURALLAR
  // Gramer ağacının kökünü oluşturan kurallar.
  // ============================================================

  /** Giriş noktası: bir veya daha fazla bildirim (declaration) */
  public program = this.RULE('program', () => {
    this.MANY(() => {
      this.SUBRULE(this.declaration);
    });
  });

  /** Modül bildirimi: module "İsim" { bildirimler* } */
  public moduleDeclaration = this.RULE('moduleDeclaration', () => {
    this.CONSUME(Module);
    this.CONSUME(StringLiteral);
    this.CONSUME(LCurly);
    this.MANY(() => {
      this.OR([
        { ALT: () => this.SUBRULE(this.moduleProperty) },
        { ALT: () => this.SUBRULE(this.declaration) },
      ]);
    });
    this.CONSUME(RCurly);
  });

  /** Modül özellikleri: version: "1.0.0" veya dependencies: ["..."] */
  private moduleProperty = this.RULE('moduleProperty', () => {
    this.CONSUME(Identifier);
    this.CONSUME(Colon);
    this.OR([
      { ALT: () => this.CONSUME(StringLiteral) },
      { ALT: () => this.SUBRULE(this.arrayLiteral) },
    ]);
  });

  /** Üst düzey bildirim - desteklenen tüm yapı tiplerinden birini ayrıştırır */
  public declaration = this.RULE('declaration', () => {
    this.OR([
      { ALT: () => this.SUBRULE(this.moduleDeclaration) },
      { ALT: () => this.SUBRULE(this.entityDeclaration) },
      { ALT: () => this.SUBRULE(this.formDeclaration) },
      { ALT: () => this.SUBRULE(this.reportDeclaration) },
      { ALT: () => this.SUBRULE(this.workflowDeclaration) },
      { ALT: () => this.SUBRULE(this.dashboardDeclaration) },
    ]);
  });

  // ============================================================
  // ENTITY (Varlık) KURALLARI
  // entity İsim { fields { ... } methods { ... } permissions { ... } ... }
  // ============================================================

  public entityDeclaration = this.RULE('entityDeclaration', () => {
    this.CONSUME(Entity);
    this.CONSUME(Identifier);
    this.CONSUME(LCurly);
    this.MANY(() => {
      this.SUBRULE(this.entityBlock);
    });
    this.CONSUME(RCurly);
  });

  private entityBlock = this.RULE('entityBlock', () => {
    this.OR([
      { ALT: () => this.SUBRULE(this.fieldsBlock) },
      { ALT: () => this.SUBRULE(this.methodsBlock) },
      { ALT: () => this.SUBRULE(this.permissionsBlock) },
      { ALT: () => this.SUBRULE(this.triggersBlock) },
      { ALT: () => this.SUBRULE(this.validationBlock) },
    ]);
  });

  // ============================================================
  // ALAN (Field) KURALLARI
  // Alan tanımı: isim: VeriTipi { kısıtlamalar }
  // ============================================================

  private fieldsBlock = this.RULE('fieldsBlock', () => {
    this.CONSUME(Fields);
    this.CONSUME(LCurly);
    this.MANY(() => {
      this.SUBRULE(this.fieldDeclaration);
    });
    this.CONSUME(RCurly);
  });

  public fieldDeclaration = this.RULE('fieldDeclaration', () => {
    this.CONSUME(Identifier);
    this.CONSUME(Colon);
    this.SUBRULE(this.dataType);
    this.OPTION(() => {
      this.SUBRULE(this.constraintBlock);
    });
  });

  public dataType = this.RULE('dataType', () => {
    this.SUBRULE(this.dataTypeName);
    this.OPTION(() => {
      this.CONSUME(LParen);
      this.SUBRULE(this.dataTypeParams);
      this.CONSUME(RParen);
    });
  });

  private dataTypeName = this.RULE('dataTypeName', () => {
    this.OR([
      { ALT: () => this.CONSUME(StringType) },
      { ALT: () => this.CONSUME(NumberType) },
      { ALT: () => this.CONSUME(DecimalType) },
      { ALT: () => this.CONSUME(BooleanType) },
      { ALT: () => this.CONSUME(DateTimeType) },
      { ALT: () => this.CONSUME(DateRangeType) },
      { ALT: () => this.CONSUME(DateType) },
      { ALT: () => this.CONSUME(EmailType) },
      { ALT: () => this.CONSUME(PhoneType) },
      { ALT: () => this.CONSUME(URLType) },
      { ALT: () => this.CONSUME(TextType) },
      { ALT: () => this.CONSUME(JSONType) },
      { ALT: () => this.CONSUME(EnumType) },
      { ALT: () => this.CONSUME(RelationType) },
      { ALT: () => this.CONSUME(FileType) },
      { ALT: () => this.CONSUME(ImageType) },
      { ALT: () => this.CONSUME(ArrayType) },
      { ALT: () => this.CONSUME(MoneyType) },
      { ALT: () => this.CONSUME(ComputedType) },
      { ALT: () => this.CONSUME(LookupType) },
      { ALT: () => this.CONSUME(Identifier) },
    ]);
  });

  private dataTypeParams = this.RULE('dataTypeParams', () => {
    this.SUBRULE(this.dataTypeParam);
    this.MANY(() => {
      this.CONSUME(Comma);
      this.SUBRULE2(this.dataTypeParam);
    });
  });

  private dataTypeParam = this.RULE('dataTypeParam', () => {
    this.OR([
      { ALT: () => this.CONSUME(NumberLiteral) },
      { ALT: () => this.CONSUME(StringLiteral) },
      { ALT: () => this.CONSUME(Identifier) },
    ]);
  });

  // ============================================================
  // KISITLAMA (Constraint) KURALLARI
  // Süslü parantez içinde virgülle ayrılmış kısıtlamalar: { required, max: 100 }
  // MANY_SEP kullanılır çünkü kısıtlamalar virgülle ayrılır.
  // ============================================================

  public constraintBlock = this.RULE('constraintBlock', () => {
    this.CONSUME(LCurly);
    this.MANY_SEP({
      SEP: Comma,
      DEF: () => {
        this.SUBRULE(this.constraint);
      },
    });
    this.CONSUME(RCurly);
  });

  private constraint = this.RULE('constraint', () => {
    this.SUBRULE(this.constraintName);
    this.OPTION(() => {
      this.CONSUME(Colon);
      this.SUBRULE(this.constraintValue);
    });
  });

  private constraintName = this.RULE('constraintName', () => {
    this.OR([
      { ALT: () => this.CONSUME(Required) },
      { ALT: () => this.CONSUME(Unique) },
      { ALT: () => this.CONSUME(Indexed) },
      { ALT: () => this.CONSUME(Default) },
      { ALT: () => this.CONSUME(Min) },
      { ALT: () => this.CONSUME(Max) },
      { ALT: () => this.CONSUME(Pattern) },
      { ALT: () => this.CONSUME(Optional) },
      { ALT: () => this.CONSUME(Many) },
      { ALT: () => this.CONSUME(Identifier) },
    ]);
  });

  private constraintValue = this.RULE('constraintValue', () => {
    this.OR([
      { ALT: () => this.CONSUME(StringLiteral) },
      { ALT: () => this.CONSUME(NumberLiteral) },
      { ALT: () => this.CONSUME(True) },
      { ALT: () => this.CONSUME(False) },
      { ALT: () => this.SUBRULE(this.arrayLiteral) },
      { ALT: () => this.SUBRULE(this.objectLiteral) },
      { ALT: () => this.CONSUME(Identifier) },
    ]);
  });

  // ============================================================
  // METOD KURALLARI
  // Metod tanımı: isim(parametre: Tip, ...) { ifadeler }
  // ============================================================

  private methodsBlock = this.RULE('methodsBlock', () => {
    this.CONSUME(Methods);
    this.CONSUME(LCurly);
    this.MANY(() => {
      this.SUBRULE(this.methodDeclaration);
    });
    this.CONSUME(RCurly);
  });

  private methodDeclaration = this.RULE('methodDeclaration', () => {
    this.CONSUME(Identifier);
    this.CONSUME(LParen);
    this.OPTION(() => {
      this.SUBRULE(this.paramList);
    });
    this.CONSUME(RParen);
    this.CONSUME(LCurly);
    this.MANY(() => {
      this.SUBRULE(this.statement);
    });
    this.CONSUME(RCurly);
  });

  private paramList = this.RULE('paramList', () => {
    this.CONSUME(Identifier);
    this.OPTION(() => {
      this.CONSUME(Colon);
      this.SUBRULE(this.dataType);
    });
    this.MANY(() => {
      this.CONSUME(Comma);
      this.CONSUME2(Identifier);
      this.OPTION2(() => {
        this.CONSUME2(Colon);
        this.SUBRULE2(this.dataType);
      });
    });
  });

  // ============================================================
  // İZİN KURALLARI
  // permissions { create: ["admin"], read: ["admin", "user"] }
  // ============================================================

  private permissionsBlock = this.RULE('permissionsBlock', () => {
    this.CONSUME(Permissions);
    this.CONSUME(LCurly);
    this.MANY(() => {
      this.SUBRULE(this.permissionRule);
    });
    this.CONSUME(RCurly);
  });

  private permissionRule = this.RULE('permissionRule', () => {
    this.CONSUME(Identifier);
    this.CONSUME(Colon);
    this.SUBRULE(this.arrayLiteral);
  });

  // ============================================================
  // TETİKLEYİCİ KURALLARI
  // triggers { after_create { ... } before_update { ... } }
  // ============================================================

  private triggersBlock = this.RULE('triggersBlock', () => {
    this.CONSUME(Triggers);
    this.CONSUME(LCurly);
    this.MANY(() => {
      this.SUBRULE(this.triggerDeclaration);
    });
    this.CONSUME(RCurly);
  });

  private triggerDeclaration = this.RULE('triggerDeclaration', () => {
    this.SUBRULE(this.triggerEvent);
    this.CONSUME(LCurly);
    this.MANY(() => {
      this.SUBRULE(this.statement);
    });
    this.CONSUME(RCurly);
  });

  private triggerEvent = this.RULE('triggerEvent', () => {
    this.OR([
      { ALT: () => this.CONSUME(AfterCreate) },
      { ALT: () => this.CONSUME(AfterUpdate) },
      { ALT: () => this.CONSUME(AfterDelete) },
      { ALT: () => this.CONSUME(BeforeCreate) },
      { ALT: () => this.CONSUME(BeforeUpdate) },
      { ALT: () => this.CONSUME(BeforeDelete) },
    ]);
  });

  // ============================================================
  // DOĞRULAMA KURALLARI
  // validation { email_format { field: "email", pattern: "...", message: "..." } }
  // ============================================================

  private validationBlock = this.RULE('validationBlock', () => {
    this.CONSUME(Validation);
    this.CONSUME(LCurly);
    this.MANY(() => {
      this.SUBRULE(this.validationEntry);
    });
    this.CONSUME(RCurly);
  });

  private validationEntry = this.RULE('validationEntry', () => {
    this.CONSUME(Identifier);
    this.CONSUME(LCurly);
    this.MANY(() => {
      this.OR([
        { ALT: () => this.SUBRULE(this.validationProperty) },
        { ALT: () => this.SUBRULE(this.statement) },
      ]);
    });
    this.CONSUME(RCurly);
  });

  private validationProperty = this.RULE('validationProperty', () => {
    this.CONSUME(Identifier);
    this.CONSUME(Colon);
    this.SUBRULE(this.constraintValue);
  });

  // ============================================================
  // FORM KURALLARI
  // form İsim { entity: EntityAdı, sections { ... }, actions { ... } }
  // ============================================================

  public formDeclaration = this.RULE('formDeclaration', () => {
    this.CONSUME(Form);
    this.CONSUME(Identifier);
    this.CONSUME(LCurly);
    this.MANY(() => {
      this.SUBRULE(this.formBlock);
    });
    this.CONSUME(RCurly);
  });

  private formBlock = this.RULE('formBlock', () => {
    this.OR([
      { ALT: () => this.SUBRULE(this.formProperty) },
      { ALT: () => this.SUBRULE(this.formSections) },
      { ALT: () => this.SUBRULE(this.formActions) },
    ]);
  });

  /** Form özelliği: entity: Customer veya layout: "two_column" */
  private formProperty = this.RULE('formProperty', () => {
    this.SUBRULE(this.propertyName);
    this.CONSUME(Colon);
    this.OR([
      { ALT: () => this.CONSUME(StringLiteral) },
      { ALT: () => this.CONSUME(Identifier) },
    ]);
  });

  /** Özellik ismi olarak hem anahtar kelimeleri hem identifier'ları kabul eder.
   *  Bu gereklidir çünkü "entity", "fields" gibi kelimeler hem keyword hem de
   *  özellik ismi olarak kullanılabilir (bağlama duyarlı ayrıştırma). */
  private propertyName = this.RULE('propertyName', () => {
    this.OR([
      { ALT: () => this.CONSUME(Entity) },
      { ALT: () => this.CONSUME(Report) },
      { ALT: () => this.CONSUME(Form) },
      { ALT: () => this.CONSUME(Workflow) },
      { ALT: () => this.CONSUME(Dashboard) },
      { ALT: () => this.CONSUME(Fields) },
      { ALT: () => this.CONSUME(Actions) },
      { ALT: () => this.CONSUME(Permissions) },
      { ALT: () => this.CONSUME(Default) },
      { ALT: () => this.CONSUME(Min) },
      { ALT: () => this.CONSUME(Max) },
      { ALT: () => this.CONSUME(Pattern) },
      { ALT: () => this.CONSUME(Required) },
      { ALT: () => this.CONSUME(Optional) },
      { ALT: () => this.CONSUME(Identifier) },
    ]);
  });

  private formSections = this.RULE('formSections', () => {
    this.CONSUME(Sections);
    this.CONSUME(LCurly);
    this.MANY(() => {
      this.SUBRULE(this.formSection);
    });
    this.CONSUME(RCurly);
  });

  private formSection = this.RULE('formSection', () => {
    this.CONSUME(Identifier);
    this.CONSUME(LCurly);
    this.MANY(() => {
      this.SUBRULE(this.formSectionProperty);
    });
    this.CONSUME(RCurly);
  });

  private formSectionProperty = this.RULE('formSectionProperty', () => {
    this.SUBRULE(this.propertyName);
    this.CONSUME(Colon);
    this.OR([
      { ALT: () => this.CONSUME(StringLiteral) },
      { ALT: () => this.SUBRULE(this.arrayLiteral) },
    ]);
  });

  private formActions = this.RULE('formActions', () => {
    this.CONSUME(Actions);
    this.CONSUME(LCurly);
    this.MANY(() => {
      this.SUBRULE(this.formAction);
    });
    this.CONSUME(RCurly);
  });

  private formAction = this.RULE('formAction', () => {
    this.CONSUME(Identifier);
    this.CONSUME(LCurly);
    this.MANY(() => {
      this.SUBRULE(this.formSectionProperty);
    });
    this.CONSUME(RCurly);
  });

  // ============================================================
  // RAPOR KURALLARI
  // report İsim { title: "...", data_source: Entity, columns { ... } }
  // ============================================================

  public reportDeclaration = this.RULE('reportDeclaration', () => {
    this.CONSUME(Report);
    this.CONSUME(Identifier);
    this.CONSUME(LCurly);
    this.MANY(() => {
      this.SUBRULE(this.reportBlock);
    });
    this.CONSUME(RCurly);
  });

  private reportBlock = this.RULE('reportBlock', () => {
    this.OR([
      { ALT: () => this.SUBRULE(this.reportProperty) },
      { ALT: () => this.SUBRULE(this.reportParameters) },
      { ALT: () => this.SUBRULE(this.reportColumns) },
      { ALT: () => this.SUBRULE(this.reportVisualizations) },
    ]);
  });

  private reportProperty = this.RULE('reportProperty', () => {
    this.CONSUME(Identifier);
    this.CONSUME(Colon);
    this.OR([
      { ALT: () => this.CONSUME(StringLiteral) },
      { ALT: () => this.CONSUME2(Identifier) },
    ]);
  });

  private reportParameters = this.RULE('reportParameters', () => {
    this.CONSUME(Parameters);
    this.CONSUME(LCurly);
    this.MANY(() => {
      this.SUBRULE(this.fieldDeclaration);
    });
    this.CONSUME(RCurly);
  });

  private reportColumns = this.RULE('reportColumns', () => {
    this.CONSUME(Columns);
    this.CONSUME(LCurly);
    this.MANY(() => {
      this.SUBRULE(this.reportColumn);
    });
    this.CONSUME(RCurly);
  });

  private reportColumn = this.RULE('reportColumn', () => {
    this.CONSUME(Identifier);
    this.CONSUME(LCurly);
    this.MANY(() => {
      this.SUBRULE(this.formSectionProperty);
    });
    this.CONSUME(RCurly);
  });

  private reportVisualizations = this.RULE('reportVisualizations', () => {
    this.CONSUME(Visualizations);
    this.CONSUME(LCurly);
    this.MANY(() => {
      this.SUBRULE(this.reportVisualization);
    });
    this.CONSUME(RCurly);
  });

  private reportVisualization = this.RULE('reportVisualization', () => {
    this.CONSUME(Identifier);
    this.CONSUME(LCurly);
    this.MANY(() => {
      this.SUBRULE(this.formSectionProperty);
    });
    this.CONSUME(RCurly);
  });

  // ============================================================
  // İŞ AKIŞI (Workflow) KURALLARI
  // workflow İsim { trigger: on_create(Entity), steps { ... } }
  // ============================================================

  public workflowDeclaration = this.RULE('workflowDeclaration', () => {
    this.CONSUME(Workflow);
    this.CONSUME(Identifier);
    this.CONSUME(LCurly);
    this.MANY(() => {
      this.SUBRULE(this.workflowBlock);
    });
    this.CONSUME(RCurly);
  });

  private workflowBlock = this.RULE('workflowBlock', () => {
    this.OR([
      { ALT: () => this.SUBRULE(this.workflowTrigger) },
      { ALT: () => this.SUBRULE(this.workflowSteps) },
    ]);
  });

  private workflowTrigger = this.RULE('workflowTrigger', () => {
    this.CONSUME(Identifier); // "trigger"
    this.CONSUME(Colon);
    this.OR2([
      { ALT: () => this.CONSUME(OnCreate) },
      { ALT: () => this.CONSUME(OnUpdate) },
      { ALT: () => this.CONSUME(OnDelete) },
    ]);
    this.CONSUME(LParen);
    this.CONSUME2(Identifier); // entity name
    this.CONSUME(RParen);
  });

  private workflowSteps = this.RULE('workflowSteps', () => {
    this.CONSUME(Steps);
    this.CONSUME(LCurly);
    this.MANY(() => {
      this.SUBRULE(this.workflowStep);
    });
    this.CONSUME(RCurly);
  });

  private workflowStep = this.RULE('workflowStep', () => {
    this.OR([
      { ALT: () => this.SUBRULE(this.workflowDecisionStep) },
      { ALT: () => this.SUBRULE(this.statement) },
    ]);
  });

  private workflowDecisionStep = this.RULE('workflowDecisionStep', () => {
    this.CONSUME(Identifier); // step name like "decision"
    this.CONSUME(LCurly);
    this.MANY(() => {
      this.SUBRULE(this.workflowEntry);
    });
    this.CONSUME(RCurly);
  });

  /** Belirsizliği önlemek için birleştirilmiş kural: tüm girişler Identifier ile başlar.
   *  Identifier'dan sonra '{' gelirse dal (branch), ':' gelirse özellik (property) olur. */
  private workflowEntry = this.RULE('workflowEntry', () => {
    this.CONSUME(Identifier);
    this.OR([
      {
        // Branch: Identifier '{' ... '}'
        ALT: () => {
          this.CONSUME(LCurly);
          this.MANY(() => {
            this.OR2([
              { ALT: () => this.SUBRULE(this.workflowDecisionStep) },
              { ALT: () => this.SUBRULE(this.statement) },
            ]);
          });
          this.CONSUME(RCurly);
        },
      },
      {
        // Property: Identifier ':' value
        ALT: () => {
          this.CONSUME(Colon);
          this.SUBRULE(this.expression);
        },
      },
    ]);
  });

  // ============================================================
  // DASHBOARD (Gösterge Paneli) KURALLARI
  // dashboard İsim { title: "...", ... }
  // ============================================================

  public dashboardDeclaration = this.RULE('dashboardDeclaration', () => {
    this.CONSUME(Dashboard);
    this.CONSUME(Identifier);
    this.CONSUME(LCurly);
    this.MANY(() => {
      this.SUBRULE(this.formSectionProperty);
    });
    this.CONSUME(RCurly);
  });

  // ============================================================
  // İFADE (Statement) KURALLARI
  // Metod gövdeleri ve trigger blokları içinde kullanılır.
  // ============================================================

  public statement = this.RULE('statement', () => {
    this.OR([
      { ALT: () => this.SUBRULE(this.returnStatement) },
      { ALT: () => this.SUBRULE(this.variableDeclaration) },
      { ALT: () => this.SUBRULE(this.ifStatement) },
      { ALT: () => this.SUBRULE(this.forStatement) },
      { ALT: () => this.SUBRULE(this.whileStatement) },
      { ALT: () => this.SUBRULE(this.expressionStatement) },
    ]);
  });

  private returnStatement = this.RULE('returnStatement', () => {
    this.CONSUME(Return);
    this.SUBRULE(this.expression);
    this.OPTION(() => {
      this.CONSUME(Semicolon);
    });
  });

  private variableDeclaration = this.RULE('variableDeclaration', () => {
    this.OR([
      { ALT: () => this.CONSUME(Let) },
      { ALT: () => this.CONSUME(Const) },
    ]);
    this.CONSUME(Identifier);
    this.OPTION(() => {
      this.CONSUME(Assign);
      this.SUBRULE(this.expression);
    });
    this.OPTION2(() => {
      this.CONSUME(Semicolon);
    });
  });

  private ifStatement = this.RULE('ifStatement', () => {
    this.CONSUME(If);
    this.CONSUME(LParen);
    this.SUBRULE(this.expression);
    this.CONSUME(RParen);
    this.CONSUME(LCurly);
    this.MANY(() => {
      this.SUBRULE(this.statement);
    });
    this.CONSUME(RCurly);
    this.OPTION(() => {
      this.CONSUME(Else);
      this.CONSUME2(LCurly);
      this.MANY2(() => {
        this.SUBRULE2(this.statement);
      });
      this.CONSUME2(RCurly);
    });
  });

  private forStatement = this.RULE('forStatement', () => {
    this.CONSUME(For);
    this.CONSUME(LParen);
    this.CONSUME(Identifier);
    this.CONSUME2(Identifier, { LABEL: 'InKeyword' }); // "in"
    this.SUBRULE(this.expression);
    this.CONSUME(RParen);
    this.CONSUME(LCurly);
    this.MANY(() => {
      this.SUBRULE(this.statement);
    });
    this.CONSUME(RCurly);
  });

  private whileStatement = this.RULE('whileStatement', () => {
    this.CONSUME(While);
    this.CONSUME(LParen);
    this.SUBRULE(this.expression);
    this.CONSUME(RParen);
    this.CONSUME(LCurly);
    this.MANY(() => {
      this.SUBRULE(this.statement);
    });
    this.CONSUME(RCurly);
  });

  private expressionStatement = this.RULE('expressionStatement', () => {
    this.SUBRULE(this.expression);
    // Atama: this.field = expr  veya  variable = expr
    this.OPTION2(() => {
      this.CONSUME(Assign);
      this.SUBRULE2(this.expression);
    });
    this.OPTION(() => {
      this.CONSUME(Semicolon);
    });
  });

  // ============================================================
  // İFADE DEĞERLERİ (Expressions) - Öncelik Tırmanması (Precedence Climbing)
  //
  // Operatör önceliği aşağıdan yukarıya artar:
  //   1. logicalOr  (en düşük) - or
  //   2. logicalAnd            - and
  //   3. comparison            - ==, !=, <, >, <=, >=
  //   4. additive              - +, -
  //   5. multiplicative        - *, /, %
  //   6. unary                 - not, !, - (tekli)
  //   7. postfix  (en yüksek)  - a.b (üye erişimi), a() (fonksiyon çağrısı)
  // ============================================================

  public expression = this.RULE('expression', () => {
    this.SUBRULE(this.logicalOrExpression);
  });

  private logicalOrExpression = this.RULE('logicalOrExpression', () => {
    this.SUBRULE(this.logicalAndExpression);
    this.MANY(() => {
      this.CONSUME(Or);
      this.SUBRULE2(this.logicalAndExpression);
    });
  });

  private logicalAndExpression = this.RULE('logicalAndExpression', () => {
    this.SUBRULE(this.comparisonExpression);
    this.MANY(() => {
      this.CONSUME(And);
      this.SUBRULE2(this.comparisonExpression);
    });
  });

  private comparisonExpression = this.RULE('comparisonExpression', () => {
    this.SUBRULE(this.additiveExpression);
    this.OPTION(() => {
      this.SUBRULE(this.comparisonOperator);
      this.SUBRULE2(this.additiveExpression);
    });
  });

  private comparisonOperator = this.RULE('comparisonOperator', () => {
    this.OR([
      { ALT: () => this.CONSUME(Equal) },
      { ALT: () => this.CONSUME(NotEqual) },
      { ALT: () => this.CONSUME(LessThan) },
      { ALT: () => this.CONSUME(GreaterThan) },
      { ALT: () => this.CONSUME(LessEqual) },
      { ALT: () => this.CONSUME(GreaterEqual) },
    ]);
  });

  private additiveExpression = this.RULE('additiveExpression', () => {
    this.SUBRULE(this.multiplicativeExpression);
    this.MANY(() => {
      this.OR([
        { ALT: () => this.CONSUME(Plus) },
        { ALT: () => this.CONSUME(Minus) },
      ]);
      this.SUBRULE2(this.multiplicativeExpression);
    });
  });

  private multiplicativeExpression = this.RULE('multiplicativeExpression', () => {
    this.SUBRULE(this.unaryExpression);
    this.MANY(() => {
      this.OR([
        { ALT: () => this.CONSUME(Star) },
        { ALT: () => this.CONSUME(Slash) },
        { ALT: () => this.CONSUME(Percent) },
      ]);
      this.SUBRULE2(this.unaryExpression);
    });
  });

  private unaryExpression = this.RULE('unaryExpression', () => {
    this.OR([
      {
        ALT: () => {
          this.OR2([
            { ALT: () => this.CONSUME(Not) },
            { ALT: () => this.CONSUME(Exclamation) },
            { ALT: () => this.CONSUME(Minus) },
          ]);
          this.SUBRULE(this.unaryExpression);
        },
      },
      { ALT: () => this.SUBRULE(this.postfixExpression) },
    ]);
  });

  /** Üye erişimi (a.b) ve fonksiyon çağrısı (a()) zincirlerini işler.
   *  Örnek: this.items.filter() -> MemberExpr -> MemberExpr -> CallExpr */
  private postfixExpression = this.RULE('postfixExpression', () => {
    this.SUBRULE(this.primaryExpression);
    this.MANY(() => {
      this.OR([
        {
          ALT: () => {
            this.CONSUME(Dot);
            this.CONSUME(Identifier);
          },
        },
        {
          ALT: () => {
            this.CONSUME(LParen);
            this.OPTION(() => {
              this.SUBRULE(this.argumentList);
            });
            this.CONSUME(RParen);
          },
        },
      ]);
    });
  });

  private argumentList = this.RULE('argumentList', () => {
    this.SUBRULE(this.argument);
    this.MANY(() => {
      this.CONSUME(Comma);
      this.SUBRULE2(this.argument);
    });
  });

  private argument = this.RULE('argument', () => {
    this.SUBRULE(this.expression);
  });

  private primaryExpression = this.RULE('primaryExpression', () => {
    this.OR([
      { ALT: () => this.CONSUME(StringLiteral) },
      { ALT: () => this.CONSUME(NumberLiteral) },
      { ALT: () => this.CONSUME(True) },
      { ALT: () => this.CONSUME(False) },
      { ALT: () => this.CONSUME(This) },
      { ALT: () => this.CONSUME(Identifier) },
      {
        ALT: () => {
          this.CONSUME(LParen);
          this.SUBRULE(this.expression);
          this.CONSUME(RParen);
        },
      },
      { ALT: () => this.SUBRULE(this.arrayLiteral) },
      { ALT: () => this.SUBRULE(this.objectLiteral) },
    ]);
  });

  // ============================================================
  // LİTERALLER (dizi ve nesne)
  // Hem ifade değeri olarak hem de kısıtlama değeri olarak kullanılırlar.
  // ============================================================

  private arrayLiteral = this.RULE('arrayLiteral', () => {
    this.CONSUME(LBracket);
    this.OPTION(() => {
      this.SUBRULE(this.expression);
      this.MANY(() => {
        this.CONSUME(Comma);
        this.SUBRULE2(this.expression);
      });
    });
    this.CONSUME(RBracket);
  });

  private objectLiteral = this.RULE('objectLiteral', () => {
    this.CONSUME(LCurly);
    this.OPTION(() => {
      this.SUBRULE(this.objectProperty);
      this.MANY(() => {
        this.CONSUME(Comma);
        this.SUBRULE2(this.objectProperty);
      });
    });
    this.CONSUME(RCurly);
  });

  private objectProperty = this.RULE('objectProperty', () => {
    this.OR([
      { ALT: () => this.CONSUME(Identifier) },
      { ALT: () => this.CONSUME(StringLiteral) },
    ]);
    this.CONSUME(Colon);
    this.SUBRULE(this.expression);
  });
}
