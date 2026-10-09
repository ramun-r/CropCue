import { spawn } from 'node:child_process';
import net from 'node:net';
import { fileURLToPath } from 'node:url';

const preferredPort = Number(process.env.PORT ?? process.env.VITE_API_PORT ?? 3005);

function findAvailablePort(startPort) {
  return new Promise((resolve, reject) => {
    const probe = net.createServer();

    probe.once('error', err => {
      if (err.code === 'EADDRINUSE') {
        resolve(findAvailablePort(startPort + 1));
        return;
      }
      reject(err);
    });

    probe.listen(startPort, () => {
      const address = probe.address();
      probe.close(() => resolve(address && typeof address === 'object' ? address.port : startPort));
    });
  });
}

const apiPort = await findAvailablePort(preferredPort);
const env = { ...process.env, PORT: String(apiPort), VITE_API_PORT: String(apiPort) };
const viteCli = fileURLToPath(new URL('../node_modules/vite/bin/vite.js', import.meta.url));
const tsxCli = fileURLToPath(new URL('../node_modules/tsx/dist/cli.mjs', import.meta.url));
const spawnOptions = { stdio: 'inherit', env };

const frontend = spawn(process.execPath, [viteCli, '--host', '0.0.0.0'], spawnOptions);

const backend = spawn(process.execPath, [tsxCli, 'watch', 'server/index.ts'], spawnOptions);

const shutdown = (signal) => {
  frontend.kill(signal);
  backend.kill(signal);
};

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

frontend.on('error', (error) => {
  console.error(`Failed to start frontend: ${error.message}`);
  backend.kill('SIGTERM');
  process.exit(1);
});

backend.on('error', (error) => {
  console.error(`Failed to start backend: ${error.message}`);
  frontend.kill('SIGTERM');
  process.exit(1);
});

frontend.on('exit', (code, signal) => {
  backend.kill(signal ?? 'SIGTERM');
  process.exit(code ?? 0);
});

backend.on('exit', (code, signal) => {
  frontend.kill(signal ?? 'SIGTERM');
  process.exit(code ?? 0);
});

console.log(`Starting CropCue dev stack on API port ${apiPort}.`);
