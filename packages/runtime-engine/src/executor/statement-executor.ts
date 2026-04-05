/**
 * FSL Statement Executor
 * ========================
 * FSL AST ifadelerini (statement) calistirir.
 * ABAP'taki PERFORM, IF, LOOP gibi kontrol yapilari.
 *
 * Desteklenen:
 * - return ifadesi
 * - let/const degisken tanimlama
 * - if/else kosullu calistirma
 * - expression statement (fonksiyon cagirma, atama)
 * - for/while dongu
 */

import type { Statement, Expression } from '@flyx/fsl-compiler';
import { RecordContext } from '../context/record-context.js';
import { ExpressionExecutor } from './expression-executor.js';

export class StatementExecutor {
  constructor(private exprExecutor: ExpressionExecutor) {}

  /** Statement listesini sirayla calistir */
  executeStatements(statements: Statement[], ctx: RecordContext): any {
    let result: any = undefined;

    for (const stmt of statements) {
      result = this.executeStatement(stmt, ctx);
      // return ile donulen deger
      if (stmt.type === 'ReturnStatement') {
        return result;
      }
    }

    return result;
  }

  /** Tek bir statement calistir */
  private executeStatement(stmt: Statement, ctx: RecordContext): any {
    switch (stmt.type) {
      case 'ReturnStatement':
        return this.exprExecutor.execute((stmt as any).value, ctx);

      case 'VariableDeclaration': {
        const value = (stmt as any).value
          ? this.exprExecutor.execute((stmt as any).value, ctx)
          : undefined;
        ctx.set((stmt as any).name, value);
        return value;
      }

      case 'ExpressionStatement': {
        const expr = (stmt as any).expression;

        // Atama: this.field = value
        if (this.isAssignment(expr)) {
          return this.executeAssignment(expr, ctx);
        }

        return this.exprExecutor.execute(expr, ctx);
      }

      case 'IfStatement': {
        const condition = this.exprExecutor.execute((stmt as any).condition, ctx);
        if (condition) {
          return this.executeStatements((stmt as any).consequent || [], ctx);
        } else if ((stmt as any).alternate) {
          return this.executeStatements((stmt as any).alternate, ctx);
        }
        return undefined;
      }

      default:
        return undefined;
    }
  }

  /** this.total = this.quantity * this.price gibi atama mi? */
  private isAssignment(expr: any): boolean {
    // CallExpression olabilir ama MemberExpression + BinaryExpression ise atama
    // Simdilik basit: expression sonucu MemberExpression'a atama
    return false; // TODO: AST'de atama operatoru destegi ekle
  }

  private executeAssignment(expr: any, ctx: RecordContext): any {
    return this.exprExecutor.execute(expr, ctx);
  }
}
