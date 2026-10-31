import { HttpError } from "./errors.js";
// Argon2 usa 64 MiB por operação. A fila é limitada e acompanha a tarefa,
// inclusive se o cliente desconectar antes do resultado.
export class PasswordWork {
  private active = 0;
  private readonly waiting: (() => void)[] = [];
  constructor(
    private readonly maximum = 2,
    private readonly queueSize = 8,
  ) {}
  async run<T>(job: () => Promise<T>): Promise<T> {
    if (this.active >= this.maximum) {
      if (this.waiting.length >= this.queueSize)
        throw new HttpError(
          503,
          "AUTH_BUSY",
          "Muitas operações de acesso em andamento. Aguarde e tente novamente.",
        );
      await new Promise<void>((resolve) => this.waiting.push(resolve));
    } else this.active++;
    try {
      return await job();
    } finally {
      const next = this.waiting.shift();
      if (next) next();
      else this.active--;
    }
  }
}
