/**
 * FSL Derleme Servisi
 * ====================
 * FSL kaynak kodunu derleyip AST ve SQL üretimi yapan servis.
 *
 * İki ana endpoint destekler:
 * 1. compile() → FSL kodu → AST (Abstract Syntax Tree)
 * 2. generateSQL() → FSL kodu → PostgreSQL CREATE TABLE ifadeleri
 *
 * Derleme hataları NestJS BadRequestException'a dönüştürülür
 * böylece API istemcisi 400 HTTP yanıtıyla hata detaylarını alır.
 */

import { Injectable, BadRequestException } from '@nestjs/common';
import { FSLCompiler, FSLCompileError } from '@flyx/fsl-compiler';
import type { CompileResult } from '@flyx/fsl-compiler';
import { TableGenerator } from '@flyx/database-engine';
import type { EntityDeclaration } from '@flyx/fsl-compiler';

@Injectable()
export class FSLService {
  private compiler = new FSLCompiler();
  private tableGenerator = new TableGenerator();

  /**
   * FSL kaynak kodunu AST'ye derler.
   * Derleme hatası varsa 400 Bad Request döner.
   */
  compile(source: string): CompileResult {
    try {
      return this.compiler.compile(source);
    } catch (error) {
      if (error instanceof FSLCompileError) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  /**
   * FSL kodundan PostgreSQL SQL ifadeleri üretir.
   * Önce derler, sonra her entity için CREATE TABLE + INDEX + FK üretir.
   */
  generateSQL(source: string): { sql: string; entities: string[] } {
    const result = this.compile(source);
    const sqlParts: string[] = [];
    const entities: string[] = [];

    for (const decl of result.ast) {
      if (decl.type === 'EntityDeclaration') {
        const entity = decl as EntityDeclaration;
        entities.push(entity.name);
        sqlParts.push(this.tableGenerator.generateFullSQL(entity));
      }
    }

    return { sql: sqlParts.join('\n\n'), entities };
  }
}
