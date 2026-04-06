/**
 * FSL Expression Executor
 * =========================
 * FSL AST ifadelerini (expression) calistirir.
 * ABAP'taki COMPUTE komutu gibi - aritmetik, karsilastirma, mantiksal islemler.
 *
 * Desteklenen islemler:
 * - Aritmetik: +, -, *, /, %
 * - Karsilastirma: ==, !=, <, >, <=, >=
 * - Mantiksal: and, or, not
 * - Member erisim: this.field_name
 * - Fonksiyon cagirma: query(), send_email()
 * - Literal: string, number, boolean, array, object
 */

import type { Expression } from '@flyx/fsl-compiler';
import { RecordContext } from '../context/record-context.js';
import type { BuiltinFunctions } from '../functions/builtin-functions.js';

export type MethodResolver = (methodName: string, ctx: RecordContext) => any;

export class ExpressionExecutor {
  private methodResolver?: MethodResolver;

  constructor(private builtins: BuiltinFunctions) {}

  /** Method cozumleyici ayarla (this.calculate() gibi cagirilar icin) */
  setMethodResolver(resolver: MethodResolver): void {
    this.methodResolver = resolver;
  }

  /** Tek bir AST expression'i calistir ve sonucu dondur */
  execute(expr: Expression, ctx: RecordContext): any {
    switch (expr.type) {
      case 'NumberLiteral':
        return (expr as any).value;

      case 'StringLiteral':
        return (expr as any).value;

      case 'BooleanLiteral':
        return (expr as any).value;

      case 'Identifier': {
        const name = (expr as any).name;
        if (name === 'this') return ctx;
        // Degisken veya fonksiyon adi
        return ctx.get(name) ?? name;
      }

      case 'MemberExpression': {
        const obj = this.execute((expr as any).object, ctx);
        const prop = (expr as any).property;
        if (obj instanceof RecordContext) {
          return obj.get(prop);
        }
        return obj?.[prop];
      }

      case 'BinaryExpression': {
        const left = this.execute((expr as any).left, ctx);
        const right = this.execute((expr as any).right, ctx);
        return this.executeBinary((expr as any).operator, left, right);
      }

      case 'UnaryExpression': {
        const operand = this.execute((expr as any).operand, ctx);
        const op = (expr as any).operator;
        if (op === 'not' || op === '!') return !operand;
        if (op === '-') return -operand;
        return operand;
      }

      case 'CallExpression': {
        const callee = (expr as any).callee;
        const args = ((expr as any).arguments || []).map((a: Expression) => this.execute(a, ctx));

        // this.method() cagirimi → method resolver'a devret
        if (callee.type === 'MemberExpression' && callee.object.type === 'Identifier' && callee.object.name === 'this') {
          if (this.methodResolver) {
            return this.methodResolver(callee.property, ctx);
          }
          return undefined;
        }

        // Dahili fonksiyonlar: query(), send_email(), send_sms()
        if (callee.type === 'Identifier') {
          const fnName = callee.name;
          return this.builtins.call(fnName, args, ctx);
        }

        return undefined;
      }

      case 'ArrayExpression': {
        return ((expr as any).elements || []).map((e: Expression) => this.execute(e, ctx));
      }

      case 'ObjectExpression': {
        const result: Record<string, any> = {};
        for (const prop of (expr as any).properties || []) {
          result[prop.key] = this.execute(prop.value, ctx);
        }
        return result;
      }

      default:
        return undefined;
    }
  }

  /** Binary operator calistir */
  private executeBinary(op: string, left: any, right: any): any {
    switch (op) {
      // Aritmetik
      case '+': return Number(left) + Number(right);
      case '-': return Number(left) - Number(right);
      case '*': return Number(left) * Number(right);
      case '/': return right !== 0 ? Number(left) / Number(right) : 0;
      case '%': return Number(left) % Number(right);
      // Karsilastirma
      case '==': return left == right;
      case '!=': return left != right;
      case '<': return Number(left) < Number(right);
      case '>': return Number(left) > Number(right);
      case '<=': return Number(left) <= Number(right);
      case '>=': return Number(left) >= Number(right);
      // Mantiksal
      case 'and': return left && right;
      case 'or': return left || right;
      default: return undefined;
    }
  }
}
