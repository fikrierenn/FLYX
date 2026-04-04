// FLYX Desktop - Preload Script types
// Electron kuruldugunda contextBridge ile aktif edilecek

export interface FlyxDesktopAPI {
  compileFSL: (source: string) => Promise<any>;
  generateSQL: (source: string) => Promise<string>;
  getTransactionCode: (code: string) => Promise<any>;
  onMenuAction: (callback: (action: string) => void) => void;
}

export const PRELOAD_CHANNELS = [
  'menu:new-entity',
  'menu:new-form',
  'menu:open-project',
  'menu:save',
  'menu:save-all',
  'navigate:entities',
  'navigate:forms',
  'navigate:reports',
  'navigate:workflows',
  'navigate:database',
  'ai:generate-entity',
  'ai:generate-module',
  'ai:improve',
  'ai:assistant',
  'tools:migrate',
  'tools:build',
  'tools:deploy',
  'tools:terminal',
] as const;

export type PreloadChannel = (typeof PRELOAD_CHANNELS)[number];
