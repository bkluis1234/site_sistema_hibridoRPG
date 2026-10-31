import { label } from "../locale";
import { formatDate } from "../locale";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router";
import {
  ArrowLeft,
  Clock,
  Check,
  Skull,
  Eye,
  ArrowUpRight,
} from "lucide-react";
import { api } from "../api";
import { ErrorBox, HorrorPanel, SectionHeader } from "../components";
import type { ReactNode } from "react";
import type { Overview, AuditEntry } from "./types";
export { HorrorPanel, SectionHeader, ErrorBox };
export const statusLabel = (s: string) =>
  ({
    DRAFT: "Rascunho",
    ACTIVE: "Ativa",
    PAUSED: "Pausada",
    FINISHED: "Encerrada",
    ARCHIVED: "Arquivada",
    PENDING: "Aguardando aceite",
    PENDING_APPROVAL: "Aguardando aprovação",
    APPROVED: "Aprovada",
    REJECTED: "Recusada",
    REMOVED: "Removido",
  })[s] ?? s;
export function useManage(keys: readonly unknown[][] = []) {
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: (action: {
      path: string;
      body: Record<string, unknown>;
      method: string;
      headers?: Record<string, string>;
    }) =>
      api<any>(action.path, {
        method: action.method,
        headers: action.headers,
        body: JSON.stringify(action.body),
      }),
    onSuccess: async () => {
      await Promise.all([
        ...keys.map((queryKey) => qc.invalidateQueries({ queryKey })),
        qc.invalidateQueries({ queryKey: ["notifications"] }),
        qc.invalidateQueries({ queryKey: ["campaigns"] }),
        qc.invalidateQueries({ queryKey: ["characters"] }),
      ]);
    },
  });
  return {
    ...mutation,
    act: async (
      path: string,
      body: Record<string, unknown>,
      method = "POST",
      headers?: Record<string, string>,
    ) => {
      if (mutation.isPending) return null;
      try {
        return await mutation.mutateAsync({
          path,
          body: { operationId: crypto.randomUUID(), ...body },
          method,
          headers,
        });
      } catch {
        return null;
      }
    },
  };
}
export function Feedback({
  mutation,
}: {
  mutation: ReturnType<typeof useManage>;
}) {
  return (
    <>
      <ErrorBox error={mutation.error} />
      {mutation.isPending && (
        <p className="management-status" role="status">
          <Clock size={15} />
          Confirmando no servidor…
        </p>
      )}
      {mutation.isSuccess && (
        <p className="management-status success" role="status">
          <Check size={15} />
          Operação confirmada.
        </p>
      )}
      {mutation.error && (
        <button
          className="button secondary"
          disabled={mutation.isPending}
          onClick={() =>
            mutation.variables && mutation.mutate(mutation.variables)
          }
        >
          Tentar novamente a mesma operação
        </button>
      )}
    </>
  );
}
export function ManagementHeading({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h1>
          {title}
          <span>.</span>
        </h1>
      </div>
      {children}
    </div>
  );
}
export function Back({
  to = "/campaigns",
  children = "Campanhas",
}: {
  to?: string;
  children?: ReactNode;
}) {
  return (
    <Link className="back-link" to={to}>
      <ArrowLeft size={15} />
      {children}
    </Link>
  );
}
export function CharacterOverviewCard({
  character,
  campaignId,
  gm = false,
}: {
  character: Overview;
  campaignId: string;
  gm?: boolean;
}) {
  const to = gm
    ? "/campaigns/" + campaignId + "/gm/characters/" + character.id
    : character.isOwner
      ? "/characters/" + character.id
      : "/campaigns/" + campaignId + "/characters/" + character.id;
  return (
    <Link className="campaign-character-card" to={to}>
      <div className="overview-portrait">
        <Skull size={34} strokeWidth={1} />
      </div>
      <div>
        <span className="tag neutral">{statusLabel(character.status)}</span>
        <h3>{character.name}</h3>
        <p>
          {[character.nickname, character.profession]
            .filter(Boolean)
            .join(" · ") || "Identificação em rascunho"}
        </p>
        <small>{character.owner.username}</small>
        {gm && character.resources && (
          <div className="mini-resources">
            {character.resources.map((r) => (
              <span key={r.key} className={r.key.toLowerCase()}>
                {r.key} {r.current}
                {r.maximum === undefined ? "" : "/" + r.maximum}
              </span>
            ))}
          </div>
        )}
      </div>
      <span className="overview-link">
        {gm
          ? "Editar como mestre"
          : character.isOwner
            ? "Minha ficha"
            : "Somente leitura"}
        <ArrowUpRight size={15} />
      </span>
    </Link>
  );
}
export function AuditTimeline({ entries }: { entries: AuditEntry[] }) {
  return (
    <ol className="audit-list">
      {entries.map((e) => (
        <li key={e.id}>
          <div className="audit-dot" />
          <div>
            <strong>{label(e.action)}</strong>
            <p>
              {e.actor.username} · {formatDate(e.createdAt, "datetime")}
            </p>
            {e.reason && <p>{e.reason}</p>}
            {Boolean(e.beforeData || e.afterData) && (
              <details>
                <summary>Conferir alteração</summary>
                <pre>
                  {JSON.stringify(
                    { antes: e.beforeData, depois: e.afterData },
                    null,
                    2,
                  )}
                </pre>
              </details>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
