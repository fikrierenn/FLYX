// FLYX Desktop - Electron Main Process
// Electron kurulumu: npm install electron --save-dev
// Baslatma: npx electron ./dist/main/index.js

export interface DesktopConfig {
  width: number;
  height: number;
  minWidth: number;
  minHeight: number;
  title: string;
}

export const defaultConfig: DesktopConfig = {
  width: 1400,
  height: 900,
  minWidth: 1024,
  minHeight: 700,
  title: 'FLYX Platform',
};

export interface MenuTemplate {
  label: string;
  submenu: MenuItemTemplate[];
}

export interface MenuItemTemplate {
  label: string;
  accelerator?: string;
  action?: string;
  type?: 'separator';
  role?: string;
}

export const menuTemplate: MenuTemplate[] = [
  {
    label: 'File',
    submenu: [
      { label: 'New Entity', accelerator: 'CmdOrCtrl+N', action: 'menu:new-entity' },
      { label: 'New Form', accelerator: 'CmdOrCtrl+Shift+N', action: 'menu:new-form' },
      { type: 'separator', label: '' },
      { label: 'Open Project...', accelerator: 'CmdOrCtrl+O', action: 'menu:open-project' },
      { label: 'Save', accelerator: 'CmdOrCtrl+S', action: 'menu:save' },
      { label: 'Save All', accelerator: 'CmdOrCtrl+Shift+S', action: 'menu:save-all' },
      { type: 'separator', label: '' },
      { label: 'Exit', accelerator: 'Alt+F4', role: 'quit' },
    ],
  },
  {
    label: 'Edit',
    submenu: [
      { label: 'Undo', role: 'undo' },
      { label: 'Redo', role: 'redo' },
      { type: 'separator', label: '' },
      { label: 'Cut', role: 'cut' },
      { label: 'Copy', role: 'copy' },
      { label: 'Paste', role: 'paste' },
      { label: 'Select All', role: 'selectAll' },
    ],
  },
  {
    label: 'Design',
    submenu: [
      { label: 'Entity Designer', action: 'navigate:entities' },
      { label: 'Form Designer', action: 'navigate:forms' },
      { label: 'Report Designer', action: 'navigate:reports' },
      { label: 'Workflow Designer', action: 'navigate:workflows' },
      { type: 'separator', label: '' },
      { label: 'Database Explorer', action: 'navigate:database' },
    ],
  },
  {
    label: 'AI',
    submenu: [
      { label: 'Generate Entity...', action: 'ai:generate-entity' },
      { label: 'Generate Module...', action: 'ai:generate-module' },
      { label: 'Improve Code', action: 'ai:improve' },
      { type: 'separator', label: '' },
      { label: 'AI Assistant', accelerator: 'CmdOrCtrl+Shift+A', action: 'ai:assistant' },
    ],
  },
  {
    label: 'Tools',
    submenu: [
      { label: 'Run Migrations', action: 'tools:migrate' },
      { label: 'Build Project', action: 'tools:build' },
      { label: 'Deploy', action: 'tools:deploy' },
      { type: 'separator', label: '' },
      { label: 'Terminal', accelerator: 'CmdOrCtrl+`', action: 'tools:terminal' },
    ],
  },
];

/** Transaction code registry (SAP benzeri) */
export interface TransactionCode {
  code: string;
  name: string;
  module: string;
  route: string;
}

export const transactionCodes: TransactionCode[] = [
  { code: 'VA01', name: 'Create Sales Order', module: 'SD', route: '/forms/sales-order' },
  { code: 'VA02', name: 'Change Sales Order', module: 'SD', route: '/entities/sales-order' },
  { code: 'VA03', name: 'Display Sales Order', module: 'SD', route: '/entities/sales-order/view' },
  { code: 'MM01', name: 'Create Material', module: 'MM', route: '/forms/material' },
  { code: 'XD01', name: 'Create Customer', module: 'SD', route: '/forms/customer' },
  { code: 'FI01', name: 'Create Bank Master', module: 'FI', route: '/forms/bank' },
  { code: 'ME21N', name: 'Create Purchase Order', module: 'MM', route: '/forms/purchase-order' },
  { code: 'MB01', name: 'Goods Receipt', module: 'MM', route: '/forms/goods-receipt' },
];

export function findTransactionCode(code: string): TransactionCode | undefined {
  return transactionCodes.find((t) => t.code.toUpperCase() === code.toUpperCase());
}
