import { useState, useEffect } from "react";
import { Link, useParams, useLocation } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "../api";
import type {
  CampaignData,
  Invite,
  RequestRow,
  AuditEntry,
  Member,
  Overview,
} from "./types";
import {
  HorrorPanel,
  SectionHeader,
  ErrorBox,
  ManagementHeading,
  Back,
  Feedback,
  useManage,
  CharacterOverviewCard,
  AuditTimeline,
  statusLabel,
} from "./common";
import {
  Plus,
  ShieldCheck,
  Copy,
  Users,
  Settings,
  FileText,
  Activity,
  KeyRound,
  Clock,
  HeartPulse,
  History,
} from "lucide-react";
export function PlayerRoster({
  members,
  gm,
  onDecision,
  busy,
}: {
  members: Member[];
  gm: boolean;
  onDecision: (member: Member, decision: string) => void;
  busy: boolean;
}) {
  return (
    <div className="roster-list">
      {members.map((m) => (
        <article key={m.id}>
          <div className="avatar">
            {m.user.username.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <strong>{m.user.username}</strong>
            <p>
              {m.role === "GM" ? "Mestre" : "Jogador"} · {statusLabel(m.status)}
              {m.disabled ? " · Conta desativada" : ""}
            </p>
          </div>
          {gm && m.role !== "GM" && (
            <div className="roster-actions">
              {m.status === "PENDING" ? (
                <>
                  <button
                    className="button secondary"
                    disabled={busy}
                    onClick={() => onDecision(m, "ACCEPT")}
                  >
                    Aceitar {m.user.username}
                  </button>
                  <button
                    className="button secondary"
                    disabled={busy}
                    onClick={() => onDecision(m, "REJECT")}
                  >
                    Recusar
                  </button>
                </>
              ) : m.status === "ACTIVE" ? (
                <button
                  className="sheet-quiet"
                  disabled={busy}
                  onClick={() => onDecision(m, "REMOVE")}
                >
                  Remover participante
                </button>
              ) : null}
            </div>
          )}
        </article>
      ))}
    </div>
  );
}
export function InviteManager({ campaignId }: { campaignId: string }) {
  const [code, setCode] = useState("");
  const [hours, setHours] = useState(24);
  const [uses, setUses] = useState(5);
  const query = useQuery({
    queryKey: ["campaign-invites", campaignId],
    queryFn: () =>
      api<{ invites: Invite[] }>("/campaigns/" + campaignId + "/invites"),
  });
  const mutation = useManage([["campaign-invites", campaignId]]);
  return (
    <>
      <p className="muted small">
        O código aparece uma única vez. Cada uso cria um pedido de jogador;
        aprovação do mestre é obrigatória.
      </p>
      <form
        className="invite-options"
        onSubmit={async (e) => {
          e.preventDefault();
          const result = await mutation.act(
            "/campaigns/" + campaignId + "/invites",
            { expiresInHours: hours, maxUses: uses },
          );
          if (result) setCode(result.code ?? "");
        }}
      >
        <label>
          Validade (horas)
          <input
            type="number"
            aria-label="Validade do convite em horas"
            min={1}
            max={168}
            value={hours}
            onChange={(e) => setHours(Number(e.target.value))}
          />
        </label>
        <label>
          Limite de usos
          <input
            type="number"
            aria-label="Limite de usos do convite"
            min={1}
            max={100}
            value={uses}
            onChange={(e) => setUses(Number(e.target.value))}
          />
        </label>
        <button className="button primary" disabled={mutation.isPending}>
          Gerar convite de jogador
        </button>
      </form>
      {code && (
        <div className="invite-code">
          <p>Entregue este código em particular:</p>
          <code data-testid="campaign-invite-code">{code}</code>
          <button className="button secondary" onClick={() => setCode("")}>
            Ocultar código
          </button>
        </div>
      )}
      <Feedback mutation={mutation} />
      <ErrorBox error={query.error} />
      <div className="invite-list">
        {query.data?.invites.map((i) => (
          <article className="invite-row" key={i.id}>
            <div>
              <strong>Convite {i.id.slice(0, 8)}</strong>
              <small>
                {i.useCount}/{i.maxUses} usos · expira{" "}
                {new Date(i.expiresAt).toLocaleString("pt-BR")}
              </small>
            </div>
            <span className="tag neutral">
              {i.revokedAt
                ? "Revogado"
                : new Date(i.expiresAt) < new Date()
                  ? "Expirado"
                  : i.useCount >= i.maxUses
                    ? "Esgotado"
                    : "Disponível"}
            </span>
            {!i.revokedAt && (
              <button
                className="button secondary"
                disabled={mutation.isPending}
                onClick={() =>
                  mutation.act(
                    "/campaigns/" + campaignId + "/invites/" + i.id,
                    { version: i.version },
                    "DELETE",
                  )
                }
              >
                Revogar convite
              </button>
            )}
          </article>
        ))}
      </div>
    </>
  );
}
export function ApprovalQueue({
  campaignId,
  characters,
  requests,
  busy,
  onReview,
  onChangeReview,
}: {
  campaignId: string;
  characters: Overview[];
  requests: RequestRow[];
  busy: boolean;
  onReview: (c: Overview, decision: string, comment: string) => void;
  onChangeReview: (r: RequestRow, decision: string, comment: string) => void;
}) {
  const [comment, setComment] = useState("");
  return (
    <>
      <label className="field">
        <span>Comentário da decisão</span>
        <textarea
          aria-label="Comentário da decisão"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          minLength={3}
          maxLength={1000}
          placeholder="Explique a aprovação ou a correção necessária."
        />
      </label>
      <h3>Fichas aguardando revisão</h3>
      {characters
        .filter((c) => c.status === "PENDING_APPROVAL")
        .map((c) => (
          <article className="approval-row" key={c.id}>
            <div>
              <strong>{c.name}</strong>
              <p>
                {c.owner.username} · versão {c.version}
              </p>
              <Link to={"/campaigns/" + campaignId + "/gm/characters/" + c.id}>
                Conferir ficha como mestre
              </Link>
            </div>
            <div className="form-buttons">
              <button
                className="button primary"
                disabled={busy || comment.trim().length < 3}
                onClick={() => onReview(c, "APPROVE", comment)}
              >
                Aprovar {c.name}
              </button>
              <button
                className="button secondary"
                disabled={busy || comment.trim().length < 3}
                onClick={() => onReview(c, "CORRECTION", comment)}
              >
                Solicitar correção
              </button>
            </div>
          </article>
        ))}
      <h3 className="management-subheading">
        Alterações mecânicas solicitadas
      </h3>
      {requests.map((r) => (
        <article className="approval-row" key={r.id}>
          <div>
            <strong>
              {r.character.name} ·{" "}
              {r.kind === "ATTRIBUTES" ? "Atributos" : "Treinamentos"}
            </strong>
            <p>
              {r.requester.username}: {r.reason}
            </p>
            <details>
              <summary>Conferir proposta</summary>
              <pre>{JSON.stringify(r.patch, null, 2)}</pre>
            </details>
          </div>
          <div className="form-buttons">
            <button
              className="button primary"
              disabled={busy || comment.trim().length < 3}
              onClick={() => onChangeReview(r, "APPROVE", comment)}
            >
              Aprovar alteração
            </button>
            <button
              className="button secondary"
              disabled={busy || comment.trim().length < 3}
              onClick={() => onChangeReview(r, "REJECT", comment)}
            >
              Recusar alteração
            </button>
          </div>
        </article>
      ))}
      {!requests.length &&
        !characters.some((c) => c.status === "PENDING_APPROVAL") && (
          <p className="management-empty">Nenhuma revisão pendente.</p>
        )}
    </>
  );
}
function CampaignSettings({
  data,
  onSave,
  busy,
}: {
  data: CampaignData;
  onSave: (body: Record<string, unknown>) => Promise<any>;
  busy: boolean;
}) {
  const c = data.campaign;
  const [name, setName] = useState(c.name);
  const [description, setDescription] = useState(c.description ?? "");
  const [status, setStatus] = useState(c.status);
  const [sharing, setSharing] = useState(c.shareSheets ?? false);
  const [notices, setNotices] = useState(c.notices ?? "");
  const [dirty, setDirty] = useState(false);
  const [baseVersion, setBaseVersion] = useState(c.version);
  useEffect(() => {
    if (!dirty) {
      setBaseVersion(c.version);
      setName(c.name);
      setDescription(c.description ?? "");
      setStatus(c.status);
      setSharing(c.shareSheets ?? false);
      setNotices(c.notices ?? "");
    }
  }, [c.version, dirty]);
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (
          await onSave({
            name,
            description,
            status,
            shareSheets: sharing,
            notices,
            version: baseVersion,
          })
        )
          setDirty(false);
      }}
    >
      <label className="field">
        <span>Nome da campanha</span>
        <input
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setDirty(true);
          }}
          required
          maxLength={100}
        />
      </label>
      <label className="field">
        <span>Descrição da campanha</span>
        <textarea
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
            setDirty(true);
          }}
          maxLength={8000}
          rows={4}
        />
      </label>
      <label className="field">
        <span>Status da campanha</span>
        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as typeof status);
            setDirty(true);
          }}
        >
          {["DRAFT", "ACTIVE", "PAUSED", "FINISHED", "ARCHIVED"].map((s) => (
            <option value={s} key={s}>
              {statusLabel(s)}
            </option>
          ))}
        </select>
      </label>
      <label className="checkbox">
        <input
          type="checkbox"
          checked={sharing}
          onChange={(e) => {
            setSharing(e.target.checked);
            setDirty(true);
          }}
        />
        Permitir fichas compartilhadas
      </label>
      <label className="field">
        <span>Avisos aos participantes</span>
        <textarea
          value={notices}
          onChange={(e) => {
            setNotices(e.target.value);
            setDirty(true);
          }}
          maxLength={8000}
        />
      </label>
      <p className="small muted">
        Sistema Híbrido 2.6. Imagens aguardam storage persistente. Arquivamento
        bloqueia ações de gestão; reativação administrativa exige confirmação.
      </p>
      <button
        className="button primary"
        disabled={busy || c.status === "ARCHIVED"}
      >
        Salvar configurações da campanha
      </button>
      {dirty && (
        <details className="management-local-copy">
          <summary>Preservar alterações locais e comparar</summary>
          <textarea
            aria-label="Cópia local das configurações"
            rows={5}
            readOnly
            value={JSON.stringify(
              { name, description, status, notices, shareSheets: sharing },
              null,
              2,
            )}
          />
          <button
            className="button secondary"
            type="button"
            onClick={() => setDirty(false)}
          >
            Descartar rascunho e carregar dados do servidor
          </button>
        </details>
      )}
    </form>
  );
}
export function CampaignDashboard() {
  const { id } = useParams();
  const manage = useLocation().pathname.endsWith("/gm");
  const [tab, setTab] = useState("overview");
  const [reason, setReason] = useState("");
  const [memberAction, setMemberAction] = useState<{
    member: Member;
    decision: string;
  } | null>(null);
  const [gmNotes, setGMNotes] = useState("");
  const [gmDirty, setGMDirty] = useState(false);
  const [gmVersion, setGMVersion] = useState(1);
  const [linkId, setLinkId] = useState("");
  const query = useQuery({
    queryKey: ["campaign", id, manage],
    queryFn: () =>
      api<CampaignData>("/campaigns/" + id + (manage ? "/manage" : "")),
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
  });
  const requests = useQuery({
    queryKey: ["campaign-requests", id],
    enabled: manage,
    queryFn: () =>
      api<{ requests: RequestRow[] }>("/campaigns/" + id + "/requests"),
    refetchInterval: 30000,
  });
  const history = useQuery({
    queryKey: ["campaign-history", id],
    enabled: manage && tab === "history",
    queryFn: () =>
      api<{ entries: AuditEntry[] }>("/campaigns/" + id + "/history"),
  });
  const eligible = useQuery({
    queryKey: ["campaign-eligible", id],
    enabled: manage,
    queryFn: () =>
      api<{
        characters: {
          id: string;
          name: string;
          version: number;
          owner: { username: string };
        }[];
      }>("/campaigns/" + id + "/eligible-characters"),
  });
  const own = useQuery({
    queryKey: ["characters"],
    enabled: !manage,
    queryFn: () =>
      api<{
        characters: {
          id: string;
          name: string;
          version: number;
          campaignId: string | null;
        }[];
      }>("/characters"),
  });
  const scopedNotes = useQuery({
    queryKey: ["scoped-notes", id],
    enabled: manage && tab === "notes",
    queryFn: () =>
      api<{
        notes: {
          id: string;
          title: string;
          body: string;
          characterId: string;
        }[];
      }>("/campaigns/" + id + "/scoped-notes"),
  });
  useEffect(() => {
    setTab("overview");
    setGMDirty(false);
    setGMNotes("");
    setGMVersion(1);
    setMemberAction(null);
    setReason("");
    setLinkId("");
  }, [manage, id]);
  const mutation = useManage([
    ["campaign", id],
    ["campaign-requests", id],
    ["campaign-history", id],
    ["campaign-eligible", id],
    ["scoped-notes", id],
    ["sheet"],
    ["sheet-history"],
  ]);
  useEffect(() => {
    if (query.data && !gmDirty) {
      setGMNotes(query.data.campaign.gmNotes ?? "");
      setGMVersion(query.data.campaign.version);
    }
  }, [query.data?.campaign.id, query.data?.campaign.version, gmDirty, manage]);
  if (query.isPending) return <p role="status">Carregando campanha…</p>;
  if (!query.data)
    return (
      <>
        <Back />
        <ErrorBox error={query.error} />
      </>
    );
  const data = query.data,
    c = data.campaign,
    characters = data.characters ?? [],
    members = data.members ?? [];
  const tabs = manage
    ? [
        ["overview", "Visão geral"],
        ["players", "Jogadores"],
        ["characters", "Personagens"],
        ["resources", "Recursos"],
        ["conditions", "Condições"],
        ["requests", "Solicitações"],
        ["invites", "Convites"],
        ["history", "Histórico"],
        ["settings", "Configurações"],
        ["notes", "Notas do mestre"],
      ]
    : [
        ["overview", "Visão geral"],
        ["players", "Participantes"],
        ["characters", "Personagens"],
      ];
  const review = async (ch: Overview, decision: string, comment: string) =>
    mutation.act("/characters/" + ch.id + "/approval", {
      version: ch.version,
      decision,
      comment,
    });
  const reviewChange = async (
    r: RequestRow,
    decision: string,
    comment: string,
  ) =>
    mutation.act(
      "/characters/" + r.characterId + "/change-requests/" + r.id + "/review",
      { version: r.version, decision, comment },
    );
  return (
    <div className="management-page">
      <Back />
      <ManagementHeading
        eyebrow={
          manage
            ? "CONTEXTO DE MESTRE · DADOS RESTRITOS"
            : "CAMPANHA · MODO JOGADOR"
        }
        title={c.name}
      >
        {!manage && c.role === "GM" && c.membershipStatus === "ACTIVE" ? (
          <Link className="button primary" to={"/campaigns/" + id + "/gm"}>
            <ShieldCheck size={16} />
            Abrir painel do mestre
          </Link>
        ) : manage ? (
          <Link className="button secondary" to={"/campaigns/" + id}>
            Modo jogador
          </Link>
        ) : null}
      </ManagementHeading>
      {manage && (
        <div className="context-banner">
          <ShieldCheck size={19} />
          <span>
            Modo Mestre. Alterações serão auditadas. Segredos só aparecem neste
            contexto.
          </span>
        </div>
      )}
      <span className="tag neutral">{statusLabel(c.status)} · Híbrido 2.6</span>
      <ErrorBox error={query.error} />
      {data.pending ? (
        <HorrorPanel>
          <h2>
            {c.membershipStatus === "PENDING"
              ? "Sua participação aguarda o mestre."
              : "Seu vínculo não está ativo."}
          </h2>
          <p>
            Fichas e informações da campanha só ficam disponíveis após o aceite.
          </p>
        </HorrorPanel>
      ) : (
        <>
          <nav className="management-tabs" aria-label="Seções da campanha">
            {tabs.map(([key, label]) => (
              <button
                key={key}
                className={tab === key ? "active" : ""}
                onClick={() => setTab(key)}
              >
                {label}
              </button>
            ))}
          </nav>
          <Feedback mutation={mutation} />
          {memberAction && (
            <div
              className="sheet-confirm"
              role="dialog"
              aria-label="Decisão de participante"
            >
              <h3>
                {memberAction.decision === "REMOVE" ? "Remover" : "Analisar"}{" "}
                {memberAction.member.user.username}
              </h3>
              <p>
                Remover um participante preserva sua conta e suas fichas; o
                vínculo com esta campanha será removido.
              </p>
              <label className="field">
                <span>Justificativa da decisão</span>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  minLength={3}
                  maxLength={1000}
                />
              </label>
              <button
                className="button primary"
                disabled={mutation.isPending || reason.trim().length < 3}
                onClick={async () => {
                  if (
                    await mutation.act(
                      "/campaigns/" +
                        id +
                        "/members/" +
                        memberAction.member.userId,
                      {
                        version: memberAction.member.version,
                        decision: memberAction.decision,
                        reason,
                      },
                      "PATCH",
                    )
                  ) {
                    setMemberAction(null);
                    setReason("");
                  }
                }}
              >
                Confirmar decisão
              </button>
              <button
                className="button secondary"
                onClick={() => setMemberAction(null)}
              >
                Cancelar
              </button>
            </div>
          )}
          {tab === "overview" && (
            <>
              <HorrorPanel>
                <SectionHeader title="A história até aqui" />
                <p>{c.description || "Nenhuma descrição publicada."}</p>
                {c.notices && (
                  <div className="campaign-notice">
                    <strong>Avisos</strong>
                    <p>{c.notices}</p>
                  </div>
                )}
                <div className="campaign-stats">
                  <span>
                    {members.filter((m) => m.status === "ACTIVE").length}{" "}
                    participantes
                  </span>
                  <span>
                    {characters.length} fichas{" "}
                    {manage ? "vinculadas" : "visíveis"}
                  </span>
                  {manage && (
                    <span>
                      {characters.filter(
                        (ch) => ch.status === "PENDING_APPROVAL",
                      ).length + (requests.data?.requests.length ?? 0)}{" "}
                      revisões pendentes
                    </span>
                  )}
                </div>
              </HorrorPanel>
              <div className="character-grid">
                {characters.map((ch) => (
                  <CharacterOverviewCard
                    key={ch.id}
                    character={ch}
                    campaignId={id!}
                    gm={manage}
                  />
                ))}
              </div>
            </>
          )}
          {tab === "players" && (
            <HorrorPanel>
              <SectionHeader
                title={manage ? "Participantes e pedidos" : "Participantes"}
              />
              <PlayerRoster
                members={members}
                gm={manage}
                busy={mutation.isPending}
                onDecision={(member, decision) => {
                  setMemberAction({ member, decision });
                  setReason("");
                }}
              />
            </HorrorPanel>
          )}
          {tab === "characters" && (
            <>
              <HorrorPanel>
                <SectionHeader title="Vincular personagem" />
                <form
                  className="join-form"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const choice = manage
                      ? eligible.data?.characters.find((x) => x.id === linkId)
                      : own.data?.characters.find((x) => x.id === linkId);
                    if (
                      choice &&
                      (await mutation.act("/campaigns/" + id + "/characters", {
                        characterId: choice.id,
                        version: choice.version,
                      }))
                    )
                      setLinkId("");
                  }}
                >
                  <label>
                    Personagem
                    <select
                      aria-label="Personagem para vincular"
                      required
                      value={linkId}
                      onChange={(e) => setLinkId(e.target.value)}
                    >
                      <option value="">Escolha uma ficha</option>
                      {(manage
                        ? eligible.data?.characters
                        : own.data?.characters.filter(
                            (x) => !x.campaignId || x.campaignId === id,
                          )
                      )?.map((ch) => (
                        <option key={ch.id} value={ch.id}>
                          {ch.name}
                          {"owner" in ch ? " · " + ch.owner.username : ""}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button
                    className="button primary"
                    disabled={mutation.isPending || c.status === "ARCHIVED"}
                  >
                    Vincular ficha
                  </button>
                </form>
                <ErrorBox error={manage ? eligible.error : own.error} />
                <p className="small muted">
                  Apenas fichas de membros aceitos podem ser vinculadas. O
                  proprietário precisa habilitar o compartilhamento na própria
                  ficha.
                </p>
              </HorrorPanel>
              <div className="character-grid">
                {characters.map((ch) => (
                  <div key={ch.id}>
                    <CharacterOverviewCard
                      character={ch}
                      campaignId={id!}
                      gm={manage}
                    />
                    {(manage || ch.isOwner) && (
                      <button
                        className="sheet-quiet"
                        disabled={mutation.isPending || c.status === "ARCHIVED"}
                        onClick={() =>
                          mutation.act(
                            "/campaigns/" + id + "/characters",
                            { characterId: ch.id, version: ch.version },
                            "DELETE",
                          )
                        }
                      >
                        Desvincular sem excluir
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
          {manage && (tab === "resources" || tab === "conditions") && (
            <HorrorPanel>
              <SectionHeader
                title={
                  tab === "resources"
                    ? "Recursos do grupo"
                    : "Condições do grupo"
                }
              />
              <div className="operational-list">
                {characters.map((ch) => (
                  <article key={ch.id}>
                    <div>
                      <h3>{ch.name}</h3>
                      {tab === "resources" ? (
                        <div className="mini-resources">
                          {ch.resources?.map((r) => (
                            <span className={r.key.toLowerCase()} key={r.key}>
                              {r.key} {r.current}
                              {r.maximum === undefined ? "" : "/" + r.maximum}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p>
                          Fadiga {ch.conditionState?.fatigue ?? 0} · Sangramento{" "}
                          {ch.conditionState?.bleeding ? "sim" : "não"} ·
                          Crítico {ch.conditionState?.critical ? "sim" : "não"}
                        </p>
                      )}
                    </div>
                    <Link
                      className="button secondary"
                      to={
                        "/campaigns/" +
                        id +
                        "/gm/characters/" +
                        ch.id +
                        "?section=" +
                        (tab === "resources" ? "attributes" : "conditions")
                      }
                    >
                      Editar como mestre
                    </Link>
                  </article>
                ))}
              </div>
            </HorrorPanel>
          )}
          {manage && tab === "requests" && (
            <HorrorPanel>
              <SectionHeader title="Aprovações e alterações" />
              <ErrorBox error={requests.error} />
              <ApprovalQueue
                campaignId={id!}
                characters={characters}
                requests={requests.data?.requests ?? []}
                busy={mutation.isPending}
                onReview={review}
                onChangeReview={reviewChange}
              />
            </HorrorPanel>
          )}
          {manage && tab === "invites" && (
            <HorrorPanel>
              <SectionHeader title="Convites de jogadores" />
              <InviteManager campaignId={id!} />
            </HorrorPanel>
          )}
          {manage && tab === "history" && (
            <HorrorPanel>
              <SectionHeader title="Histórico da campanha" />
              <ErrorBox error={history.error} />
              <AuditTimeline entries={history.data?.entries ?? []} />
            </HorrorPanel>
          )}
          {manage && tab === "settings" && (
            <HorrorPanel>
              <SectionHeader title="Configurações da campanha" />
              <CampaignSettings
                data={data}
                busy={mutation.isPending}
                onSave={(body) =>
                  mutation.act("/campaigns/" + id, body, "PATCH")
                }
              />
            </HorrorPanel>
          )}
          {manage && tab === "notes" && (
            <HorrorPanel>
              <SectionHeader title="Notas reservadas ao mestre" />
              <label className="field">
                <span>Segredos da campanha (GM_ONLY)</span>
                <textarea
                  rows={7}
                  value={gmNotes}
                  maxLength={12000}
                  onChange={(e) => {
                    setGMNotes(e.target.value);
                    setGMDirty(true);
                  }}
                />
              </label>
              <button
                className="button primary"
                disabled={mutation.isPending || c.status === "ARCHIVED"}
                onClick={async () => {
                  if (
                    await mutation.act(
                      "/campaigns/" + id + "/gm-notes",
                      { version: gmVersion, gmNotes },
                      "PATCH",
                    )
                  )
                    setGMDirty(false);
                }}
              >
                Salvar notas do mestre
              </button>
              {gmDirty && (
                <button
                  className="button secondary"
                  onClick={() => setGMDirty(false)}
                >
                  Descartar rascunho das notas e atualizar
                </button>
              )}
              <p className="small muted">
                Esta área não é enviada no modo jogador ou no painel
                administrativo comum.
              </p>
              <h3 className="management-subheading">
                Notas de personagens vinculadas a esta campanha
              </h3>
              <ErrorBox error={scopedNotes.error} />
              {scopedNotes.data?.notes.map((n) => (
                <article className="restricted-note" key={n.id}>
                  <h3>{n.title}</h3>
                  <p>{n.body}</p>
                </article>
              ))}
            </HorrorPanel>
          )}
        </>
      )}
    </div>
  );
}
