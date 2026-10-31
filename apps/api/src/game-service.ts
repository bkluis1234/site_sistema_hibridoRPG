import { Prisma, type PrismaClient } from "@prisma/client";
import type { z } from "zod";
import * as schemas from "../../../packages/shared/src/game.js";
import {
  nextGameStatus,
  connectionPresence,
} from "../../../packages/rpg-rules/src/game.js";
import {
  calculateMaxima,
  calculateInventoryUsage,
  calculateInventoryCapacity,
  DEFAULT_ATTRIBUTES,
  type Attributes,
} from "../../../packages/rpg-rules/src/index.js";
import { HttpError } from "./errors.js";
import {
  activeUser,
  member,
  campaignGM,
  checkVersion,
  campaignLog,
  management,
  type Tx,
} from "./management-service.js";
import {
  authorized,
  createRoll,
  effort,
  authorizeRetry,
  audit,
  json,
  saveItem,
} from "./sheet-service.js";
import { rollExpression } from "./dice-engine.js";
import { appendGameEvent } from "./game-events.js";
const missing = () =>
  new HttpError(
    404,
    "NOT_FOUND",
    "Sessão ou registro não encontrado ou não autorizado.",
  );
export async function gameAccess(
  tx: Tx,
  id: string,
  actorId: string,
  gmContext = false,
  write = false,
) {
  await activeUser(tx, actorId);
  const prior = await tx.gameSession.findUnique({
    where: { id },
    select: { campaignId: true },
  });
  if (!prior) throw missing();
  if (write) {
    await tx.$queryRaw`SELECT id FROM campaigns WHERE id=${prior.campaignId} FOR UPDATE`;
    await tx.$queryRaw`SELECT id FROM game_sessions WHERE id=${id} FOR UPDATE`;
  }
  const membership = await member(tx, prior.campaignId, actorId, !write);
  const session = await tx.gameSession.findUniqueOrThrow({ where: { id } });
  const isGM = membership.role === "GM";
  if (gmContext && !isGM)
    throw new HttpError(
      403,
      "GM_REQUIRED",
      "O contexto de mestre exige vínculo GM ativo nesta campanha.",
    );
  return {
    session,
    campaign: membership.campaign,
    isGM,
    gm: isGM && gmContext,
    actorId,
  };
}
export type GameAccess = Awaited<ReturnType<typeof gameAccess>>;
export function requireGM(access: GameAccess) {
  if (!access.isGM)
    throw new HttpError(
      403,
      "GM_REQUIRED",
      "Somente o mestre desta campanha controla esta operação.",
    );
}
export function requireActive(access: GameAccess) {
  if (access.session.status !== "ACTIVE")
    throw new HttpError(
      409,
      "SESSION_NOT_ACTIVE",
      "A sessão precisa estar em andamento para esta ação.",
    );
}
export function requireOpen(access: GameAccess) {
  if (["FINISHED", "CANCELLED"].includes(access.session.status))
    throw new HttpError(
      409,
      "SESSION_CLOSED",
      "Sessão encerrada: apenas consulta.",
    );
}
export async function participant(tx: Tx, a: GameAccess) {
  const p = await tx.sessionParticipant.findUnique({
    where: {
      gameSessionId_userId: { gameSessionId: a.session.id, userId: a.actorId },
    },
  });
  if (!p)
    throw new HttpError(
      403,
      "JOIN_REQUIRED",
      "Entre na sessão antes de realizar ações.",
    );
  return p;
}
export async function gameCharacter(
  tx: Tx,
  a: GameAccess,
  id: string,
  requireJoined = true,
) {
  const c = await tx.character.findFirst({
    where: {
      id,
      campaignId: a.campaign.id,
      archivedAt: null,
      status: { not: "ARCHIVED" },
      owner: {
        disabledAt: null,
        memberships: { some: { campaignId: a.campaign.id, status: "ACTIVE" } },
      },
    },
  });
  if (!c) throw missing();
  if (c.ownerId !== a.actorId && !a.gm) throw missing();
  if (requireJoined && !a.gm) {
    const p = await participant(tx, a);
    if (p.characterId !== id)
      throw new HttpError(
        403,
        "CHARACTER_NOT_PRESENT",
        "Escolha sua ficha ao entrar na sessão.",
      );
  }
  return c;
}
export function eventVisibility(a: GameAccess): Prisma.SessionEventWhereInput {
  return {
    OR: [
      { visibility: "PUBLIC" },
      {
        visibility: "PRIVATE",
        OR: [
          { authorId: a.actorId },
          { recipientId: a.actorId },
          { ownerId: a.actorId },
          ...(a.gm ? [{ privateToGM: true }] : []),
        ],
      },
      ...(a.gm ? [{ visibility: "GM_ONLY" as const }] : []),
    ],
  };
}
export function rollVisibility(a: GameAccess): Prisma.DiceRollWhereInput {
  return {
    OR: [
      { visibility: { in: ["PUBLIC", "GM_SHARED"] } },
      {
        visibility: "PRIVATE",
        OR: [{ userId: a.actorId }, ...(a.gm ? [{ privateToGM: true }] : [])],
      },
      ...(a.gm ? [{ visibility: "GM_ONLY" as const }] : []),
    ],
  };
}
export function noteVisibility(a: GameAccess): Prisma.SessionNoteWhereInput {
  return {
    OR: [
      { visibility: "PUBLIC" },
      { visibility: "PRIVATE", authorId: a.actorId },
      ...(a.gm ? [{ visibility: "GM_ONLY" as const }] : []),
    ],
  };
}
export const eventSelect = {
  id: true,
  type: true,
  category: true,
  visibility: true,
  characterId: true,
  data: true,
  createdAt: true,
  author: { select: { id: true, username: true } },
} satisfies Prisma.SessionEventSelect;
export const rollSelect = {
  id: true,
  characterId: true,
  characterName: true,
  userId: true,
  user: { select: { username: true } },
  expression: true,
  results: true,
  initialResults: true,
  total: true,
  skillKey: true,
  baseTarget: true,
  fatiguePenalty: true,
  contextModifier: true,
  modifierReason: true,
  target: true,
  outcome: true,
  effortMode: true,
  visibility: true,
  privateToGM: true,
  byGM: true,
  category: true,
  version: true,
  finalizedAt: true,
  retryRequestedAt: true,
  retryAuthorizedById: true,
  createdAt: true,
} satisfies Prisma.DiceRollSelect;
export const noteSelect = {
  id: true,
  title: true,
  body: true,
  visibility: true,
  version: true,
  createdAt: true,
  updatedAt: true,
  authorId: true,
  author: { select: { username: true } },
} satisfies Prisma.SessionNoteSelect;
export const publicSession = (s: GameAccess["session"]) => ({
  id: s.id,
  campaignId: s.campaignId,
  title: s.title,
  status: s.status,
  scheduledAt: s.scheduledAt,
  startedAt: s.startedAt,
  finishedAt: s.finishedAt,
  privateRollsToGM: s.privateRollsToGM,
  narrativeSummary: s.narrativeSummary ?? "",
  version: s.version,
  createdAt: s.createdAt,
});
export async function createGame(
  tx: Tx,
  campaignId: string,
  actorId: string,
  input: z.infer<typeof schemas.gameCreateSchema>,
) {
  await campaignGM(tx, campaignId, actorId, true);
  const s = await tx.gameSession.create({
    data: {
      campaignId,
      hostId: actorId,
      title: input.title,
      scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null,
      privateRollsToGM: input.privateRollsToGM,
    },
  });
  await appendGameEvent(
    tx,
    s.id,
    actorId,
    "SESSION_SCHEDULED",
    { title: s.title },
    { category: "ADMINISTRATIVE" },
  );
  await campaignLog(tx, campaignId, actorId, "GAME_SESSION_CREATED", s.id);
  return { session: publicSession(s) };
}
export async function transitionGame(
  tx: Tx,
  a: GameAccess,
  action: string,
  input: z.infer<typeof schemas.gameLifecycleSchema>,
) {
  requireGM(a);
  checkVersion(a.session.version, input.version);
  const next = nextGameStatus(a.session.status, action);
  if (!next)
    throw new HttpError(
      409,
      "SESSION_TRANSITION_INVALID",
      "Esta transição de sessão não está disponível.",
    );
  if (
    (next === "ACTIVE" || next === "PAUSED") &&
    (await tx.gameSession.count({
      where: {
        campaignId: a.campaign.id,
        activeSlot: 1,
        id: { not: a.session.id },
      },
    }))
  )
    throw new HttpError(
      409,
      "SESSION_ALREADY_ACTIVE",
      "A campanha já possui sessão em andamento ou pausada.",
    );
  let snapshot: unknown = undefined;
  if (next === "FINISHED") snapshot = await survivalSnapshot(tx, a);
  const session = await tx.gameSession.update({
    where: { id: a.session.id },
    data: {
      status: next as any,
      activeSlot: ["ACTIVE", "PAUSED"].includes(next) ? 1 : null,
      ...(action === "start" ? { startedAt: new Date() } : {}),
      ...(["FINISHED", "CANCELLED"].includes(next)
        ? { finishedAt: new Date() }
        : {}),
      ...(snapshot ? { snapshot: json(snapshot) } : {}),
      version: { increment: 1 },
    },
  });
  const type = {
    start: "SESSION_STARTED",
    pause: "SESSION_PAUSED",
    resume: "SESSION_RESUMED",
    finish: "SESSION_FINISHED",
    cancel: "SESSION_CANCELLED",
  }[action]!;
  await appendGameEvent(
    tx,
    session.id,
    a.actorId,
    type,
    { status: next, reason: input.reason },
    { category: "ADMINISTRATIVE" },
  );
  await campaignLog(
    tx,
    a.campaign.id,
    a.actorId,
    type,
    session.id,
    { status: a.session.status },
    { status: next },
    input.reason,
  );
  return { session: publicSession(session) };
}
export async function joinGame(
  tx: Tx,
  a: GameAccess,
  input: z.infer<typeof schemas.gameJoinSchema>,
) {
  requireActive(a);
  let character = null;
  if (input.characterId) {
    character = await gameCharacter(tx, a, input.characterId, false);
    if (character.ownerId !== a.actorId)
      throw new HttpError(403, "OWNER_REQUIRED", "Entre com uma ficha sua.");
  } else if (!a.isGM)
    throw new HttpError(
      400,
      "CHARACTER_REQUIRED",
      "Selecione sua ficha vinculada à campanha.",
    );
  const old = await tx.sessionParticipant.findUnique({
    where: {
      gameSessionId_userId: { gameSessionId: a.session.id, userId: a.actorId },
    },
  });
  const p = await tx.sessionParticipant.upsert({
    where: {
      gameSessionId_userId: { gameSessionId: a.session.id, userId: a.actorId },
    },
    create: {
      gameSessionId: a.session.id,
      userId: a.actorId,
      characterId: character?.id,
      characterName: character?.name,
    },
    update: {
      characterId: character?.id ?? null,
      characterName: character?.name ?? null,
      version: { increment: 1 },
    },
  });
  if (!old || old.characterId !== input.characterId)
    await appendGameEvent(
      tx,
      a.session.id,
      a.actorId,
      "PARTICIPANT_JOINED",
      {
        characterId: character?.id ?? null,
        characterName: character?.name ?? null,
      },
      { category: "ADMINISTRATIVE" },
    );
  return {
    participant: { id: p.id, characterId: p.characterId, version: p.version },
  };
}
export async function heartbeat(
  tx: Tx,
  a: GameAccess,
  authSessionId: string,
  input: z.infer<typeof schemas.heartbeatSchema>,
) {
  requireOpen(a);
  await participant(tx, a);
  await tx.presenceRecord.upsert({
    where: {
      gameSessionId_userId_clientId: {
        gameSessionId: a.session.id,
        userId: a.actorId,
        clientId: input.clientId,
      },
    },
    create: {
      gameSessionId: a.session.id,
      userId: a.actorId,
      authSessionId,
      clientId: input.clientId,
      away: input.away,
    },
    update: { lastSeenAt: new Date(), away: input.away, authSessionId },
  });
  return { confirmed: true };
}
export async function roster(tx: Tx, a: GameAccess) {
  const participants = await tx.sessionParticipant.findMany({
    where: {
      gameSessionId: a.session.id,
      user: {
        disabledAt: null,
        memberships: { some: { campaignId: a.campaign.id, status: "ACTIVE" } },
      },
    },
    include: {
      user: { select: { id: true, username: true } },
      character: {
        include: {
          attributes: true,
          resources: true,
          conditionState: true,
          injuries: {
            where: { status: { not: "RESOLVED" } },
            select: { id: true },
          },
        },
      },
    },
    orderBy: { joinedAt: "asc" },
  });
  const records = await tx.presenceRecord.findMany({
    where: {
      gameSessionId: a.session.id,
      lastSeenAt: { gt: new Date(Date.now() - 90000) },
    },
  });
  return participants.map((p) => {
    const c = p.character;
    const accessible = Boolean(
      c &&
        c.campaignId === a.campaign.id &&
        (c.ownerId === a.actorId ||
          a.gm ||
          (a.campaign.shareSheets && c.sharingEnabled)),
    );
    const maxima = c
      ? calculateMaxima(
          Object.fromEntries(
            c.attributes.map((x) => [x.key, x.value]),
          ) as Attributes,
        )
      : null;
    return {
      id: p.id,
      user: p.user,
      characterId: p.characterId,
      characterName: p.characterName,
      joinedAt: p.joinedAt,
      isOwner: c?.ownerId === a.actorId,
      canReadSheet: accessible,
      presence: ["FINISHED", "CANCELLED"].includes(a.session.status)
        ? "OFFLINE"
        : connectionPresence(records.filter((r) => r.userId === p.userId)),
      ...(accessible && c
        ? {
            resources: c.resources.map((r) => ({
              key: r.key,
              current: r.current,
              maximum: maxima![r.key as keyof typeof maxima],
            })),
            conditions: c.conditionState
              ? {
                  fatigue: c.conditionState.fatigue,
                  bleeding: c.conditionState.bleeding,
                  critical: c.conditionState.critical,
                  incapacitated: c.conditionState.incapacitated,
                  successes: c.conditionState.successes,
                  failures: c.conditionState.failures,
                  stabilization: c.conditionState.stabilization,
                }
              : null,
            injuries: c.injuries.length,
          }
        : {}),
    };
  });
}
export async function gameDetails(
  db: PrismaClient,
  id: string,
  actorId: string,
  gm = false,
) {
  const a = await gameAccess(db, id, actorId, gm);
  const p = await db.sessionParticipant.findUnique({
    where: { gameSessionId_userId: { gameSessionId: id, userId: actorId } },
  });
  const host = await db.user.findUniqueOrThrow({
    where: { id: a.session.hostId },
    select: { username: true },
  });
  return {
    session: publicSession(a.session),
    campaign: {
      id: a.campaign.id,
      name: a.campaign.name,
      shareSheets: a.campaign.shareSheets,
    },
    host,
    isGM: a.isGM,
    gmContext: a.gm,
    participation: p
      ? { id: p.id, characterId: p.characterId, version: p.version }
      : null,
    participants: await roster(db, a),
    transfers: {
      enabled: a.campaign.itemTransfersEnabled,
      approvalMode: a.campaign.transferApprovalMode,
      campaignVersion: a.campaign.version,
    },
  };
}
export async function gameEvents(
  tx: Tx,
  a: GameAccess,
  options: { before?: string; after?: string; category?: string } = {},
) {
  const scope: Prisma.SessionEventWhereInput = {
    gameSessionId: a.session.id,
    AND: [eventVisibility(a)],
  };
  let boundary: Prisma.SessionEventWhereInput = {};
  if (options.before || options.after) {
    const cursor = await tx.sessionEvent.findFirst({
      where: { ...scope, id: options.before ?? options.after },
      select: { sequence: true },
    });
    if (!cursor)
      throw new HttpError(
        409,
        "CURSOR_INVALID",
        "Atualize o histórico para recuperar a posição autorizada.",
      );
    boundary = {
      sequence: options.after
        ? { gt: cursor.sequence }
        : { lt: cursor.sequence },
    };
  }
  const entries = await tx.sessionEvent.findMany({
    where: {
      ...scope,
      ...boundary,
      ...(options.category ? { category: options.category } : {}),
    },
    orderBy: { sequence: options.after ? "asc" : "desc" },
    take: 50,
    select: eventSelect,
  });
  return {
    entries,
    nextBefore:
      !options.after && entries.length === 50 ? entries.at(-1)!.id : null,
    nextAfter: options.after
      ? (entries.at(-1)?.id ?? options.after)
      : (entries[0]?.id ?? null),
  };
}
export async function gameRolls(
  tx: Tx,
  a: GameAccess,
  filter = "ALL",
  before?: string,
) {
  const scope: Prisma.DiceRollWhereInput = {
    gameSessionId: a.session.id,
    AND: [rollVisibility(a)],
  };
  let boundary: Prisma.DiceRollWhereInput = {};
  if (before) {
    const cursor = await tx.diceRoll.findFirst({
      where: { ...scope, id: before },
      select: { createdAt: true, id: true },
    });
    if (!cursor)
      throw new HttpError(409, "CURSOR_INVALID", "Atualize as rolagens.");
    boundary = {
      OR: [
        { createdAt: { lt: cursor.createdAt } },
        { createdAt: cursor.createdAt, id: { lt: cursor.id } },
      ],
    };
  }
  const filtered: Prisma.DiceRollWhereInput =
    filter === "MINE"
      ? { userId: a.actorId }
      : filter === "SKILL"
        ? { category: "SKILL" }
        : filter === "DAMAGE"
          ? { category: "DAMAGE" }
          : filter === "GM"
            ? { byGM: true }
            : {};
  const rolls = await tx.diceRoll.findMany({
    where: { ...scope, AND: [rollVisibility(a), boundary, filtered] },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: 50,
    select: rollSelect,
  });
  return { rolls, nextBefore: rolls.length === 50 ? rolls.at(-1)!.id : null };
}
export async function rollPermission(
  tx: Tx,
  a: GameAccess,
  input: z.infer<typeof schemas.gameRollSchema>,
) {
  if (["GM_ONLY", "GM_SHARED"].includes(input.visibility) && !a.gm)
    throw new HttpError(
      403,
      "GM_REQUIRED",
      "Use o contexto de mestre autorizado para esta visibilidade.",
    );
  if (
    (input.contextModifier !== 0 || input.fatigueOverride !== undefined) &&
    !a.gm
  )
    throw new HttpError(
      403,
      "GM_REQUIRED",
      "Modificadores contextuais exigem decisão do mestre.",
    );
  if (input.characterId) await gameCharacter(tx, a, input.characterId);
  else if (!a.gm)
    throw new HttpError(
      403,
      "CHARACTER_REQUIRED",
      "Jogadores rolam com a ficha presente na sessão.",
    );
}
export async function sessionRoll(
  tx: Tx,
  a: GameAccess,
  input: z.infer<typeof schemas.gameRollSchema>,
) {
  requireActive(a);
  await rollPermission(tx, a, input);
  const context = {
    gameSessionId: a.session.id,
    campaignId: a.campaign.id,
    visibility: input.visibility,
    privateToGM: input.visibility === "PRIVATE" && a.session.privateRollsToGM,
    byGM: a.gm,
    category: input.skillKey ? "SKILL" : input.category,
    contextModifier: input.contextModifier,
    modifierReason: input.modifierReason,
  };
  let roll;
  if (input.characterId) {
    await tx.$queryRaw`SELECT id FROM characters WHERE id=${input.characterId} FOR UPDATE`;
    ({ roll } = await createRoll(
      tx,
      input.characterId,
      a.actorId,
      {
        operationId: input.operationId,
        characterId: input.characterId,
        ...(input.skillKey
          ? { skillKey: input.skillKey }
          : { expression: input.expression! }),
        ...(input.fatigueOverride === undefined
          ? {}
          : { fatigueOverride: input.fatigueOverride }),
      },
      context,
    ));
  } else {
    const results = rollExpression(input.expression!);
    roll = await tx.diceRoll.create({
      data: {
        ...context,
        userId: a.actorId,
        expression: input.expression!,
        results,
        initialResults: results,
        total: results.reduce((x, y) => x + y, 0),
        finalizedAt: new Date(),
      },
    });
  }
  await rollEvent(tx, a, roll, "ROLL_CREATED");
  return {
    roll: await tx.diceRoll.findUniqueOrThrow({
      where: { id: roll.id },
      select: rollSelect,
    }),
  };
}
export async function visibleRoll(tx: Tx, a: GameAccess, id: string) {
  const roll = await tx.diceRoll.findFirst({
    where: { gameSessionId: a.session.id, id, AND: [rollVisibility(a)] },
  });
  if (!roll) throw missing();
  return roll;
}
async function rollEvent(
  tx: Tx,
  a: GameAccess,
  roll: Awaited<ReturnType<typeof visibleRoll>>,
  type: string,
) {
  const view = await tx.diceRoll.findUniqueOrThrow({
    where: { id: roll.id },
    select: rollSelect,
  });
  await appendGameEvent(
    tx,
    a.session.id,
    a.actorId,
    type,
    { roll: view },
    {
      visibility: roll.visibility === "GM_SHARED" ? "PUBLIC" : roll.visibility,
      recipientId: roll.userId,
      privateToGM: roll.privateToGM,
      characterId: roll.characterId,
    },
  );
}
export async function rollDecision(
  tx: Tx,
  a: GameAccess,
  id: string,
  input:
    | z.infer<typeof schemas.gameEffortSchema>
    | z.infer<typeof schemas.gameRetrySchema>,
  authorize = false,
) {
  requireActive(a);
  const r = await visibleRoll(tx, a, id);
  if (!r.characterId)
    throw new HttpError(
      400,
      "SKILL_REQUIRED",
      "A decisão exige teste de perícia.",
    );
  await gameCharacter(tx, a, r.characterId, !authorize);
  await tx.$queryRaw`SELECT id FROM characters WHERE id=${r.characterId} FOR UPDATE`;
  let result;
  if (authorize) {
    if (!a.gm)
      throw new HttpError(403, "GM_REQUIRED", "Abra o contexto de mestre.");
    result = await authorizeRetry(
      tx,
      r.characterId,
      a.actorId,
      id,
      input as any,
      true,
      a.session.id,
    );
  } else {
    result = await effort(
      tx,
      r.characterId,
      a.actorId,
      id,
      input as any,
      a.session.id,
    );
    if (
      "action" in input &&
      input.action === "REQUEST_RETRY" &&
      r.visibility === "PRIVATE" &&
      !r.privateToGM
    ) {
      await tx.diceRoll.update({ where: { id }, data: { privateToGM: true } });
    }
  }
  const updated = await tx.diceRoll.findUniqueOrThrow({ where: { id } });
  await rollEvent(tx, a, updated, "ROLL_UPDATED");
  return {
    ...result,
    roll: await tx.diceRoll.findUniqueOrThrow({
      where: { id },
      select: rollSelect,
    }),
  };
}
export async function manualEvent(
  tx: Tx,
  a: GameAccess,
  input: z.infer<typeof schemas.gameEventSchema>,
) {
  requireOpen(a);
  if (input.visibility === "GM_ONLY" && !a.gm)
    throw new HttpError(
      403,
      "GM_REQUIRED",
      "Nota de mestre exige contexto autorizado.",
    );
  if (!a.isGM) await participant(tx, a);
  const event = await appendGameEvent(
    tx,
    a.session.id,
    a.actorId,
    "NARRATIVE_RECORDED",
    { title: input.title, body: input.body },
    { visibility: input.visibility, category: "NARRATIVE" },
  );
  return { id: event.id };
}
export async function notePermission(
  tx: Tx,
  a: GameAccess,
  input: { visibility?: string },
  id?: string,
) {
  if (input.visibility === "GM_ONLY" && !a.gm) throw missing();
  if (!id) return null;
  const note = await tx.sessionNote.findFirst({
    where: { id, gameSessionId: a.session.id, AND: [noteVisibility(a)] },
  });
  if (!note) throw missing();
  if (note.authorId !== a.actorId && !(a.gm && note.visibility !== "PRIVATE"))
    throw missing();
  return note;
}
export async function saveSessionNote(
  tx: Tx,
  a: GameAccess,
  input:
    | z.infer<typeof schemas.gameNoteCreateSchema>
    | z.infer<typeof schemas.gameNoteUpdateSchema>,
  id?: string,
) {
  requireOpen(a);
  const before = await notePermission(tx, a, input, id);
  if (!a.isGM) await participant(tx, a);
  if (before) {
    checkVersion(before.version, (input as any).version);
    if (before.visibility !== input.visibility)
      throw new HttpError(
        409,
        "NOTE_VISIBILITY_LOCKED",
        "Crie outra nota para publicar conteúdo deliberadamente.",
      );
  }
  const note = before
    ? await tx.sessionNote.update({
        where: { id },
        data: {
          title: input.title,
          body: input.body,
          version: { increment: 1 },
        },
      })
    : await tx.sessionNote.create({
        data: {
          gameSessionId: a.session.id,
          authorId: a.actorId,
          title: input.title,
          body: input.body,
          visibility: input.visibility,
        },
      });
  await appendGameEvent(
    tx,
    a.session.id,
    a.actorId,
    before ? "NOTE_UPDATED" : "NOTE_CREATED",
    { noteId: note.id, title: note.title, body: note.body },
    {
      visibility: note.visibility,
      category: "NARRATIVE",
      recipientId: note.authorId,
    },
  );
  return {
    note: await tx.sessionNote.findUniqueOrThrow({
      where: { id: note.id },
      select: noteSelect,
    }),
  };
}
export async function removeSessionNote(
  tx: Tx,
  a: GameAccess,
  id: string,
  input: { version: number },
) {
  requireOpen(a);
  const n = await notePermission(tx, a, {}, id);
  checkVersion(n!.version, input.version);
  await tx.sessionNote.delete({ where: { id } });
  await appendGameEvent(
    tx,
    a.session.id,
    a.actorId,
    "NOTE_DELETED",
    { noteId: id, title: n!.title },
    {
      visibility: n!.visibility,
      category: "NARRATIVE",
      recipientId: n!.authorId,
    },
  );
  return { deleted: true };
}
async function survivalSnapshot(tx: Tx, a: GameAccess) {
  const participants = await roster(tx, { ...a, gm: true });
  const characters = await tx.character.findMany({
    where: {
      id: {
        in: participants.flatMap((p) => (p.characterId ? [p.characterId] : [])),
      },
    },
    select: { id: true, sharingEnabled: true },
  });
  return participants.map((p) => ({
    ...p,
    publicAtFinish:
      a.campaign.shareSheets &&
      Boolean(characters.find((c) => c.id === p.characterId)?.sharingEnabled),
  }));
}

export async function gameSummary(db: PrismaClient, a: GameAccess) {
  if (a.session.status !== "FINISHED")
    throw new HttpError(
      409,
      "SESSION_NOT_FINISHED",
      "O resumo estruturado fica disponível após encerrar a sessão.",
    );
  const events = await db.sessionEvent.groupBy({
    by: ["type", "category"],
    where: { gameSessionId: a.session.id, AND: [eventVisibility(a)] },
    _count: { _all: true },
  });
  const rolls = await db.diceRoll.findMany({
    where: { gameSessionId: a.session.id, AND: [rollVisibility(a)] },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    take: 1000,
    select: rollSelect,
  });
  const notes = await db.sessionNote.findMany({
    where: { gameSessionId: a.session.id, AND: [noteVisibility(a)] },
    orderBy: { createdAt: "asc" },
    take: 200,
    select: noteSelect,
  });
  const snap = Array.isArray(a.session.snapshot)
    ? (a.session.snapshot as any[])
    : [];
  const characters = await db.character.findMany({
    where: {
      id: {
        in: snap.flatMap((x) =>
          typeof x.characterId === "string" ? [x.characterId] : [],
        ),
      },
    },
    select: { id: true, ownerId: true, sharingEnabled: true },
  });
  const participants = snap.map((p) => {
    const c = characters.find((c) => c.id === p.characterId);
    const canView =
      a.gm ||
      p.user.id === a.actorId ||
      (p.publicAtFinish && c?.sharingEnabled);
    const {
      resources,
      conditions,
      injuries,
      publicAtFinish,
      canReadSheet,
      ...base
    } = p;
    return { ...base, ...(canView ? { resources, conditions, injuries } : {}) };
  });
  const latest = await gameEvents(db, a);
  return {
    campaign: { id: a.campaign.id, name: a.campaign.name },
    session: publicSession(a.session),
    participants,
    rolls,
    notes,
    eventCounts: events.map((e) => ({
      type: e.type,
      category: e.category,
      count: e._count._all,
    })),
    recentEvents: latest.entries,
    limits: { rolls: 1000, notes: 200 },
    historyPath: "/sessions/" + a.session.id + "/events",
  };
}
export async function useItem(
  tx: Tx,
  a: GameAccess,
  id: string,
  input: z.infer<typeof schemas.gameItemUseSchema>,
) {
  requireActive(a);
  const c = await gameCharacter(tx, a, input.characterId);
  await tx.$queryRaw`SELECT id FROM characters WHERE id=${c.id} FOR UPDATE`;
  const item = await tx.inventoryItem.findFirst({
    where: { id, characterId: c.id },
  });
  if (!item) throw missing();
  checkVersion(item.version, input.version);
  if (input.quantity > item.quantity)
    throw new HttpError(409, "ITEM_QUANTITY", "Quantidade indisponível.");
  const updated = await tx.inventoryItem.update({
    where: { id },
    data: {
      quantity: { decrement: input.quantity },
      version: { increment: 1 },
    },
  });
  await audit(
    tx,
    c.id,
    a.actorId,
    input.kind === "USE" ? "ITEM_USED" : "ITEM_DISCARDED",
    item,
    updated,
  );
  return { itemId: id, quantity: updated.quantity, version: updated.version };
}
export async function createTransfer(
  tx: Tx,
  a: GameAccess,
  input: z.infer<typeof schemas.transferCreateSchema>,
) {
  requireActive(a);
  if (!a.campaign.itemTransfersEnabled)
    throw new HttpError(
      409,
      "TRANSFERS_DISABLED",
      "Transferências estão desativadas nesta campanha até aprovação do mestre.",
    );
  await participant(tx, a);
  const item = await tx.inventoryItem.findUnique({
    where: { id: input.itemId },
    include: { character: true },
  });
  if (!item || item.character.ownerId !== a.actorId) throw missing();
  await gameCharacter(tx, a, item.characterId);
  checkVersion(item.version, input.version);
  const dest = await tx.character.findFirst({
    where: {
      id: input.destinationCharacterId,
      campaignId: a.campaign.id,
      archivedAt: null,
      status: { not: "ARCHIVED" },
      owner: {
        disabledAt: null,
        memberships: { some: { campaignId: a.campaign.id, status: "ACTIVE" } },
      },
      gameParticipations: { some: { gameSessionId: a.session.id } },
    },
  });
  if (!dest || dest.id === item.characterId || dest.ownerId === a.actorId)
    throw missing();
  if (item.quantity < input.quantity)
    throw new HttpError(409, "ITEM_QUANTITY", "Quantidade indisponível.");
  const transfer = await tx.itemTransfer.create({
    data: {
      gameSessionId: a.session.id,
      sourceCharacterId: item.characterId,
      destinationCharacterId: dest.id,
      sourceItemId: item.id,
      requesterId: a.actorId,
      quantity: input.quantity,
      itemVersion: item.version,
      itemSnapshot: json({
        name: item.name,
        slotsPerUnit: Number(item.slotsPerUnit),
        description: item.description,
        equipment: item.equipment,
        type: item.type,
        damage: item.damage,
      }),
    },
  });
  await appendGameEvent(
    tx,
    a.session.id,
    a.actorId,
    "TRANSFER_REQUESTED",
    { transferId: transfer.id, itemName: item.name, quantity: input.quantity },
    { visibility: "PRIVATE", recipientId: dest.ownerId, privateToGM: true },
  );
  return { id: transfer.id, status: transfer.status };
}
export async function transferPermission(tx: Tx, a: GameAccess, id: string) {
  const t = await tx.itemTransfer.findFirst({
    where: { id, gameSessionId: a.session.id },
    include: { destinationCharacter: { select: { ownerId: true } } },
  });
  if (
    !t ||
    (t.destinationCharacter.ownerId !== a.actorId &&
      !(a.gm && a.campaign.transferApprovalMode === "RECIPIENT_OR_GM"))
  )
    throw missing();
  return t;
}
export async function reviewTransfer(
  tx: Tx,
  a: GameAccess,
  id: string,
  input: z.infer<typeof schemas.transferReviewSchema>,
) {
  requireActive(a);
  if (!a.campaign.itemTransfersEnabled)
    throw new HttpError(
      409,
      "TRANSFERS_DISABLED",
      "Transferências estão desativadas.",
    );
  const t = await transferPermission(tx, a, id);
  checkVersion(t.version, input.version);
  if (t.status !== "PENDING")
    throw new HttpError(409, "TRANSFER_CLOSED", "Transferência já analisada.");
  for (const charId of [t.sourceCharacterId, t.destinationCharacterId].sort())
    await tx.$queryRaw`SELECT id FROM characters WHERE id=${charId} FOR UPDATE`;
  const chars = await tx.character.findMany({
    where: {
      id: { in: [t.sourceCharacterId, t.destinationCharacterId] },
      campaignId: a.campaign.id,
      archivedAt: null,
      status: { not: "ARCHIVED" },
      owner: {
        disabledAt: null,
        memberships: { some: { campaignId: a.campaign.id, status: "ACTIVE" } },
      },
    },
    include: { attributes: true, inventory: true },
  });
  if (chars.length !== 2) throw missing();
  const source = chars.find((c) => c.id === t.sourceCharacterId)!,
    dest = chars.find((c) => c.id === t.destinationCharacterId)!;
  if (source.ownerId !== t.requesterId) throw missing();
  if (input.decision === "APPROVE") {
    const item = source.inventory.find((i) => i.id === t.sourceItemId);
    if (!item) throw missing();
    checkVersion(item.version, t.itemVersion);
    if (item.quantity < t.quantity)
      throw new HttpError(409, "ITEM_QUANTITY", "Quantidade indisponível.");
    const attrs = Object.fromEntries(
      dest.attributes.map((x) => [x.key, x.value]),
    ) as Attributes;
    if (
      calculateInventoryUsage([
        ...dest.inventory.map((i) => ({
          quantity: i.quantity,
          slotsPerUnit: Number(i.slotsPerUnit),
        })),
        { quantity: t.quantity, slotsPerUnit: Number(item.slotsPerUnit) },
      ]) > calculateInventoryCapacity(attrs.FOR)
    )
      throw new HttpError(
        409,
        "CAPACITY_EXCEEDED",
        "O destinatário não possui capacidade disponível.",
      );
    const updated = await tx.inventoryItem.update({
      where: { id: item.id },
      data: { quantity: { decrement: t.quantity }, version: { increment: 1 } },
    });
    const moved = await tx.inventoryItem.create({
      data: {
        characterId: dest.id,
        name: item.name,
        quantity: t.quantity,
        slotsPerUnit: item.slotsPerUnit,
        description: item.description,
        notes: "",
        equipment: item.equipment,
        type: item.type,
        damage: item.damage,
      },
    });
    await audit(tx, source.id, a.actorId, "ITEM_UPDATED", item, updated);
    await audit(tx, dest.id, a.actorId, "ITEM_CREATED", undefined, moved);
  }
  const status = input.decision === "APPROVE" ? "APPROVED" : "REJECTED";
  await tx.itemTransfer.update({
    where: { id },
    data: {
      status,
      reviewerId: a.actorId,
      reviewedAt: new Date(),
      reason: input.reason,
      version: { increment: 1 },
    },
  });
  await appendGameEvent(
    tx,
    a.session.id,
    a.actorId,
    "TRANSFER_" + status,
    { transferId: id, quantity: t.quantity, reason: input.reason },
    {
      visibility: "PRIVATE",
      recipientId: dest.ownerId,
      ownerId: source.ownerId,
      privateToGM: true,
    },
  );
  return { status };
}
