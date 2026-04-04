import path from 'path';
import fs from 'fs-extra';

interface GenerateOptions {
  module?: string;
}

const GENERATORS: Record<string, (name: string, options: GenerateOptions) => Promise<void>> = {
  entity: generateEntity,
  form: generateForm,
  report: generateReport,
  workflow: generateWorkflow,
  module: generateModule,
};

export async function generateCommand(type: string, name: string, options: GenerateOptions) {
  const generator = GENERATORS[type];
  if (!generator) {
    console.error(`Unknown type: ${type}. Available: entity, form, report, workflow, module`);
    process.exit(1);
  }

  await generator(name, options);
}

async function generateEntity(name: string, _options: GenerateOptions) {
  const fileName = `${name.toLowerCase()}.fsl`;
  const filePath = path.resolve('src/entities', fileName);

  const fsl = `entity ${name} {
  fields {
    code: String(50) { required, unique, indexed }
    name: String(200) { required }
    description: Text
    status: Enum {
      values: ["active", "inactive"],
      default: "active"
    }
  }

  methods {
    get_display_name() {
      return this.code + " - " + this.name;
    }
  }

  permissions {
    create: ["admin", "manager"]
    read: ["admin", "manager", "user"]
    update: ["admin", "manager"]
    delete: ["admin"]
  }

  triggers {
    after_create {
      send_email({
        to: "admin@company.com",
        template: "new_${name.toLowerCase()}"
      });
    }
  }
}
`;

  await fs.ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, fsl);
  console.log(`Created src/entities/${fileName}`);

  // Also generate form
  await generateForm(`${name}Form`, { module: undefined });

  // Also generate test
  const testPath = path.resolve('tests', `${name.toLowerCase()}.test.ts`);
  const test = `import { describe, test, expect } from 'vitest';
import { FSLCompiler } from '@flyx/fsl-compiler';
import { readFileSync } from 'fs';

const compiler = new FSLCompiler();

describe('${name}', () => {
  test('compiles ${name.toLowerCase()}.fsl', () => {
    const source = readFileSync('src/entities/${name.toLowerCase()}.fsl', 'utf-8');
    const result = compiler.compile(source);
    expect(result.ast).toHaveLength(1);
    expect(result.ast[0].type).toBe('EntityDeclaration');
  });
});
`;

  await fs.ensureDir(path.dirname(testPath));
  await fs.writeFile(testPath, test);
  console.log(`Created tests/${name.toLowerCase()}.test.ts`);
}

async function generateForm(name: string, _options: GenerateOptions) {
  const entityName = name.replace(/Form$/, '');
  const fileName = `${name.toLowerCase().replace(/form$/, '-form')}.fsl`;
  const filePath = path.resolve('src/forms', fileName);

  const fsl = `form ${name} {
  entity: ${entityName}
  layout: "two_column"

  sections {
    general {
      label: "General Information"
      fields: ["code", "name", "description"]
    }
    settings {
      label: "Settings"
      fields: ["status"]
    }
  }

  actions {
    save { label: "Save", style: "primary" }
    save_and_new { label: "Save & New" }
    cancel { label: "Cancel" }
  }
}
`;

  await fs.ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, fsl);
  console.log(`Created src/forms/${fileName}`);
}

async function generateReport(name: string, _options: GenerateOptions) {
  const fileName = `${name.toLowerCase()}.fsl`;
  const filePath = path.resolve('src/reports', fileName);

  const fsl = `report ${name} {
  title: "${name.replace(/([A-Z])/g, ' $1').trim()}"

  parameters {
    date_range: DateRange { default: "this_month" }
    status: Enum {
      values: ["all", "active", "inactive"],
      default: "all",
      optional: true
    }
  }

  columns {
    code { label: "Code" }
    name { label: "Name" }
    status { label: "Status" }
  }
}
`;

  await fs.ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, fsl);
  console.log(`Created src/reports/${fileName}`);
}

async function generateWorkflow(name: string, _options: GenerateOptions) {
  const fileName = `${name.toLowerCase()}.fsl`;
  const filePath = path.resolve('src/workflows', fileName);

  const fsl = `workflow ${name} {
  trigger: on_create(Order)

  steps {
    check_amount {
      condition: this.total > 10000

      if_true {
        approval {
          assignee: "finance_director"
          timeout: "2 days"
        }
      }

      if_false {
        auto_approve {
          send_email({
            to: this.customer.email,
            template: "order_approved"
          });
        }
      }
    }
  }
}
`;

  await fs.ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, fsl);
  console.log(`Created src/workflows/${fileName}`);
}

async function generateModule(name: string, _options: GenerateOptions) {
  const moduleDir = path.resolve('src/modules', name.toLowerCase());
  await fs.ensureDir(path.join(moduleDir, 'entities'));
  await fs.ensureDir(path.join(moduleDir, 'forms'));
  await fs.ensureDir(path.join(moduleDir, 'reports'));
  await fs.ensureDir(path.join(moduleDir, 'workflows'));

  // Generate module config
  const config = `module "FLYX:${name}" {
  version: "1.0.0"
  dependencies: ["FLYX:Platform"]
}
`;
  await fs.writeFile(path.join(moduleDir, 'module.fsl'), config);

  console.log(`Created src/modules/${name.toLowerCase()}/`);
  console.log(`  module.fsl`);
  console.log(`  entities/`);
  console.log(`  forms/`);
  console.log(`  reports/`);
  console.log(`  workflows/`);
  console.log(`\nUse: flyx generate entity MyEntity -m ${name}`);
}
