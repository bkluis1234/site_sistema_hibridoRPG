// Um sinal pode chegar antes da resposta HTTP que revela seu ID ao medidor.
// Registra por evento/cliente e reconcilia depois, sem contar duplicados.
export class SignalMeasurements {
  private readonly starts = new Map<string, number>();
  private readonly arrivals = new Map<string, Map<string, number>>();
  readonly latencies: number[] = [];
  receive(id: string, client: string, at: number) {
    let clients = this.arrivals.get(id);
    if (!clients) { clients = new Map(); this.arrivals.set(id, clients); }
    if (clients.has(client)) return;
    clients.set(client, at);
    const start = this.starts.get(id);
    if (start !== undefined) this.latencies.push(at - start);
  }
  publish(id: string, at: number) {
    if (this.starts.has(id)) return;
    this.starts.set(id, at);
    for (const arrival of this.arrivals.get(id)?.values() ?? []) this.latencies.push(arrival - at);
  }
}
