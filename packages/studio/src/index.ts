/**
 * FLYX Studio
 * ============
 * Yapi:
 *   core/        → Framework-agnostic (types, FormController, SchemaBuilder)
 *   adapters/    → Framework-specific (react/)
 *   engine/      → Mevcut API (geriye uyumlu)
 *   designer/    → FormCustomizer (1C benzeri)
 */

// Core (framework-agnostic)
export type {
  FormSchema, FieldSchema, SectionSchema, TotalSchema, ActionSchema,
  FormState, FormCallbacks,
  RenderAdapter, RenderFormProps, RenderFieldProps, RenderGridProps,
} from './core/types';
export { FormController } from './core/FormController';
export { SchemaBuilder } from './core/SchemaBuilder';

// Engine (mevcut React API)
export { FormEngine } from './engine/FormEngine';
export { FieldRenderer } from './engine/FieldRenderer';
export { GridRenderer } from './engine/GridRenderer';
export { TotalsRenderer } from './engine/TotalsRenderer';
export { ActionRenderer } from './engine/ActionRenderer';

// Designer
export { FormCustomizer, loadCustomization, applyCustomization } from './designer/FormCustomizer';
