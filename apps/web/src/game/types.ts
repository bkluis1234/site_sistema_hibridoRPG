import type {
  GameStatus,
  RollView,
  SheetDetails,
} from "../../../../packages/shared/src/index";
export type Game = {
  id: string;
  campaignId: string;
  title: string;
  status: GameStatus;
  scheduledAt: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  privateRollsToGM: boolean;
  narrativeSummary: string;
  version: number;
  createdAt: string;
};
export type Member = {
  id: string;
  user: { id: string; username: string };
  characterId: string | null;
  characterName: string | null;
  joinedAt: string;
  isOwner: boolean;
  canReadSheet: boolean;
  presence: "ONLINE" | "AWAY" | "OFFLINE";
  resources?: { key: string; current: number; maximum: number }[];
  conditions?: SheetDetails["conditions"] | null;
  injuries?: number;
};
export type Room = {
  session: Game;
  campaign: { id: string; name: string; shareSheets: boolean };
  host: { username: string };
  isGM: boolean;
  gmContext: boolean;
  participation: {
    id: string;
    characterId: string | null;
    version: number;
  } | null;
  participants: Member[];
  transfers: {
    enabled: boolean;
    approvalMode: string;
    campaignVersion: number;
  };
};
export type SessionRoll = Omit<RollView, "characterId"> & {
  characterId: string | null;
  characterName: string | null;
  userId: string;
  user: { username: string };
  visibility: "PUBLIC" | "PRIVATE" | "GM_ONLY" | "GM_SHARED";
  privateToGM: boolean;
  byGM: boolean;
  category: string;
  contextModifier: number;
  modifierReason: string | null;
};
export type Event = {
  id: string;
  type: string;
  category: string;
  visibility: string;
  characterId: string | null;
  data: Record<string, any>;
  createdAt: string;
  author: { id: string; username: string };
};
export type Note = {
  id: string;
  title: string;
  body: string;
  visibility: "PUBLIC" | "PRIVATE" | "GM_ONLY";
  version: number;
  authorId: string;
  author: { username: string };
  createdAt: string;
  updatedAt: string;
};
export type Transfer = {
  id: string;
  sourceCharacterId: string;
  destinationCharacterId: string;
  requesterId: string;
  quantity: number;
  status: string;
  itemSnapshot: { name: string };
  version: number;
  reason: string | null;
  createdAt: string;
};
export type GameAction = (
  suffix: string,
  body: Record<string, unknown>,
  method?: string,
) => Promise<any>;
export const gameLabels: Record<string, string> = {
  SCHEDULED: "Agendada",
  ACTIVE: "Em andamento",
  PAUSED: "Pausada",
  FINISHED: "Encerrada",
  CANCELLED: "Cancelada",
};
export const visibilityLabels: Record<string, string> = {
  PUBLIC: "Compartilhada",
  PRIVATE: "Privada",
  GM_ONLY: "Somente mestre",
  GM_SHARED: "Mestre · compartilhada",
};
export const eventLabels: Record<string, string> = {
  SESSION_SCHEDULED: "Sessão agendada",
  SESSION_STARTED: "Sessão iniciada",
  SESSION_PAUSED: "Sessão pausada",
  SESSION_RESUMED: "Sessão retomada",
  SESSION_FINISHED: "Sessão encerrada",
  SESSION_CANCELLED: "Sessão cancelada",
  PARTICIPANT_JOINED: "Participante entrou",
  ROLL_CREATED: "Rolagem registrada",
  ROLL_UPDATED: "Decisão de rolagem atualizada",
  RESOURCE_CHANGED: "Recurso alterado",
  CONDITIONS_UPDATED: "Condições atualizadas",
  CRITICAL_SUCCESS: "Sucesso de estabilização",
  CRITICAL_FAILURE: "Falha de estabilização",
  CRITICAL_START: "Estado crítico iniciado",
  CRITICAL_RESET: "Estado crítico revisto",
  CRITICAL_CLOSED: "Estado crítico encerrado",
  ITEM_CREATED: "Item adicionado",
  ITEM_UPDATED: "Item atualizado",
  ITEM_DELETED: "Item removido",
  ITEM_USED: "Item utilizado",
  ITEM_DISCARDED: "Item descartado",
  INJURY_CREATED: "Ferimento registrado",
  INJURY_UPDATED: "Ferimento atualizado",
  NOTE_CREATED: "Anotação registrada",
  NOTE_UPDATED: "Anotação atualizada",
  NOTE_DELETED: "Anotação removida",
  NARRATIVE_RECORDED: "Acontecimento registrado",
  SUMMARY_PUBLISHED: "Resumo narrativo publicado",
  TRANSFER_REQUESTED: "Transferência solicitada",
  TRANSFER_APPROVED: "Transferência confirmada",
  TRANSFER_REJECTED: "Transferência recusada",
  TRANSFER_POLICY_CHANGED: "Configuração de transferências",
  ATTRIBUTES_UPDATED: "Atributos atualizados",
  TRAINING_UPDATED: "Treinamentos atualizados",
  FATIGUE_POLICY_UPDATED: "Configuração de fadiga atualizada",
};
