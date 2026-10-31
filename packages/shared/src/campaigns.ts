import { z } from "zod";
import { operationSchema, versionedSchema } from "./sheet.js";
import { ATTRIBUTE_KEYS, SKILL_KEYS } from "../../rpg-rules/src/index.js";
export const campaignStatuses = [
  "DRAFT",
  "ACTIVE",
  "PAUSED",
  "FINISHED",
  "ARCHIVED",
] as const;
export const narrativeFields = [
  "concept",
  "backstory",
  "appearance",
  "personality",
  "objectives",
] as const;
export const campaignFields = {
  name: z.string().trim().min(1).max(100),
  description: z.string().max(8000),
  status: z.enum(campaignStatuses),
  shareSheets: z.boolean(),
  notices: z.string().max(8000),
};
export const campaignCreateSchema = operationSchema
  .extend({
    ...campaignFields,
    status: z.enum(campaignStatuses).default("ACTIVE"),
    description: z.string().max(8000).default(""),
    shareSheets: z.boolean().default(false),
    notices: z.string().max(8000).default(""),
  })
  .strict();
export const campaignUpdateSchema = versionedSchema
  .extend(campaignFields)
  .strict();
export const gmNotesSchema = versionedSchema
  .extend({ gmNotes: z.string().max(12000) })
  .strict();
export const campaignInviteSchema = operationSchema
  .extend({
    expiresInHours: z.number().int().min(1).max(168),
    maxUses: z.number().int().min(1).max(100),
  })
  .strict();
export const joinSchema = operationSchema
  .extend({ code: z.string().trim().min(20).max(128) })
  .strict();
export const membershipSchema = versionedSchema
  .extend({
    decision: z.enum(["ACCEPT", "REJECT", "REMOVE"]),
    reason: z.string().trim().min(3).max(1000),
  })
  .strict();
export const linkSchema = operationSchema
  .extend({ characterId: z.uuid(), version: z.number().int().positive() })
  .strict();
export const approvalSchema = versionedSchema
  .extend({
    decision: z.enum(["APPROVE", "CORRECTION"]),
    comment: z.string().trim().min(3).max(1000),
  })
  .strict();
export const mechanicsPatchSchema = z.discriminatedUnion("kind", [
  z
    .object({
      kind: z.literal("ATTRIBUTES"),
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
    .strict(),
  z
    .object({
      kind: z.literal("SKILLS"),
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
    .strict(),
]);
export const changeRequestSchema = versionedSchema
  .extend({
    reason: z.string().trim().min(5).max(1000),
    change: mechanicsPatchSchema,
  })
  .strict();
export const changeReviewSchema = versionedSchema
  .extend({
    decision: z.enum(["APPROVE", "REJECT"]),
    comment: z.string().trim().min(3).max(1000),
  })
  .strict();
export const sharingSchema = versionedSchema
  .extend({
    sharingEnabled: z.boolean(),
    publicFields: z.array(z.enum(narrativeFields)).max(5),
  })
  .strict()
  .refine(
    (v) => new Set(v.publicFields).size === v.publicFields.length,
    "Não repita campos.",
  );
export const noteFields = {
  title: z.string().trim().min(1).max(100),
  body: z.string().trim().min(1).max(12000),
  visibility: z.enum(["PUBLIC", "PRIVATE", "GM_ONLY"]),
};
export const noteCreateSchema = operationSchema.extend(noteFields).strict();
export const noteUpdateSchema = versionedSchema.extend(noteFields).strict();
export const reauthSchema = z
  .object({
    password: z.string().min(1).max(128),
    recoveryCode: z.string().trim().min(20).max(128).optional(),
  })
  .strict();
export const accountSchema = versionedSchema
  .extend({ disabled: z.boolean(), reason: z.string().trim().min(5).max(500) })
  .strict();
export const privilegeSchema = versionedSchema
  .extend({
    canCreateCampaigns: z.boolean(),
    reason: z.string().trim().min(5).max(500),
  })
  .strict();
export const globalRoleSchema = versionedSchema
  .extend({
    role: z.enum(["ADMIN", "PLAYER"]),
    confirmation: z.string().min(3).max(32),
    reason: z.string().trim().min(5).max(500),
  })
  .strict();
export const memberRoleSchema = versionedSchema
  .extend({
    role: z.enum(["GM", "PLAYER"]),
    reason: z.string().trim().min(5).max(500),
  })
  .strict();
export const settingsSchema = versionedSchema
  .extend({
    registrationOpen: z.boolean(),
    campaignCreationEnabled: z.boolean(),
    reason: z.string().trim().min(5).max(500),
  })
  .strict();
export const adminCampaignSchema = versionedSchema
  .extend({
    status: z.enum(campaignStatuses),
    reason: z.string().trim().min(5).max(500),
  })
  .strict();
export type CampaignSummary = {
  id: string;
  name: string;
  status: (typeof campaignStatuses)[number];
  systemVersion: string;
  version: number;
  role: "GM" | "PLAYER";
  membershipStatus: "PENDING" | "ACTIVE" | "REMOVED" | "REJECTED";
};
export type SharedCharacter = {
  id: string;
  name: string;
  nickname: string;
  profession: string;
  appearance?: string;
  narratives: Partial<Record<(typeof narrativeFields)[number], string>>;
  status: string;
  attributes: Record<(typeof ATTRIBUTE_KEYS)[number], number>;
  resources: { key: string; current: number; maximum: number }[];
  skills: {
    key: string;
    name: string;
    attribute: string;
    trained: boolean;
    baseTarget: number;
    fatiguePenalty: number;
    target: number;
  }[];
  inventory: {
    id: string;
    name: string;
    quantity: number;
    slotsPerUnit: number;
    description: string;
    equipment: boolean;
    type: string;
    damage: string;
  }[];
  conditions: {
    fatigue: number;
    bleeding: boolean;
    critical: boolean;
    incapacitated: boolean;
    successes: number;
    failures: number;
    stabilization: string;
  };
  notes: { id: string; title: string; body: string }[];
};
