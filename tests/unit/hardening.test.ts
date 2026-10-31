import { describe, it, expect } from "vitest";
import { databasePolicy } from "../../apps/api/src/database-policy.js";
import { StreamLimits } from "../../apps/api/src/stream-limits.js";
import { PasswordWork } from "../../apps/api/src/password-work.js";
const base = {
  DATABASE_URL:
    "mysql://synthetic:placeholder@mysql.example.invalid:3306/origem",
};
describe("política de conexão MySQL", () => {
  it("exige MySQL e não revela a URL nos erros", () => {
    expect(() =>
      databasePolicy({ DATABASE_URL: "https://secret.invalid" }),
    ).toThrow("MySQL");
    expect(() =>
      databasePolicy({ DATABASE_URL: "senha-que-nao-pode-aparecer" }),
    ).toThrow("DATABASE_URL inválida");
  });
  it("bloqueia produção sem TLS", () => {
    expect(() => databasePolicy({ ...base, NODE_ENV: "production" })).toThrow(
      "TLS",
    );
  });
  it("compartilha TLS estrito e CA absoluta entre API e migrações", () => {
    const p = databasePolicy({
      ...base,
      NODE_ENV: "production",
      DATABASE_SSL: "true",
      DATABASE_CA_PATH: "/etc/secrets/ca.pem",
    });
    expect(p.tls).toBe(true);
    const u = new URL(p.prismaUrl);
    expect(u.searchParams.get("sslaccept")).toBe("strict");
    expect(u.searchParams.get("sslcert")).toBe(p.caPath);
    expect(u.hostname).toBe("mysql.example.invalid");
  });
  it("respeita a CA já informada na URL e falha fechado para modos inseguros", () => {
    expect(
      databasePolicy({
        DATABASE_URL:
          base.DATABASE_URL + "?sslcert=/tmp/ca.pem&sslaccept=strict",
      }).tls,
    ).toBe(true);
    for (const query of [
      "sslaccept=accept_invalid_certs",
      "sslmode=disable",
      "sslidentity=client.p12",
      "sslpassword=value",
    ])
      expect(() =>
        databasePolicy({
          ...base,
          DATABASE_URL: base.DATABASE_URL + "?" + query,
        }),
      ).toThrow();
  });
});
describe("limites de SSE", () => {
  it("limita por conta sem impedir outra conta e devolve vagas", () => {
    const l = new StreamLimits(1, 2);
    const a = l.reserve("a")!;
    expect(l.reserve("a")).toBeNull();
    const b = l.reserve("b")!;
    expect(l.reserve("c")).toBeNull();
    a();
    a();
    expect(l.reserve("c")).not.toBeNull();
    expect(l.reserve("d")).toBeNull();
    b();
    expect(l.reserve("d")).not.toBeNull();
  });
});
it("limita trabalho de senha, rejeita excesso e libera a vaga após falha", async () => {
  const gate = new PasswordWork(1, 1);
  let release!: () => void;
  const first = gate.run(
    () =>
      new Promise<void>((resolve) => {
        release = resolve;
      }),
  );
  let started = false;
  const second = gate.run(async () => {
    started = true;
    throw new Error("falha sintética");
  });
  const rejected = expect(second).rejects.toThrow("falha sintética");
  expect(started).toBe(false);
  await expect(gate.run(async () => true)).rejects.toMatchObject({
    status: 503,
    code: "AUTH_BUSY",
  });
  release();
  await first;
  await rejected;
  expect(await gate.run(async () => "livre")).toBe("livre");
});
