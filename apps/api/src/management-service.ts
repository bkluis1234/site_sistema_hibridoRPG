import { Prisma, type PrismaClient } from "@prisma/client";
import { HttpError } from "./errors.js";
import {
  json,
  conflict,
  authorized,
  getSheet,
  audit,
  saveAttributes,
  saveSkills,
} from "./sheet-service.js";
import { randomToken, tokenHash, verifyPassword } from "./security.js";
import {
  validateAttributes,
  validateTrainedSkills,
  calculateInventoryUsage,
  calculateInventoryCapacity,
  calculateMaxima,
  type Attributes,
} from "../../../packages/rpg-rules/src/index.js";
import {
  narrativeFields,
  type SharedCharacter,
} from "../../../packages/shared/src/campaigns.js";
export type Tx = Prisma.TransactionClient;
const notFound = () =>
  new HttpError(404, "NOT_FOUND", "Registro não encontrado ou não autorizado.");
const deny = () =>
  new HttpError(403, "FORBIDDEN", "Você não tem permissão para esta operação.");
export const checkVersion = (current: number, given: number) => {
  if (current !== given) throw conflict();
};
export async function activeUser(tx: Tx, userId: string) {
  const u = await tx.user.findUnique({ where: { id: userId } });
  if (!u || u.disabledAt)
    throw new HttpError(401, "UNAUTHENTICATED", "A conta não está disponível.");
  return u;
}
export async function member(
  tx: Tx,
  campaignId: string,
  userId: string,
  allowArchived = true,
) {
  const m = await tx.campaignMember.findUnique({
    where: { campaignId_userId: { campaignId, userId } },
    include: { campaign: true },
  });
  if (
    !m ||
    m.status !== "ACTIVE" ||
    (!allowArchived &&
      (m.campaign.status === "ARCHIVED" || m.campaign.archivedAt))
  )
    throw notFound();
  return m;
}
export async function campaignGM(
  tx: Tx,
  campaignId: string,
  userId: string,
  write = false,
) {
  if (write)
    await tx.$queryRaw`SELECT id FROM campaigns WHERE id=${campaignId} FOR UPDATE`;
  const m = await member(tx, campaignId, userId, !write);
  if (m.role !== "GM") throw deny();
  return m.campaign;
}
export async function administration(tx: Tx, userId: string) {
  await tx.$queryRaw`SELECT id FROM platform_settings WHERE id='global' FOR UPDATE`;
  const user = await activeUser(tx, userId);
  if (user.role !== "ADMIN") throw deny();
  return user;
}
function redactSecrets(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redactSecrets);
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value)
        .filter(([k]) => !["code", "token", "stepUpToken"].includes(k))
        .map(([k, v]) => [k, redactSecrets(v)]),
    );
  return value;
}
export async function management<T>(
  db: PrismaClient,
  actorId: string,
  action: string,
  input: { operationId: string },
  permission: (tx: Tx) => Promise<T>,
  handler: (tx: Tx, context: T) => Promise<unknown>,
): Promise<any> {
  const hash = tokenHash(JSON.stringify({ actorId, action, input }));
  const run = () =>
    db.$transaction(
      async (tx) => {
        await activeUser(tx, actorId);
        const context = await permission(tx);
        const known = await tx.managementOperation.findUnique({
          where: {
            actorId_operationId: { actorId, operationId: input.operationId },
          },
        });
        if (known) {
          if (known.requestHash !== hash)
            throw new HttpError(
              409,
              "OPERATION_REUSED",
              "Esta operação já foi usada com outro conteúdo.",
            );
          return known.result;
        }
        const operation = await tx.managementOperation.create({
          data: { actorId, operationId: input.operationId, requestHash: hash },
        });
        const result = await handler(tx, context);
        await tx.managementOperation.update({
          where: { id: operation.id },
          data: { result: json(redactSecrets(result)) },
        });
        return result;
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
        maxWait: 10000,
        timeout: 15000,
      },
    );
  try {
    return await run();
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const known = await db.managementOperation.findUnique({
        where: {
          actorId_operationId: { actorId, operationId: input.operationId },
        },
      });
      if (known) return run();
    }
    throw error;
  }
}
export async function campaignLog(
  tx: Tx,
  campaignId: string,
  actorId: string,
  action: string,
  targetId?: string,
  before?: unknown,
  after?: unknown,
  reason?: string,
) {
  await tx.campaignAuditLog.create({
    data: {
      campaignId,
      actorId,
      action,
      targetId,
      ...(before === undefined ? {} : { beforeData: json(before) }),
      ...(after === undefined ? {} : { afterData: json(after) }),
      reason,
    },
  });
}
export async function notify(
  tx: Tx,
  userId: string,
  message: string,
  linkPath: string,
) {
  await tx.notification.create({ data: { userId, message, linkPath } });
}
export async function notifyGMs(tx: Tx, campaignId: string, message: string) {
  const ms = await tx.campaignMember.findMany({
    where: {
      campaignId,
      role: "GM",
      status: "ACTIVE",
      user: { disabledAt: null },
    },
    select: { userId: true },
  });
  for (const m of ms)
    await notify(tx, m.userId, message, "/campaigns/" + campaignId + "/gm");
}
export async function listCampaigns(db: PrismaClient, userId: string) {
  const memberships = await db.campaignMember.findMany({
    where: { userId, status: { in: ["ACTIVE", "PENDING"] } },
    include: {
      campaign: {
        select: {
          id: true,
          name: true,
          status: true,
          systemVersion: true,
          version: true,
        },
      },
    },
    orderBy: { updatedAt: "desc" },
    take: 100,
  });
  return memberships.map((m) => ({
    ...m.campaign,
    role: m.role,
    membershipStatus: m.status,
  }));
}
export async function createCampaign(tx: Tx, userId: string, input: any) {
  const user = await activeUser(tx, userId);
  const settings = await tx.platformSettings.findUniqueOrThrow({
    where: { id: "global" },
  });
  if (
    !settings.campaignCreationEnabled ||
    (!user.canCreateCampaigns && user.role !== "ADMIN")
  )
    throw deny();
  const { operationId, ...data } = input;
  const c = await tx.campaign.create({
    data: {
      ...data,
      ownerId: userId,
      systemVersion: "2.6",
      members: { create: { userId, role: "GM", status: "ACTIVE" } },
    },
  });
  await campaignLog(tx, c.id, userId, "CAMPAIGN_CREATED", c.id, undefined, {
    name: c.name,
    status: c.status,
  });
  return {
    campaign: { id: c.id, name: c.name, status: c.status, version: c.version },
  };
}
export async function updateCampaign(
  tx: Tx,
  campaignId: string,
  userId: string,
  input: any,
) {
  const c = await campaignGM(tx, campaignId, userId, true);
  checkVersion(c.version, input.version);
  const { operationId, version, ...data } = input;
  const result = await tx.campaign.update({
    where: { id: campaignId },
    data: {
      ...data,
      archivedAt: data.status === "ARCHIVED" ? new Date() : null,
      version: { increment: 1 },
    },
  });
  await campaignLog(
    tx,
    campaignId,
    userId,
    "CAMPAIGN_UPDATED",
    campaignId,
    { name: c.name, status: c.status, shareSheets: c.shareSheets },
    {
      name: result.name,
      status: result.status,
      shareSheets: result.shareSheets,
    },
  );
  return { version: result.version };
}
export async function campaignDetails(
  db: PrismaClient,
  campaignId: string,
  userId: string,
  gm = false,
) {
  return db.$transaction(async (tx) => {
    const m = await tx.campaignMember.findUnique({
      where: { campaignId_userId: { campaignId, userId } },
    });
    if (!m) throw notFound();
    const c = await tx.campaign.findUniqueOrThrow({
      where: { id: campaignId },
    });
    if (gm && (m.status !== "ACTIVE" || m.role !== "GM")) throw deny();
    if (m.status !== "ACTIVE")
      return {
        campaign: {
          id: c.id,
          name: c.name,
          status: c.status,
          version: c.version,
          role: m.role,
          membershipStatus: m.status,
        },
        pending: true,
      };
    if (gm && m.role !== "GM") throw deny();
    const members = await tx.campaignMember.findMany({
      where: {
        campaignId,
        ...(gm ? {} : { status: "ACTIVE", user: { disabledAt: null } }),
      },
      select: {
        id: true,
        userId: true,
        role: true,
        status: true,
        version: true,
        user: { select: { username: true, disabledAt: true } },
      },
      orderBy: { createdAt: "asc" },
    });
    const activeIds = members
      .filter((x) => x.status === "ACTIVE" && !x.user.disabledAt)
      .map((x) => x.userId);
    const chars = await tx.character.findMany({
      where: {
        campaignId,
        ...(gm
          ? {}
          : {
              ownerId: { in: activeIds },
              OR: [
                { ownerId: userId },
                ...(c.shareSheets ? [{ sharingEnabled: true }] : []),
              ],
            }),
      },
      select: {
        id: true,
        name: true,
        nickname: true,
        profession: true,
        status: true,
        version: true,
        ownerId: true,
        sharingEnabled: true,
        owner: { select: { username: true } },
        ...(gm
          ? {
              resources: { select: { key: true, current: true } },
              conditionState: {
                select: {
                  fatigue: true,
                  bleeding: true,
                  critical: true,
                  stabilization: true,
                },
              },
            }
          : {}),
      },
      orderBy: { name: "asc" },
    });
    const attributeRows = gm
      ? await tx.characterAttribute.findMany({
          where: { characterId: { in: chars.map((ch) => ch.id) } },
          select: { characterId: true, key: true, value: true },
        })
      : [];
    return {
      campaign: {
        id: c.id,
        name: c.name,
        description: c.description ?? "",
        notices: c.notices ?? "",
        status: c.status,
        systemVersion: c.systemVersion,
        shareSheets: c.shareSheets,
        version: c.version,
        role: m.role,
        membershipStatus: m.status,
        ...(gm ? { gmNotes: c.gmNotes ?? "" } : {}),
      },
      members: members.map((x) => ({
        ...x,
        user: { username: x.user.username },
        ...(gm ? { disabled: Boolean(x.user.disabledAt) } : {}),
      })),
      characters: chars.map((x) => {
        const maxima = gm
          ? calculateMaxima(
              Object.fromEntries(
                attributeRows
                  .filter((a) => a.characterId === x.id)
                  .map((a) => [a.key, a.value]),
              ) as Attributes,
            )
          : null;
        return {
          ...x,
          ...(gm
            ? {
                resources: (x as any).resources?.map((r: any) => ({
                  ...r,
                  maximum: maxima![r.key as keyof typeof maxima],
                })),
              }
            : {}),
          isOwner: x.ownerId === userId,
          readOnly: x.ownerId !== userId,
        };
      }),
      pending: false,
    };
  });
}
export async function createInvite(
  tx: Tx,
  campaignId: string,
  userId: string,
  input: any,
) {
  const c = await campaignGM(tx, campaignId, userId, true);
  if (!["ACTIVE", "PAUSED"].includes(c.status))
    throw new HttpError(
      409,
      "CAMPAIGN_INACTIVE",
      "Ative a campanha antes de convidar jogadores.",
    );
  const code = randomToken();
  const invite = await tx.campaignInvite.create({
    data: {
      campaignId,
      createdById: userId,
      codeHash: tokenHash(code),
      role: "PLAYER",
      expiresAt: new Date(Date.now() + input.expiresInHours * 3600000),
      maxUses: input.maxUses,
    },
  });
  await campaignLog(
    tx,
    campaignId,
    userId,
    "PLAYER_INVITE_CREATED",
    invite.id,
    undefined,
    { expiresAt: invite.expiresAt, maxUses: invite.maxUses },
  );
  return {
    invite: {
      id: invite.id,
      expiresAt: invite.expiresAt,
      maxUses: invite.maxUses,
      useCount: 0,
      version: invite.version,
    },
    code,
  };
}
export async function joinCampaign(tx: Tx, userId: string, code: string) {
  const i = await tx.campaignInvite.findUnique({
    where: { codeHash: tokenHash(code) },
  });
  if (!i)
    throw new HttpError(
      400,
      "INVITE_INVALID",
      "Convite inválido ou indisponível.",
    );
  await tx.$queryRaw`SELECT id FROM campaigns WHERE id=${i.campaignId} FOR UPDATE`;
  const invite = await tx.campaignInvite.findUniqueOrThrow({
    where: { id: i.id },
    include: { campaign: true },
  });
  if (
    invite.revokedAt ||
    invite.expiresAt <= new Date() ||
    invite.useCount >= invite.maxUses ||
    !["ACTIVE", "PAUSED"].includes(invite.campaign.status) ||
    invite.campaign.archivedAt
  )
    throw new HttpError(
      400,
      "INVITE_INVALID",
      "Convite inválido ou indisponível.",
    );
  const existing = await tx.campaignMember.findUnique({
    where: { campaignId_userId: { campaignId: invite.campaignId, userId } },
  });
  if (existing && ["ACTIVE", "PENDING"].includes(existing.status))
    return { campaignId: invite.campaignId, status: existing.status };
  const consumed = await tx.campaignInvite.updateMany({
    where: {
      id: invite.id,
      revokedAt: null,
      expiresAt: { gt: new Date() },
      useCount: { lt: invite.maxUses },
    },
    data: {
      useCount: { increment: 1 },
      usedAt: new Date(),
      version: { increment: 1 },
    },
  });
  if (!consumed.count)
    throw new HttpError(
      400,
      "INVITE_INVALID",
      "Convite inválido ou indisponível.",
    );
  await tx.campaignMember.upsert({
    where: { campaignId_userId: { campaignId: invite.campaignId, userId } },
    create: {
      campaignId: invite.campaignId,
      userId,
      role: "PLAYER",
      status: "PENDING",
    },
    update: { role: "PLAYER", status: "PENDING", version: { increment: 1 } },
  });
  await campaignLog(
    tx,
    invite.campaignId,
    userId,
    "MEMBERSHIP_REQUESTED",
    userId,
  );
  await notifyGMs(
    tx,
    invite.campaignId,
    "Há uma nova solicitação de participação.",
  );
  return { campaignId: invite.campaignId, status: "PENDING" };
}
export async function reviewMember(
  tx: Tx,
  campaignId: string,
  userId: string,
  targetId: string,
  input: any,
) {
  await campaignGM(tx, campaignId, userId, true);
  const m = await tx.campaignMember.findUnique({
    where: { campaignId_userId: { campaignId, userId: targetId } },
  });
  if (!m) throw notFound();
  checkVersion(m.version, input.version);
  if (m.role === "GM")
    throw new HttpError(
      409,
      "GM_PROTECTED",
      "Papéis de mestre são administrados pela plataforma; preserve ao menos um GM ativo.",
    );
  if (input.decision !== "REMOVE" && m.status !== "PENDING")
    throw new HttpError(
      409,
      "MEMBERSHIP_STATE",
      "A solicitação já foi analisada.",
    );
  const status =
    input.decision === "ACCEPT"
      ? "ACTIVE"
      : input.decision === "REJECT"
        ? "REJECTED"
        : "REMOVED";
  if (status === "REMOVED") {
    const chars = await tx.character.findMany({
      where: { campaignId, ownerId: targetId },
      select: { id: true },
    });
    for (const char of chars) {
      await tx.$queryRaw`SELECT id FROM characters WHERE id=${char.id} FOR UPDATE`;
      await tx.character.update({
        where: { id: char.id },
        data: { campaignId: null },
      });
      await audit(
        tx,
        char.id,
        userId,
        "CAMPAIGN_UNLINKED",
        { campaignId },
        { campaignId: null },
        { reason: input.reason },
      );
    }
  }
  await tx.campaignMember.update({
    where: { id: m.id },
    data: { status, version: { increment: 1 } },
  });
  await campaignLog(
    tx,
    campaignId,
    userId,
    "MEMBER_" + status,
    targetId,
    { status: m.status },
    { status },
    input.reason,
  );
  await notify(
    tx,
    targetId,
    status === "ACTIVE"
      ? "Sua participação na campanha foi aceita."
      : status === "REJECTED"
        ? "Sua solicitação de participação foi recusada."
        : "Seu vínculo com a campanha foi removido; sua ficha foi preservada.",
    "/campaigns/" + campaignId,
  );
  return { status };
}
export async function linkCharacter(
  tx: Tx,
  campaignId: string,
  userId: string,
  input: any,
  unlink = false,
) {
  await tx.$queryRaw`SELECT id FROM campaigns WHERE id=${campaignId} FOR UPDATE`;
  const membership = await member(tx, campaignId, userId, false);
  await tx.$queryRaw`SELECT id FROM characters WHERE id=${input.characterId} FOR UPDATE`;
  const c = await tx.character.findUnique({ where: { id: input.characterId } });
  if (!c) throw notFound();
  if (c.ownerId !== userId && membership.role !== "GM") throw deny();
  checkVersion(c.version, input.version);
  if (c.status === "ARCHIVED" || c.archivedAt)
    throw new HttpError(
      409,
      "ARCHIVED",
      "Ficha arquivada não pode ser vinculada.",
    );
  if (unlink) {
    if (c.campaignId !== campaignId) throw notFound();
  } else {
    await member(tx, campaignId, c.ownerId);
    if (c.campaignId && c.campaignId !== campaignId)
      throw new HttpError(
        409,
        "CHARACTER_LINKED",
        "A ficha já pertence a outra campanha.",
      );
  }
  await tx.character.update({
    where: { id: c.id },
    data: { campaignId: unlink ? null : campaignId },
  });
  await audit(
    tx,
    c.id,
    userId,
    unlink ? "CAMPAIGN_UNLINKED" : "CAMPAIGN_LINKED",
    { campaignId: c.campaignId },
    { campaignId: unlink ? null : campaignId },
  );
  await campaignLog(
    tx,
    campaignId,
    userId,
    unlink ? "CHARACTER_UNLINKED" : "CHARACTER_LINKED",
    c.id,
  );
  return { characterId: c.id, campaignId: unlink ? null : campaignId };
}
export async function validateFinal(tx: Tx, id: string) {
  const c = await tx.character.findUniqueOrThrow({
    where: { id },
    include: { attributes: true, skills: true, inventory: true },
  });
  const a = Object.fromEntries(
    c.attributes.map((x) => [x.key, x.value]),
  ) as Attributes;
  const errors = validateAttributes(a, true).errors;
  if (
    !validateTrainedSkills(
      c.skills.filter((x) => x.trained).map((x) => x.key),
      true,
    ).valid
  )
    errors.push("Selecione exatamente quatro perícias.");
  if (
    calculateInventoryUsage(
      c.inventory.map((x) => ({
        quantity: x.quantity,
        slotsPerUnit: Number(x.slotsPerUnit),
      })),
    ) > calculateInventoryCapacity(a.FOR)
  )
    errors.push("Resolva o excesso de carga.");
  if (!c.name.trim()) errors.push("Informe o nome.");
  if (errors.length)
    throw new HttpError(400, "SHEET_INVALID", errors.join(" "));
  return c;
}
export async function approveCharacter(
  tx: Tx,
  id: string,
  actorId: string,
  input: any,
) {
  const access = await authorized(tx, id, actorId, true);
  if (!access.isGM || !access.character.campaignId) throw deny();
  const c = access.character;
  await member(tx, c.campaignId!, actorId, false);
  checkVersion(c.version, input.version);
  if (c.status !== "PENDING_APPROVAL")
    throw new HttpError(
      409,
      "STATUS_INVALID",
      "A ficha não aguarda aprovação.",
    );
  if (input.decision === "APPROVE") await validateFinal(tx, id);
  const status = input.decision === "APPROVE" ? "APPROVED" : "DRAFT";
  await tx.character.update({ where: { id }, data: { status } });
  await audit(
    tx,
    id,
    actorId,
    input.decision === "APPROVE"
      ? "CHARACTER_APPROVED"
      : "CHARACTER_CORRECTION_REQUESTED",
    { status: c.status },
    { status },
    { reason: input.comment },
  );
  await campaignLog(
    tx,
    c.campaignId!,
    actorId,
    "CHARACTER_REVIEWED",
    id,
    { status: c.status },
    { status },
    input.comment,
  );
  await notify(
    tx,
    c.ownerId,
    input.decision === "APPROVE"
      ? "Sua ficha foi aprovada pelo mestre."
      : "O mestre solicitou correções na sua ficha.",
    "/characters/" + id,
  );
  return { status };
}
export async function requestChange(
  tx: Tx,
  id: string,
  actorId: string,
  input: any,
) {
  const c = await tx.character.findUniqueOrThrow({ where: { id } });
  if (c.ownerId !== actorId) throw deny();
  if (c.status !== "APPROVED" || !c.campaignId)
    throw new HttpError(
      409,
      "CHANGE_NOT_AVAILABLE",
      "Solicitações exigem ficha aprovada e vinculada a uma campanha.",
    );
  await member(tx, c.campaignId, actorId, false);
  const base =
    input.change.kind === "ATTRIBUTES" ? c.attributesVersion : c.skillsVersion;
  checkVersion(base, input.version);
  if (
    await tx.characterChangeRequest.count({
      where: { characterId: id, kind: input.change.kind, status: "PENDING" },
    })
  )
    throw new HttpError(
      409,
      "REQUEST_PENDING",
      "Já existe uma solicitação pendente deste tipo.",
    );
  if (
    input.change.kind === "ATTRIBUTES" &&
    !validateAttributes(input.change.attributes, true).valid
  )
    throw new HttpError(
      400,
      "ATTRIBUTES_INVALID",
      "A distribuição deve permanecer válida.",
    );
  if (
    input.change.kind === "SKILLS" &&
    !validateTrainedSkills(input.change.trained, true).valid
  )
    throw new HttpError(
      400,
      "SKILLS_INVALID",
      "Escolha quatro perícias distintas.",
    );
  const change = await tx.characterChangeRequest.create({
    data: {
      characterId: id,
      requesterId: actorId,
      baseVersion: base,
      kind: input.change.kind,
      patch: json(input.change),
      reason: input.reason,
    },
  });
  await audit(
    tx,
    id,
    actorId,
    "CHANGE_REQUESTED",
    undefined,
    { id: change.id, kind: change.kind },
    { reason: input.reason },
  );
  await notifyGMs(
    tx,
    c.campaignId,
    "Há uma nova solicitação de alteração mecânica.",
  );
  return { request: { id: change.id, status: change.status } };
}
export async function reviewChange(
  tx: Tx,
  id: string,
  actorId: string,
  requestId: string,
  input: any,
) {
  const access = await authorized(tx, id, actorId, true);
  if (!access.isGM) throw deny();
  await member(tx, access.character.campaignId!, actorId, false);
  const row = await tx.characterChangeRequest.findFirst({
    where: { id: requestId, characterId: id },
  });
  if (!row) throw notFound();
  checkVersion(row.version, input.version);
  if (row.status !== "PENDING")
    throw new HttpError(
      409,
      "REQUEST_CLOSED",
      "A solicitação já foi analisada.",
    );
  if (access.character.status !== "APPROVED")
    throw new HttpError(
      409,
      "STATUS_INVALID",
      "A ficha precisa permanecer aprovada.",
    );
  if (input.decision === "APPROVE") {
    const patch = row.patch as any;
    const domain =
      patch.kind === "ATTRIBUTES"
        ? access.character.attributesVersion
        : access.character.skillsVersion;
    checkVersion(domain, row.baseVersion);
    const op = {
      operationId: input.operationId,
      version: row.baseVersion,
      reason: input.comment,
    };
    if (patch.kind === "ATTRIBUTES")
      await saveAttributes(tx, id, actorId, {
        ...op,
        attributes: patch.attributes,
      });
    else if (patch.kind === "SKILLS")
      await saveSkills(tx, id, actorId, { ...op, trained: patch.trained });
    else
      throw new HttpError(
        400,
        "CHANGE_INVALID",
        "Tipo de alteração não suportado.",
      );
    await validateFinal(tx, id);
  }
  const status = input.decision === "APPROVE" ? "APPROVED" : "REJECTED";
  await tx.characterChangeRequest.update({
    where: { id: requestId },
    data: {
      status,
      reviewerId: actorId,
      reviewedAt: new Date(),
      reviewComment: input.comment,
      version: { increment: 1 },
    },
  });
  await audit(
    tx,
    id,
    actorId,
    "CHANGE_" + status,
    { requestId, status: row.status },
    { requestId, status },
    { reason: input.comment },
  );
  await notify(
    tx,
    access.character.ownerId,
    status === "APPROVED"
      ? "Sua alteração mecânica foi aprovada."
      : "Sua alteração mecânica foi recusada.",
    "/characters/" + id,
  );
  return { status };
}
export async function sharedCharacter(
  db: PrismaClient,
  campaignId: string,
  id: string,
  actorId: string,
): Promise<SharedCharacter> {
  await member(db, campaignId, actorId);
  const c = await db.character.findFirst({
    where: { id, campaignId },
    select: { ownerId: true, sharingEnabled: true, publicFields: true },
  });
  if (!c) throw notFound();
  await member(db, campaignId, c.ownerId);
  const camp = await db.campaign.findUniqueOrThrow({
    where: { id: campaignId },
  });
  if (c.ownerId !== actorId && (!camp.shareSheets || !c.sharingEnabled))
    throw notFound();
  const s = await getSheet(db, id, c.ownerId);
  const fields = Array.isArray(c.publicFields) ? c.publicFields : [];
  const narratives: Record<string, string> = {};
  for (const k of narrativeFields)
    if (fields.includes(k)) narratives[k] = s.identity[k];
  const notes = await db.characterNote.findMany({
    where: { characterId: id, visibility: "PUBLIC" },
    select: { id: true, title: true, body: true },
  });
  return {
    id: s.id,
    name: s.name,
    nickname: s.identity.nickname,
    profession: s.identity.profession,
    narratives,
    status: s.status,
    attributes: s.attributes,
    resources: s.resources.map(({ key, current, maximum }) => ({
      key,
      current,
      maximum,
    })),
    skills: s.skills,
    inventory: s.inventory.map(({ notes, version, ...item }) => item),
    conditions: {
      fatigue: s.conditions.fatigue,
      bleeding: s.conditions.bleeding,
      critical: s.conditions.critical,
      incapacitated: s.conditions.incapacitated,
      successes: s.conditions.successes,
      failures: s.conditions.failures,
      stabilization: s.conditions.stabilization,
    },
    notes,
  };
}
export function sanitizeHistory(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sanitizeHistory);
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value)
        .filter(
          ([k]) =>
            ![
              "notes",
              "personalNotes",
              "concept",
              "backstory",
              "appearance",
              "personality",
              "objectives",
              "imagePath",
            ].includes(k),
        )
        .map(([k, v]) => [k, sanitizeHistory(v)]),
    );
  return value;
}
export async function issueAdminAuthorization(
  db: PrismaClient,
  userId: string,
  sessionId: string,
  password: string,
  recoveryCode?: string,
) {
  const u = await db.user.findUnique({ where: { id: userId } });
  if (
    !u ||
    u.role !== "ADMIN" ||
    u.disabledAt ||
    !(await verifyPassword(u.passwordHash, password))
  )
    throw new HttpError(
      401,
      "REAUTH_FAILED",
      "Não foi possível confirmar sua identidade administrativa.",
    );
  const token = randomToken();
  await db.$transaction(async (tx) => {
    await administration(tx, userId);
    const current = await tx.user.findUniqueOrThrow({ where: { id: userId } });
    if (current.version !== u.version) throw conflict();
    if (recoveryCode) {
      const used = await tx.recoveryCode.updateMany({
        where: {
          userId,
          codeHash: tokenHash(recoveryCode),
          usedAt: null,
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
        data: { usedAt: new Date() },
      });
      if (!used.count)
        throw new HttpError(
          401,
          "REAUTH_FAILED",
          "Não foi possível confirmar sua identidade administrativa.",
        );
    }
    await tx.adminAuthorization.create({
      data: {
        userId,
        sessionId,
        tokenHash: tokenHash(token),
        strong: Boolean(recoveryCode),
        expiresAt: new Date(Date.now() + 300000),
      },
    });
    await tx.adminAuditLog.create({
      data: { actorId: userId, action: "ADMIN_REAUTHENTICATED" },
    });
  });
  return { token, strong: Boolean(recoveryCode), expiresInSeconds: 300 };
}
export async function consumeProof(
  tx: Tx,
  userId: string,
  sessionId: string,
  token: unknown,
  strong = false,
) {
  if (typeof token !== "string" || token.length > 128)
    throw new HttpError(
      403,
      "REAUTH_REQUIRED",
      "Confirme novamente sua identidade administrativa.",
    );
  const proof = await tx.adminAuthorization.updateMany({
    where: {
      userId,
      sessionId,
      tokenHash: tokenHash(token),
      usedAt: null,
      expiresAt: { gt: new Date() },
      ...(strong ? { strong: true } : {}),
    },
    data: { usedAt: new Date() },
  });
  if (!proof.count)
    throw new HttpError(
      403,
      "REAUTH_REQUIRED",
      "Autorização administrativa inválida, expirada ou já utilizada.",
    );
}
export async function changeAccount(
  tx: Tx,
  actorId: string,
  targetId: string,
  input: any,
  kind: "account" | "privileges" | "role",
) {
  const u = await tx.user.findUnique({ where: { id: targetId } });
  if (!u) throw notFound();
  checkVersion(u.version, input.version);
  if (
    targetId === actorId &&
    ((kind === "account" && input.disabled) ||
      (kind === "role" && input.role !== "ADMIN"))
  )
    throw new HttpError(
      409,
      "SELF_PROTECTED",
      "Você não pode desativar ou remover seu próprio acesso administrativo.",
    );
  if (
    u.role === "ADMIN" &&
    ((kind === "account" && input.disabled) ||
      (kind === "role" && input.role === "PLAYER")) &&
    (await tx.user.count({ where: { role: "ADMIN", disabledAt: null } })) <= 1
  )
    throw new HttpError(
      409,
      "LAST_ADMIN",
      "Mantenha ao menos um administrador ativo.",
    );
  if (kind === "role" && input.confirmation !== u.username)
    throw new HttpError(
      400,
      "CONFIRMATION_REQUIRED",
      "Confirme o login exato da conta de destino.",
    );
  const data =
    kind === "account"
      ? { disabledAt: input.disabled ? new Date() : null }
      : kind === "privileges"
        ? { canCreateCampaigns: input.canCreateCampaigns }
        : { role: input.role as "ADMIN" | "PLAYER" };
  await tx.user.update({
    where: { id: targetId },
    data: { ...data, version: { increment: 1 } },
  });
  if ((kind === "account" && input.disabled) || kind === "role")
    await tx.session.deleteMany({ where: { userId: targetId } });
  await tx.adminAuditLog.create({
    data: {
      actorId,
      action: "ACCOUNT_" + kind.toUpperCase() + "_CHANGED",
      targetId,
      reason: input.reason,
    },
  });
  return { id: targetId };
}
