import { spawn } from 'child_process';

interface DevOptions {
  port: string;
  desktop?: boolean;
}

export async function devCommand(options: DevOptions) {
  console.log(`\nStarting FLYX development server on port ${options.port}...\n`);

  if (options.desktop) {
    console.log('Launching desktop app...');
    // Launch Electron
    const electron = spawn('npx', ['electron', '.'], {
      stdio: 'inherit',
      shell: true,
    });
    electron.on('error', (err) => {
      console.error('Failed to start desktop app:', err.message);
    });
  } else {
    // Start API server
    const server = spawn('npx', ['ts-node', 'src/main.ts'], {
      stdio: 'inherit',
      shell: true,
      env: { ...process.env, PORT: options.port },
    });
    server.on('error', (err) => {
      console.error('Failed to start server:', err.message);
    });
  }
}
