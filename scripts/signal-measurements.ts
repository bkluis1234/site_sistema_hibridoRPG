// Um sinal pode chegar antes da resposta HTTP que revela seu ID ao medidor.
// Registra por evento/cliente e reconcilia depois, sem contar duplicados.
export class SignalMeasurements {
  private readonly events = new Map<string, { start: number; clients: Set<string> }>();
  private readonly arrivals = new Map<string, Map<string, number>>();
  receive(id: string, client: string, at: number) {
    let clients = this.arrivals.get(id);
    if (!clients) { clients = new Map(); this.arrivals.set(id, clients); }
    if (clients.has(client)) return;
    clients.set(client, at);
  }
  publish(id: string, at: number, clients: readonly string[]) {
    if (this.events.has(id)) return;
    this.events.set(id, { start: at, clients: new Set(clients) });
  }
  get latencies(): number[] {
    const values: number[] = [];
    for (const [id, event] of this.events)
      for (const client of event.clients) {
        const at = this.arrivals.get(id)?.get(client);
        if (at !== undefined) values.push(at - event.start);
      }
    return values;
  }
  get missingDeliveries(): { eventId: string; clientId: string }[] {
    const missing: { eventId: string; clientId: string }[] = [];
    for (const [eventId, event] of this.events)
      for (const clientId of event.clients)
        if (!this.arrivals.get(eventId)?.has(clientId)) missing.push({ eventId, clientId });
    return missing;
  }
}
