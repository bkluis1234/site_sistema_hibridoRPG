import { config } from 'dotenv';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import assert from 'node:assert/strict';
config({ path: '.env.test', quiet: true });
if (process.platform !== 'linux' || process.env.NODE_ENV !== 'test' || !new URL(process.env.DATABASE_URL ?? 'http://invalid').pathname.endsWith('_test'))
  throw new Error('Ensaio requer Linux e banco de teste dedicado; nunca produção.');
const base = 'http://127.0.0.1:3009';
try { await fetch(base + '/api/health', { signal: AbortSignal.timeout(500) }); throw new Error('Porta de teste ocupada.'); }
catch (e) { if (e.message === 'Porta de teste ocupada.') throw e; }
const memory = { phases: {}, latest: null, samples: 0 };
const server = spawn(process.execPath, ['--import', './scripts/audit-runtime.mjs', 'apps/api/dist/apps/api/src/server.js'], {
  env: { ...process.env, PORT: '3009', NODE_OPTIONS: `${process.env.NODE_OPTIONS ?? ''} --max-old-space-size=192` },
  stdio: ['ignore', 'ignore', 'ignore', 'ipc'],
});
const serverExit = new Promise((resolve) => {
  server.once('error', () => resolve({ code: null, signal: 'spawn_error' }));
  server.once('exit', (code, signal) => resolve({ code, signal }));
});
server.on('message', (m) => {
  if (m?.kind !== 'audit_memory') return;
  memory.samples++;
  memory.latest = m;
  if (m.phase !== 'sample') memory.phases[m.phase] = m;
});
const snapshot = (phase) => { if (server.connected) server.send({ kind: 'audit_snapshot', phase }, () => {}); };
let load, interrupted = false, failed = false;
const interrupt = () => { interrupted = true; load?.kill('SIGTERM'); };
process.once('SIGINT', interrupt);
process.once('SIGTERM', interrupt);
try {
  let ready = false;
  for (let i = 0; i < 40 && !interrupted; i++) {
    if (server.exitCode !== null || server.signalCode) break;
    try { if ((await fetch(base + '/api/ready', { signal: AbortSignal.timeout(1000) })).ok) { ready = true; break; } } catch {}
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  assert(ready && !interrupted, 'Servidor compilado não iniciou ou ensaio interrompido.');
  snapshot('ready');
  load = spawn(process.execPath, ['--import', 'tsx', 'scripts/audit-load.ts', process.argv[2] ?? '300'], {
    env: { ...process.env, AUDIT_BASE_URL: base, AUDIT_SERVER_PID: String(server.pid) },
    stdio: ['ignore', 'inherit', 'inherit', 'ipc'],
  });
  load.on('message', (m) => { if (m?.kind === 'audit_phase') snapshot(m.phase); });
  const code = await new Promise((resolve) => {
    load.once('error', () => resolve(null));
    load.once('exit', resolve);
  });
  failed = code !== 0 || interrupted;
  // Observa recuperação depois dos aborts/limpeza, sem forçar GC ou mascarar RSS.
  await new Promise((resolve) => setTimeout(resolve, 5000));
  snapshot('after_disconnect_idle');
  await new Promise((resolve) => setTimeout(resolve, 200));
  assert.equal(memory.phases.after_disconnect_idle?.streams, 0, 'Streams não foram liberados.');
  if (!failed) assert.equal(memory.latest?.peakStreams, 20, 'Ensaio deve abrir exatamente 20 SSE.');
} catch (error) {
  failed = true;
  console.error(error);
} finally {
  snapshot('before_shutdown');
  await new Promise((resolve) => setTimeout(resolve, 100));
  server.kill('SIGTERM');
  const timer = setTimeout(() => server.kill('SIGKILL'), 12000); timer.unref();
  const exit = await serverExit;
  clearTimeout(timer);
  const report = {
    audit: 'compiled_backend_memory', status: !failed && exit.code === 0 ? 'passed' : 'failed',
    samples: memory.samples, phases: memory.phases, peaks: memory.latest?.peaks,
    heapSizeLimit: memory.latest?.heapSizeLimit, peakStreams: memory.latest?.peakStreams,
    backendExit: exit, processPresentAfterExit: existsSync(`/proc/${server.pid}`),
    restarts: 0, interrupted,
  };
  console.log(JSON.stringify(report));
  if (failed || exit.code !== 0 || report.processPresentAfterExit) process.exitCode = 1;
  process.removeListener('SIGINT', interrupt);
  process.removeListener('SIGTERM', interrupt);
}
