import { z } from "zod";
import { ATTRIBUTE_KEYS, SKILL_KEYS } from "../../rpg-rules/src/index.js";
export const operationSchema = z.object({ operationId: z.uuid() });
export const versionedSchema = operationSchema.extend({
  version: z.number().int().min(1),
});
const text = (length = 4000) => z.string().max(length);
export const identityFields = {
  name: z.string().trim().min(1).max(80),
  concept: text(2000),
  nickname: text(80),
  age: z.number().int().min(0).max(200).nullable(),
  height: z.number().min(0.1).max(4).multipleOf(0.01).nullable(),
  weight: z.number().min(0.1).max(1500).multipleOf(0.01).nullable(),
  profession: text(160),
  backstory: text(12000),
  appearance: text(),
  personality: text(),
  objectives: text(),
  personalNotes: text(),
};
export const identitySchema = versionedSchema.extend(identityFields).strict();
export const attributesSchema = versionedSchema
  .extend({
    attributes: z
      .object({
        AGI: z.number().int().min(0).max(3),
        FOR: z.number().int().min(0).max(3),
        INT: z.number().int().min(0).max(3),
        PRE: z.number().int().min(0).max(3),
        VIG: z.number().int().min(0).max(3),
      })
      .strict(),
  })
  .strict();
export const skillsSchema = versionedSchema
  .extend({
    trained: z
      .array(
        z.enum(
          SKILL_KEYS as [
            (typeof SKILL_KEYS)[number],
            ...(typeof SKILL_KEYS)[number][],
          ],
        ),
      )
      .max(4),
  })
  .strict();
export const resourceSchema = versionedSchema
  .extend({
    key: z.enum(["PV", "SAN", "PE"]),
    mode: z.enum(["SET", "ADJUST"]),
    value: z.number().int().min(-100000).max(100000),
    event: z
      .enum(["ADJUSTMENT", "DAMAGE", "SINGLE_ATTACK", "HEALING"])
      .default("ADJUSTMENT"),
  })
  .strict();
export const inventoryFields = {
  name: z.string().trim().min(1).max(100),
  quantity: z.number().int().min(0).max(1000000),
  slotsPerUnit: z.number().min(0).max(999999.99).multipleOf(0.01),
  description: text(),
  notes: text(),
  equipment: z.boolean(),
  type: text(100),
  damage: text(80),
};
export const inventoryCreateSchema = operationSchema
  .extend(inventoryFields)
  .strict();
export const inventoryUpdateSchema = versionedSchema
  .extend(inventoryFields)
  .strict();
export const conditionSchema = versionedSchema
  .extend({
    fatigue: z.number().int().min(0).max(3).optional(),
    bleeding: z.boolean().optional(),
  })
  .strict()
  .refine(
    (v) => v.fatigue !== undefined || v.bleeding !== undefined,
    "Informe uma condição.",
  );
export const criticalSchema = versionedSchema
  .extend({ action: z.enum(["SUCCESS", "FAILURE", "RESET", "START"]) })
  .strict();
export const injuryFields = {
  description: z.string().trim().min(1).max(4000),
  location: text(160),
  consequences: text(),
  status: z.enum(["ACTIVE", "TREATED", "RESOLVED"]),
};
export const injuryCreateSchema = operationSchema.extend(injuryFields).strict();
export const injuryUpdateSchema = versionedSchema.extend(injuryFields).strict();
export const diceSchema = operationSchema
  .extend({
    characterId: z.uuid(),
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
    fatigueOverride: z.boolean().optional(),
  })
  .strict()
  .refine(
    (v) => Boolean(v.expression) !== Boolean(v.skillKey),
    "Escolha dados ou perícia, não ambos.",
  );
export const effortSchema = versionedSchema
  .extend({ action: z.enum(["ACCEPT", "BONUS", "REQUEST_RETRY", "RETRY"]) })
  .strict();
export const authorizeRetrySchema = versionedSchema
  .extend({
    category: z.enum(["ESCAPE", "RESISTANCE"]),
    reason: z.string().trim().min(5).max(500),
  })
  .strict();
export type IdentityFields = z.infer<z.ZodObject<typeof identityFields>>;
export type InventoryFields = z.infer<z.ZodObject<typeof inventoryFields>>;
export type InjuryFields = z.infer<z.ZodObject<typeof injuryFields>>;
export type SheetDetails = {
  id: string;
  name: string;
  status: "DRAFT" | "PENDING_APPROVAL" | "APPROVED" | "ARCHIVED";
  version: number;
  identityVersion: number;
  attributesVersion: number;
  skillsVersion: number;
  rulesVersion: string;
  isGM: boolean;
  identity: IdentityFields;
  attributes: Record<(typeof ATTRIBUTE_KEYS)[number], number>;
  resources: {
    key: "PV" | "SAN" | "PE";
    current: number;
    maximum: number;
    version: number;
  }[];
  skills: {
    key: (typeof SKILL_KEYS)[number];
    name: string;
    attribute: (typeof ATTRIBUTE_KEYS)[number];
    trained: boolean;
    baseTarget: number;
    fatiguePenalty: number;
    target: number;
    physical: boolean;
  }[];
  conditions: {
    fatigue: number;
    bleeding: boolean;
    critical: boolean;
    incapacitated: boolean;
    successes: number;
    failures: number;
    stabilization: string;
    version: number;
  };
  inventory: (InventoryFields & { id: string; version: number })[];
  inventoryUsage: number;
  inventoryCapacity: number;
  injuries: (InjuryFields & {
    id: string;
    version: number;
    createdAt: string;
  })[];
  physicalSkillsConfirmed: boolean;
  physicalSkillKeys: string[];
  campaignVersion: number | null;
  portrait: { configured: boolean; maxBytes: number; mimeTypes: string[] };
};
export type RollView = {
  id: string;
  characterId: string;
  expression: string;
  results: number[];
  total: number;
  initialResults: number[];
  skillKey: string | null;
  baseTarget: number | null;
  fatiguePenalty: number;
  target: number | null;
  outcome: string | null;
  effortMode: string;
  version: number;
  finalizedAt: string | null;
  retryRequestedAt: string | null;
  retryAuthorizedById: string | null;
  createdAt: string;
};
export type HistoryEntry = {
  id: string;
  action: string;
  actor: { username: string };
  recordVersion: number;
  beforeData: unknown;
  afterData: unknown;
  createdAt: string;
};

export const fatiguePolicySchema = versionedSchema
  .extend({
    physicalSkillKeys: z
      .array(
        z.enum(
          SKILL_KEYS as [
            (typeof SKILL_KEYS)[number],
            ...(typeof SKILL_KEYS)[number][],
          ],
        ),
      )
      .max(21),
  })
  .strict()
  .refine(
    (v) => new Set(v.physicalSkillKeys).size === v.physicalSkillKeys.length,
    "Não repita perícias.",
  );
