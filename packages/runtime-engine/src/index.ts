/**
 * FLYX Runtime Engine
 * ====================
 * FSL kodunu gercek zamanli calistiran motor.
 * ABAP runtime'i gibi - methods, triggers, computed fields, builtin functions.
 *
 * Kullanim:
 *   const runtime = new FSLRuntime();
 *   runtime.setQueryExecutor(dbService);
 *
 *   // Kayit olusturma oncesi trigger calistir
 *   const ctx = new RecordContext(data);
 *   runtime.executeTrigger(entity, 'before_create', ctx);
 *   const processedData = ctx.toObject();
 */

export { RecordContext } from './context/record-context.js';
export { ExpressionExecutor } from './executor/expression-executor.js';
export { StatementExecutor } from './executor/statement-executor.js';
export { TriggerExecutor, type TriggerEvent } from './executor/trigger-executor.js';
export { BuiltinFunctions, type QueryExecutor } from './functions/builtin-functions.js';

import type { EntityDeclaration } from '@flyx/fsl-compiler';
import { RecordContext } from './context/record-context.js';
import { TriggerExecutor, type TriggerEvent } from './executor/trigger-executor.js';
import { BuiltinFunctions, type QueryExecutor } from './functions/builtin-functions.js';

export class FSLRuntime {
  private builtins = new BuiltinFunctions();
  private triggerExecutor: TriggerExecutor;

  constructor() {
    this.triggerExecutor = new TriggerExecutor(this.builtins);
  }

  setQueryExecutor(executor: QueryExecutor): void {
    this.builtins.setQueryExecutor(executor);
  }

  setEmailHandler(handler: (args: any) => Promise<void>): void {
    this.builtins.setEmailHandler(handler);
  }

  /** Trigger calistir ve degistirilmis veriyi dondur */
  executeTrigger(entity: EntityDeclaration, event: TriggerEvent, data: Record<string, any>): Record<string, any> {
    const ctx = new RecordContext(data);
    this.triggerExecutor.executeTrigger(entity, event, ctx);
    this.triggerExecutor.calculateComputedFields(entity, ctx);
    return ctx.toObject();
  }

  executeMethod(entity: EntityDeclaration, methodName: string, data: Record<string, any>): any {
    const ctx = new RecordContext(data);
    return this.triggerExecutor.executeMethod(entity, methodName, ctx);
  }

  calculateComputed(entity: EntityDeclaration, data: Record<string, any>): Record<string, any> {
    const ctx = new RecordContext(data);
    this.triggerExecutor.calculateComputedFields(entity, ctx);
    return ctx.toObject();
  }
}
