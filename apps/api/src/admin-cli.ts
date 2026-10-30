import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { loadConfig } from "./config.js";
import { createDb } from "./db.js";
import { hashPassword, randomToken, tokenHash } from "./security.js";
import {
  usernameSchema,
  passwordSchema,
} from "../../../packages/shared/src/index.js";

// Entrada bruta impede eco e mantém senha fora de argumentos, histórico e variáveis.
async function hidden(prompt: string): Promise<string> {
  stdout.write(prompt);
  stdin.setRawMode(true);
  stdin.resume();
  return new Promise((resolve, reject) => {
    let value = "";
    const cleanup = () => {
      stdin.off("data", onData);
      stdin.setRawMode(false);
      stdin.pause();
      stdout.write("\n");
    };
    const onData = (data: Buffer) => {
      for (const ch of data.toString("utf8")) {
        if (ch === "\u0003") {
          cleanup();
          reject(new Error("Operação cancelada."));
          return;
        }
        if (ch === "\r" || ch === "\n") {
          cleanup();
          resolve(value);
          return;
        }
        if (ch === "\u007f" || ch === "\b") value = value.slice(0, -1);
        else if (ch >= " ") value += ch;
      }
    };
    stdin.on("data", onData);
  });
}
if (!stdin.isTTY || !stdout.isTTY)
  throw new Error("Execute em terminal interativo seguro no servidor.");
const db = createDb(loadConfig());
try {
  const existing = await db.user.count({ where: { role: "ADMIN" } });
  if (existing)
    throw new Error(
      "Administrador inicial já existe. Nenhuma alteração realizada.",
    );
  const rl = createInterface({ input: stdin, output: stdout });
  const username = usernameSchema.parse(
    await rl.question("Login do administrador inicial: "),
  );
  rl.close();
  const password = passwordSchema.parse(
    await hidden("Senha (mínimo 12 caracteres; entrada oculta): "),
  );
  if (password !== (await hidden("Confirme a senha: ")))
    throw new Error("Senhas diferentes.");
  const codes = Array.from({ length: 8 }, () => randomToken());
  const passwordHash = await hashPassword(password);
  await db.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        username,
        passwordHash,
        role: "ADMIN",
        canCreateCampaigns: true,
        bootstrapKey: "initial-admin",
        recoveryCodes: {
          create: codes.map((code) => ({ codeHash: tokenHash(code) })),
        },
      },
    });
    await tx.adminAuditLog.create({
      data: {
        actorId: user.id,
        action: "INITIAL_ADMIN_CREATED",
        targetId: user.id,
      },
    });
  });
  stdout.write(
    "Administrador criado. Guarde estes códigos fora do servidor; serão exibidos apenas agora.\n" +
      codes.join("\n") +
      "\n",
  );
} catch (error) {
  console.error(
    error instanceof Error && !("code" in error)
      ? error.message
      : "Não foi possível criar o administrador. Nenhuma credencial foi registrada.",
  );
  process.exitCode = 1;
} finally {
  await db.$disconnect();
}
