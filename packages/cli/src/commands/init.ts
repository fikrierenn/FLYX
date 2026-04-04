import path from 'path';
import fs from 'fs-extra';

interface InitOptions {
  template: string;
  desktop?: boolean;
  mobile?: boolean;
  ai?: boolean;
}

const TEMPLATES: Record<string, { description: string; entities: string[] }> = {
  'erp-starter': {
    description: 'ERP Starter (Customer, Product, Order)',
    entities: ['Customer', 'Product', 'Order', 'Invoice'],
  },
  'crm-starter': {
    description: 'CRM Starter',
    entities: ['Contact', 'Company', 'Deal', 'Activity'],
  },
  'retail-pos': {
    description: 'Retail POS',
    entities: ['Product', 'Sale', 'Payment', 'Inventory'],
  },
  'manufacturing': {
    description: 'Manufacturing',
    entities: ['Product', 'BOM', 'WorkOrder', 'QualityCheck'],
  },
  custom: {
    description: 'Custom (empty project)',
    entities: [],
  },
};

function generateEntityFSL(name: string): string {
  return `entity ${name} {
  fields {
    code: String(50) { required, unique, indexed }
    name: String(200) { required }
    status: Enum {
      values: ["active", "inactive"],
      default: "active"
    }
    created_date: DateTime { default: "NOW()" }
  }

  permissions {
    create: ["admin", "manager"]
    read: ["admin", "manager", "user"]
    update: ["admin", "manager"]
    delete: ["admin"]
  }
}
`;
}

function generateFormFSL(entityName: string): string {
  return `form ${entityName}Form {
  entity: ${entityName}
  layout: "two_column"

  sections {
    main {
      label: "General"
      fields: ["code", "name", "status"]
    }
  }

  actions {
    save { label: "Save", style: "primary" }
    cancel { label: "Cancel" }
  }
}
`;
}

export async function initCommand(name: string | undefined, options: InitOptions) {
  const projectName = name || 'my-flyx-app';
  const projectDir = path.resolve(process.cwd(), projectName);

  console.log(`\nCreating FLYX project: ${projectName}`);
  console.log(`Template: ${TEMPLATES[options.template]?.description || 'Custom'}\n`);

  // Create project structure
  await fs.ensureDir(projectDir);
  await fs.ensureDir(path.join(projectDir, 'src/entities'));
  await fs.ensureDir(path.join(projectDir, 'src/forms'));
  await fs.ensureDir(path.join(projectDir, 'src/reports'));
  await fs.ensureDir(path.join(projectDir, 'src/workflows'));
  await fs.ensureDir(path.join(projectDir, 'src/modules'));
  await fs.ensureDir(path.join(projectDir, 'tests'));

  // Generate package.json
  const pkg = {
    name: projectName,
    version: '0.1.0',
    private: true,
    scripts: {
      dev: 'flyx dev',
      build: 'flyx build',
      test: 'flyx test',
      migrate: 'flyx migrate',
      deploy: 'flyx deploy',
      ...(options.desktop ? { desktop: 'flyx dev --desktop' } : {}),
    },
    dependencies: {
      '@flyx/core': '^0.1.0',
      '@flyx/runtime': '^0.1.0',
      '@flyx/db': '^0.1.0',
      '@flyx/api': '^0.1.0',
      '@flyx/ui': '^0.1.0',
      ...(options.desktop ? { '@flyx/desktop': '^0.1.0' } : {}),
      ...(options.mobile ? { '@flyx/mobile': '^0.1.0' } : {}),
      ...(options.ai ? { '@flyx/ai': '^0.1.0' } : {}),
    },
    devDependencies: {
      '@flyx/cli': '^0.1.0',
      typescript: '^5.4.0',
    },
  };

  await fs.writeJSON(path.join(projectDir, 'package.json'), pkg, { spaces: 2 });

  // Generate flyx.config.ts
  const config = `import { defineConfig } from '@flyx/core';

export default defineConfig({
  name: '${projectName}',
  database: {
    provider: 'postgresql',
    url: process.env.DATABASE_URL || 'postgresql://localhost:5432/${projectName}',
  },
  server: {
    port: 3000,
  },
  features: {
    desktop: ${!!options.desktop},
    mobile: ${!!options.mobile},
    ai: ${!!options.ai},
    multiTenant: true,
  },
});
`;
  await fs.writeFile(path.join(projectDir, 'flyx.config.ts'), config);

  // Generate entities from template
  const template = TEMPLATES[options.template] || TEMPLATES['custom'];
  for (const entityName of template.entities) {
    const entityFSL = generateEntityFSL(entityName);
    const formFSL = generateFormFSL(entityName);

    await fs.writeFile(
      path.join(projectDir, `src/entities/${entityName.toLowerCase()}.fsl`),
      entityFSL,
    );
    await fs.writeFile(
      path.join(projectDir, `src/forms/${entityName.toLowerCase()}-form.fsl`),
      formFSL,
    );
  }

  // Generate .gitignore
  await fs.writeFile(
    path.join(projectDir, '.gitignore'),
    'node_modules/\ndist/\n.env\n.env.local\n*.log\n',
  );

  console.log(`Created ${projectName}/`);
  console.log(`  package.json`);
  console.log(`  flyx.config.ts`);
  for (const e of template.entities) {
    console.log(`  src/entities/${e.toLowerCase()}.fsl`);
    console.log(`  src/forms/${e.toLowerCase()}-form.fsl`);
  }
  console.log(`\nNext steps:`);
  console.log(`  cd ${projectName}`);
  console.log(`  npm install`);
  console.log(`  npm run dev`);
  if (options.desktop) console.log(`  npm run desktop`);
}
