import { Injectable } from '@nestjs/common';
import { CRUDGenerator } from '@flyx/database-engine';
import type { CRUDOperation } from '@flyx/database-engine';
import type { EntityDeclaration } from '@flyx/fsl-compiler';

/**
 * Dynamic CRUD service that generates endpoints based on FSL entity definitions.
 */
@Injectable()
export class EntitiesService {
  private crudGenerator = new CRUDGenerator();
  private registeredEntities = new Map<string, EntityDeclaration>();

  registerEntity(entity: EntityDeclaration): CRUDOperation[] {
    this.registeredEntities.set(entity.name, entity);
    return this.crudGenerator.generate(entity);
  }

  getRegisteredEntities(): string[] {
    return Array.from(this.registeredEntities.keys());
  }

  getEntity(name: string): EntityDeclaration | undefined {
    return this.registeredEntities.get(name);
  }

  getCRUDOperations(entityName: string): CRUDOperation[] | undefined {
    const entity = this.registeredEntities.get(entityName);
    if (!entity) return undefined;
    return this.crudGenerator.generate(entity);
  }
}
