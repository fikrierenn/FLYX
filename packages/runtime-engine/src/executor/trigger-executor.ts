/**
 * FSL Trigger Executor
 * ======================
 * Entity trigger'larini calistirir (before_create, after_update vb.)
 * ABAP'taki EXIT, EVENT gibi yapilar.
 *
 * Kullanim:
 *   FSL'de:
 *     triggers {
 *       before_create {
 *         this.calculate();  // method cagir
 *         this.status = "draft";  // alan ata
 *       }
 *       after_create {
 *         send_email({ to: this.email, template: "welcome" });
 *       }
 *     }
 *
 *   Runtime'da:
 *     triggerExecutor.executeTrigger(entity, 'before_create', recordCtx);
 */

import type { EntityDeclaration, TriggerDeclaration, MethodDeclaration, Statement } from '@flyx/fsl-compiler';
import { RecordContext } from '../context/record-context.js';
import { ExpressionExecutor } from './expression-executor.js';
import { StatementExecutor } from './statement-executor.js';
import { BuiltinFunctions } from '../functions/builtin-functions.js';

export type TriggerEvent = 'before_create' | 'after_create' | 'before_update' | 'after_update' | 'before_delete' | 'after_delete';

export class TriggerExecutor {
  private exprExecutor: ExpressionExecutor;
  private stmtExecutor: StatementExecutor;

  constructor(builtins: BuiltinFunctions) {
    this.exprExecutor = new ExpressionExecutor(builtins);
    this.stmtExecutor = new StatementExecutor(this.exprExecutor);
  }

  /** Entity trigger'ini calistir */
  executeTrigger(entity: EntityDeclaration, event: TriggerEvent, ctx: RecordContext): void {
    if (!entity.triggers?.triggers) return;

    // Method resolver bagla - trigger icinde this.calculate() gibi cagirilar icin
    this.exprExecutor.setMethodResolver((methodName, methodCtx) => {
      return this.executeMethod(entity, methodName, methodCtx);
    });

    const trigger = entity.triggers.triggers.find((t) => t.event === event);
    if (!trigger || !trigger.body) return;

    this.stmtExecutor.executeStatements(trigger.body, ctx);
  }

  /** Entity method'unu calistir */
  executeMethod(entity: EntityDeclaration, methodName: string, ctx: RecordContext): any {
    if (!entity.methods) return undefined;

    const method = entity.methods.find((m) => m.name === methodName);
    if (!method || !method.body) return undefined;

    return this.stmtExecutor.executeStatements(method.body, ctx);
  }

  /** Computed alanlari hesapla */
  calculateComputedFields(entity: EntityDeclaration, ctx: RecordContext): void {
    for (const field of entity.fields) {
      if (field.dataType.name === 'Computed' && field.constraints?.expression) {
        try {
          // Basit ifade: "{first_name} {last_name}" → string interpolation
          const expr = field.constraints.expression;
          const value = expr.replace(/\{([^}]+)\}/g, (_: string, fieldName: string) => {
            return String(ctx.get(fieldName.trim()) ?? '');
          });
          ctx.set(field.name, value);
        } catch {
          // Hesaplama hatasi - sessizce gec
        }
      }
    }
  }
}
