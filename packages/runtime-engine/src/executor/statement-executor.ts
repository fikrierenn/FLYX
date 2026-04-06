/**
 * FSL Statement Executor
 * ========================
 * FSL AST statement'larini calistirir.
 * Desteklenen: return, let/const, assignment, if/else, expression
 */

import type { Statement, Expression } from '@flyx/fsl-compiler';
import { RecordContext } from '../context/record-context.js';
import { ExpressionExecutor } from './expression-executor.js';

/** Return degerini isaretleyen ozel nesne - ic ice if/method'dan return yakalamak icin */
class ReturnSignal {
  constructor(public value: any) {}
}

export class StatementExecutor {
  constructor(private exprExecutor: ExpressionExecutor) {}

  /** Statement listesini sirayla calistir */
  executeStatements(statements: Statement[], ctx: RecordContext): any {
    for (const stmt of statements) {
      const result = this.executeStatement(stmt, ctx);
      // Return signal yakalanirsa hemen dondur (ic ice if'lerden bile)
      if (result instanceof ReturnSignal) {
        return result.value;
      }
    }
    return undefined;
  }

  /** Tek bir statement calistir */
  private executeStatement(stmt: Statement, ctx: RecordContext): any {
    switch (stmt.type) {
      case 'ReturnStatement':
        // ReturnSignal ile isaretle - ust seviye executeStatements yakalayacak
        return new ReturnSignal(this.exprExecutor.execute((stmt as any).value, ctx));

      case 'VariableDeclaration': {
        const value = (stmt as any).value
          ? this.exprExecutor.execute((stmt as any).value, ctx)
          : undefined;
        ctx.set((stmt as any).name, value);
        return value;
      }

      case 'AssignmentStatement': {
        const target = (stmt as any).target;
        const value = this.exprExecutor.execute((stmt as any).value, ctx);

        if (target.type === 'MemberExpression' && target.object?.type === 'Identifier' && target.object.name === 'this') {
          ctx.set(target.property, value);
        } else if (target.type === 'Identifier') {
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
          const result = this.executeBlock((stmt as any).consequent || [], ctx);
          if (result instanceof ReturnSignal) return result; // Return'u yukari ilet
          return result;
        } else if ((stmt as any).alternate) {
          const result = this.executeBlock((stmt as any).alternate, ctx);
          if (result instanceof ReturnSignal) return result;
          return result;
        }
        return undefined;
      }

      default:
        return undefined;
    }
  }

  /** Blok icindeki statement'lari calistir - return signal'i korur */
  private executeBlock(statements: Statement[], ctx: RecordContext): any {
    for (const stmt of statements) {
      const result = this.executeStatement(stmt, ctx);
      if (result instanceof ReturnSignal) return result;
    }
    return undefined;
  }
}
