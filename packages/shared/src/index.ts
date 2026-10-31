import { z } from "zod";
export const usernameSchema = z
  .string()
  .trim()
  .min(3, "Use ao menos 3 caracteres.")
  .max(32)
  .regex(/^[a-zA-Z0-9_]+$/, "Use letras, números e sublinhado.")
  .transform((v) => v.toLowerCase());
export const passwordSchema = z
  .string()
  .min(12, "Use ao menos 12 caracteres.")
  .max(128, "Use até 128 caracteres.");
export const loginSchema = z
  .object({ username: usernameSchema, password: z.string().min(1).max(128) })
  .strict();
export const registerSchema = z
  .object({
    username: usernameSchema,
    characterName: z.string().trim().max(80).optional(),
    password: passwordSchema,
    confirmPassword: z.string(),
    inviteCode: z.string().trim().max(128).optional(),
  })
  .strict()
  .refine((v) => v.password === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "As senhas precisam ser iguais.",
  });
export const recoverySchema = z
  .object({
    username: usernameSchema,
    recoveryCode: z.string().trim().min(1).max(128),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .strict()
  .refine((v) => v.password === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "As senhas precisam ser iguais.",
  });
export const characterCreateSchema = z
  .object({ name: z.string().trim().min(1).max(80) })
  .strict();
export const characterUpdateSchema = z
  .object({
    name: z.string().trim().min(1).max(80),
    concept: z.string().max(2000),
    version: z.number().int().min(1),
  })
  .strict();
export type PublicUser = {
  id: string;
  username: string;
  role: "ADMIN" | "PLAYER";
  canCreateCampaigns: boolean;
};
export type CharacterSummary = {
  id: string;
  name: string;
  concept: string;
  status: "DRAFT" | "PENDING_APPROVAL" | "APPROVED" | "ARCHIVED";
  rulesVersion: string;
  version: number;
  updatedAt: string;
  campaignId: string | null;
};

export * from "./sheet.js";

export * from "./campaigns.js";

export * from "./game.js";
