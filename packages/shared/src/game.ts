import { z } from "zod";
import {
  operationSchema,
  versionedSchema,
  conditionSchema,
  criticalSchema,
  injuryCreateSchema,
  injuryUpdateSchema,
  resourceSchema,
  inventoryCreateSchema,
  inventoryUpdateSchema,
  diceSchema,
  effortSchema,
  authorizeRetrySchema,
} from "./sheet.js";
import { SKILL_KEYS } from "../../rpg-rules/src/index.js";
export const gameStatuses = [
  "SCHEDULED",
  "ACTIVE",
  "PAUSED",
  "FINISHED",
  "CANCELLED",
] as const;
export type GameStatus = (typeof gameStatuses)[number];
export const gameCreateSchema = operationSchema
  .extend({
    title: z.string().trim().min(1).max(120),
    scheduledAt: z.iso.datetime({ offset: true }).nullable().default(null),
    privateRollsToGM: z.boolean().default(true),
  })
  .strict();
export const gameLifecycleSchema = versionedSchema
  .extend({ reason: z.string().trim().min(3).max(1000) })
  .strict();
export const gameJoinSchema = operationSchema
  .extend({ characterId: z.uuid().nullable() })
  .strict();
export const heartbeatSchema = z
  .object({ clientId: z.uuid(), away: z.boolean() })
  .strict();
export const gameNarrativeSchema = versionedSchema
  .extend({ narrativeSummary: z.string().max(12000) })
  .strict();
export const gameEventSchema = operationSchema
  .extend({
    title: z.string().trim().min(1).max(120),
    body: z.string().trim().min(1).max(4000),
    visibility: z.enum(["PUBLIC", "PRIVATE", "GM_ONLY"]),
  })
  .strict();
export const gameNoteCreateSchema = operationSchema
  .extend({
    title: z.string().trim().min(1).max(100),
    body: z.string().trim().min(1).max(12000),
    visibility: z.enum(["PUBLIC", "PRIVATE", "GM_ONLY"]),
  })
  .strict();
export const gameNoteUpdateSchema = gameNoteCreateSchema
  .extend({ version: z.number().int().positive() })
  .strict();
export const rollVisibilities = [
  "PUBLIC",
  "PRIVATE",
  "GM_ONLY",
  "GM_SHARED",
] as const;
export const gameRollSchema = operationSchema
  .extend({
    characterId: z.uuid().nullable(),
    expression: z
      .string()
      .regex(/^(?:[1-9]|[1-9][0-9]|100)d(?:4|6|8|10|12|20|100)$/)
      .optional(),
    skillKey: z
      .enum(
        SKILL_KEYS as [
          (typeof SKILL_KEYS)[number],
          ...(typeof SKILL_KEYS)[number][],
        ],
      )
      .optional(),
    visibility: z.enum(rollVisibilities),
    category: z.enum(["GENERAL", "DAMAGE"]).default("GENERAL"),
    fatigueOverride: z.boolean().optional(),
    contextModifier: z.number().int().min(-19).max(19).default(0),
    modifierReason: z.string().trim().min(5).max(500).optional(),
  })
  .strict()
  .refine(
    (v) => Boolean(v.expression) !== Boolean(v.skillKey),
    "Escolha dados ou perícia.",
  )
  .refine(
    (v) => !v.skillKey || v.characterId !== null,
    "Teste exige personagem.",
  )
  .refine(
    (v) =>
      (!v.contextModifier && v.fatigueOverride === undefined) ||
      Boolean(v.modifierReason),
    "Justifique modificadores contextuais.",
  );
const forCharacter = <T extends z.ZodRawShape>(schema: z.ZodObject<T>) =>
  schema.extend({ characterId: z.uuid() }).strict();
export const gameResourceSchema = forCharacter(resourceSchema);
export const gameConditionSchema = forCharacter(conditionSchema);
export const gameCriticalSchema = forCharacter(criticalSchema);
export const gameInjuryCreateSchema = forCharacter(injuryCreateSchema);
export const gameInjuryUpdateSchema = forCharacter(injuryUpdateSchema);
export const gameItemCreateSchema = forCharacter(inventoryCreateSchema);
export const gameItemUpdateSchema = forCharacter(inventoryUpdateSchema);
export const gameItemRemoveSchema = forCharacter(versionedSchema);
export const gameItemUseSchema = forCharacter(versionedSchema)
  .extend({
    quantity: z.number().int().min(1).max(1000000),
    kind: z.enum(["USE", "DISCARD"]),
  })
  .strict();
export const transferSettingsSchema = versionedSchema
  .extend({
    enabled: z.boolean(),
    approvalMode: z.enum(["RECIPIENT", "RECIPIENT_OR_GM"]),
    reason: z.string().trim().min(5).max(500),
  })
  .strict();
export const transferCreateSchema = operationSchema
  .extend({
    itemId: z.uuid(),
    destinationCharacterId: z.uuid(),
    quantity: z.number().int().positive().max(1000000),
    version: z.number().int().positive(),
  })
  .strict();
export const transferReviewSchema = versionedSchema
  .extend({
    decision: z.enum(["APPROVE", "REJECT"]),
    reason: z.string().trim().min(3).max(500),
  })
  .strict();
export {
  effortSchema as gameEffortSchema,
  authorizeRetrySchema as gameRetrySchema,
};
export type ConnectionState =
  | "connecting"
  | "live"
  | "reconnecting"
  | "polling"
  | "offline";
