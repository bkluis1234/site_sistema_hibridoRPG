import { useEffect, useState } from "react";
import { Link, useOutletContext } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "../api";
import type { PublicUser } from "../../../../packages/shared/src/index";
import type { AuditEntry } from "./types";
import {
  HorrorPanel,
  SectionHeader,
  ErrorBox,
  ManagementHeading,
  Feedback,
  useManage,
  AuditTimeline,
  statusLabel,
} from "./common";
import { ShieldCheck, KeyRound, Users, ArrowLeft } from "lucide-react";
type AdminUser = {
  id: string;
  username: string;
  role: "ADMIN" | "PLAYER";
  canCreateCampaigns: boolean;
  disabledAt: string | null;
  version: number;
};
type AdminCampaign = {
  id: string;
  name: string;
  status: string;
  version: number;
  systemVersion: string;
  owner: { username: string };
  _count: { members: number; characters: number };
};
type MemberRole = {
  userId: string;
  role: "GM" | "PLAYER";
  status: string;
  version: number;
  user: { username: string; canCreateCampaigns: boolean; role: string };
};
type ProtectedAction = {
  title: string;
  path: string;
  body: Record<string, unknown>;
  strong?: boolean;
  confirmation?: string;
  done?: () => void;
};
export function PrivilegedInviteManager() {
  const [code, setCode] = useState("");
  const query = useQuery({
    queryKey: ["gm-invites"],
    queryFn: () =>
      api<{
        invites: {
          id: string;
          expiresAt: string;
          usedAt: string | null;
          revokedAt: string | null;
        }[];
      }>("/admin/gm-invites"),
  });
  const mutation = useManage([["gm-invites"]]);
  return (
    <>
      <p className="small muted">
        Convites privilegiados habilitam criação de campanhas no cadastro, sem
        conceder ADMIN. Uso único, validade de 24 horas. Para conta já
        existente, use a seção Usuários.
      </p>
      <button
        className="button primary"
        disabled={mutation.isPending}
        onClick={async () => {
          const result = await mutation.act("/admin/gm-invites", {
            expiresInHours: 24,
          });
          if (result) setCode(result.code ?? "");
        }}
      >
        Gerar convite de mestre
      </button>
      {code && (
        <div className="invite-code">
          <p>Copie agora. O código não será reexibido:</p>
          <code>{code}</code>
          <button className="button secondary" onClick={() => setCode("")}>
            Ocultar código
          </button>
        </div>
      )}
      <Feedback mutation={mutation} />
      <ErrorBox error={query.error} />
      {query.data?.invites.map((i) => (
        <article className="invite-row" key={i.id}>
          <div>
            <strong>Convite {i.id.slice(0, 8)}</strong>
            <small>
              Expira {new Date(i.expiresAt).toLocaleString("pt-BR")}
            </small>
          </div>
          <span className="tag neutral">
            {i.usedAt ? "Utilizado" : i.revokedAt ? "Revogado" : "Pendente"}
          </span>
          {!i.usedAt && !i.revokedAt && (
            <button
              className="button secondary"
              disabled={mutation.isPending}
              onClick={() =>
                mutation.act("/admin/gm-invites/" + i.id, {}, "DELETE")
              }
            >
              Revogar convite
            </button>
          )}
        </article>
      ))}
    </>
  );
}
export function AdminDashboard() {
  const { user } = useOutletContext<{ user: PublicUser }>();
  const [tab, setTab] = useState("users");
  const [search, setSearch] = useState("");
  const [selectedCampaign, setSelectedCampaign] = useState("");
  const [action, setAction] = useState<ProtectedAction | null>(null);
  const [reason, setReason] = useState("");
  const [password, setPassword] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [identityError, setIdentityError] = useState<unknown>(null);
  const [checking, setChecking] = useState(false);
  const users = useQuery({
    queryKey: ["admin-users", search],
    enabled: user.role === "ADMIN" && ["users", "roles"].includes(tab),
    queryFn: () =>
      api<{ users: AdminUser[] }>(
        "/admin/users?q=" + encodeURIComponent(search),
      ),
    refetchInterval: 30000,
  });
  const campaigns = useQuery({
    queryKey: ["admin-campaigns"],
    enabled: user.role === "ADMIN" && ["campaigns", "roles"].includes(tab),
    queryFn: () => api<{ campaigns: AdminCampaign[] }>("/admin/campaigns"),
    refetchInterval: 30000,
  });
  const members = useQuery({
    queryKey: ["admin-members", selectedCampaign],
    enabled:
      user.role === "ADMIN" && tab === "roles" && Boolean(selectedCampaign),
    queryFn: () =>
      api<{ members: MemberRole[] }>(
        "/admin/campaigns/" + selectedCampaign + "/members",
      ),
  });
  const history = useQuery({
    queryKey: ["admin-audit"],
    enabled: user.role === "ADMIN" && tab === "audit",
    queryFn: () => api<{ entries: AuditEntry[] }>("/admin/audit"),
  });
  const settings = useQuery({
    queryKey: ["admin-settings"],
    enabled: user.role === "ADMIN" && tab === "settings",
    queryFn: () =>
      api<{
        settings: {
          registrationOpen: boolean;
          campaignCreationEnabled: boolean;
          version: number;
        };
      }>("/admin/settings"),
  });
  const [registration, setRegistration] = useState(true),
    [creation, setCreation] = useState(true),
    [settingsDirty, setSettingsDirty] = useState(false),
    [settingsVersion, setSettingsVersion] = useState(1);
  useEffect(() => {
    if (settings.data && !settingsDirty) {
      setRegistration(settings.data.settings.registrationOpen);
      setCreation(settings.data.settings.campaignCreationEnabled);
      setSettingsVersion(settings.data.settings.version);
    }
  }, [settings.data?.settings.version, settingsDirty]);
  const mutation = useManage([
    ["admin-users"],
    ["admin-campaigns"],
    ["admin-members"],
    ["admin-audit"],
    ["admin-settings"],
    ["me"],
  ]);
  const protect = (a: ProtectedAction) => {
    setAction(a);
    setReason("");
    setPassword("");
    setRecoveryCode("");
    setConfirmation("");
    setIdentityError(null);
  };
  if (user.role !== "ADMIN")
    return (
      <>
        <ManagementHeading eyebrow="ACESSO RESTRITO" title="Administração" />
        <p>Seu acesso não inclui administração global.</p>
      </>
    );
  return (
    <div className="management-page">
      <ManagementHeading
        eyebrow="ADMINISTRAÇÃO GLOBAL · METADADOS OPERACIONAIS"
        title="Administração"
      >
        <Link className="button secondary" to="/">
          <ArrowLeft size={16} />
          Voltar ao modo jogador
        </Link>
      </ManagementHeading>
      <div className="context-banner">
        <ShieldCheck size={20} />
        <span>
          Este painel não carrega fichas, narrativas privadas ou segredos do
          mestre.
        </span>
      </div>
      <nav className="management-tabs" aria-label="Seções administrativas">
        {[
          ["users", "Usuários"],
          ["campaigns", "Campanhas"],
          ["roles", "Papéis"],
          ["invites", "Convites privilegiados"],
          ["audit", "Auditoria"],
          ["settings", "Configurações"],
        ].map(([key, label]) => (
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
      {action && (
        <div
          className="administrative-confirm"
          role="dialog"
          aria-label="Confirmação administrativa reforçada"
        >
          <h2>{action.title}</h2>
          <p>
            Esta operação é auditada e exige confirmação de identidade. A
            autorização dura cinco minutos e vale para uma operação.
          </p>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (checking || mutation.isPending) return;
              setChecking(true);
              setIdentityError(null);
              try {
                const proof = await api<{ token: string }>("/admin/reauth", {
                  method: "POST",
                  body: JSON.stringify({
                    password,
                    ...(action.strong ? { recoveryCode } : {}),
                  }),
                });
                setPassword("");
                setRecoveryCode("");
                const result = await mutation.act(
                  action.path,
                  {
                    ...action.body,
                    reason,
                    ...(action.confirmation ? { confirmation } : {}),
                  },
                  "PATCH",
                  { "X-Admin-Authorization": proof.token },
                );
                if (result) {
                  action.done?.();
                  setAction(null);
                }
              } catch (error) {
                setIdentityError(error);
              } finally {
                setChecking(false);
              }
            }}
          >
            <label className="field">
              <span>Justificativa administrativa</span>
              <textarea
                aria-label="Justificativa administrativa"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
                minLength={5}
                maxLength={500}
              />
            </label>
            <label className="field">
              <span>Sua senha administrativa</span>
              <input
                type="password"
                aria-label="Sua senha administrativa"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                required
                maxLength={128}
              />
            </label>
            {action.strong && (
              <label className="field">
                <span>Código de recuperação administrativo (uso único)</span>
                <input
                  aria-label="Código de recuperação administrativo"
                  value={recoveryCode}
                  onChange={(e) => setRecoveryCode(e.target.value)}
                  autoComplete="off"
                  required
                  maxLength={128}
                />
                <small>
                  Um código será consumido para emitir a autorização reforçada.
                </small>
              </label>
            )}
            {action.confirmation && (
              <label className="field">
                <span>Digite o login de destino: {action.confirmation}</span>
                <input
                  aria-label="Confirme o login de destino"
                  value={confirmation}
                  onChange={(e) => setConfirmation(e.target.value)}
                  required
                />
              </label>
            )}
            <ErrorBox error={identityError} />
            <div className="form-buttons">
              <button
                className="button primary"
                disabled={
                  checking ||
                  mutation.isPending ||
                  reason.trim().length < 5 ||
                  (Boolean(action.confirmation) &&
                    confirmation !== action.confirmation)
                }
              >
                Confirmar operação administrativa
              </button>
              <button
                className="button secondary"
                type="button"
                onClick={() => setAction(null)}
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}
      {tab === "users" && (
        <HorrorPanel>
          <SectionHeader title="Contas da plataforma" />
          <label className="field">
            <span>Pesquisar usuário</span>
            <input
              aria-label="Pesquisar usuário"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              maxLength={64}
            />
          </label>
          <ErrorBox error={users.error} />
          <div className="admin-users">
            {users.data?.users.map((u) => (
              <article key={u.id}>
                <div>
                  <h3>{u.username}</h3>
                  <p>
                    {u.role === "ADMIN" ? "Administrador" : "Jogador"} ·{" "}
                    {u.disabledAt ? "Desativado" : "Ativo"} ·{" "}
                    {u.canCreateCampaigns
                      ? "Criação de campanhas habilitada"
                      : "Sem criação de campanhas"}
                  </p>
                </div>
                <div className="form-buttons">
                  <button
                    className="button secondary"
                    disabled={u.id === user.id}
                    onClick={() =>
                      protect({
                        title:
                          (u.disabledAt ? "Reativar " : "Desativar ") +
                          u.username,
                        path: "/admin/users/" + u.id + "/account",
                        body: { version: u.version, disabled: !u.disabledAt },
                        strong: u.role === "ADMIN",
                      })
                    }
                  >
                    {u.disabledAt ? "Reativar conta" : "Desativar conta"}
                  </button>
                  <button
                    className="button secondary"
                    onClick={() =>
                      protect({
                        title: "Alterar habilitação de " + u.username,
                        path: "/admin/users/" + u.id + "/privileges",
                        body: {
                          version: u.version,
                          canCreateCampaigns: !u.canCreateCampaigns,
                        },
                        strong: u.role === "ADMIN",
                      })
                    }
                  >
                    {u.canCreateCampaigns
                      ? "Revogar criação de campanhas"
                      : "Habilitar criação de campanhas"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </HorrorPanel>
      )}
      {tab === "campaigns" && (
        <HorrorPanel>
          <SectionHeader title="Campanhas · metadados" />
          <p className="small muted">
            Gerenciar o estado não concede acesso às fichas ou notas narrativas.
          </p>
          <ErrorBox error={campaigns.error} />
          {campaigns.data?.campaigns.map((c) => (
            <article className="admin-campaign" key={c.id}>
              <div>
                <h3>{c.name}</h3>
                <p>
                  {statusLabel(c.status)} · Criador {c.owner.username} ·{" "}
                  {c._count.members} vínculos · {c._count.characters} fichas
                </p>
              </div>
              <select
                aria-label={"Novo status de " + c.name}
                value={c.status}
                onChange={(e) =>
                  protect({
                    title: "Alterar estado de " + c.name,
                    path: "/admin/campaigns/" + c.id,
                    body: { version: c.version, status: e.target.value },
                  })
                }
              >
                {["DRAFT", "ACTIVE", "PAUSED", "FINISHED", "ARCHIVED"].map(
                  (s) => (
                    <option key={s} value={s}>
                      {statusLabel(s)}
                    </option>
                  ),
                )}
              </select>
            </article>
          ))}
        </HorrorPanel>
      )}
      {tab === "roles" && (
        <>
          <HorrorPanel>
            <SectionHeader title="Papéis globais" />
            <p className="small muted">
              Criar ou remover ADMIN exige senha, código de recuperação de uso
              único, login de destino e justificativa. Cadastro público nunca
              aceita esse papel.
            </p>
            <label className="field">
              <span>Pesquisar conta para papel global</span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                maxLength={64}
              />
            </label>
            {users.data?.users.map((u) => (
              <article className="admin-campaign" key={u.id}>
                <div>
                  <strong>{u.username}</strong>
                  <p>{u.role}</p>
                </div>
                <button
                  className="button secondary"
                  disabled={u.id === user.id}
                  onClick={() =>
                    protect({
                      title:
                        (u.role === "ADMIN"
                          ? "Remover ADMIN de "
                          : "Conceder ADMIN a ") + u.username,
                      path: "/admin/users/" + u.id + "/role",
                      body: {
                        role: u.role === "ADMIN" ? "PLAYER" : "ADMIN",
                        version: u.version,
                      },
                      strong: true,
                      confirmation: u.username,
                    })
                  }
                >
                  {u.role === "ADMIN" ? "Remover ADMIN" : "Conceder ADMIN"}
                </button>
              </article>
            ))}
          </HorrorPanel>
          <HorrorPanel>
            <SectionHeader title="Papéis por campanha" />
            <label className="field">
              <span>Campanha para administrar papéis</span>
              <select
                aria-label="Campanha para administrar papéis"
                value={selectedCampaign}
                onChange={(e) => setSelectedCampaign(e.target.value)}
              >
                <option value="">Selecione a campanha</option>
                {campaigns.data?.campaigns.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <ErrorBox error={members.error} />
            {members.data?.members.map((m) => (
              <article className="admin-campaign" key={m.userId}>
                <div>
                  <strong>{m.user.username}</strong>
                  <p>
                    {m.role} · {statusLabel(m.status)}
                  </p>
                </div>
                <button
                  className="button secondary"
                  disabled={
                    m.status !== "ACTIVE" ||
                    (m.role !== "GM" &&
                      !m.user.canCreateCampaigns &&
                      m.user.role !== "ADMIN")
                  }
                  onClick={() =>
                    protect({
                      title: "Alterar papel de campanha de " + m.user.username,
                      path:
                        "/admin/campaigns/" +
                        selectedCampaign +
                        "/members/" +
                        m.userId +
                        "/role",
                      body: {
                        version: m.version,
                        role: m.role === "GM" ? "PLAYER" : "GM",
                      },
                    })
                  }
                >
                  {m.role === "GM"
                    ? "Tornar jogador"
                    : "Tornar mestre da campanha"}
                </button>
              </article>
            ))}
          </HorrorPanel>
        </>
      )}
      {tab === "invites" && (
        <HorrorPanel>
          <SectionHeader title="Convites de mestre" />
          <PrivilegedInviteManager />
        </HorrorPanel>
      )}
      {tab === "audit" && (
        <HorrorPanel>
          <SectionHeader title="Auditoria administrativa" />
          <ErrorBox error={history.error} />
          <AuditTimeline entries={history.data?.entries ?? []} />
        </HorrorPanel>
      )}
      {tab === "settings" && (
        <HorrorPanel>
          <SectionHeader title="Configurações globais" />
          <ErrorBox error={settings.error} />
          <label className="checkbox">
            <input
              type="checkbox"
              checked={registration}
              onChange={(e) => {
                setRegistration(e.target.checked);
                setSettingsDirty(true);
              }}
            />
            Cadastro público aberto
          </label>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={creation}
              onChange={(e) => {
                setCreation(e.target.checked);
                setSettingsDirty(true);
              }}
            />
            Permitir criação de campanhas por contas habilitadas
          </label>
          <p className="small muted">
            Segredos de infraestrutura e credenciais não são exibidos ou
            editados pelo navegador. Sistema permitido: Híbrido 2.6.
          </p>
          <button
            className="button primary"
            disabled={!settingsDirty}
            onClick={() =>
              protect({
                title: "Alterar configurações globais",
                path: "/admin/settings",
                body: {
                  version: settingsVersion,
                  registrationOpen: registration,
                  campaignCreationEnabled: creation,
                },
                done: () => setSettingsDirty(false),
              })
            }
          >
            Salvar configurações globais
          </button>
        </HorrorPanel>
      )}
    </div>
  );
}
