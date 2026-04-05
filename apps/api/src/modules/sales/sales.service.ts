/**
 * Satis Siparisi Is Mantigi Servisi
 * ====================================
 * NOT: Bu gecici TS kodu. Ileride FSL runtime engine uzerinden
 * tamamen FSL methods/triggers ile calisacak.
 * Su an amac: calisan bir ERP ekrani gostermek.
 */

import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.module';

const DEFAULT_TENANT = '00000000-0000-0000-0000-000000000001';

@Injectable()
export class SalesService {
  private readonly logger = new Logger('SalesService');
  private orderCounter = 0;

  constructor(private readonly db: DatabaseService) {
    this.initCounter();
  }

  private async initCounter() {
    try {
      const result = await this.db.query(
        `SELECT COUNT(*) FROM sales_order WHERE tenant_id = $1`, [DEFAULT_TENANT],
      );
      this.orderCounter = parseInt(result.rows[0].count, 10);
    } catch { this.orderCounter = 0; }
  }

  private generateOrderNo(): string {
    this.orderCounter++;
    const year = new Date().getFullYear();
    return `SIP-${year}-${String(this.orderCounter).padStart(4, '0')}`;
  }

  /** Yeni siparis olustur */
  async createOrder(header: any, lines: any[]): Promise<any> {
    const orderNo = this.generateOrderNo();
    const calculated = lines.map((l: any) => this.calcLine(l));
    const subtotal = calculated.reduce((s: number, l: any) => s + l.line_total, 0);
    const taxAmount = calculated.reduce((s: number, l: any) => s + l.tax_amount, 0);
    const total = calculated.reduce((s: number, l: any) => s + l.net_total, 0);

    return this.db.transaction(async (client) => {
      const orderResult = await client.query(
        `INSERT INTO sales_order (order_no, customer, order_date, delivery_date, subtotal, tax_amount, total, currency, status, notes, tenant_id, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,NOW()) RETURNING *`,
        [orderNo, header.customer_id, header.order_date || new Date().toISOString().split('T')[0],
         header.delivery_date, subtotal, taxAmount, total, header.currency || 'TRY', 'draft', header.notes, DEFAULT_TENANT],
      );
      const order = orderResult.rows[0];

      const savedLines = [];
      for (const line of calculated) {
        const lr = await client.query(
          `INSERT INTO sales_order_item (sales_order, product, quantity, unit_price, discount_rate, tax_rate, line_total, tenant_id, created_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW()) RETURNING *`,
          [order.id, line.product_id, line.quantity, line.unit_price, line.discount_rate, line.tax_rate, line.net_total, DEFAULT_TENANT],
        );
        savedLines.push(lr.rows[0]);
      }
      this.logger.log(`Siparis: ${orderNo} (${calculated.length} kalem, ${total} TL)`);
      return { ...order, lines: savedLines };
    });
  }

  async listOrders(page = 1, limit = 20): Promise<any> {
    const offset = (page - 1) * limit;
    const result = await this.db.query(
      `SELECT so.*, c.name as customer_name FROM sales_order so LEFT JOIN customer c ON c.id = so.customer
       WHERE so.tenant_id = $1 ORDER BY so.created_at DESC LIMIT $2 OFFSET $3`, [DEFAULT_TENANT, limit, offset],
    );
    const count = await this.db.query(`SELECT COUNT(*) FROM sales_order WHERE tenant_id = $1`, [DEFAULT_TENANT]);
    return { data: result.rows, total: parseInt(count.rows[0].count, 10), page, limit };
  }

  async getOrder(id: string): Promise<any> {
    const o = await this.db.query(
      `SELECT so.*, c.name as customer_name FROM sales_order so LEFT JOIN customer c ON c.id = so.customer
       WHERE so.id = $1 AND so.tenant_id = $2`, [id, DEFAULT_TENANT],
    );
    if (!o.rows[0]) throw new NotFoundException('Siparis bulunamadi');
    const lines = await this.db.query(
      `SELECT soi.*, p.name as product_name, p.code as product_code FROM sales_order_item soi
       LEFT JOIN product p ON p.id = soi.product WHERE soi.sales_order = $1 AND soi.tenant_id = $2`, [id, DEFAULT_TENANT],
    );
    return { ...o.rows[0], lines: lines.rows };
  }

  async confirmOrder(id: string) {
    const o = await this.getOrder(id);
    if (o.status !== 'draft') throw new BadRequestException('Sadece taslak onaylanabilir');
    await this.db.query(`UPDATE sales_order SET status='confirmed', updated_at=NOW() WHERE id=$1`, [id]);
    return { ...o, status: 'confirmed' };
  }

  async shipOrder(id: string) {
    const o = await this.getOrder(id);
    if (o.status !== 'confirmed') throw new BadRequestException('Sadece onaylanan sevk edilebilir');
    await this.db.query(`UPDATE sales_order SET status='shipped', updated_at=NOW() WHERE id=$1`, [id]);
    return { ...o, status: 'shipped' };
  }

  async cancelOrder(id: string) {
    const o = await this.getOrder(id);
    if (!['draft','confirmed'].includes(o.status)) throw new BadRequestException('Iptal edilemez');
    await this.db.query(`UPDATE sales_order SET status='cancelled', updated_at=NOW() WHERE id=$1`, [id]);
    return { ...o, status: 'cancelled' };
  }

  async searchCustomers(q?: string) {
    const sql = q
      ? `SELECT id, code, name FROM customer WHERE tenant_id=$1 AND (name ILIKE $2 OR code ILIKE $2) LIMIT 20`
      : `SELECT id, code, name FROM customer WHERE tenant_id=$1 LIMIT 20`;
    return (await this.db.query(sql, q ? [DEFAULT_TENANT, `%${q}%`] : [DEFAULT_TENANT])).rows;
  }

  async searchProducts(q?: string) {
    const sql = q
      ? `SELECT id, code, name, sale_price, tax_rate FROM product WHERE tenant_id=$1 AND (name ILIKE $2 OR code ILIKE $2) LIMIT 20`
      : `SELECT id, code, name, sale_price, tax_rate FROM product WHERE tenant_id=$1 LIMIT 20`;
    return (await this.db.query(sql, q ? [DEFAULT_TENANT, `%${q}%`] : [DEFAULT_TENANT])).rows;
  }

  private calcLine(l: any) {
    const lt = l.quantity * l.unit_price;
    const da = lt * (l.discount_rate || 0) / 100;
    const ad = lt - da;
    const ta = ad * (l.tax_rate || 18) / 100;
    return { ...l, line_total: Math.round(lt*100)/100, discount_amount: Math.round(da*100)/100,
      tax_amount: Math.round(ta*100)/100, net_total: Math.round((ad+ta)*100)/100 };
  }
}
