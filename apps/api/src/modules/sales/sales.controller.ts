import { Controller, Get, Post, Put, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SalesService } from './sales.service';

@ApiTags('sales')
@Controller('v1/sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post('orders')
  @ApiOperation({ summary: 'Yeni siparis olustur' })
  async createOrder(@Body() body: { header: any; lines: any[] }) {
    return this.salesService.createOrder(body.header, body.lines);
  }

  @Get('orders')
  @ApiOperation({ summary: 'Siparis listele' })
  async listOrders(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.salesService.listOrders(page || 1, limit || 20);
  }

  @Get('orders/:id')
  @ApiOperation({ summary: 'Siparis detay' })
  async getOrder(@Param('id') id: string) {
    return this.salesService.getOrder(id);
  }

  @Put('orders/:id/confirm')
  @ApiOperation({ summary: 'Onayla (draft → confirmed)' })
  async confirm(@Param('id') id: string) { return this.salesService.confirmOrder(id); }

  @Put('orders/:id/ship')
  @ApiOperation({ summary: 'Sevk et (confirmed → shipped)' })
  async ship(@Param('id') id: string) { return this.salesService.shipOrder(id); }

  @Put('orders/:id/cancel')
  @ApiOperation({ summary: 'Iptal et' })
  async cancel(@Param('id') id: string) { return this.salesService.cancelOrder(id); }

  @Get('lookup/customers')
  @ApiOperation({ summary: 'Musteri arama' })
  async customers(@Query('q') q?: string) { return this.salesService.searchCustomers(q); }

  @Get('lookup/products')
  @ApiOperation({ summary: 'Urun arama' })
  async products(@Query('q') q?: string) { return this.salesService.searchProducts(q); }
}
