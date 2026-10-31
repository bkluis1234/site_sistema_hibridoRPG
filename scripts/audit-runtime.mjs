// Instrumentação local por IPC, carregada apenas pelo ensaio. Nenhuma rota HTTP.
import { Server } from 'node:http';
import { getHeapStatistics } from 'node:v8';
if (process.env.NODE_ENV !== 'test' || typeof process.send !== 'function')
  throw new Error('Instrumentação requer processo de teste com IPC privado.');
const emit = Server.prototype.emit;
let streams = 0, peakStreams = 0;
const peaks = { rss: 0, heapUsed: 0, heapTotal: 0, external: 0, arrayBuffers: 0 };
function sample(phase = 'sample') {
  const memory = process.memoryUsage();
  for (const key of Object.keys(peaks)) peaks[key] = Math.max(peaks[key], memory[key]);
  if (process.connected) process.send({
    kind: 'audit_memory', phase, memory, peaks: { ...peaks },
    heapSizeLimit: getHeapStatistics().heap_size_limit,
    streams, peakStreams, uptimeSeconds: process.uptime(),
  }, () => {});
}
Server.prototype.emit = function (event, ...args) {
  if (event === 'request') {
    const [req, res] = args;
    if (/^\/api\/sessions\/[^/?]+\/stream(?:\?|$)/.test(req.url ?? '')) {
      let counted = false;
      const writeHead = res.writeHead;
      res.writeHead = function (...head) {
        const result = writeHead.apply(this, head);
        if (!counted && this.statusCode === 200 && String(this.getHeader('Content-Type')).startsWith('text/event-stream')) {
          counted = true; streams++; peakStreams = Math.max(peakStreams, streams);
        }
        return result;
      };
      res.once('close', () => { if (counted) { streams--; counted = false; } });
    }
  }
  const result = emit.call(this, event, ...args);
  if (event === 'close') sample('server_closed');
  return result;
};
process.on('message', (m) => {
  if (m?.kind === 'audit_snapshot' && ['ready', 'connected', 'clients_disconnected', 'after_disconnect_idle', 'before_shutdown'].includes(m.phase)) sample(m.phase);
});
const timer = setInterval(() => sample(), 100);
timer.unref();
process.channel?.unref();
process.once('disconnect', () => clearInterval(timer));
sample('boot');
