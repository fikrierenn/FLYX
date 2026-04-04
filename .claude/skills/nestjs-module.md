---
name: nestjs-module
description: FLYX projesi icin NestJS modul, controller, service ve DTO olusturma standartlari
---

# FLYX NestJS Module Skill

## Modul Yapisi

Her NestJS modulu su dosyalardan olusur:
```
modules/[entity]/
  [entity].module.ts
  [entity].controller.ts
  [entity].service.ts
  dto/
    create-[entity].dto.ts
    update-[entity].dto.ts
```

## Controller Kalıbı

```typescript
/**
 * [Entity] Controller
 * Turkce aciklama
 */
import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators';

@ApiTags('entities')
@ApiBearerAuth()
@Controller('entities')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EntitiesController {
  constructor(private readonly service: EntitiesService) {}

  @Get()
  @Roles('admin', 'user')
  @ApiOperation({ summary: 'List all' })
  findAll(@Query('page') page?: number, @Query('limit') limit?: number) {
    return this.service.findAll({ page, limit });
  }

  @Get(':id')
  findOne(@Param('id') id: string) { return this.service.findOne(id); }

  @Post()
  create(@Body() dto: CreateEntityDto) { return this.service.create(dto); }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateEntityDto) { return this.service.update(id, dto); }

  @Delete(':id')
  remove(@Param('id') id: string) { return this.service.remove(id); }
}
```

## Service Kalıbı

```typescript
@Injectable()
export class EntitiesService {
  async findAll(options?: { page?: number; limit?: number }) {
    const page = options?.page || 1;
    const limit = options?.limit || 20;
    const offset = (page - 1) * limit;
    return { data: [], total: 0, page, limit };
  }

  async findOne(id: string) { /* ... */ }
  async create(dto: CreateEntityDto) { /* ... */ }
  async update(id: string, dto: UpdateEntityDto) { /* ... */ }
  async remove(id: string) { /* ... */ }
}
```

## DTO Kalıbı (class-validator)

```typescript
import { IsString, IsEmail, IsNumber, IsBoolean, IsOptional, IsNotEmpty, MaxLength, Min, Max } from 'class-validator';

export class CreateEntityDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  amount?: number;
}
```

```typescript
import { PartialType } from '@nestjs/mapped-types';
export class UpdateEntityDto extends PartialType(CreateEntityDto) {}
```

## Kurallar

1. **Decorator-based** pattern kullan
2. **Swagger** decorator'lari ekle (@ApiTags, @ApiOperation)
3. **JwtAuthGuard + RolesGuard** her controller'da kullan
4. **Roles** FSL permissions'dan gelir
5. **DTO** class-validator ile dogrulanir
6. **Sayfalama** destekle (page, limit query params)
7. **Multi-tenant** tenant_id filtresi service katmaninda
8. **Turkce yorum** dosya basinda

## Guard/Decorator Kullanimi

```typescript
// Herkes erisebilir (login gerekmez)
@Public()

// Belirli roller gerekli
@Roles('admin', 'manager')

// Tenant baglamı zorunlu
@UseGuards(TenantGuard)
```
