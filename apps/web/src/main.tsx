import {
  StrictMode,
  lazy,
  Suspense,
  createContext,
  useContext,
  useState,
  useEffect,
  useId,
  cloneElement,
  isValidElement,
  type ReactElement,
  type ReactNode,
} from "react";
import { createRoot } from "react-dom/client";
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  Navigate,
  Outlet,
  useNavigate,
  useParams,
  useLocation,
} from "react-router";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Skull,
  LayoutDashboard,
  Users,
  Settings,
  LogOut,
  Plus,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Eye,
  EyeOff,
  Menu,
  X,
  FolderOpen,
  BookOpen,
  Download,
  KeyRound,
  Save,
  FileText,
  Activity,
  Backpack,
  Crosshair,
  HeartPulse,
  ChevronRight,
  LockKeyhole,
} from "lucide-react";
import {
  loginSchema,
  registerSchema,
  recoverySchema,
  characterCreateSchema,
  characterUpdateSchema,
  type PublicUser,
  type CharacterSummary,
} from "../../../packages/shared/src/index";
import { api, ApiError } from "./api";
import {
  HorrorPanel,
  SectionHeader,
  CharacterCard,
  CampaignCard,
  EmptyState,
  ErrorBox,
  SaveStatus,
} from "./components";
import "./styles.css";
import { CharacterSheet } from "./sheet/CharacterSheet";
import { CampaignsPage } from "./management/Campaigns";
import { CampaignDashboard } from "./management/CampaignDashboard";
import { SharedCharacterView } from "./management/SharedCharacter";
import { GMCharacterEditor } from "./management/GMCharacterEditor";
import { AdminDashboard } from "./management/AdminDashboard";
import { NotificationsBell } from "./management/Notifications";
import "./management/management.css";
const SessionsPage = lazy(() =>
  import("./game/SessionsPage").then((m) => ({ default: m.SessionsPage })),
);
const SessionRoom = lazy(() =>
  import("./game/SessionRoom").then((m) => ({ default: m.SessionRoom })),
);
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false, refetchOnWindowFocus: true },
    mutations: { retry: false },
  },
});
const RecoveryContext = createContext<{
  codes: string[];
  setCodes: (v: string[]) => void;
}>({ codes: [], setCodes: () => {} });
function useMe() {
  return useQuery({
    queryKey: ["me"],
    queryFn: () => api<{ user: PublicUser }>("/auth/me"),
    staleTime: 60_000,
    refetchInterval: 30000,
  });
}
function Brand() {
  return (
    <span className="brand">
      <span className="brand-symbol">
        H<span>†</span>
      </span>
      <span>
        SISTEMA HÍBRIDO
        <small>
          ARQUIVO DE SOBREVIVENTES <b>2.6</b>
        </small>
      </span>
    </span>
  );
}
function Loading() {
  return (
    <div className="loading" role="status">
      <span className="loading-mark" />
      Conectando ao arquivo…
    </div>
  );
}
function Field({
  label,
  error,
  children,
  hint,
}: {
  label: string;
  error?: string;
  children: ReactNode;
  hint?: string;
}) {
  const id = useId();
  const describedBy =
    [hint ? id + "-hint" : null, error ? id + "-error" : null]
      .filter(Boolean)
      .join(" ") || undefined;
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {isValidElement(children)
        ? cloneElement(
            children as ReactElement<{
              id?: string;
              "aria-describedby"?: string;
              "aria-invalid"?: boolean;
            }>,
            { id, "aria-describedby": describedBy, "aria-invalid": !!error },
          )
        : children}
      {hint && <small id={id + "-hint"}>{hint}</small>}
      {error && (
        <small id={id + "-error"} className="field-error" role="alert">
          {error}
        </small>
      )}
    </div>
  );
}
function PasswordInput({
  registration,
  id = "password",
  ...a11y
}: {
  registration: ReturnType<ReturnType<typeof useForm>["register"]>;
  id?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="password-wrap">
      <input
        {...registration}
        {...a11y}
        id={id}
        type={show ? "text" : "password"}
        autoComplete={
          id === "password-login" ? "current-password" : "new-password"
        }
        maxLength={128}
      />
      <button
        type="button"
        className="icon-button"
        onClick={() => setShow(!show)}
        aria-label={show ? "Ocultar senha" : "Mostrar senha"}
      >
        {show ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}
function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="auth-layout">
      <div className="auth-story">
        <Link to="/login" className="brand-link">
          <Brand />
        </Link>
        <div className="story-graphic" aria-hidden="true">
          <div className="sigil-ring" />
          <div className="sigil-cross" />
          <span className="sigil-label">ARQUIVO / 026</span>
        </div>
        <div className="story-copy">
          <span className="eyebrow">
            TERROR · SOBREVIVÊNCIA · CONSEQUÊNCIAS
          </span>
          <h1>
            Toda cicatriz
            <br />
            conta uma <em>história.</em>
          </h1>
          <p>
            A sua próxima começa aqui. Mantenha sua ficha por perto e descubra o
            que resta depois do medo.
          </p>
        </div>
        <div className="story-footer">
          <span>UM SISTEMA DE MARCUS</span>
          <span>EDIÇÃO 2.6</span>
        </div>
      </div>
      <div className="auth-form-side">
        <div className="mobile-brand">
          <Brand />
        </div>
        {children}
        <div className="auth-footer">
          <LockKeyhole size={13} /> Seu acesso. Seus personagens. Sua história.
        </div>
      </div>
    </main>
  );
}
function Login() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const me = useMe();
  const f = useForm<
    z.input<typeof loginSchema>,
    unknown,
    z.output<typeof loginSchema>
  >({ resolver: zodResolver(loginSchema) });
  const mutation = useMutation({
    mutationFn: (v: z.output<typeof loginSchema>) =>
      api<{ user: PublicUser }>("/auth/login", {
        method: "POST",
        body: JSON.stringify(v),
      }),
    onSuccess: async (data) => {
      qc.clear();
      qc.setQueryData(["me"], data);
      navigate("/");
    },
  });
  if (me.data) return <Navigate to="/" replace />;
  return (
    <AuthLayout>
      <div className="auth-form">
        <span className="eyebrow">ACESSO AO ARQUIVO</span>
        <h2>Bem-vindo de volta.</h2>
        <p className="muted">O mundo lá fora não ficou mais seguro.</p>
        <form onSubmit={f.handleSubmit((v) => mutation.mutate(v))}>
          <Field
            label="Nome de usuário"
            error={f.formState.errors.username?.message}
          >
            <input
              {...f.register("username")}
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              placeholder="Seu nome de acesso"
              aria-invalid={!!f.formState.errors.username}
            />
          </Field>
          <Field label="Senha" error={f.formState.errors.password?.message}>
            <PasswordInput
              registration={f.register("password")}
              id="password-login"
            />
          </Field>
          <div className="form-row">
            <span className="small muted">Acesso por sessão segura</span>
            <Link to="/recover">Recuperar acesso</Link>
          </div>
          <ErrorBox error={mutation.error} />
          <button className="button primary wide" disabled={mutation.isPending}>
            {mutation.isPending ? "Entrando…" : "Entrar no arquivo"}
            <ArrowRight size={17} />
          </button>
        </form>
        <div className="auth-switch">
          Primeira vez por aqui? <Link to="/register">Criar uma conta</Link>
        </div>
        <div className="auth-note">
          <ShieldCheck size={20} />
          <p>
            Sem e-mail obrigatório.
            <br />
            <span>Seu nome de usuário é a sua identificação.</span>
          </p>
        </div>
      </div>
    </AuthLayout>
  );
}
function Register() {
  const registration = useQuery({
    queryKey: ["public-settings"],
    queryFn: () => api<{ registrationOpen: boolean }>("/settings/public"),
  });
  const navigate = useNavigate();
  const qc = useQueryClient();
  const recovery = useContext(RecoveryContext);
  const f = useForm<
    z.input<typeof registerSchema>,
    unknown,
    z.output<typeof registerSchema>
  >({ resolver: zodResolver(registerSchema) });
  const mutation = useMutation({
    mutationFn: (v: z.output<typeof registerSchema>) =>
      api<{ user: PublicUser; recoveryCodes: string[] }>("/auth/register", {
        method: "POST",
        body: JSON.stringify(v),
      }),
    onSuccess: (data) => {
      qc.clear();
      qc.setQueryData(["me"], { user: data.user });
      recovery.setCodes(data.recoveryCodes);
      navigate("/recovery-codes");
    },
  });
  return (
    <AuthLayout>
      <div className="auth-form">
        <Link to="/login" className="back-link">
          <ArrowLeft size={15} /> Voltar ao acesso
        </Link>
        <span className="eyebrow">NOVO REGISTRO</span>
        <h2>Deixe sua marca.</h2>
        <p className="muted">
          Crie seu acesso. O resto da história é com você.
        </p>
        {registration.data?.registrationOpen === false && (
          <p role="alert" className="error-box">
            O cadastro público está fechado pelo administrador.
          </p>
        )}
        <form onSubmit={f.handleSubmit((v) => mutation.mutate(v))}>
          <Field
            label="Nome de usuário"
            error={f.formState.errors.username?.message}
            hint="Único. Use letras, números e sublinhado."
          >
            <input
              {...f.register("username")}
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              maxLength={32}
            />
          </Field>
          <Field
            label="Personagem inicial (opcional)"
            error={f.formState.errors.characterName?.message}
          >
            <input
              {...f.register("characterName")}
              maxLength={80}
              placeholder="Como chamam você?"
            />
          </Field>
          <div className="two-fields">
            <Field label="Senha" error={f.formState.errors.password?.message}>
              <PasswordInput registration={f.register("password")} />
            </Field>
            <Field
              label="Confirmar senha"
              error={f.formState.errors.confirmPassword?.message}
            >
              <PasswordInput
                registration={f.register("confirmPassword")}
                id="confirm-password"
              />
            </Field>
          </div>
          <p className="input-hint">Use entre 12 e 128 caracteres.</p>
          <Field
            label="Convite de mestre (opcional)"
            error={f.formState.errors.inviteCode?.message}
            hint="Somente para quem recebeu um convite do administrador."
          >
            <input
              {...f.register("inviteCode")}
              autoComplete="off"
              maxLength={128}
            />
          </Field>
          <ErrorBox error={mutation.error} />
          <button
            className="button primary wide"
            disabled={
              mutation.isPending ||
              registration.data?.registrationOpen === false
            }
          >
            {mutation.isPending ? "Criando registro…" : "Criar minha conta"}
            <ArrowRight size={17} />
          </button>
        </form>
        <p className="small muted">
          Após o cadastro, guarde os códigos de recuperação. Eles substituem a
          recuperação por e-mail.
        </p>
      </div>
    </AuthLayout>
  );
}
function Recover() {
  const f = useForm<
    z.input<typeof recoverySchema>,
    unknown,
    z.output<typeof recoverySchema>
  >({ resolver: zodResolver(recoverySchema) });
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: (v: z.output<typeof recoverySchema>) =>
      api("/auth/recover", { method: "POST", body: JSON.stringify(v) }),
    onSuccess: () => qc.clear(),
  });
  return (
    <AuthLayout>
      <div className="auth-form">
        <Link to="/login" className="back-link">
          <ArrowLeft size={15} /> Voltar ao acesso
        </Link>
        <span className="eyebrow">RECUPERAÇÃO</span>
        <h2>Encontre o caminho.</h2>
        <p className="muted">Use um dos códigos guardados no cadastro.</p>
        {mutation.isSuccess ? (
          <HorrorPanel>
            <ShieldCheck />
            <h3>Senha alterada</h3>
            <p>As sessões anteriores foram encerradas.</p>
            <Link className="button primary" to="/login">
              Entrar novamente
            </Link>
          </HorrorPanel>
        ) : (
          <form onSubmit={f.handleSubmit((v) => mutation.mutate(v))}>
            <Field
              label="Nome de usuário"
              error={f.formState.errors.username?.message}
            >
              <input
                {...f.register("username")}
                autoComplete="username"
                autoCapitalize="none"
              />
            </Field>
            <Field
              label="Código de recuperação"
              error={f.formState.errors.recoveryCode?.message}
            >
              <input
                {...f.register("recoveryCode")}
                autoComplete="off"
                spellCheck={false}
              />
            </Field>
            <Field
              label="Nova senha"
              error={f.formState.errors.password?.message}
            >
              <PasswordInput registration={f.register("password")} />
            </Field>
            <Field
              label="Confirme a nova senha"
              error={f.formState.errors.confirmPassword?.message}
            >
              <PasswordInput
                registration={f.register("confirmPassword")}
                id="recovery-confirm"
              />
            </Field>
            <ErrorBox error={mutation.error} />
            <button
              className="button primary wide"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? "Verificando…" : "Redefinir senha"}
              <KeyRound size={17} />
            </button>
          </form>
        )}
        <div className="auth-note">
          <ShieldCheck size={20} />
          <p>
            Perdeu todos os códigos?
            <br />
            <span>
              Fale com o administrador por um contato já conhecido para
              verificar sua identidade.
            </span>
          </p>
        </div>
      </div>
    </AuthLayout>
  );
}
function RecoveryCodes() {
  const { codes, setCodes } = useContext(RecoveryContext);
  const [confirmed, setConfirmed] = useState(false);
  const navigate = useNavigate();
  if (!codes.length) return <Navigate to="/" replace />;
  const download = () => {
    const url = URL.createObjectURL(
      new Blob(
        [
          "Sistema Híbrido — códigos de recuperação de uso único. Guarde em local seguro.\n\n" +
            codes.join("\n"),
        ],
        { type: "text/plain" },
      ),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "hibrido-codigos-recuperacao.txt";
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <main className="recovery-page">
      <HorrorPanel>
        <span className="eyebrow">ANTES DE CONTINUAR</span>
        <h1>Guarde sua saída de emergência.</h1>
        <p>
          Estes códigos aparecem apenas agora. Cada um pode recuperar a conta
          uma única vez. Recarregar esta página apaga esta exibição.
        </p>
        <div className="recovery-grid">
          {codes.map((code) => (
            <code key={code}>{code}</code>
          ))}
        </div>
        <button className="button secondary" onClick={download}>
          <Download size={16} /> Baixar códigos
        </button>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
          />{" "}
          Guardei meus códigos em um local seguro.
        </label>
        <button
          className="button primary"
          disabled={!confirmed}
          onClick={() => {
            setCodes([]);
            navigate("/");
          }}
        >
          Acessar o arquivo
          <ArrowRight size={16} />
        </button>
      </HorrorPanel>
    </main>
  );
}
function Shell() {
  const me = useMe();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const loc = useLocation();
  const logout = useMutation({
    mutationFn: () => api("/auth/logout", { method: "POST" }),
    onSuccess: () => {
      qc.clear();
      navigate("/login");
    },
  });
  if (me.isPending) return <Loading />;
  if (me.error) {
    if (me.error instanceof ApiError && me.error.status === 401)
      return <Navigate to="/login" replace />;
    return (
      <main className="error-page">
        <ErrorBox error={me.error} />
        <button className="button secondary" onClick={() => me.refetch()}>
          Tentar novamente
        </button>
      </main>
    );
  }
  const user = me.data!.user;
  const links = [
    { to: "/", label: "Visão geral", icon: LayoutDashboard },
    { to: "/campaigns", label: "Campanhas", icon: Users },
    { to: "/profile", label: "Meu perfil", icon: Settings },
  ];
  return (
    <div className="app-shell">
      <header className="mobile-header">
        <Brand />
        <button
          className="icon-button"
          aria-label={open ? "Fechar menu" : "Abrir menu"}
          onClick={() => setOpen(!open)}
        >
          {open ? <X /> : <Menu />}
        </button>
      </header>
      <aside className={"sidebar " + (open ? "open" : "")}>
        <Link to="/" className="brand-link" onClick={() => setOpen(false)}>
          <Brand />
        </Link>
        <div className="sidebar-section-label">SEU ARQUIVO</div>
        <nav aria-label="Navegação principal">
          {links.map((l) => (
            <Link
              key={l.to}
              className={"nav-item " + (loc.pathname === l.to ? "active" : "")}
              to={l.to}
              onClick={() => setOpen(false)}
            >
              <l.icon size={18} />
              {l.label}
              {loc.pathname === l.to && <span className="nav-dot" />}
            </Link>
          ))}
          {user.role === "ADMIN" && (
            <Link
              to="/admin"
              className={
                "nav-item " + (loc.pathname === "/admin" ? "active" : "")
              }
              onClick={() => setOpen(false)}
            >
              <ShieldCheck size={18} />
              Administração
            </Link>
          )}
        </nav>
        <div className="sidebar-world">
          <span className="eyebrow">SISTEMA HÍBRIDO 2.6</span>
          <div className="world-art" aria-hidden="true">
            <Skull size={60} strokeWidth={0.7} />
          </div>
          <p>
            O medo é parte
            <br />
            da história.
          </p>
          <span className="small muted">Prepare-se para a próxima sessão.</span>
        </div>
        <div className="sidebar-account">
          <div className="avatar">
            {user.username.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <strong>{user.username}</strong>
            <span>
              {user.role === "ADMIN"
                ? "Administrador"
                : user.canCreateCampaigns
                  ? "Mestre habilitado"
                  : "Jogador"}
            </span>
          </div>
          <button
            className="icon-button"
            title="Sair"
            aria-label="Sair da conta"
            disabled={logout.isPending}
            onClick={() => logout.mutate()}
          >
            <LogOut size={17} />
          </button>
        </div>
        <ErrorBox error={logout.error} />
      </aside>
      {open && (
        <button
          className="sidebar-overlay"
          aria-label="Fechar navegação"
          onClick={() => setOpen(false)}
        />
      )}
      <main className="app-main">
        <header className="topbar">
          <span>
            <span className="live-dot" /> ARQUIVO DE SOBREVIVENTES
          </span>
          <NotificationsBell />
          <span className="topbar-version">
            SISTEMA HÍBRIDO <b>2.6</b>
          </span>
        </header>
        <div className="page-content">
          <Outlet context={{ user }} />
        </div>
        <footer className="app-footer">
          <span>SISTEMA HÍBRIDO 2.6</span>
          <span>Uma história de cada vez.</span>
        </footer>
      </main>
    </div>
  );
}
function NewCharacter() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const f = useForm<z.input<typeof characterCreateSchema>>({
    resolver: zodResolver(characterCreateSchema),
  });
  const mutation = useMutation({
    mutationFn: (v: { name: string }) =>
      api<{ character: CharacterSummary }>("/characters", {
        method: "POST",
        body: JSON.stringify(v),
      }),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["characters"] });
      navigate("/characters/" + data.character.id);
    },
  });
  return (
    <HorrorPanel>
      <SectionHeader eyebrow="NOVO ARQUIVO" title="Quem vai sobreviver?" />
      <p className="muted">
        Comece com um nome. A ficha será criada como rascunho.
      </p>
      <form onSubmit={f.handleSubmit((v) => mutation.mutate(v))}>
        <Field
          label="Nome do personagem"
          error={f.formState.errors.name?.message}
        >
          <input
            {...f.register("name")}
            maxLength={80}
            autoFocus
            placeholder="Nome do personagem"
          />
        </Field>
        <ErrorBox error={mutation.error} />
        <button className="button primary" disabled={mutation.isPending}>
          {mutation.isPending ? "Criando…" : "Criar personagem"}
          <Plus size={16} />
        </button>
      </form>
    </HorrorPanel>
  );
}
function Dashboard() {
  const me = useMe();
  const [create, setCreate] = useState(false);
  const characters = useQuery({
    queryKey: ["characters"],
    queryFn: () => api<{ characters: CharacterSummary[] }>("/characters"),
  });
  const campaigns = useQuery({
    queryKey: ["campaigns"],
    queryFn: () =>
      api<{ campaigns: { id: string; name: string }[] }>("/campaigns"),
  });
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">O ARQUIVO ESTÁ ABERTO</span>
          <h1>
            Seu próximo capítulo<span>.</span>
          </h1>
          <p>
            Olá, {me.data?.user.username}. Toda história precisa de alguém para
            contá-la.
          </p>
        </div>
        <button className="button primary" onClick={() => setCreate(!create)}>
          {create ? <X size={17} /> : <Plus size={17} />}{" "}
          {create ? "Fechar" : "Criar personagem"}
        </button>
      </div>
      <div className="intro-banner">
        <div>
          <span className="eyebrow">BEM-VINDO AO SISTEMA HÍBRIDO 2.6</span>
          <h2>
            A sessão termina.
            <br />
            <em>A história continua.</em>
          </h2>
          <p>Seus personagens e suas escolhas, reunidos em um só lugar.</p>
        </div>
        <div className="banner-emblem" aria-hidden="true">
          <div />
          <Skull size={82} strokeWidth={0.75} />
          <span>H / 2.6</span>
        </div>
      </div>
      <div className="stats-strip">
        <div>
          <FileText size={19} />
          <strong>{characters.data?.characters.length ?? "—"}</strong>
          <span>Personagens</span>
        </div>
        <div>
          <Users size={19} />
          <strong>{campaigns.data?.campaigns.length ?? "—"}</strong>
          <span>Campanhas</span>
        </div>
        <div>
          <BookOpen size={19} />
          <strong>2.6</strong>
          <span>Versão do sistema</span>
        </div>
      </div>
      {create && (
        <div className="create-block">
          <NewCharacter />
        </div>
      )}
      <SectionHeader eyebrow="IDENTIDADES NO ARQUIVO" title="Seus personagens">
        <span className="count-badge">
          {characters.data?.characters.length ?? "—"}
        </span>
      </SectionHeader>
      <ErrorBox error={characters.error} />
      {characters.isPending ? (
        <Loading />
      ) : characters.data?.characters.length ? (
        <div className="character-grid">
          {characters.data.characters.map((c) => (
            <CharacterCard key={c.id} character={c} />
          ))}
        </div>
      ) : (
        !characters.error && (
          <HorrorPanel>
            <EmptyState
              title="Toda história começa com um nome."
              action={
                <button
                  className="button secondary"
                  onClick={() => setCreate(true)}
                >
                  <Plus size={16} /> Criar meu primeiro personagem
                </button>
              }
            >
              Crie um personagem para começar seu arquivo. Ele ficará salvo na
              sua conta.
            </EmptyState>
          </HorrorPanel>
        )
      )}
      <div className="section-spacer" />
      <SectionHeader eyebrow="HISTÓRIAS COMPARTILHADAS" title="Suas campanhas">
        <Link className="text-link" to="/campaigns">
          Ver campanhas
          <ArrowRight size={15} />
        </Link>
      </SectionHeader>
      <ErrorBox error={campaigns.error} />
      {campaigns.isPending ? (
        <Loading />
      ) : campaigns.data?.campaigns.length ? (
        <div className="character-grid">
          {campaigns.data.campaigns.map((c) => (
            <CampaignCard key={c.id} name={c.name} id={c.id} />
          ))}
        </div>
      ) : (
        !campaigns.error && (
          <HorrorPanel>
            <div className="campaign-empty">
              <div className="empty-icon">
                <Users size={25} strokeWidth={1} />
              </div>
              <div>
                <h3>Nenhuma campanha vinculada.</h3>
                <p>
                  Criação de campanhas e convites de jogadores chegam na etapa
                  3.
                </p>
              </div>
              <span className="tag neutral">EM PREPARAÇÃO</span>
            </div>
          </HorrorPanel>
        )
      )}
    </>
  );
}
function Profile() {
  const me = useMe();
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">SEU ACESSO</span>
          <h1>
            Meu perfil<span>.</span>
          </h1>
          <p>Conta e personagem são registros independentes.</p>
        </div>
      </div>
      <HorrorPanel>
        <SectionHeader title="Identificação da conta" />
        <dl className="profile-details">
          <div>
            <dt>Nome de usuário</dt>
            <dd>{me.data?.user.username}</dd>
          </div>
          <div>
            <dt>Papel global</dt>
            <dd>
              {me.data?.user.role === "ADMIN" ? "Administrador" : "Jogador"}
            </dd>
          </div>
          <div>
            <dt>Criação de campanhas</dt>
            <dd>
              {me.data?.user.canCreateCampaigns
                ? "Permissão concedida"
                : "Não habilitada"}
            </dd>
          </div>
        </dl>
        <div className="inline-note">
          <KeyRound size={21} />
          <p>
            Guarde seus códigos de recuperação fora da plataforma. O
            administrador pode ajudar após verificar sua identidade.
          </p>
        </div>
      </HorrorPanel>
    </>
  );
}
type Invite = {
  id: string;
  expiresAt: string;
  usedAt: string | null;
  revokedAt: string | null;
};
function App() {
  const [codes, setCodes] = useState<string[]>([]);
  return (
    <RecoveryContext.Provider value={{ codes, setCodes }}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/recover" element={<Recover />} />
        <Route path="/recovery-codes" element={<RecoveryCodes />} />
        <Route element={<Shell />}>
          <Route index element={<Dashboard />} />
          <Route path="characters/:id" element={<CharacterSheet />} />
          <Route path="campaigns" element={<CampaignsPage />} />
          <Route
            path="campaigns/:campaignId/sessions"
            element={
              <Suspense fallback={<p role="status">Carregando sessões…</p>}>
                <SessionsPage />
              </Suspense>
            }
          />
          <Route
            path="campaigns/:campaignId/sessions/:sessionId"
            element={
              <Suspense fallback={<p role="status">Carregando sala…</p>}>
                <SessionRoom />
              </Suspense>
            }
          />
          <Route path="campaigns/:id" element={<CampaignDashboard />} />
          <Route path="campaigns/:id/gm" element={<CampaignDashboard />} />
          <Route
            path="campaigns/:campaignId/gm/characters/:id"
            element={<GMCharacterEditor />}
          />
          <Route
            path="campaigns/:campaignId/characters/:id"
            element={<SharedCharacterView />}
          />
          <Route path="profile" element={<Profile />} />
          <Route path="admin" element={<AdminDashboard />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </RecoveryContext.Provider>
  );
}
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
