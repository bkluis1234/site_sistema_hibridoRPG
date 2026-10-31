import type { Prisma } from "@prisma/client";
export type GameTx = Prisma.TransactionClient;
const json = (v: unknown) =>
  JSON.parse(JSON.stringify(v)) as Prisma.InputJsonValue;
export async function appendGameEvent(
  tx: GameTx,
  sessionId: string,
  actorId: string,
  type: string,
  data: unknown,
  options: {
    visibility?: "PUBLIC" | "PRIVATE" | "GM_ONLY";
    category?: string;
    recipientId?: string | null;
    ownerId?: string | null;
    privateToGM?: boolean;
    characterId?: string | null;
  } = {},
) {
  const session = await tx.gameSession.update({
    where: { id: sessionId },
    data: { eventSequence: { increment: 1 } },
    select: { eventSequence: true },
  });
  return tx.sessionEvent.create({
    data: {
      gameSessionId: sessionId,
      sequence: session.eventSequence,
      authorId: actorId,
      type,
      data: json(data),
      visibility: options.visibility ?? "PUBLIC",
      category: options.category ?? "MECHANICAL",
      recipientId: options.recipientId,
      ownerId: options.ownerId,
      privateToGM: options.privateToGM ?? false,
      characterId: options.characterId,
    },
  });
}
// Somente projeções mecânicas explícitas. Nunca copiar snapshots de auditoria completos.
export async function captureSheetEvent(
  tx: GameTx,
  character: {
    id: string;
    campaignId: string | null;
    ownerId: string;
    name: string;
    sharingEnabled: boolean;
  },
  actorId: string,
  action: string,
  before: unknown,
  after: unknown,
) {
  if (!character.campaignId) return;
  const allowed = [
    "RESOURCE_CHANGED",
    "CONDITIONS_UPDATED",
    "CRITICAL_CHANGED",
    "CRITICAL_UPDATED",
    "INJURY_CREATED",
    "INJURY_UPDATED",
    "ITEM_CREATED",
    "ITEM_UPDATED",
    "ITEM_DELETED",
    "ITEM_USED",
    "ITEM_DISCARDED",
    "EFFORT_BONUS",
    "EFFORT_RETRY",
    "ATTRIBUTES_UPDATED",
    "TRAINING_UPDATED",
    "FATIGUE_POLICY_UPDATED",
  ];
  if (!allowed.includes(action) && !action.startsWith("CRITICAL_")) return;
  const session = await tx.gameSession.findFirst({
    where: {
      campaignId: character.campaignId,
      status: { in: ["ACTIVE", "PAUSED"] },
    },
  });
  if (!session) return;
  const campaign = await tx.campaign.findUniqueOrThrow({
    where: { id: character.campaignId },
    select: { shareSheets: true },
  });
  const a = (after ?? {}) as Record<string, any>,
    b = (before ?? {}) as Record<string, any>;
  let type = action,
    data: Record<string, unknown> = {
      characterId: character.id,
      characterName: character.name,
    };
  if (action === "RESOURCE_CHANGED") {
    data = {
      ...data,
      resource: a.key,
      previous: b.current,
      current: a.current,
      difference: Number(a.current) - Number(b.current),
      event: a.event,
      conditions: a.conditions
        ? {
            fatigue: a.conditions.fatigue,
            bleeding: a.conditions.bleeding,
            critical: a.conditions.critical,
            successes: a.conditions.successes,
            failures: a.conditions.failures,
            stabilization: a.conditions.stabilization,
          }
        : undefined,
    };
  } else if (action.startsWith("EFFORT_")) {
    type = "RESOURCE_CHANGED";
    data = {
      ...data,
      resource: "PE",
      previous: b.PE,
      current: a.PE,
      difference: Number(a.PE) - Number(b.PE),
    };
  } else if (action.startsWith("ITEM_")) {
    data = {
      ...data,
      itemId: a.id ?? b.id ?? a.itemId,
      name: a.name ?? b.name,
      previousQuantity: b.quantity ?? null,
      quantity: a.quantity ?? (action === "ITEM_DELETED" ? 0 : undefined),
    };
  } else if (action.startsWith("INJURY_")) {
    data = { ...data, injuryId: a.id ?? b.id, status: a.status ?? "ACTIVE" };
  } else if (action === "ATTRIBUTES_UPDATED") {
    for (const adjustment of a.resourceAdjustments ?? []) {
      await appendGameEvent(
        tx,
        session.id,
        actorId,
        "RESOURCE_CHANGED",
        {
          characterId: character.id,
          characterName: character.name,
          resource: adjustment.key,
          previous: adjustment.before,
          current: adjustment.after,
          difference: adjustment.after - adjustment.before,
          previousMaximum: b.maxima?.[adjustment.key],
          maximum: adjustment.maximum,
          event: "DERIVED_ADJUSTMENT",
        },
        {
          visibility:
            campaign.shareSheets && character.sharingEnabled
              ? "PUBLIC"
              : "PRIVATE",
          recipientId: character.ownerId,
          privateToGM: true,
          characterId: character.id,
        },
      );
    }
    data = { ...data, attributesChanged: true };
  } else if (action === "TRAINING_UPDATED") {
    data = { ...data, trainedSkillsChanged: true };
  } else if (action === "FATIGUE_POLICY_UPDATED") {
    data = { ...data, policyChanged: true };
  } else {
    data = {
      ...data,
      conditions: {
        fatigue: a.fatigue,
        bleeding: a.bleeding,
        critical: a.critical,
        incapacitated: a.incapacitated,
        successes: a.successes,
        failures: a.failures,
        stabilization: a.stabilization,
      },
    };
  }
  await appendGameEvent(tx, session.id, actorId, type, data, {
    visibility:
      action === "FATIGUE_POLICY_UPDATED" ||
      (campaign.shareSheets && character.sharingEnabled)
        ? "PUBLIC"
        : "PRIVATE",
    recipientId: character.ownerId,
    privateToGM: true,
    characterId: character.id,
  });
}
