/**
 * FSL Dahili Fonksiyonlar
 * ========================
 * FSL kodunda kullanilabilen dahili fonksiyonlar.
 * ABAP'taki yerlesik fonksiyon modulleri gibi.
 *
 * Desteklenen:
 * - query(sql) → SQL sorgusu calistir
 * - send_email({ to, template }) → email gonder
 * - send_sms({ to, message }) → SMS gonder
 * - now() → simdiki zaman
 * - today() → bugunun tarihi
 * - round(value, decimals) → yuvarlama
 * - abs(value) → mutlak deger
 * - max(a, b) → buyuk olan
 * - min(a, b) → kucuk olan
 */

import { RecordContext } from '../context/record-context.js';

export interface QueryExecutor {
  query(sql: string, params?: any[]): Promise<any>;
}

export class BuiltinFunctions {
  private queryExecutor?: QueryExecutor;
  private emailHandler?: (args: any) => Promise<void>;
  private smsHandler?: (args: any) => Promise<void>;

  /** DB sorgu calistiricisi ayarla */
  setQueryExecutor(executor: QueryExecutor): void {
    this.queryExecutor = executor;
  }

  /** Email handler ayarla */
  setEmailHandler(handler: (args: any) => Promise<void>): void {
    this.emailHandler = handler;
  }

  /** SMS handler ayarla */
  setSmsHandler(handler: (args: any) => Promise<void>): void {
    this.smsHandler = handler;
  }

  /** Fonksiyon cagir */
  call(name: string, args: any[], ctx: RecordContext): any {
    switch (name) {
      case 'query':
        return this.queryExecutor?.query(String(args[0]));

      case 'send_email':
        this.emailHandler?.(args[0]);
        return undefined;

      case 'send_sms':
        this.smsHandler?.(args[0]);
        return undefined;

      // Tarih/zaman
      case 'now':
      case 'NOW':
        return new Date().toISOString();

      case 'today':
      case 'TODAY':
        return new Date().toISOString().split('T')[0];

      // Matematik
      case 'round':
        return Math.round(Number(args[0]) * Math.pow(10, Number(args[1] || 0))) / Math.pow(10, Number(args[1] || 0));

      case 'abs':
        return Math.abs(Number(args[0]));

      case 'max':
        return Math.max(Number(args[0]), Number(args[1]));

      case 'min':
        return Math.min(Number(args[0]), Number(args[1]));

      // String
      case 'upper':
        return String(args[0]).toUpperCase();

      case 'lower':
        return String(args[0]).toLowerCase();

      case 'concat':
        return args.map(String).join('');

      default:
        console.warn(`Bilinmeyen FSL fonksiyonu: ${name}`);
        return undefined;
    }
  }
}
