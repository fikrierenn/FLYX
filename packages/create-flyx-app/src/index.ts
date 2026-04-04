#!/usr/bin/env node

import { Command } from 'commander';
import { createProject } from './utils/create-project.js';

const program = new Command();

program
  .name('create-flyx-app')
  .description('Create a new FLYX Platform application')
  .version('0.1.0')
  .argument('[project-name]', 'Name of the project')
  .option('-t, --template <template>', 'Project template')
  .option('--desktop', 'Include desktop app (1C-style)')
  .option('--ai', 'Include AI-powered features')
  .option('--multi-tenant', 'Enable multi-tenant support')
  .option('--skip-install', 'Skip npm install')
  .action(async (projectName, options) => {
    await createProject(projectName, options);
  });

program.parse();
