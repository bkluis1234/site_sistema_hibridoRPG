import { Prisma, type PrismaClient } from "@prisma/client";
import { rollExpression } from "./dice-engine.js";
import { captureSheetEvent } from "./game-events.js";
import { HttpError } from "./errors.js";
import { tokenHash } from "./security.js";
import {
  ATTRIBUTE_KEYS,
  DEFAULT_PHYSICAL_SKILLS,
  DEFAULT_ATTRIBUTES,
  SKILLS,
  SKILL_KEYS,
  calculateMaxima,
  calculateInventoryCapacity,
  calculateInventoryUsage,
  calculateSkillTarget,
  validateAttributes,
  validateTrainedSkills,
  resolveSkillCheck,
  fatiguePenalty,
  stabilization,
  seriousInjuryAlert,
  requireMechanics,
  type Attributes,
  type SkillKey,
} from "../../../packages/rpg-rules/src/index.js";
import {
  identitySchema,
  attributesSchema,
  skillsSchema,
  resourceSchema,
  inventoryCreateSchema,
  inventoryUpdateSchema,
  conditionSchema,
  criticalSchema,
  injuryCreateSchema,
  injuryUpdateSchema,
  diceSchema,
  effortSchema,
  authorizeRetrySchema,
  type SheetDetails,
} from "../../../packages/shared/src/sheet.js";
import type { z } from "zod";
type Tx = Prisma.TransactionClient;
export const json = (v: unknown) =>
  JSON.parse(JSON.stringify(v)) as Prisma.InputJsonValue;
export const conflict = () =>
  new HttpError(
    409,
    "VERSION_CONFLICT",
    "Esta seção mudou em outro dispositivo. O texto local foi preservado; confira a versão do servidor.",
  );
export async function initializeSheet(tx: Tx, id: string) {
  await tx.characterAttribute.createMany({
    data: ATTRIBUTE_KEYS.map((key) => ({
      characterId: id,
      key,
      value: DEFAULT_ATTRIBUTES[key],
    })),
  });
  await tx.characterSkill.createMany({
    data: SKILLS.map(([key]) => ({ characterId: id, key })),
  });
  await tx.characterResource.createMany({
    data: Object.entries(calculateMaxima(DEFAULT_ATTRIBUTES)).map(
      ([key, current]) => ({ characterId: id, key, current }),
    ),
  });
  await tx.characterConditionState.create({ data: { characterId: id } });
}
const include = {
  attributes: true,
  skills: true,
  resources: true,
  inventory: { orderBy: { createdAt: "asc" as const } },
  injuries: { orderBy: { createdAt: "desc" as const } },
  conditionState: true,
  campaign: { select: { physicalSkillKeys: true, version: true } },
} satisfies Prisma.CharacterInclude;
export async function authorized(
  tx: Tx,
  id: string,
  actorId: string,
  write = false,
) {
  const actor = await tx.user.findUnique({
    where: { id: actorId },
    select: { disabledAt: true },
  });
  if (!actor || actor.disabledAt)
    throw new HttpError(401, "UNAUTHENTICATED", "A conta não está disponível.");
  const character = await tx.character.findUnique({ where: { id } });
  if (!character)
    throw new HttpError(404, "NOT_FOUND", "Ficha não encontrada.");
  const gm = character.campaignId
    ? await tx.campaignMember.findFirst({
        where: {
          campaignId: character.campaignId,
          userId: actorId,
          role: "GM",
          status: "ACTIVE",
          user: { disabledAt: null },
        },
      })
    : null;
  if (character.ownerId !== actorId && !gm)
    throw new HttpError(404, "NOT_FOUND", "Ficha não encontrada.");
  if (write && character.ownerId !== actorId && character.campaignId) {
    const campaign = await tx.campaign.findUnique({
      where: { id: character.campaignId },
      select: { status: true, archivedAt: true },
    });
    if (campaign?.status === "ARCHIVED" || campaign?.archivedAt)
      throw new HttpError(
        409,
        "CAMPAIGN_ARCHIVED",
        "A campanha está arquivada.",
      );
  }
  if (write && (character.status === "ARCHIVED" || character.archivedAt))
    throw new HttpError(409, "ARCHIVED", "Ficha arquivada: somente consulta.");
  try {
    requireMechanics(character.rulesVersion);
  } catch {
    throw new HttpError(
      409,
      "RULESET_UNSUPPORTED",
      "Esta versão da ficha exige um módulo de regras compatível.",
    );
  }
  return {
    character,
    isGM: Boolean(gm),
    isOwner: character.ownerId === actorId,
  };
}
function attrs(rows: { key: string; value: number }[]): Attributes {
  const a = { ...DEFAULT_ATTRIBUTES };
  for (const k of ATTRIBUTE_KEYS) {
    const row = rows.find((r) => r.key === k);
    if (!row)
      throw new HttpError(
        503,
        "SHEET_INCOMPLETE",
        "Estrutura da ficha incompleta. Confira as migrações.",
      );
    a[k] = row.value;
  }
  return a;
}
export async function audit(
  tx: Tx,
  id: string,
  actorId: string,
  action: string,
  before?: unknown,
  after?: unknown,
  options: {
    visibility?: "PUBLIC" | "PRIVATE" | "GM_ONLY";
    reason?: string;
  } = {},
) {
  const c = await tx.character.update({
    where: { id },
    data: { version: { increment: 1 } },
  });
  await tx.characterAuditLog.create({
    data: {
      characterId: id,
      actorId,
      action,
      recordVersion: c.version,
      visibility:
        options.visibility ??
        (action === "IDENTITY_UPDATED" ? "PRIVATE" : "PUBLIC"),
      campaignScopeId: options.visibility === "GM_ONLY" ? c.campaignId : null,
      reason: options.reason,
      ...(before === undefined ? {} : { beforeData: json(before) }),
      ...(after === undefined ? {} : { afterData: json(after) }),
    },
  });
  await captureSheetEvent(tx, c, actorId, action, before, after);
  return c.version;
}
export async function mutate(
  db: PrismaClient,
  id: string,
  actorId: string,
  action: string,
  input: { operationId: string },
  handler: (
    tx: Tx,
    access: Awaited<ReturnType<typeof authorized>>,
  ) => Promise<unknown>,
) {
  return db.$transaction(
    async (tx) => {
      // Campanha antes da ficha: mesma ordem da sala, membros e vínculos.
      const prior = await tx.character.findUnique({
        where: { id },
        select: { campaignId: true },
      });
      if (prior?.campaignId)
        await tx.$queryRaw`SELECT id FROM campaigns WHERE id=${prior.campaignId} FOR UPDATE`;
      // Um único lock de ficha ordena transações; versões independentes evitam conflitos entre seções.
      await tx.$queryRaw`SELECT id FROM characters WHERE id=${id} FOR UPDATE`;
      const access = await authorized(tx, id, actorId, true);
      if ((prior?.campaignId ?? null) !== access.character.campaignId)
        throw conflict();
      const requestHash = tokenHash(JSON.stringify({ actorId, action, input }));
      const known = await tx.characterOperation.findUnique({
        where: {
          characterId_operationId: {
            characterId: id,
            operationId: input.operationId,
          },
        },
      });
      if (known) {
        if (known.requestHash !== requestHash)
          throw new HttpError(
            409,
            "OPERATION_REUSED",
            "Identificador de operação já utilizado com outros dados.",
          );
        return known.result;
      }
      const result = json(await handler(tx, access));
      await tx.characterOperation.create({
        data: {
          characterId: id,
          operationId: input.operationId,
          requestHash,
          result,
        },
      });
      return result;
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
      maxWait: 10000,
      timeout: 15000,
    },
  );
}
export async function getSheet(
  db: PrismaClient,
  id: string,
  actorId: string,
  portraitMaxBytes = 5242880,
  gmContext = false,
): Promise<SheetDetails> {
  return db.$transaction(async (tx) => {
    const access = await authorized(tx, id, actorId);
    const c = await tx.character.findUniqueOrThrow({ where: { id }, include });
    const attributes = attrs(c.attributes),
      maximum = calculateMaxima(attributes);
    const physical = Array.isArray(c.campaign?.physicalSkillKeys)
      ? c.campaign!.physicalSkillKeys.filter(
          (k): k is SkillKey =>
            typeof k === "string" && SKILL_KEYS.includes(k as SkillKey),
        )
      : DEFAULT_PHYSICAL_SKILLS;
    const state = c.conditionState;
    if (!state)
      throw new HttpError(
        503,
        "SHEET_INCOMPLETE",
        "Execute a migração da ficha.",
      );
    const inventory = c.inventory.map((i) => ({
      id: i.id,
      name: i.name,
      quantity: i.quantity,
      slotsPerUnit: Number(i.slotsPerUnit),
      description: i.description ?? "",
      notes: i.notes ?? "",
      equipment: i.equipment,
      type: i.type,
      damage: i.damage,
      version: i.version,
    }));
    const result: SheetDetails = {
      id: c.id,
      name: c.name,
      status: c.status,
      version: c.version,
      identityVersion: c.identityVersion,
      attributesVersion: c.attributesVersion,
      skillsVersion: c.skillsVersion,
      rulesVersion: c.rulesVersion,
      isGM: access.isGM && gmContext,
      access: {
        isOwner: access.isOwner,
        gmContext: access.isGM && gmContext,
        redactedFields: [],
      },
      sharing: {
        enabled: c.sharingEnabled,
        publicFields: Array.isArray(c.publicFields)
          ? c.publicFields.filter((x): x is string => typeof x === "string")
          : [],
        version: c.sharingVersion,
      },
      identity: {
        name: c.name,
        concept: c.concept,
        nickname: c.nickname,
        age: c.age,
        height: c.height === null ? null : Number(c.height),
        weight: c.weight === null ? null : Number(c.weight),
        profession: c.profession,
        backstory: c.backstory ?? "",
        appearance: c.appearance ?? "",
        personality: c.personality ?? "",
        objectives: c.objectives ?? "",
        personalNotes: c.personalNotes ?? "",
      },
      attributes,
      resources: (["PV", "SAN", "PE"] as const).map((key) => {
        const r = c.resources.find((r) => r.key === key);
        if (!r)
          throw new HttpError(
            503,
            "SHEET_INCOMPLETE",
            "Recurso não inicializado.",
          );
        return {
          key,
          current: r.current,
          maximum: maximum[key],
          version: r.version,
        };
      }),
      skills: SKILLS.map(([key, name, attribute]) => {
        const trained = c.skills.some((s) => s.key === key && s.trained);
        const isPhysical = physical.includes(key);
        return {
          key,
          name,
          attribute,
          trained,
          physical: isPhysical,
          baseTarget: calculateSkillTarget(attributes[attribute], trained),
          fatiguePenalty: isPhysical ? fatiguePenalty(state.fatigue) : 0,
          target: calculateSkillTarget(
            attributes[attribute],
            trained,
            state.fatigue,
            isPhysical,
          ),
        };
      }),
      conditions: {
        fatigue: state.fatigue,
        bleeding: state.bleeding,
        critical: state.critical,
        incapacitated: state.incapacitated,
        successes: state.successes,
        failures: state.failures,
        stabilization: state.stabilization,
        version: state.version,
      },
      inventory,
      inventoryUsage: calculateInventoryUsage(inventory),
      inventoryCapacity: calculateInventoryCapacity(attributes.FOR),
      injuries: c.injuries.map((i) => ({
        id: i.id,
        description: i.description,
        location: i.location,
        consequences: i.consequences ?? "",
        status: i.status as "ACTIVE" | "TREATED" | "RESOLVED",
        version: i.version,
        createdAt: i.createdAt.toISOString(),
      })),
      physicalSkillsConfirmed:
        c.campaign?.physicalSkillKeys !== null &&
        c.campaign?.physicalSkillKeys !== undefined,
      physicalSkillKeys: physical,
      campaignVersion: c.campaign?.version ?? null,
      portrait: {
        configured: false,
        maxBytes: portraitMaxBytes,
        mimeTypes: ["image/png", "image/jpeg", "image/webp"],
      },
    };
    if (!access.isOwner) {
      const publicFields = Array.isArray(c.publicFields) ? c.publicFields : [];
      for (const field of [
        "concept",
        "backstory",
        "appearance",
        "personality",
        "objectives",
        "personalNotes",
      ] as const) {
        if (field === "personalNotes" || !publicFields.includes(field)) {
          result.identity[field] = "";
          result.access.redactedFields.push(field);
        }
      }
      result.inventory = result.inventory.map((item) => ({
        ...item,
        notes: "",
      }));
    }
    return result;
  });
}
const assertVersion = (current: number, submitted: number) => {
  if (current !== submitted) throw conflict();
};
const assertDraft = (status: string) => {
  if (status !== "DRAFT")
    throw new HttpError(
      409,
      "MECHANICS_LOCKED",
      "Atributos e treinamentos estão protegidos. Reabra o rascunho ou solicite revisão ao mestre.",
    );
};
export async function saveIdentity(
  tx: Tx,
  id: string,
  actorId: string,
  input: z.infer<typeof identitySchema>,
) {
  const before = await tx.character.findUniqueOrThrow({ where: { id } });
  assertVersion(before.identityVersion, input.version);
  const { version, operationId, ...submitted } = input;
  const fields = Array.isArray(before.publicFields) ? before.publicFields : [];
  const blocked =
    before.ownerId === actorId
      ? []
      : [
          "concept",
          "backstory",
          "appearance",
          "personality",
          "objectives",
          "personalNotes",
        ].filter((k) => k === "personalNotes" || !fields.includes(k));
  for (const k of blocked)
    if ((submitted as Record<string, unknown>)[k])
      throw new HttpError(
        403,
        "PRIVATE_FIELD",
        "Este campo pertence à área privada do proprietário.",
      );
  const data = Object.fromEntries(
    Object.entries(submitted).filter(([k]) => !blocked.includes(k)),
  );
  const c = await tx.character.update({
    where: { id },
    data: { ...data, identityVersion: { increment: 1 } },
  });
  await audit(
    tx,
    id,
    actorId,
    "IDENTITY_UPDATED",
    Object.fromEntries(
      Object.keys(data).map((k) => [k, before[k as keyof typeof before]]),
    ),
    data,
    { visibility: before.ownerId === actorId ? "PRIVATE" : "PUBLIC" },
  );
  return { identityVersion: c.identityVersion };
}
export async function saveAttributes(
  tx: Tx,
  id: string,
  actorId: string,
  input: z.infer<typeof attributesSchema>,
) {
  const c = await tx.character.findUniqueOrThrow({
    where: { id },
    include: { attributes: true, resources: true },
  });
  const access = await authorized(tx, id, actorId, true);
  if (c.status !== "DRAFT" && (!access.isGM || !input.reason))
    assertDraft(c.status);
  assertVersion(c.attributesVersion, input.version);
  const valid = validateAttributes(input.attributes, c.status !== "DRAFT");
  if (!valid.valid)
    throw new HttpError(400, "ATTRIBUTES_INVALID", valid.errors.join(" "));
  const before = attrs(c.attributes),
    oldMax = calculateMaxima(before),
    max = calculateMaxima(input.attributes);
  for (const key of ATTRIBUTE_KEYS)
    await tx.characterAttribute.update({
      where: { characterId_key: { characterId: id, key } },
      data: { value: input.attributes[key], version: { increment: 1 } },
    });
  const adjustments = [];
  for (const r of c.resources) {
    if (!(r.key in max)) continue;
    const key = r.key as keyof typeof max;
    if (oldMax[key] !== max[key]) {
      const current = Math.min(r.current, max[key]);
      await tx.characterResource.update({
        where: { id: r.id },
        data: { current, version: { increment: 1 } },
      });
      adjustments.push({
        key,
        before: r.current,
        after: current,
        maximum: max[key],
      });
    }
  }
  const updated = await tx.character.update({
    where: { id },
    data: { attributesVersion: { increment: 1 } },
  });
  await audit(
    tx,
    id,
    actorId,
    "ATTRIBUTES_UPDATED",
    { attributes: before, maxima: oldMax },
    {
      attributes: input.attributes,
      maxima: max,
      resourceAdjustments: adjustments,
    },
    { reason: input.reason },
  );
  return {
    attributesVersion: updated.attributesVersion,
    resourceAdjustments: adjustments,
  };
}
export async function saveSkills(
  tx: Tx,
  id: string,
  actorId: string,
  input: z.infer<typeof skillsSchema>,
) {
  const c = await tx.character.findUniqueOrThrow({
    where: { id },
    include: { skills: true },
  });
  const access = await authorized(tx, id, actorId, true);
  if (c.status !== "DRAFT" && (!access.isGM || !input.reason))
    assertDraft(c.status);
  assertVersion(c.skillsVersion, input.version);
  if (!validateTrainedSkills(input.trained, c.status !== "DRAFT").valid)
    throw new HttpError(
      400,
      "SKILLS_INVALID",
      "Escolha até quatro perícias diferentes.",
    );
  for (const [key] of SKILLS)
    await tx.characterSkill.update({
      where: { characterId_key: { characterId: id, key } },
      data: { trained: input.trained.includes(key), version: { increment: 1 } },
    });
  const updated = await tx.character.update({
    where: { id },
    data: { skillsVersion: { increment: 1 } },
  });
  await audit(
    tx,
    id,
    actorId,
    "TRAINING_UPDATED",
    c.skills.filter((s) => s.trained).map((s) => s.key),
    input.trained,
    { reason: input.reason },
  );
  return { skillsVersion: updated.skillsVersion };
}
export async function changeResource(
  tx: Tx,
  id: string,
  actorId: string,
  input: z.infer<typeof resourceSchema>,
) {
  const c = await tx.character.findUniqueOrThrow({
    where: { id },
    include: { attributes: true, conditionState: true },
  });
  const r = await tx.characterResource.findUniqueOrThrow({
    where: { characterId_key: { characterId: id, key: input.key } },
  });
  assertVersion(r.version, input.version);
  const maximum = calculateMaxima(attrs(c.attributes))[input.key];
  const damage = ["DAMAGE", "SINGLE_ATTACK"].includes(input.event);
  if (
    damage &&
    (input.key !== "PV" || input.mode !== "ADJUST" || input.value >= 0)
  )
    throw new HttpError(
      400,
      "DAMAGE_INVALID",
      "Dano exige redução de PV por quantidade informada.",
    );
  if (
    input.event === "HEALING" &&
    (input.key !== "PV" || input.value <= 0 || input.mode !== "ADJUST")
  )
    throw new HttpError(
      400,
      "HEALING_INVALID",
      "Recuperação exige aumento de PV por quantidade informada.",
    );
  const raw = input.mode === "SET" ? input.value : r.current + input.value;
  const current = damage ? Math.max(0, raw) : raw;
  if (current < 0 || current > maximum)
    throw new HttpError(
      400,
      "RESOURCE_LIMIT",
      "O recurso deve permanecer entre zero e o máximo.",
    );
  const beforeState = c.conditionState!;
  let afterState = beforeState;
  if (input.key === "PV") {
    let updates: Prisma.CharacterConditionStateUpdateInput = {};
    if (current === 0 && !beforeState.incapacitated) {
      updates = {
        incapacitated: true,
        critical: true,
        stabilization: "UNSTABLE",
      };
    }
    if (damage && beforeState.critical) {
      const failures = Math.min(3, beforeState.failures + 1);
      updates = {
        ...updates,
        failures,
        stabilization: stabilization(beforeState.successes, failures),
      };
    }
    if (Object.keys(updates).length)
      afterState = await tx.characterConditionState.update({
        where: { characterId: id },
        data: { ...updates, version: { increment: 1 } },
      });
  }
  const updated = await tx.characterResource.update({
    where: { id: r.id },
    data: { current, version: { increment: 1 } },
  });
  const alert =
    input.key === "PV" && seriousInjuryAlert(-input.value, maximum, input.event)
      ? "Dano de ataque único atingiu metade dos PV máximos: consulte o teste de VIG/Fortitude. Nenhum ferimento foi aplicado automaticamente."
      : null;
  await audit(
    tx,
    id,
    actorId,
    "RESOURCE_CHANGED",
    { key: r.key, current: r.current, conditions: beforeState },
    {
      key: r.key,
      current,
      event: input.event,
      reportedAmount: input.value,
      conditions: afterState,
      alert,
    },
  );
  return { key: r.key, current, version: updated.version, alert };
}
export async function saveItem(
  tx: Tx,
  id: string,
  actorId: string,
  input:
    | z.infer<typeof inventoryCreateSchema>
    | z.infer<typeof inventoryUpdateSchema>,
  itemId?: string,
) {
  const access = await authorized(tx, id, actorId, true);
  let before: unknown = undefined;
  if (itemId) {
    const item = await tx.inventoryItem.findFirst({
      where: { id: itemId, characterId: id },
    });
    if (!item) throw new HttpError(404, "NOT_FOUND", "Item não encontrado.");
    assertVersion(item.version, "version" in input ? input.version : 0);
    before = item;
  }
  const { operationId, ...fields } = input;
  const { version, ...data } = fields as Omit<
    z.infer<typeof inventoryUpdateSchema>,
    "operationId"
  >;
  if (!access.isOwner) {
    if (data.notes)
      throw new HttpError(
        403,
        "PRIVATE_FIELD",
        "As observações do item são privadas do proprietário.",
      );
    data.notes = itemId
      ? ((before as { notes: string | null }).notes ?? "")
      : "";
  }
  if (!data.equipment && (data.type || data.damage))
    throw new HttpError(
      400,
      "EQUIPMENT_INVALID",
      "Marque o item como equipamento para informar tipo ou dano.",
    );
  const item = itemId
    ? await tx.inventoryItem.update({
        where: { id: itemId },
        data: { ...data, version: { increment: 1 } },
      })
    : await tx.inventoryItem.create({ data: { ...data, characterId: id } });
  const allItems = await tx.inventoryItem.findMany({
    where: { characterId: id },
    select: { quantity: true, slotsPerUnit: true },
  });
  try {
    calculateInventoryUsage(
      allItems.map((row) => ({
        quantity: row.quantity,
        slotsPerUnit: Number(row.slotsPerUnit),
      })),
    );
  } catch {
    throw new HttpError(
      400,
      "INVENTORY_PRECISION",
      "A ocupação total ultrapassa a precisão numérica suportada. Reduza quantidades/espaços.",
    );
  }
  // Inventário é a fonte canônica. Nenhuma segunda entrada é criada para armas.
  await audit(
    tx,
    id,
    actorId,
    itemId ? "ITEM_UPDATED" : "ITEM_CREATED",
    before,
    item,
  );
  return { id: item.id, version: item.version };
}
export async function removeItem(
  tx: Tx,
  id: string,
  actorId: string,
  itemId: string,
  version: number,
) {
  const item = await tx.inventoryItem.findFirst({
    where: { id: itemId, characterId: id },
    include: { weapon: true },
  });
  if (!item) throw new HttpError(404, "NOT_FOUND", "Item não encontrado.");
  assertVersion(item.version, version);
  if (item.weapon)
    await tx.characterWeapon.delete({ where: { id: item.weapon.id } });
  await tx.inventoryItem.delete({ where: { id: itemId } });
  await audit(tx, id, actorId, "ITEM_DELETED", item, {
    deleted: true,
    id: itemId,
  });
  return { deleted: true };
}
export async function saveConditions(
  tx: Tx,
  id: string,
  actorId: string,
  input: z.infer<typeof conditionSchema>,
) {
  const before = await tx.characterConditionState.findUniqueOrThrow({
    where: { characterId: id },
  });
  assertVersion(before.version, input.version);
  const { operationId, version, ...data } = input;
  const after = await tx.characterConditionState.update({
    where: { characterId: id },
    data: { ...data, version: { increment: 1 } },
  });
  await audit(tx, id, actorId, "CONDITIONS_UPDATED", before, after);
  return { conditions: after };
}
export async function changeCritical(
  tx: Tx,
  id: string,
  actorId: string,
  input: z.infer<typeof criticalSchema>,
) {
  const before = await tx.characterConditionState.findUniqueOrThrow({
    where: { characterId: id },
  });
  assertVersion(before.version, input.version);
  const pv = await tx.characterResource.findUniqueOrThrow({
    where: { characterId_key: { characterId: id, key: "PV" } },
  });
  let update: Prisma.CharacterConditionStateUpdateInput = {};
  if (input.action === "RESET") {
    if (pv.current === 0)
      throw new HttpError(
        400,
        "PV_ZERO",
        "Com PV zero, mantenha o acompanhamento de incapacitação.",
      );
    update = {
      critical: false,
      incapacitated: false,
      successes: 0,
      failures: 0,
      stabilization: "NONE",
    };
  } else if (input.action === "START") {
    if (before.critical)
      throw new HttpError(
        409,
        "ALREADY_CRITICAL",
        "O acompanhamento já está ativo.",
      );
    update = {
      critical: true,
      successes: 0,
      failures: 0,
      stabilization: "UNSTABLE",
    };
  } else {
    if (
      !before.critical ||
      before.stabilization === "STABLE" ||
      before.stabilization === "DEAD"
    )
      throw new HttpError(
        400,
        "CRITICAL_CLOSED",
        "Registre resultados somente em um estado crítico ainda não resolvido.",
      );
    const successes =
      input.action === "SUCCESS"
        ? Math.min(3, before.successes + 1)
        : before.successes;
    const failures =
      input.action === "FAILURE"
        ? Math.min(3, before.failures + 1)
        : before.failures;
    update = {
      successes,
      failures,
      stabilization: stabilization(successes, failures),
    };
  }
  const after = await tx.characterConditionState.update({
    where: { characterId: id },
    data: { ...update, version: { increment: 1 } },
  });
  await audit(tx, id, actorId, "CRITICAL_" + input.action, before, after);
  return { conditions: after };
}
export async function saveInjury(
  tx: Tx,
  id: string,
  actorId: string,
  input:
    | z.infer<typeof injuryCreateSchema>
    | z.infer<typeof injuryUpdateSchema>,
  injuryId?: string,
) {
  let before: unknown = undefined;
  if (injuryId) {
    const row = await tx.characterInjury.findFirst({
      where: { id: injuryId, characterId: id },
    });
    if (!row)
      throw new HttpError(404, "NOT_FOUND", "Ferimento não encontrado.");
    assertVersion(row.version, "version" in input ? input.version : 0);
    before = row;
  }
  const { operationId, ...fields } = input;
  const { version, ...data } = fields as Omit<
    z.infer<typeof injuryUpdateSchema>,
    "operationId"
  >;
  const injury = injuryId
    ? await tx.characterInjury.update({
        where: { id: injuryId },
        data: {
          ...data,
          healedAt: data.status === "RESOLVED" ? new Date() : null,
          version: { increment: 1 },
        },
      })
    : await tx.characterInjury.create({
        data: {
          ...data,
          characterId: id,
          healedAt: data.status === "RESOLVED" ? new Date() : null,
        },
      });
  await audit(
    tx,
    id,
    actorId,
    injuryId ? "INJURY_UPDATED" : "INJURY_CREATED",
    before,
    injury,
  );
  return { id: injury.id, version: injury.version };
}
export async function submitSheet(
  tx: Tx,
  id: string,
  actorId: string,
  version: number,
  reopen = false,
) {
  const c = await tx.character.findUniqueOrThrow({
    where: { id },
    include: { attributes: true, skills: true, inventory: true },
  });
  assertVersion(c.version, version);
  if (reopen) {
    if (c.status !== "PENDING_APPROVAL")
      throw new HttpError(
        409,
        "STATUS_INVALID",
        "Somente fichas aguardando aprovação podem voltar a rascunho.",
      );
  } else {
    assertDraft(c.status);
    const attributes = attrs(c.attributes);
    const errors = validateAttributes(attributes, true).errors;
    if (
      !validateTrainedSkills(
        c.skills.filter((s) => s.trained).map((s) => s.key),
        true,
      ).valid
    )
      errors.push("Selecione exatamente quatro perícias treinadas.");
    if (
      c.inventory.some((i) => Number(i.slotsPerUnit) < 0) ||
      calculateInventoryUsage(
        c.inventory.map((i) => ({
          quantity: i.quantity,
          slotsPerUnit: Number(i.slotsPerUnit),
        })),
      ) > calculateInventoryCapacity(attributes.FOR)
    )
      errors.push("Resolva o excesso de espaços do inventário.");
    if (!c.name.trim()) errors.push("Informe o nome.");
    if (errors.length)
      throw new HttpError(400, "SHEET_INVALID", errors.join(" "));
  }
  const status = reopen ? "DRAFT" : "PENDING_APPROVAL";
  await tx.character.update({ where: { id }, data: { status } });
  await audit(
    tx,
    id,
    actorId,
    reopen ? "DRAFT_REOPENED" : "APPROVAL_REQUESTED",
    { status: c.status },
    { status },
  );
  if (!reopen && c.campaignId) {
    const masters = await tx.campaignMember.findMany({
      where: {
        campaignId: c.campaignId,
        role: "GM",
        status: "ACTIVE",
        user: { disabledAt: null },
      },
      select: { userId: true },
    });
    await tx.notification.createMany({
      data: masters.map((m) => ({
        userId: m.userId,
        message: "Há uma ficha aguardando aprovação.",
        linkPath: "/campaigns/" + c.campaignId + "/gm",
      })),
    });
  }
  return { status };
}
export async function createRoll(
  tx: Tx,
  id: string,
  actorId: string,
  input: z.infer<typeof diceSchema>,
  context?: {
    gameSessionId: string;
    campaignId: string;
    visibility: "PUBLIC" | "PRIVATE" | "GM_ONLY" | "GM_SHARED";
    privateToGM: boolean;
    byGM: boolean;
    category: string;
    contextModifier?: number;
    modifierReason?: string;
  },
) {
  const sheet = await tx.character.findUniqueOrThrow({
    where: { id },
    include: {
      attributes: true,
      skills: true,
      conditionState: true,
      campaign: { select: { physicalSkillKeys: true, version: true } },
    },
  });
  let expression = input.expression ?? "1d20";
  let target: number | null = null;
  let baseTarget: number | null = null;
  let applied = false;
  let penalty = 0;
  if (input.skillKey) {
    const skill = SKILLS.find((s) => s[0] === input.skillKey)!;
    const policy = Array.isArray(sheet.campaign?.physicalSkillKeys)
      ? sheet.campaign!.physicalSkillKeys
      : DEFAULT_PHYSICAL_SKILLS;
    const access = await authorized(tx, id, actorId);
    if (input.fatigueOverride !== undefined && !access.isGM)
      throw new HttpError(
        403,
        "GM_REQUIRED",
        "Somente o GM pode decidir a aplicação contextual de fadiga.",
      );
    const physical = input.fatigueOverride ?? policy.includes(skill[0]);
    applied = physical;
    penalty = physical ? fatiguePenalty(sheet.conditionState!.fatigue) : 0;
    baseTarget = calculateSkillTarget(
      attrs(sheet.attributes)[skill[2]],
      sheet.skills.some((s) => s.key === input.skillKey && s.trained),
    );
    target = calculateSkillTarget(
      attrs(sheet.attributes)[skill[2]],
      sheet.skills.some((s) => s.key === input.skillKey && s.trained),
      sheet.conditionState!.fatigue,
      physical,
    );
  }
  if (target !== null)
    target = Math.min(19, target + (context?.contextModifier ?? 0));
  const results = rollExpression(expression);
  const total = results.reduce((a, b) => a + b, 0);
  // Um novo teste encerra a janela de decisão do anterior; não cobra PE.
  await tx.diceRoll.updateMany({
    where: { characterId: id, finalizedAt: null },
    data: { finalizedAt: new Date(), version: { increment: 1 } },
  });
  const roll = await tx.diceRoll.create({
    data: {
      characterId: id,
      userId: actorId,
      expression,
      results,
      initialResults: results,
      total,
      skillKey: input.skillKey ?? null,
      target,
      baseTarget,
      fatiguePenalty: penalty,
      fatigueApplied: applied,
      outcome: target === null ? null : resolveSkillCheck(results[0]!, target),
      finalizedAt: target === null ? new Date() : null,
      ...(context ? { ...context, characterName: sheet.name } : {}),
    },
  });
  if (!context) await audit(tx, id, actorId, "DICE_ROLLED", undefined, roll);
  return { roll };
}
async function openRoll(
  tx: Tx,
  id: string,
  rollId: string,
  version: number,
  gameSessionId?: string,
) {
  const roll = await tx.diceRoll.findFirst({
    where: { id: rollId, characterId: id },
  });
  if (!roll || roll.gameSessionId !== (gameSessionId ?? null))
    throw new HttpError(404, "NOT_FOUND", "Rolagem não encontrada.");
  assertVersion(roll.version, version);
  if (roll.finalizedAt || !roll.skillKey || roll.target === null)
    throw new HttpError(409, "ROLL_CLOSED", "Esta rolagem já foi encerrada.");
  return roll;
}
export async function effort(
  tx: Tx,
  id: string,
  actorId: string,
  rollId: string,
  input: z.infer<typeof effortSchema>,
  gameSessionId?: string,
) {
  const roll = await openRoll(tx, id, rollId, input.version, gameSessionId);
  if (roll.userId !== actorId)
    throw new HttpError(
      403,
      "FORBIDDEN",
      "Somente quem rolou pode confirmar ou gastar PE nesse teste.",
    );
  if (input.action !== "ACCEPT" && roll.effortMode !== "NONE")
    throw new HttpError(
      409,
      "EFFORT_USED",
      "Bônus e repetição não podem ser combinados.",
    );
  if (input.action === "REQUEST_RETRY") {
    if (roll.outcome !== "FAILURE")
      throw new HttpError(
        400,
        "RETRY_INVALID",
        "Somente um teste falhado pode receber solicitação de repetição.",
      );
    if (roll.retryRequestedAt)
      throw new HttpError(
        409,
        "RETRY_REQUESTED",
        "A repetição já foi solicitada.",
      );
    const updated = await tx.diceRoll.update({
      where: { id: roll.id },
      data: { retryRequestedAt: new Date(), version: { increment: 1 } },
    });
    if (!gameSessionId)
      await audit(tx, id, actorId, "RETRY_REQUESTED", roll, updated);
    return { roll: updated };
  }
  if (input.action === "ACCEPT") {
    const updated = await tx.diceRoll.update({
      where: { id: roll.id },
      data: { finalizedAt: new Date(), version: { increment: 1 } },
    });
    if (!gameSessionId)
      await audit(tx, id, actorId, "ROLL_ACCEPTED", roll, updated);
    return { roll: updated };
  }
  if (input.action === "RETRY") {
    if (roll.outcome !== "FAILURE" || !roll.retryAuthorizedById)
      throw new HttpError(
        403,
        "RETRY_NOT_AUTHORIZED",
        "A repetição de fuga ou resistência exige autorização do mestre desta campanha.",
      );
    const c = await tx.character.findUniqueOrThrow({ where: { id } });
    const gm = c.campaignId
      ? await tx.campaignMember.findFirst({
          where: {
            campaignId: c.campaignId,
            userId: roll.retryAuthorizedById,
            role: "GM",
            status: "ACTIVE",
            user: { disabledAt: null },
          },
        })
      : null;
    if (!gm)
      throw new HttpError(
        403,
        "RETRY_NOT_AUTHORIZED",
        "A autorização de mestre não está mais válida.",
      );
  }
  const pe = await tx.characterResource.findUniqueOrThrow({
    where: { characterId_key: { characterId: id, key: "PE" } },
  });
  const cost = input.action === "BONUS" ? 1 : 2;
  if (pe.current < cost)
    throw new HttpError(
      400,
      "PE_INSUFFICIENT",
      "PE insuficientes para esta opção.",
    );
  const results =
    input.action === "RETRY"
      ? rollExpression("1d20")
      : (roll.results as number[]);
  const target =
    input.action === "BONUS" ? Math.min(19, roll.target! + 2) : roll.target!;
  const updated = await tx.diceRoll.update({
    where: { id: roll.id },
    data: {
      results,
      total: results[0]!,
      target,
      outcome: resolveSkillCheck(results[0]!, target),
      effortMode: input.action,
      version: { increment: 1 },
      finalizedAt: new Date(),
    },
  });
  await tx.characterResource.update({
    where: { id: pe.id },
    data: { current: { decrement: cost }, version: { increment: 1 } },
  });
  await audit(
    tx,
    id,
    actorId,
    "EFFORT_" + input.action,
    gameSessionId ? { PE: pe.current } : { roll, PE: pe.current },
    gameSessionId
      ? { PE: pe.current - cost }
      : { roll: updated, PE: pe.current - cost },
  );
  return { roll: updated, spent: cost };
}
export async function authorizeRetry(
  tx: Tx,
  id: string,
  actorId: string,
  rollId: string,
  input: z.infer<typeof authorizeRetrySchema>,
  isGM: boolean,
  gameSessionId?: string,
) {
  if (!isGM)
    throw new HttpError(
      403,
      "GM_REQUIRED",
      "Somente um GM vinculado à campanha pode autorizar esta repetição.",
    );
  const roll = await openRoll(tx, id, rollId, input.version, gameSessionId);
  if (
    roll.outcome !== "FAILURE" ||
    roll.effortMode !== "NONE" ||
    !roll.retryRequestedAt ||
    roll.retryAuthorizedById
  )
    throw new HttpError(
      409,
      "RETRY_INVALID",
      "Esta rolagem não possui solicitação disponível.",
    );
  const updated = await tx.diceRoll.update({
    where: { id: rollId },
    data: {
      retryAuthorizedById: actorId,
      retryCategory: input.category,
      version: { increment: 1 },
    },
  });
  if (!gameSessionId)
    await audit(
      tx,
      id,
      actorId,
      "RETRY_AUTHORIZED",
      { roll },
      { roll: updated, category: input.category, reason: input.reason },
    );
  return { roll: updated };
}

export async function saveFatiguePolicy(
  tx: Tx,
  id: string,
  actorId: string,
  input: { version: number; physicalSkillKeys: string[] },
  isGM: boolean,
) {
  if (!isGM)
    throw new HttpError(
      403,
      "GM_REQUIRED",
      "Somente um GM vinculado pode configurar a fadiga da campanha.",
    );
  const c = await tx.character.findUniqueOrThrow({
    where: { id },
    include: { campaign: true },
  });
  if (!c.campaign)
    throw new HttpError(
      409,
      "CAMPAIGN_REQUIRED",
      "Vincule a ficha a uma campanha.",
    );
  const changed = await tx.campaign.updateMany({
    where: { id: c.campaign.id, version: input.version },
    data: {
      physicalSkillKeys: input.physicalSkillKeys,
      version: { increment: 1 },
    },
  });
  if (!changed.count) throw conflict();
  await audit(
    tx,
    id,
    actorId,
    "FATIGUE_POLICY_UPDATED",
    {
      physicalSkillKeys:
        c.campaign.physicalSkillKeys ?? DEFAULT_PHYSICAL_SKILLS,
    },
    { physicalSkillKeys: input.physicalSkillKeys },
  );
  return {
    physicalSkillKeys: input.physicalSkillKeys,
    campaignVersion: input.version + 1,
  };
}
