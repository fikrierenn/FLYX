/**
 * FSL (FLYX Specification Language) Token Tanımları
 *
 * Bu dosya, FSL dilinin tüm lexical token'larını tanımlar. Chevrotain kütüphanesi
 * kullanılarak her token bir regex deseni ile eşleştirilir.
 *
 * ÖNEMLİ: Token sıralaması kritiktir! Chevrotain, token'ları dizideki sıraya göre
 * eşleştirir. Daha uzun/spesifik desenler, daha kısa/genel olanlardan ÖNCE gelmelidir.
 * Bu yüzden tüm anahtar kelimeler `longer_alt: Identifier` kullanır; böylece "entity"
 * gibi bir kelime Identifier yerine doğru keyword token'ı olarak tanınır.
 */
import { createToken, Lexer } from 'chevrotain';

// ============================================================
// TANIMLAYICI (Identifier) - Anahtar kelimelerin longer_alt referansı için önce tanımlanmalı
// ============================================================

export const Identifier = createToken({
  name: 'Identifier',
  pattern: /[a-zA-Z_][a-zA-Z0-9_]*/,
});

// ============================================================
// BOŞ KARAKTERLER VE YORUMLAR
// Lexer.SKIPPED grubuna atanırlar, yani token dizisinde yer almazlar.
// Parser bu token'ları hiç görmez; sadece lexer aşamasında tüketilirler.
// ============================================================

export const WhiteSpace = createToken({
  name: 'WhiteSpace',
  pattern: /\s+/,
  group: Lexer.SKIPPED,
});

export const SingleLineComment = createToken({
  name: 'SingleLineComment',
  pattern: /\/\/[^\n\r]*/,
  group: Lexer.SKIPPED,
});

export const MultiLineComment = createToken({
  name: 'MultiLineComment',
  pattern: /\/\*[\s\S]*?\*\//,
  group: Lexer.SKIPPED,
});

// ============================================================
// ANAHTAR KELİMELER - Bildirim (Declaration)
// FSL'in temel yapı taşlarını tanımlayan anahtar kelimeler.
// Her biri bir üst düzey yapıyı (entity, form, report vb.) başlatır.
// ============================================================

export const Module = createToken({ name: 'Module', pattern: /module/, longer_alt: Identifier });
export const Entity = createToken({ name: 'Entity', pattern: /entity/, longer_alt: Identifier });
export const Form = createToken({ name: 'Form', pattern: /form/, longer_alt: Identifier });
export const Report = createToken({ name: 'Report', pattern: /report/, longer_alt: Identifier });
export const Workflow = createToken({ name: 'Workflow', pattern: /workflow/, longer_alt: Identifier });
export const Dashboard = createToken({ name: 'Dashboard', pattern: /dashboard/, longer_alt: Identifier });

// ============================================================
// ANAHTAR KELİMELER - Blok Tanımlayıcılar
// Entity ve Form gibi yapıların içindeki alt bölümleri tanımlar.
// Örneğin: fields { ... }, methods { ... }, permissions { ... }
// ============================================================

export const Fields = createToken({ name: 'Fields', pattern: /fields/, longer_alt: Identifier });
export const Methods = createToken({ name: 'Methods', pattern: /methods/, longer_alt: Identifier });
export const Permissions = createToken({ name: 'Permissions', pattern: /permissions/, longer_alt: Identifier });
export const Validation = createToken({ name: 'Validation', pattern: /validation/, longer_alt: Identifier });
export const Triggers = createToken({ name: 'Triggers', pattern: /triggers/, longer_alt: Identifier });
export const Sections = createToken({ name: 'Sections', pattern: /sections/, longer_alt: Identifier });
export const Actions = createToken({ name: 'Actions', pattern: /actions/, longer_alt: Identifier });
export const Parameters = createToken({ name: 'Parameters', pattern: /parameters/, longer_alt: Identifier });
export const Columns = createToken({ name: 'Columns', pattern: /columns/, longer_alt: Identifier });
export const Visualizations = createToken({ name: 'Visualizations', pattern: /visualizations/, longer_alt: Identifier });
export const Steps = createToken({ name: 'Steps', pattern: /steps/, longer_alt: Identifier });

// ============================================================
// ANAHTAR KELİMELER - Kontrol Akışı
// Metod gövdelerinde ve trigger'larda kullanılan kontrol yapıları.
// ============================================================

export const If = createToken({ name: 'If', pattern: /if/, longer_alt: Identifier });
export const Else = createToken({ name: 'Else', pattern: /else/, longer_alt: Identifier });
export const For = createToken({ name: 'For', pattern: /for/, longer_alt: Identifier });
export const While = createToken({ name: 'While', pattern: /while/, longer_alt: Identifier });
export const Return = createToken({ name: 'Return', pattern: /return/, longer_alt: Identifier });
export const Let = createToken({ name: 'Let', pattern: /let/, longer_alt: Identifier });
export const Const = createToken({ name: 'Const', pattern: /const/, longer_alt: Identifier });

// ============================================================
// ANAHTAR KELİMELER - Mantıksal Operatörler
// Okunabilirlik için sembol yerine kelime tabanlı mantıksal operatörler.
// ============================================================

export const And = createToken({ name: 'And', pattern: /and/, longer_alt: Identifier });
export const Or = createToken({ name: 'Or', pattern: /or/, longer_alt: Identifier });
export const Not = createToken({ name: 'Not', pattern: /not/, longer_alt: Identifier });

// ============================================================
// ANAHTAR KELİMELER - Tetikleyiciler (Triggers)
// Entity yaşam döngüsü olaylarını temsil eder.
// "before_" öneki: işlem yapılmadan önce çalışır (doğrulama için)
// "after_" öneki: işlem tamamlandıktan sonra çalışır (yan etkiler için)
// Alt çizgili isimlendirme (after_create) Identifier'dan uzun olduğu için
// longer_alt sayesinde doğru eşleşir.
// ============================================================

export const AfterCreate = createToken({ name: 'AfterCreate', pattern: /after_create/, longer_alt: Identifier });
export const AfterUpdate = createToken({ name: 'AfterUpdate', pattern: /after_update/, longer_alt: Identifier });
export const AfterDelete = createToken({ name: 'AfterDelete', pattern: /after_delete/, longer_alt: Identifier });
export const BeforeCreate = createToken({ name: 'BeforeCreate', pattern: /before_create/, longer_alt: Identifier });
export const BeforeUpdate = createToken({ name: 'BeforeUpdate', pattern: /before_update/, longer_alt: Identifier });
export const BeforeDelete = createToken({ name: 'BeforeDelete', pattern: /before_delete/, longer_alt: Identifier });
export const OnCreate = createToken({ name: 'OnCreate', pattern: /on_create/, longer_alt: Identifier });

// ============================================================
// VERİ TİPLERİ
// FSL'in desteklediği alan veri tipleri. PascalCase kullanılır;
// bu sayede kullanıcı tanımlı identifier'lardan (camelCase) ayrışırlar.
// Bazı tipler parametre alabilir: String(255), Decimal(10,2), Enum("a","b")
// ============================================================

export const DateTimeType = createToken({ name: 'DateTimeType', pattern: /DateTime/, longer_alt: Identifier });
export const DateRangeType = createToken({ name: 'DateRangeType', pattern: /DateRange/, longer_alt: Identifier });
export const DateType = createToken({ name: 'DateType', pattern: /Date/, longer_alt: Identifier });
export const StringType = createToken({ name: 'StringType', pattern: /String/, longer_alt: Identifier });
export const NumberType = createToken({ name: 'NumberType', pattern: /Number/, longer_alt: Identifier });
export const DecimalType = createToken({ name: 'DecimalType', pattern: /Decimal/, longer_alt: Identifier });
export const BooleanType = createToken({ name: 'BooleanType', pattern: /Boolean/, longer_alt: Identifier });
export const EmailType = createToken({ name: 'EmailType', pattern: /Email/, longer_alt: Identifier });
export const PhoneType = createToken({ name: 'PhoneType', pattern: /Phone/, longer_alt: Identifier });
export const URLType = createToken({ name: 'URLType', pattern: /URL/, longer_alt: Identifier });
export const TextType = createToken({ name: 'TextType', pattern: /Text/, longer_alt: Identifier });
export const JSONType = createToken({ name: 'JSONType', pattern: /JSON/, longer_alt: Identifier });
export const EnumType = createToken({ name: 'EnumType', pattern: /Enum/, longer_alt: Identifier });
export const RelationType = createToken({ name: 'RelationType', pattern: /Relation/, longer_alt: Identifier });
export const FileType = createToken({ name: 'FileType', pattern: /File/, longer_alt: Identifier });
export const ImageType = createToken({ name: 'ImageType', pattern: /Image/, longer_alt: Identifier });
export const ArrayType = createToken({ name: 'ArrayType', pattern: /Array/, longer_alt: Identifier });
export const MoneyType = createToken({ name: 'MoneyType', pattern: /Money/, longer_alt: Identifier });
export const ComputedType = createToken({ name: 'ComputedType', pattern: /Computed/, longer_alt: Identifier });
export const LookupType = createToken({ name: 'LookupType', pattern: /Lookup/, longer_alt: Identifier });

// ============================================================
// KISITLAMALAR (Constraints)
// Alan tanımlarının ardından süslü parantez içinde kullanılır.
// Örnek: name: String { required, unique, max: 100 }
// ============================================================

export const Required = createToken({ name: 'Required', pattern: /required/, longer_alt: Identifier });
export const Unique = createToken({ name: 'Unique', pattern: /unique/, longer_alt: Identifier });
export const Indexed = createToken({ name: 'Indexed', pattern: /indexed/, longer_alt: Identifier });
export const Default = createToken({ name: 'Default', pattern: /default/, longer_alt: Identifier });
export const Min = createToken({ name: 'Min', pattern: /min/, longer_alt: Identifier });
export const Max = createToken({ name: 'Max', pattern: /max/, longer_alt: Identifier });
export const Pattern = createToken({ name: 'Pattern', pattern: /pattern/, longer_alt: Identifier });
export const Optional = createToken({ name: 'Optional', pattern: /optional/, longer_alt: Identifier });
export const Many = createToken({ name: 'Many', pattern: /many/, longer_alt: Identifier });

// ============================================================
// YERLEŞİK TANIMLAYICILAR
// Dil tarafından ayrılmış özel değerler.
// ============================================================

export const True = createToken({ name: 'True', pattern: /true/, longer_alt: Identifier });
export const False = createToken({ name: 'False', pattern: /false/, longer_alt: Identifier });
export const This = createToken({ name: 'This', pattern: /this/, longer_alt: Identifier });

// ============================================================
// SEMBOLLER - Yapısal ayraçlar ve noktalama işaretleri
// ============================================================

export const LCurly = createToken({ name: 'LCurly', pattern: /{/ });
export const RCurly = createToken({ name: 'RCurly', pattern: /}/ });
export const LParen = createToken({ name: 'LParen', pattern: /\(/ });
export const RParen = createToken({ name: 'RParen', pattern: /\)/ });
export const LBracket = createToken({ name: 'LBracket', pattern: /\[/ });
export const RBracket = createToken({ name: 'RBracket', pattern: /]/ });
export const Colon = createToken({ name: 'Colon', pattern: /:/ });
export const Comma = createToken({ name: 'Comma', pattern: /,/ });
export const Dot = createToken({ name: 'Dot', pattern: /\./ });
export const Semicolon = createToken({ name: 'Semicolon', pattern: /;/ });

// ============================================================
// OPERATÖRLER
// Çok karakterli operatörler (!=, <=, >=, ==) tek karakterli olanlardan
// ÖNCE tanımlanmalıdır, aksi halde "!=" yerine "!" + "=" olarak ayrıştırılır.
// ============================================================

export const NotEqual = createToken({ name: 'NotEqual', pattern: /!=/ });
export const LessEqual = createToken({ name: 'LessEqual', pattern: /<=/ });
export const GreaterEqual = createToken({ name: 'GreaterEqual', pattern: />=/ });
export const Equal = createToken({ name: 'Equal', pattern: /==/ });
export const Assign = createToken({ name: 'Assign', pattern: /=/ });
export const Plus = createToken({ name: 'Plus', pattern: /\+/ });
export const Minus = createToken({ name: 'Minus', pattern: /-/ });
export const Star = createToken({ name: 'Star', pattern: /\*/ });
export const Slash = createToken({ name: 'Slash', pattern: /\// });
export const Percent = createToken({ name: 'Percent', pattern: /%/ });
export const LessThan = createToken({ name: 'LessThan', pattern: /</ });
export const GreaterThan = createToken({ name: 'GreaterThan', pattern: />/ });
export const Exclamation = createToken({ name: 'Exclamation', pattern: /!/ });
export const Ampersand = createToken({ name: 'Ampersand', pattern: /&/ });
export const Pipe = createToken({ name: 'Pipe', pattern: /\|/ });

// ============================================================
// LİTERALLER (Sabit Değerler)
// ============================================================

export const StringLiteral = createToken({
  name: 'StringLiteral',
  pattern: /"[^"]*"/,
});

export const NumberLiteral = createToken({
  name: 'NumberLiteral',
  pattern: /\d+(\.\d+)?/,
});

// ============================================================
// TÜM TOKEN'LAR - Sıralama kritiktir!
//
// Chevrotain token'ları bu dizideki sıraya göre eşleştirir. Kurallar:
// 1. Boşluk ve yorumlar en başta (önce atlanmalı)
// 2. Literaller, keyword'lerden önce (sayı/string öncelikli eşleşsin)
// 3. Uzun keyword'ler kısa olanlardan önce (after_create > after)
// 4. Çok karakterli operatörler tek karakterlilerden önce (!= > !)
// 5. Identifier EN SONDA - diğer hiçbir token'a uymayan her şeyi yakalar
// ============================================================

export const allTokens = [
  // Boşluk ve yorumlar (atlanır, parser'a ulaşmaz)
  WhiteSpace,
  SingleLineComment,
  MultiLineComment,

  // Literaller (anahtar kelimelerden önce eşleşmeli)
  StringLiteral,
  NumberLiteral,

  // Tetikleyici anahtar kelimeleri (daha uzun oldukları için kısa keyword'lerden önce)
  AfterCreate,
  AfterUpdate,
  AfterDelete,
  BeforeCreate,
  BeforeUpdate,
  BeforeDelete,
  OnCreate,

  // Veri tipleri (PascalCase - Identifier'dan önce gelmeliler)
  DateTimeType,
  DateRangeType,
  DateType,
  StringType,
  NumberType,
  DecimalType,
  BooleanType,
  EmailType,
  PhoneType,
  URLType,
  TextType,
  JSONType,
  EnumType,
  RelationType,
  FileType,
  ImageType,
  ArrayType,
  MoneyType,
  ComputedType,
  LookupType,

  // Bildirim anahtar kelimeleri
  Module,
  Entity,
  Form,
  Report,
  Workflow,
  Dashboard,

  // Blok anahtar kelimeleri
  Fields,
  Methods,
  Permissions,
  Validation,
  Triggers,
  Sections,
  Actions,
  Parameters,
  Columns,
  Visualizations,
  Steps,

  // Kontrol akışı
  If,
  Else,
  For,
  While,
  Return,
  Let,
  Const,

  // Mantıksal operatörler
  And,
  Or,
  Not,

  // Kısıtlamalar
  Required,
  Unique,
  Indexed,
  Default,
  Min,
  Max,
  Pattern,
  Optional,
  Many,

  // Boolean literaller ve this
  True,
  False,
  This,

  // Çok karakterli operatörler (tek karakterlilerden önce gelmeliler)
  NotEqual,
  LessEqual,
  GreaterEqual,
  Equal,

  // Semboller
  LCurly,
  RCurly,
  LParen,
  RParen,
  LBracket,
  RBracket,
  Colon,
  Comma,
  Dot,
  Semicolon,

  // Tek karakterli operatörler
  Assign,
  Plus,
  Minus,
  Star,
  Slash,
  Percent,
  LessThan,
  GreaterThan,
  Exclamation,
  Ampersand,
  Pipe,

  // Identifier EN SON olmalı - yukarıdaki hiçbir token'a uymayan her şeyi yakalar
  Identifier,
];
