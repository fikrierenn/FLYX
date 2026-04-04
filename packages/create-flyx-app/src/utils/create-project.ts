import path from 'path';
import fs from 'fs-extra';
import { execSync } from 'child_process';

interface CreateOptions {
  template?: string;
  desktop?: boolean;
  ai?: boolean;
  multiTenant?: boolean;
  skipInstall?: boolean;
}

const TEMPLATES = {
  'erp-starter': {
    name: 'ERP Starter (Customer, Product, Order)',
    entities: ['Customer', 'Product', 'Order', 'Invoice'],
  },
  'crm-starter': {
    name: 'CRM Starter',
    entities: ['Contact', 'Company', 'Deal', 'Activity'],
  },
  'retail-pos': {
    name: 'Retail POS',
    entities: ['Product', 'Sale', 'Payment', 'Inventory'],
  },
  'manufacturing': {
    name: 'Manufacturing',
    entities: ['Product', 'BOM', 'WorkOrder', 'QualityCheck'],
  },
  'custom': {
    name: 'Custom (empty)',
    entities: [],
  },
};

export async function createProject(projectName: string | undefined, options: CreateOptions) {
  const name = projectName || 'my-flyx-app';
  const template = options.template || 'erp-starter';
  const tmpl = TEMPLATES[template as keyof typeof TEMPLATES] || TEMPLATES.custom;

  console.log();
  console.log(`  Creating FLYX app: ${name}`);
  console.log(`  Template: ${tmpl.name}`);
  console.log();

  const projectDir = path.resolve(process.cwd(), name);

  if (await fs.pathExists(projectDir)) {
    console.error(`  Error: Directory "${name}" already exists.`);
    process.exit(1);
  }

  // Create dirs
  const dirs = [
    'src/entities', 'src/forms', 'src/reports', 'src/workflows',
    'src/modules', 'tests', 'public',
  ];
  for (const dir of dirs) {
    await fs.ensureDir(path.join(projectDir, dir));
  }

  // package.json
  const pkg = {
    name,
    version: '0.1.0',
    private: true,
    scripts: {
      dev: 'flyx dev',
      build: 'flyx build',
      test: 'vitest run',
      migrate: 'flyx migrate',
      'migrate:dry': 'flyx migrate --dry-run',
      deploy: 'flyx deploy',
      ...(options.desktop ? { desktop: 'flyx dev --desktop' } : {}),
    },
    dependencies: {
      '@flyx/fsl-compiler': '^0.1.0',
      '@flyx/database-engine': '^0.1.0',
      '@flyx/runtime-engine': '^0.1.0',
      '@flyx/platform-core': '^0.1.0',
      '@flyx/ui': '^0.1.0',
      ...(options.desktop ? { '@flyx/desktop': '^0.1.0' } : {}),
      ...(options.ai ? { '@flyx/ai': '^0.1.0' } : {}),
    },
    devDependencies: {
      '@flyx/cli': '^0.1.0',
      typescript: '^5.4.0',
      vitest: '^1.6.0',
    },
  };
  await fs.writeJSON(path.join(projectDir, 'package.json'), pkg, { spaces: 2 });

  // tsconfig.json
  const tsconfig = {
    compilerOptions: {
      target: 'ES2022',
      module: 'NodeNext',
      moduleResolution: 'NodeNext',
      strict: true,
      esModuleInterop: true,
      skipLibCheck: true,
      outDir: './dist',
      rootDir: './src',
    },
    include: ['src'],
  };
  await fs.writeJSON(path.join(projectDir, 'tsconfig.json'), tsconfig, { spaces: 2 });

  // flyx.config.ts
  await fs.writeFile(path.join(projectDir, 'flyx.config.ts'), `export default {
  name: '${name}',
  database: {
    provider: 'postgresql',
    url: process.env.DATABASE_URL || 'postgresql://localhost:5432/${name}',
  },
  server: { port: 3000 },
  features: {
    desktop: ${!!options.desktop},
    ai: ${!!options.ai},
    multiTenant: ${options.multiTenant !== false},
  },
};
`);

  // .gitignore
  await fs.writeFile(path.join(projectDir, '.gitignore'),
    'node_modules/\ndist/\n.env\n.env.local\n*.log\nmigrations/\n');

  // Entity FSL files from template
  for (const entityName of tmpl.entities) {
    await fs.writeFile(path.join(projectDir, `src/entities/${entityName.toLowerCase()}.fsl`),
      `entity ${entityName} {
  fields {
    code: String(50) { required, unique, indexed }
    name: String(200) { required }
    status: Enum {
      values: ["active", "inactive"],
      default: "active"
    }
  }

  permissions {
    create: ["admin", "manager"]
    read: ["admin", "manager", "user"]
    update: ["admin", "manager"]
    delete: ["admin"]
  }
}
`);

    await fs.writeFile(path.join(projectDir, `src/forms/${entityName.toLowerCase()}-form.fsl`),
      `form ${entityName}Form {
  entity: ${entityName}
  layout: "two_column"

  sections {
    main {
      label: "${entityName} Details"
      fields: ["code", "name", "status"]
    }
  }

  actions {
    save { label: "Save", style: "primary" }
    cancel { label: "Cancel" }
  }
}
`);
  }

  // README.md
  await fs.writeFile(path.join(projectDir, 'README.md'), `# ${name}

Built with [FLYX Platform](https://flyx.dev)

## Getting Started

\`\`\`bash
npm run dev          # Start development server
${options.desktop ? 'npm run desktop     # Launch desktop app\n' : ''}npm run migrate:dry  # Preview database migrations
npm run build        # Build for production
\`\`\`

## Project Structure

\`\`\`
src/
  entities/    # FSL entity definitions
  forms/       # FSL form definitions
  reports/     # FSL report definitions
  workflows/   # FSL workflow definitions
  modules/     # Business modules
tests/         # Test files
\`\`\`
`);

  console.log(`  Created ${name}/`);
  console.log(`    package.json`);
  console.log(`    flyx.config.ts`);
  console.log(`    tsconfig.json`);
  for (const e of tmpl.entities) {
    console.log(`    src/entities/${e.toLowerCase()}.fsl`);
    console.log(`    src/forms/${e.toLowerCase()}-form.fsl`);
  }

  // Install
  if (!options.skipInstall) {
    console.log();
    console.log('  Installing dependencies...');
    try {
      execSync('npm install', { cwd: projectDir, stdio: 'inherit' });
      console.log('  Done!');
    } catch {
      console.log('  Skipped install (run npm install manually)');
    }
  }

  console.log();
  console.log(`  Success! Created ${name}`);
  console.log();
  console.log('  Next steps:');
  console.log(`    cd ${name}`);
  console.log('    npm run dev');
  console.log();
}
