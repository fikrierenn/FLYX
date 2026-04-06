/**
 * FSL Statement Executor
 * ========================
 * FSL AST statement'larini calistirir.
 * Desteklenen: return, let/const, assignment (this.x = expr), if/else, expression
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

      case 'AssignmentStatement': {
        // this.field = expr  →  ctx.set(field, evaluated_value)
        const target = (stmt as any).target;
        const value = this.exprExecutor.execute((stmt as any).value, ctx);

        if (target.type === 'MemberExpression' && target.object?.type === 'Identifier' && target.object.name === 'this') {
          // this.field_name = value
          ctx.set(target.property, value);
        } else if (target.type === 'Identifier') {
          // variable = value
          ctx.set(target.name, value);
        }

        return value;
      }

      case 'ExpressionStatement': {
        return this.exprExecutor.execute((stmt as any).expression, ctx);
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
}
