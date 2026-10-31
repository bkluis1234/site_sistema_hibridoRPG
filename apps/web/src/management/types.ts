import type { CampaignSummary } from "../../../../packages/shared/src/index";
export type Member = {
  id: string;
  userId: string;
  role: "GM" | "PLAYER";
  status: string;
  version: number;
  user: { username: string };
  disabled?: boolean;
};
export type Overview = {
  id: string;
  name: string;
  nickname: string;
  profession: string;
  status: string;
  version: number;
  ownerId: string;
  owner: { username: string };
  sharingEnabled: boolean;
  isOwner: boolean;
  readOnly: boolean;
  resources?: { key: string; current: number; maximum?: number }[];
  conditionState?: {
    fatigue: number;
    bleeding: boolean;
    critical: boolean;
    stabilization: string;
  } | null;
};
export type CampaignData = {
  campaign: CampaignSummary & {
    description?: string;
    notices?: string;
    gmNotes?: string;
    shareSheets?: boolean;
  };
  pending?: boolean;
  members?: Member[];
  characters?: Overview[];
};
export type Invite = {
  id: string;
  expiresAt: string;
  maxUses: number;
  useCount: number;
  revokedAt: string | null;
  version: number;
  createdAt: string;
};
export type RequestRow = {
  id: string;
  characterId: string;
  kind: string;
  reason: string;
  patch: unknown;
  baseVersion: number;
  version: number;
  createdAt: string;
  requester: { username: string };
  character: { name: string };
};
export type AuditEntry = {
  id: string;
  action: string;
  targetId?: string | null;
  reason?: string | null;
  createdAt: string;
  actor: { username: string };
  beforeData?: unknown;
  afterData?: unknown;
};
