// Reserva síncrona: limite por conta e por processo, com liberação idempotente.
export class StreamLimits {
  private readonly actors = new Map<string, number>();
  private total = 0;
  constructor(
    private readonly perActor = 4,
    private readonly maximum = 100,
  ) {}
  reserve(actor: string): (() => void) | null {
    const count = this.actors.get(actor) ?? 0;
    if (count >= this.perActor || this.total >= this.maximum) return null;
    this.actors.set(actor, count + 1);
    this.total++;
    let released = false;
    return () => {
      if (released) return;
      released = true;
      const remaining = (this.actors.get(actor) ?? 1) - 1;
      if (remaining > 0) this.actors.set(actor, remaining);
      else this.actors.delete(actor);
      this.total--;
    };
  }
}
