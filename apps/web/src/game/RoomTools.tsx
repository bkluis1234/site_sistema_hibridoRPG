import { useEffect, useState } from "react";
import { Link } from "react-router";
import { ShieldCheck, HeartPulse, BookOpen } from "lucide-react";
import { HorrorPanel, SectionHeader, ErrorBox } from "../components";
import { ResourceControl } from "../sheet/Resources";
import { ConditionTracker, Injuries } from "../sheet/Conditions";
import { InventoryTable } from "../sheet/Inventory";
import type { SheetDetails } from "../../../../packages/shared/src/index";
import type { Act } from "../sheet/types";
import {
  gameLabels,
  eventLabels,
  type Room,
  type GameAction,
  type Transfer,
} from "./types";
export function SurvivalPanel({
  sheet,
  act,
  busy,
  canAct,
  gameAct,
  campaignId,
  gm,
}: {
  sheet: SheetDetails;
  act: Act;
  busy: boolean;
  canAct: boolean;
  gameAct: GameAction;
  campaignId: string;
  gm: boolean;
}) {
  const [section, setSection] = useState("resources");
  const locked = busy || !canAct;
  return (
    <HorrorPanel>
      <SectionHeader title={sheet.name} />
      <div className="session-survival-tabs">
        {[
          ["resources", "Recursos"],
          ["conditions", "Condições"],
          ["inventory", "Inventário"],
        ].map(([key, label]) => (
          <button
            className={section === key ? "active" : ""}
            key={key}
            onClick={() => setSection(key!)}
          >
            {label}
          </button>
        ))}
      </div>
      {section === "resources" && (
        <>
          <div className="session-resource-stack">
            {sheet.resources.map((resource) => (
              <ResourceControl
                resource={resource}
                key={resource.key}
                act={act}
                busy={busy}
                archived={!canAct}
              />
            ))}
          </div>
          <p className="small muted">
            Fadiga {sheet.conditions.fatigue} · Sangramento{" "}
            {sheet.conditions.bleeding ? "sim" : "não"} ·{" "}
            {sheet.conditions.critical
              ? "Estado crítico ativo"
              : "Sem estado crítico"}
          </p>
        </>
      )}
      {section === "conditions" && (
        <fieldset disabled={locked} className="session-fieldset">
          <ConditionTracker sheet={sheet} act={act} busy={locked} />
          <h3 className="management-subheading">Ferimentos</h3>
          <Injuries sheet={sheet} act={act} busy={locked} />
        </fieldset>
      )}
      {section === "inventory" && (
        <fieldset disabled={locked} className="session-fieldset">
          <InventoryTable sheet={sheet} act={act} busy={locked} />
          <div className="session-use-items">
            {sheet.inventory
              .filter((i) => i.quantity > 0)
              .map((item) => (
                <article key={item.id}>
                  <strong>
                    {item.name} · {item.quantity}
                  </strong>
                  <div className="form-buttons">
                    <button
                      className="button secondary"
                      disabled={locked}
                      onClick={() =>
                        gameAct("/inventory/" + item.id + "/use", {
                          characterId: sheet.id,
                          version: item.version,
                          quantity: 1,
                          kind: "USE",
                        })
                      }
                    >
                      Usar 1 {item.name}
                    </button>
                    <button
                      className="sheet-quiet"
                      disabled={locked}
                      onClick={() =>
                        gameAct("/inventory/" + item.id + "/use", {
                          characterId: sheet.id,
                          version: item.version,
                          quantity: 1,
                          kind: "DISCARD",
                        })
                      }
                    >
                      Descartar 1
                    </button>
                  </div>
                </article>
              ))}
          </div>
        </fieldset>
      )}
      <Link
        className="sheet-quiet session-full-sheet"
        to={
          gm
            ? "/campaigns/" + campaignId + "/gm/characters/" + sheet.id
            : "/characters/" + sheet.id
        }
      >
        <BookOpen size={15} />
        Abrir ficha completa
      </Link>
    </HorrorPanel>
  );
}
export function SessionGroup({ room }: { room: Room }) {
  return (
    <HorrorPanel>
      <SectionHeader title="Quem está na sala" />
      <p className="small muted">
        Presença aproximada de conexão, sem confirmar presença física. Celulares
        podem suspender a aba.
      </p>
      <div className="session-roster">
        {room.participants.map((p) => (
          <article key={p.id}>
            <div className="session-member-heading">
              <span className={"presence-dot " + p.presence.toLowerCase()} />
              <div>
                <h3>{p.characterName ?? p.user.username}</h3>
                <small>
                  {p.user.username} ·{" "}
                  {p.presence === "ONLINE"
                    ? "Online"
                    : p.presence === "AWAY"
                      ? "Ausente"
                      : "Offline"}
                </small>
              </div>
            </div>
            {p.resources ? (
              <div className="mini-resources">
                {p.resources.map((r) => (
                  <span className={r.key.toLowerCase()} key={r.key}>
                    {r.key} {r.current}/{r.maximum}
                  </span>
                ))}
              </div>
            ) : (
              p.characterId && (
                <p className="small muted">
                  Ficha sem compartilhamento de recursos.
                </p>
              )
            )}
            {p.conditions && (
              <p className="small">
                Fadiga {p.conditions.fatigue} · Sangramento{" "}
                {p.conditions.bleeding ? "sim" : "não"} · Crítico{" "}
                {p.conditions.critical ? "sim" : "não"}
                {p.conditions.critical
                  ? " · " +
                    p.conditions.successes +
                    " sucessos / " +
                    p.conditions.failures +
                    " falhas"
                  : ""}
              </p>
            )}
            {p.characterId && p.canReadSheet && (
              <Link
                className="sheet-quiet"
                to={
                  p.isOwner
                    ? "/characters/" + p.characterId
                    : room.gmContext
                      ? "/campaigns/" +
                        room.campaign.id +
                        "/gm/characters/" +
                        p.characterId
                      : "/campaigns/" +
                        room.campaign.id +
                        "/characters/" +
                        p.characterId
                }
              >
                {p.isOwner
                  ? "Minha ficha"
                  : room.gmContext
                    ? "Editar como mestre"
                    : "Consultar ficha compartilhada"}
              </Link>
            )}
          </article>
        ))}
      </div>
    </HorrorPanel>
  );
}
export function MasterControls({
  room,
  act,
  busy,
}: {
  room: Room;
  act: GameAction;
  busy: boolean;
}) {
  const [action, setAction] = useState(""),
    [reason, setReason] = useState(""),
    [summary, setSummary] = useState(room.session.narrativeSummary),
    [dirty, setDirty] = useState(false),
    [baseVersion, setBaseVersion] = useState(room.session.version);
  useEffect(() => {
    if (!dirty) {
      setSummary(room.session.narrativeSummary);
      setBaseVersion(room.session.version);
    }
  }, [room.session.version, dirty]);
  const actions: Record<string, [string, string][]> = {
    SCHEDULED: [
      ["start", "Iniciar sessão"],
      ["cancel", "Cancelar agendamento"],
    ],
    ACTIVE: [
      ["pause", "Pausar sessão"],
      ["finish", "Encerrar sessão"],
    ],
    PAUSED: [
      ["resume", "Retomar sessão"],
      ["finish", "Encerrar sessão"],
    ],
    FINISHED: [],
    CANCELLED: [],
  };
  return (
    <HorrorPanel>
      <SectionHeader title="Controles do mestre" />
      <p className="small muted">
        {gameLabels[room.session.status]}. Decisões e alterações ficam
        registradas.
      </p>
      <div className="master-actions">
        {actions[room.session.status]?.map(([key, label]) => (
          <button
            key={key}
            className="button secondary"
            disabled={busy}
            onClick={() => {
              setAction(key);
              setReason("");
            }}
          >
            <ShieldCheck size={15} />
            {label}
          </button>
        ))}
      </div>
      {action && (
        <form
          className="session-lifecycle-confirm"
          aria-label="Confirmar estado da sessão"
          onSubmit={async (e) => {
            e.preventDefault();
            if (
              await act("/" + action, { version: room.session.version, reason })
            )
              setAction("");
          }}
        >
          <h3>
            {actions[room.session.status]?.find(
              ([key]) => key === action,
            )?.[1] ?? "Confirmar ação"}
          </h3>
          {action === "finish" && (
            <p>
              Encerrar mantém o histórico autorizado e gera o resumo. A sala não
              poderá ser reaberta.
            </p>
          )}
          <label className="field">
            <span>Justificativa pública da sessão</span>
            <textarea
              required
              minLength={3}
              maxLength={1000}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </label>
          <div className="form-buttons">
            <button
              className="button primary"
              disabled={busy || reason.trim().length < 3}
            >
              Confirmar{" "}
              {action === "finish"
                ? "encerramento"
                : action === "start"
                  ? "início"
                  : "alteração de estado"}
            </button>
            <button
              className="button secondary"
              type="button"
              onClick={() => setAction("")}
            >
              Cancelar
            </button>
          </div>
        </form>
      )}
      {room.session.status !== "CANCELLED" && (
        <details className="session-summary-editor">
          <summary>Resumo narrativo do mestre</summary>
          <p className="small muted">
            Texto publicado para os participantes. Não inclua segredos nesta
            área.
          </p>
          <label className="field">
            <span>Resumo narrativo compartilhado</span>
            <textarea
              rows={5}
              value={summary}
              onChange={(e) => {
                setSummary(e.target.value);
                setDirty(true);
              }}
              maxLength={12000}
            />
          </label>
          <button
            className="button secondary"
            disabled={busy}
            onClick={async () => {
              if (
                await act(
                  "/summary",
                  { version: baseVersion, narrativeSummary: summary },
                  "PATCH",
                )
              )
                setDirty(false);
            }}
          >
            Publicar resumo narrativo
          </button>
          {dirty && (
            <button className="sheet-quiet" onClick={() => setDirty(false)}>
              Descartar rascunho e atualizar
            </button>
          )}
        </details>
      )}
    </HorrorPanel>
  );
}
export function TransfersPanel({
  room,
  sheet,
  transfers,
  act,
  busy,
  userId,
}: {
  room: Room;
  sheet?: SheetDetails;
  transfers: Transfer[];
  act: GameAction;
  busy: boolean;
  userId: string;
}) {
  const [itemId, setItemId] = useState(""),
    [destination, setDestination] = useState(""),
    [quantity, setQuantity] = useState(1),
    [reason, setReason] = useState("Recebimento confirmado."),
    [settings, setSettings] = useState(false),
    [enabled, setEnabled] = useState(room.transfers.enabled),
    [mode, setMode] = useState(room.transfers.approvalMode),
    [policyReason, setPolicyReason] = useState(""),
    [baseVersion, setBaseVersion] = useState(room.transfers.campaignVersion);
  const selected = sheet?.inventory.find((i) => i.id === itemId);
  const active = room.session.status === "ACTIVE";
  const closed = ["FINISHED", "CANCELLED"].includes(room.session.status);
  return (
    <HorrorPanel>
      <SectionHeader title="Transferência de itens" />
      {!room.transfers.enabled ? (
        <p className="small muted">
          Desativada nesta campanha até aprovação do mestre. Nenhum item será
          movimentado automaticamente.
        </p>
      ) : (
        <>
          <p className="small muted">
            Envio só é aplicado após confirmação e conferência de capacidade.
            Observações privadas do item não são enviadas.
          </p>
          {sheet?.access.isOwner && active && (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (
                  selected &&
                  (await act("/transfers", {
                    itemId,
                    quantity,
                    destinationCharacterId: destination,
                    version: selected.version,
                  }))
                ) {
                  setItemId("");
                  setDestination("");
                }
              }}
            >
              <label className="field">
                <span>Item para transferir</span>
                <select
                  required
                  value={itemId}
                  onChange={(e) => setItemId(e.target.value)}
                >
                  <option value="">Escolha um item</option>
                  {sheet.inventory
                    .filter((i) => i.quantity > 0)
                    .map((i) => (
                      <option value={i.id} key={i.id}>
                        {i.name} · {i.quantity}
                      </option>
                    ))}
                </select>
              </label>
              <label className="field">
                <span>Quantidade para transferir</span>
                <input
                  type="number"
                  required
                  min={1}
                  max={selected?.quantity ?? 1}
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                />
              </label>
              <label className="field">
                <span>Personagem destinatário</span>
                <select
                  required
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                >
                  <option value="">Escolha no grupo</option>
                  {room.participants
                    .filter((p) => p.characterId && !p.isOwner)
                    .map((p) => (
                      <option key={p.id} value={p.characterId!}>
                        {p.characterName}
                      </option>
                    ))}
                </select>
              </label>
              <button className="button secondary" disabled={busy || !selected}>
                Solicitar transferência
              </button>
            </form>
          )}
          {transfers.length > 0 && (
            <label className="field">
              <span>Comentário do recebimento</span>
              <input
                value={reason}
                minLength={3}
                maxLength={500}
                onChange={(e) => setReason(e.target.value)}
              />
            </label>
          )}
          {transfers.map((t) => {
            const mine = room.participants.find(
              (p) => p.characterId === t.destinationCharacterId,
            )?.isOwner;
            return (
              <article className="session-transfer" key={t.id}>
                <h3>
                  {t.itemSnapshot.name} · {t.quantity}
                </h3>
                <p>
                  {t.status === "PENDING"
                    ? "Aguardando confirmação"
                    : t.status === "APPROVED"
                      ? "Transferência confirmada"
                      : "Transferência recusada"}
                </p>
                {t.reason && <p>{t.reason}</p>}
                {active &&
                  t.status === "PENDING" &&
                  (mine ||
                    (room.gmContext &&
                      room.transfers.approvalMode === "RECIPIENT_OR_GM")) && (
                    <div className="form-buttons">
                      <button
                        className="button secondary"
                        disabled={busy || reason.trim().length < 3}
                        onClick={() =>
                          act("/transfers/" + t.id + "/review", {
                            version: t.version,
                            decision: "APPROVE",
                            reason,
                          })
                        }
                      >
                        Confirmar recebimento
                      </button>
                      <button
                        className="sheet-quiet"
                        disabled={busy || reason.trim().length < 3}
                        onClick={() =>
                          act("/transfers/" + t.id + "/review", {
                            version: t.version,
                            decision: "REJECT",
                            reason,
                          })
                        }
                      >
                        Recusar recebimento
                      </button>
                    </div>
                  )}
              </article>
            );
          })}
        </>
      )}
      {room.gmContext && !closed && (
        <>
          <button
            className="sheet-quiet"
            onClick={() => {
              setSettings(!settings);
              setEnabled(room.transfers.enabled);
              setMode(room.transfers.approvalMode);
              setBaseVersion(room.transfers.campaignVersion);
            }}
          >
            Configurar transferências
          </button>
          {settings && (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (
                  await act(
                    "/transfer-settings",
                    {
                      version: baseVersion,
                      enabled,
                      approvalMode: mode,
                      reason: policyReason,
                    },
                    "PATCH",
                  )
                )
                  setSettings(false);
              }}
            >
              <p className="small muted">
                Habilite apenas após aprovar este fluxo para a campanha.
              </p>
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) => setEnabled(e.target.checked)}
                />
                Habilitar transferências aprovadas
              </label>
              <label className="field">
                <span>Quem confirma recebimento</span>
                <select value={mode} onChange={(e) => setMode(e.target.value)}>
                  <option value="RECIPIENT">Somente destinatário</option>
                  <option value="RECIPIENT_OR_GM">
                    Destinatário ou mestre
                  </option>
                </select>
              </label>
              <label className="field">
                <span>Justificativa da política</span>
                <textarea
                  value={policyReason}
                  onChange={(e) => setPolicyReason(e.target.value)}
                  minLength={5}
                  maxLength={500}
                />
              </label>
              <button
                className="button secondary"
                disabled={busy || policyReason.trim().length < 5}
              >
                Salvar política de transferências
              </button>
            </form>
          )}
        </>
      )}
    </HorrorPanel>
  );
}
export function SummaryPanel({
  summary,
  error,
}: {
  summary: any;
  error: unknown;
}) {
  return (
    <HorrorPanel>
      <SectionHeader title="Resumo registrado" />
      <ErrorBox error={error} />
      {summary && (
        <>
          <p>
            {summary.campaign.name} · {summary.session.title} ·{" "}
            {new Date(summary.session.finishedAt).toLocaleString("pt-BR")}
          </p>
          {summary.session.narrativeSummary && (
            <p className="session-prose">{summary.session.narrativeSummary}</p>
          )}
          <h3>Participantes registrados</h3>
          {summary.participants.map((p: any) => (
            <p key={p.id}>
              {p.characterName ?? p.user.username} · {p.user.username}
              {p.resources
                ? " · " +
                  p.resources
                    .map((r: any) => r.key + " " + r.current + "/" + r.maximum)
                    .join(" · ")
                : ""}
            </p>
          ))}
          <h3>Registros autorizados</h3>
          <p>
            {summary.rolls.length} rolagens visíveis nesta página ·{" "}
            {summary.notes.length} anotações visíveis.
          </p>
          <ul>
            {summary.eventCounts.map((e: any) => (
              <li key={e.type}>
                {eventLabels[e.type] ?? "Registro autorizado"}: {e.count}
              </li>
            ))}
          </ul>
          <p className="small muted">
            Resumo gerado a partir dos registros do servidor. A narrativa é
            preenchida pelo mestre. Históricos completos continuam disponíveis
            pelos filtros e páginas anteriores.
          </p>
        </>
      )}
    </HorrorPanel>
  );
}
