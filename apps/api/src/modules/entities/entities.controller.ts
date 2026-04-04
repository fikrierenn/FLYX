import { Controller, Get, Post, Body, Param, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { EntitiesService } from './entities.service';
import type { EntityDeclaration } from '@flyx/fsl-compiler';

@ApiTags('entities')
@Controller('entities')
export class EntitiesController {
  constructor(private readonly entitiesService: EntitiesService) {}

  @Get()
  @ApiOperation({ summary: 'List all registered entities' })
  list() {
    return this.entitiesService.getRegisteredEntities();
  }

  @Post('register')
  @ApiOperation({ summary: 'Register an entity for dynamic CRUD' })
  register(@Body() entity: EntityDeclaration) {
    const operations = this.entitiesService.registerEntity(entity);
    return { entity: entity.name, operations };
  }

  @Get(':name/operations')
  @ApiOperation({ summary: 'Get CRUD operations for an entity' })
  getOperations(@Param('name') name: string) {
    const ops = this.entitiesService.getCRUDOperations(name);
    if (!ops) throw new NotFoundException(`Entity "${name}" not found`);
    return ops;
  }
}
