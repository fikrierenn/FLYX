#!/usr/bin/env node

import { Command } from 'commander';
import { initCommand } from './commands/init.js';
import { devCommand } from './commands/dev.js';
import { generateCommand } from './commands/generate.js';
import { buildCommand } from './commands/build.js';
import { migrateCommand } from './commands/migrate.js';

const program = new Command();

program
  .name('flyx')
  .description('FLYX Platform CLI - Enterprise application development toolkit')
  .version('0.1.0');

program
  .command('init')
  .description('Initialize a new FLYX project')
  .argument('[name]', 'Project name')
  .option('-t, --template <template>', 'Project template', 'custom')
  .option('--desktop', 'Include desktop app (Electron)')
  .option('--mobile', 'Include mobile app')
  .option('--ai', 'Include AI features')
  .action(initCommand);

program
  .command('dev')
  .description('Start development server')
  .option('-p, --port <port>', 'Port number', '3000')
  .option('--desktop', 'Launch desktop app')
  .action(devCommand);

program
  .command('generate <type> <name>')
  .alias('g')
  .description('Generate entity, form, report, workflow, or module')
  .option('-m, --module <module>', 'Target module')
  .action(generateCommand);

program
  .command('build')
  .description('Build for production')
  .option('--desktop', 'Build desktop app')
  .option('--mobile', 'Build mobile app')
  .action(buildCommand);

program
  .command('migrate')
  .description('Run database migrations')
  .option('--dry-run', 'Show SQL without executing')
  .action(migrateCommand);

program
  .command('test')
  .description('Run tests')
  .action(() => {
    console.log('Running tests...');
  });

program
  .command('deploy')
  .description('Deploy to FLYX Cloud')
  .option('--staging', 'Deploy to staging')
  .action(() => {
    console.log('Deploying to FLYX Cloud...');
  });

program.parse();
