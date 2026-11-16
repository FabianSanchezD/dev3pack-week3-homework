import { spawn } from 'node:child_process';
import { createWriteStream } from 'node:fs';
import { access, mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { once } from 'node:events';

const root = fileURLToPath(new URL('../', import.meta.url));
const program = join(root, 'anchor/target/deploy/wallet_counter.so');
await access(program);

// Uso un ledger temporal y compruebo que no haya otro RPC ocupando el puerto.
try {
  await fetch('http://127.0.0.1:8899', { signal: AbortSignal.timeout(1000) });
  throw new Error('Necesito liberar el puerto 8899 antes de iniciar mi validador de pruebas.');
} catch (error) {
  if (error instanceof Error && error.message.startsWith('Necesito liberar')) throw error;
}

const folder = await mkdtemp(join(tmpdir(), 'julia-counter-'));
const output = createWriteStream(join(folder, 'validador.log'));
const validator = spawn('solana-test-validator', [
  '--ledger', join(folder, 'ledger'),
  '--bind-address', '127.0.0.1',
  '--bpf-program', 'BLjHbkRuZczQxXeuKYi3jLVjJj6QDxE4YVSKGv487v61', program,
  '--log',
], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] });
validator.stdout.pipe(output, { end: false });
validator.stderr.pipe(output, { end: false });
let startupError;
validator.on('error', (error) => { startupError = error; });

try {
  let ready = false;
  for (let attempt = 0; attempt < 45; attempt++) {
    if (startupError) throw startupError;
    if (validator.exitCode !== null) throw new Error(`Mi validador terminó; reviso ${folder}/validador.log`);
    try {
      const response = await fetch('http://127.0.0.1:8899', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'getHealth' }),
        signal: AbortSignal.timeout(1000),
      });
      if ((await response.json()).result === 'ok') { ready = true; break; }
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  if (!ready) throw new Error(`Mi validador no respondió; reviso ${folder}/validador.log`);

  const args = process.argv.includes('--demo')
    ? ['--import', 'tsx', 'app/main.ts']
    : ['--import', 'tsx', '--test', '--test-concurrency=1', 'tests/counter.test.ts'];
  const child = spawn(process.execPath, args, { cwd: root, stdio: 'inherit' });
  child.on('error', (error) => { console.error(error); process.exitCode = 1; });
  const [code] = await once(child, 'exit');
  process.exitCode = code ?? 1;
} finally {
  // Detengo únicamente el proceso que inicié para esta ejecución.
  if (validator.exitCode === null && !startupError) {
    const exited = once(validator, 'exit');
    validator.kill('SIGTERM');
    const timeout = setTimeout(() => validator.kill('SIGKILL'), 10_000);
    await exited;
    clearTimeout(timeout);
  }
  output.end();
}
