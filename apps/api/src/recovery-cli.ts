import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { loadConfig } from "./config.js";
import { createDb } from "./db.js";
import { randomToken, tokenHash } from "./security.js";
import { usernameSchema } from "../../../packages/shared/src/index.js";
if (!stdin.isTTY || !stdout.isTTY)
  throw new Error("Use um terminal interativo seguro.");
const db = createDb(loadConfig());
const rl = createInterface({ input: stdin, output: stdout });
try {
  const actorName = usernameSchema.parse(
    await rl.question("Login ADMIN responsável: "),
  );
  const targetName = usernameSchema.parse(
    await rl.question("Login a recuperar: "),
  );
  const reason = (
    await rl.question(
      "Referência da verificação presencial/voz previamente conhecida (sem dados sensíveis): ",
    )
  ).trim();
  if (reason.length < 10 || reason.length > 500)
    throw new Error(
      "Registre a verificação fora da plataforma antes de continuar.",
    );
  const confirmation = await rl.question(
    "A identidade foi conferida por contato previamente conhecido? Digite VERIFICADO: ",
  );
  if (confirmation !== "VERIFICADO")
    throw new Error("Verificação não confirmada.");
  const code = randomToken();
  await db.$transaction(async (tx) => {
    const actor = await tx.user.findUnique({ where: { username: actorName } });
    const target = await tx.user.findUnique({
      where: { username: targetName },
    });
    if (
      !actor ||
      actor.role !== "ADMIN" ||
      actor.disabledAt ||
      !target ||
      target.disabledAt
    )
      throw new Error("Contas indisponíveis.");
    await tx.$queryRaw`SELECT id FROM users WHERE id=${target.id} FOR UPDATE`;
    await tx.user.update({
      where: { id: target.id },
      data: { version: { increment: 1 } },
    });
    await tx.session.deleteMany({ where: { userId: target.id } });
    await tx.recoveryCode.deleteMany({ where: { userId: target.id } });
    await tx.recoveryCode.create({
      data: {
        userId: target.id,
        codeHash: tokenHash(code),
        expiresAt: new Date(Date.now() + 24 * 3600_000),
      },
    });
    await tx.adminAuditLog.create({
      data: {
        actorId: actor.id,
        action: "RECOVERY_REISSUED",
        targetId: target.id,
        reason,
      },
    });
  });
  stdout.write(
    "Entregue por canal privado à pessoa verificada. Código único de recuperação: " +
      code +
      "\n",
  );
} catch {
  console.error("Recuperação não concluída. Confira os dados e a verificação.");
  process.exitCode = 1;
} finally {
  rl.close();
  await db.$disconnect();
}
