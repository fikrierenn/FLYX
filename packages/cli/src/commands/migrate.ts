import path from 'path';
import fs from 'fs-extra';
import { FSLCompiler } from '@flyx/fsl-compiler';
import { TableGenerator } from '@flyx/database-engine';
import type { EntityDeclaration } from '@flyx/fsl-compiler';

interface MigrateOptions {
  dryRun?: boolean;
}

export async function migrateCommand(options: MigrateOptions) {
  console.log('\nRunning FLYX migrations...\n');

  const compiler = new FSLCompiler();
  const tableGenerator = new TableGenerator();
  const entitiesDir = path.resolve('src/entities');

  if (!(await fs.pathExists(entitiesDir))) {
    console.log('No entities found in src/entities/');
    return;
  }

  const files = (await fs.readdir(entitiesDir)).filter((f) => f.endsWith('.fsl'));
  const allSQL: string[] = [];

  for (const file of files) {
    const source = await fs.readFile(path.join(entitiesDir, file), 'utf-8');
    try {
      const result = compiler.compile(source);
      for (const decl of result.ast) {
        if (decl.type === 'EntityDeclaration') {
          const entity = decl as EntityDeclaration;
          const sql = tableGenerator.generateFullSQL(entity);
          allSQL.push(`-- Entity: ${entity.name} (from ${file})`);
          allSQL.push(sql);
          allSQL.push('');
          console.log(`  Compiled: ${file} → ${entity.name}`);
        }
      }
    } catch (err: any) {
      console.error(`  Error in ${file}: ${err.message}`);
    }
  }

  const migrationSQL = allSQL.join('\n');

  if (options.dryRun) {
    console.log('\n--- DRY RUN (SQL not executed) ---\n');
    console.log(migrationSQL);
  } else {
    // Write migration file
    const timestamp = Date.now();
    const migrationDir = path.resolve('migrations');
    await fs.ensureDir(migrationDir);
    const migrationFile = path.join(migrationDir, `${timestamp}_auto.sql`);
    await fs.writeFile(migrationFile, migrationSQL);
    console.log(`\nMigration written to: migrations/${timestamp}_auto.sql`);
    console.log('Run with your database client to apply.');
  }
}
