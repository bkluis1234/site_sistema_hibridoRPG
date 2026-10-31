import { useState, useEffect, useMemo } from "react";
import {
  Link,
  useParams,
  useSearchParams,
  useOutletContext,
} from "react-router";
import {
  useQuery,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  Radio,
  Wifi,
  WifiOff,
  VolumeX,
  ShieldCheck,
  ArrowLeft,
  Dices,
  Users,
  ScrollText,
  BookOpen,
  HeartPulse,
} from "lucide-react";
import { api } from "../api";
import { ErrorBox, HorrorPanel } from "../components";
import type {
  SheetDetails,
  PublicUser,
} from "../../../../packages/shared/src/index";
import type { Act } from "../sheet/types";
import { useSessionSync } from "./useSessionSync";
import { SessionRoller, SessionRollHistory } from "./Rolls";
import { SessionJournal, SessionTimeline } from "./Journal";
import {
  SurvivalPanel,
  SessionGroup,
  MasterControls,
  TransfersPanel,
  SummaryPanel,
} from "./RoomTools";
import {
  gameLabels,
  type Room,
  type SessionRoll,
  type Event,
  type Note,
  type Transfer,
  type GameAction,
} from "./types";
import "../sheet/sheet.css";
import "./game.css";
export function SessionRoom() {
  const { campaignId, sessionId } = useParams(),
    [params] = useSearchParams(),
    gm = params.get("mode") === "gm",
    { user } = useOutletContext<{ user: PublicUser }>(),
    qc = useQueryClient(),
    [tab, setTab] = useState("sheet"),
    [selected, setSelected] = useState(""),
    [joinChoice, setJoinChoice] = useState(""),
    [filter, setFilter] = useState("ALL"),
    [confirmed, setConfirmed] = useState("");
  const headers = useMemo(
    () => (gm ? { "X-View-Context": "gm" } : undefined),
    [gm],
  );
  const detail = useQuery({
    queryKey: ["game", sessionId, "detail", gm],
    queryFn: () => api<Room>("/sessions/" + sessionId, { headers }),
    refetchInterval: 15000,
  });
  const room = detail.data,
    open = Boolean(
      room && !["FINISHED", "CANCELLED"].includes(room.session.status),
    );
  const sync = useSessionSync(
    sessionId,
    gm,
    Boolean(room),
    Boolean(room?.participation),
    open,
  );
  const choices = useQuery({
    queryKey: ["game", sessionId, "characters", gm],
    enabled: Boolean(room),
    queryFn: () =>
      api<{
        characters: {
          id: string;
          name: string;
          ownerId: string;
          owner: { username: string };
        }[];
      }>("/sessions/" + sessionId + "/characters", { headers }),
  });
  const focused = gm
    ? selected || room?.participation?.characterId || ""
    : (room?.participation?.characterId ?? "");
  const sheet = useQuery({
    queryKey: ["game", sessionId, "sheet", focused, gm],
    enabled: Boolean(room && focused),
    queryFn: () =>
      api<{ sheet: SheetDetails }>(
        "/sessions/" + sessionId + "/characters/" + focused + "/sheet",
        { headers },
      ),
    refetchInterval: sync.polling,
  });
  const events = useInfiniteQuery({
    queryKey: ["game", sessionId, "events", gm],
    enabled: Boolean(room),
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) =>
      api<{
        entries: Event[];
        nextBefore: string | null;
        nextAfter: string | null;
      }>(
        "/sessions/" +
          sessionId +
          "/events" +
          (pageParam ? "?before=" + pageParam : ""),
        { headers },
      ),
    getNextPageParam: (p) => p.nextBefore ?? undefined,
    refetchInterval: sync.polling,
  });
  const rolls = useInfiniteQuery({
    queryKey: ["game", sessionId, "rolls", gm, filter],
    enabled: Boolean(room),
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) =>
      api<{ rolls: SessionRoll[]; nextBefore: string | null }>(
        "/sessions/" +
          sessionId +
          "/rolls?filter=" +
          filter +
          (pageParam ? "&before=" + pageParam : ""),
        { headers },
      ),
    getNextPageParam: (p) => p.nextBefore ?? undefined,
    refetchInterval: sync.polling,
  });
  const notes = useQuery({
    queryKey: ["game", sessionId, "notes", gm],
    enabled: Boolean(room),
    queryFn: () =>
      api<{ notes: Note[] }>("/sessions/" + sessionId + "/notes", { headers }),
    refetchInterval: sync.polling,
  });
  const transfers = useQuery({
    queryKey: ["game", sessionId, "transfers", gm],
    enabled: Boolean(room),
    queryFn: () =>
      api<{ transfers: Transfer[] }>("/sessions/" + sessionId + "/transfers", {
        headers,
      }),
    refetchInterval: sync.polling,
  });
  const summary = useQuery({
    queryKey: ["game", sessionId, "summary", gm],
    enabled: room?.session.status === "FINISHED",
    queryFn: () =>
      api<{ summary: any }>("/sessions/" + sessionId + "/summary", { headers }),
  });
  const refresh = async () => {
    await Promise.all([
      qc.invalidateQueries({ queryKey: ["game", sessionId] }),
      qc.invalidateQueries({ queryKey: ["game-sessions", campaignId] }),
      qc.invalidateQueries({ queryKey: ["sheet"] }),
      qc.invalidateQueries({ queryKey: ["sheet-rolls"] }),
      qc.invalidateQueries({ queryKey: ["sheet-history"] }),
      qc.invalidateQueries({ queryKey: ["characters"] }),
    ]);
  };
  const mutation = useMutation({
    networkMode: "always",
    mutationFn: (action: {
      suffix: string;
      body: Record<string, unknown>;
      method: string;
    }) =>
      api<any>("/sessions/" + sessionId + action.suffix, {
        method: action.method,
        headers,
        body: JSON.stringify(action.body),
      }),
    onMutate: () => setConfirmed(""),
    onSuccess: async () => {
      setConfirmed("Operação confirmada pelo servidor.");
      await refresh();
    },
  });
  const act: GameAction = async (suffix, body, method = "POST") => {
    if (mutation.isPending) return null;
    try {
      return await mutation.mutateAsync({
        suffix,
        body: { operationId: crypto.randomUUID(), ...body },
        method,
      });
    } catch {
      return null;
    }
  };
  const characterAct: Act = async (suffix, body, method = "PATCH") =>
    Boolean(await act(suffix, { ...body, characterId: focused }, method));
  useEffect(() => {
    setSelected("");
    setJoinChoice("");
    setTab("sheet");
    setFilter("ALL");
    setConfirmed("");
  }, [sessionId, gm]);
  if (detail.isPending) return <p role="status">Abrindo a sala da sessão…</p>;
  if (!room || room.campaign.id !== campaignId)
    return (
      <>
        <Link
          className="back-link"
          to={"/campaigns/" + campaignId + "/sessions"}
        >
          Voltar às sessões
        </Link>
        <ErrorBox
          error={
            detail.error ??
            new Error("A sessão não pertence à campanha indicada.")
          }
        />
      </>
    );
  const currentSheet = sheet.data?.sheet,
    active =
      room.session.status === "ACTIVE" && (gm || Boolean(room.participation)),
    closed = !open;
  const eventRows = [
    ...new Map(
      (events.data?.pages.flatMap((p) => p.entries) ?? []).map((e) => [
        e.id,
        e,
      ]),
    ).values(),
  ];
  const rollRows = [
    ...new Map(
      (rolls.data?.pages.flatMap((p) => p.rolls) ?? []).map((r) => [r.id, r]),
    ).values(),
  ];
  const connectionLabels = {
    connecting: "Conectando",
    live: "Atualizações ao vivo",
    reconnecting: "Reconectando · atualização periódica ativa",
    polling: "Atualização periódica",
    offline: "Sem conexão · alterações ainda não confirmadas",
  };
  return (
    <div className="session-room">
      <Link
        className="back-link"
        to={"/campaigns/" + campaignId + "/sessions" + (gm ? "?mode=gm" : "")}
      >
        <ArrowLeft size={16} />
        Sessões da campanha
      </Link>
      <header className="session-room-heading">
        <div>
          <p className="eyebrow">MODO SESSÃO · {room.campaign.name}</p>
          <h1>
            {room.session.title}
            <span>.</span>
          </h1>
          <p className="small muted">
            Mestre responsável: {room.host.username} · Registro{" "}
            {room.session.id.slice(0, 8)}
          </p>
        </div>
        <span className={"session-state " + room.session.status.toLowerCase()}>
          {gameLabels[room.session.status]}
        </span>
      </header>
      <div className="session-connection">
        <span
          role="status"
          data-testid="session-connection"
          className={sync.connection}
        >
          {sync.connection === "live" ? (
            <Wifi size={16} />
          ) : (
            <WifiOff size={16} />
          )}{" "}
          {connectionLabels[sync.connection]}
        </span>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={sync.muted}
            onChange={(e) => sync.setMuted(e.target.checked)}
          />
          <VolumeX size={15} />
          Silenciar avisos da sessão
        </label>
        {room.isGM && (
          <Link className="sheet-quiet" to={gm ? "?mode=player" : "?mode=gm"}>
            {gm ? "Modo jogador" : "Abrir contexto de mestre"}
          </Link>
        )}
      </div>
      {gm && (
        <div className="context-banner">
          <ShieldCheck size={20} />
          <span>
            Modo Mestre. Rolagens e notas reservadas aparecem somente neste
            contexto.
          </span>
        </div>
      )}
      <ErrorBox error={detail.error} />
      <ErrorBox error={mutation.error} />
      {mutation.isPending && (
        <p className="session-operation" role="status">
          Confirmando operação no servidor…
        </p>
      )}
      {confirmed && (
        <p className="session-operation success" role="status">
          {confirmed}
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
      {sync.notice && !sync.muted && (
        <p className="session-toast" role="status">
          <Radio size={14} />
          {sync.notice}
        </p>
      )}
      {!room.participation && room.session.status === "ACTIVE" && (
        <HorrorPanel>
          <h2>Entre na sessão</h2>
          <form
            className="session-join"
            onSubmit={async (e) => {
              e.preventDefault();
              await act("/join", { characterId: joinChoice || null });
            }}
          >
            <label>
              Minha ficha para esta sessão
              <select
                aria-label="Minha ficha para esta sessão"
                value={joinChoice}
                onChange={(e) => setJoinChoice(e.target.value)}
                required={!room.isGM}
              >
                <option value="">
                  {room.isGM
                    ? "Acompanhar como mestre, sem personagem"
                    : "Selecione sua ficha vinculada"}
                </option>
                {choices.data?.characters
                  .filter((c) => c.ownerId === user.id)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </label>
            <button className="button primary" disabled={mutation.isPending}>
              Entrar na sessão
            </button>
          </form>
        </HorrorPanel>
      )}
      {gm && (
        <label className="session-focus">
          Ficha para acompanhar e corrigir
          <select
            aria-label="Ficha em foco do mestre"
            value={focused}
            onChange={(e) => setSelected(e.target.value)}
          >
            <option value="">Sem personagem · rolagem do mestre</option>
            {choices.data?.characters.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} · {c.owner.username}
              </option>
            ))}
          </select>
        </label>
      )}
      {currentSheet && (
        <div className="session-quick-resources" aria-label="Recursos rápidos">
          {currentSheet.resources.map((r) => (
            <div className={r.key.toLowerCase()} key={r.key}>
              <strong>{r.key}</strong>
              <span>
                {r.current}/{r.maximum}
              </span>
              <button
                aria-label={"Ajustar menos um " + r.key + " na sessão"}
                disabled={mutation.isPending || !active || r.current === 0}
                onClick={() =>
                  characterAct("/resources", {
                    key: r.key,
                    mode: "ADJUST",
                    value: -1,
                    event: "ADJUSTMENT",
                    version: r.version,
                  })
                }
              >
                −
              </button>
            </div>
          ))}
        </div>
      )}
      <nav className="session-mobile-tabs" aria-label="Abas do modo sessão">
        {[
          ["sheet", "Minha ficha", HeartPulse],
          ["dice", "Dados", Dices],
          ["group", "Grupo", Users],
          ["events", "Eventos", ScrollText],
          ["notes", "Anotações", BookOpen],
        ].map(([key, label, Icon]) => {
          const I = Icon as typeof HeartPulse;
          return (
            <button
              className={tab === key ? "active" : ""}
              key={key as string}
              onClick={() => setTab(key as string)}
            >
              <I size={18} />
              <span>{label as string}</span>
            </button>
          );
        })}
      </nav>
      <div className={"session-room-grid mobile-" + tab}>
        <aside className="session-left">
          <div className="session-mobile-sheet">
            <ErrorBox error={sheet.error} />
            {currentSheet ? (
              <SurvivalPanel
                key={currentSheet.id}
                sheet={currentSheet}
                act={characterAct}
                busy={mutation.isPending}
                canAct={active}
                gameAct={act}
                campaignId={campaignId!}
                gm={gm}
              />
            ) : (
              <HorrorPanel>
                <h2>Minha ficha</h2>
                <p className="muted">
                  {gm
                    ? "Selecione uma ficha do grupo para acompanhar recursos e condições."
                    : "Entre com uma ficha vinculada para acessar seus controles rápidos."}
                </p>
              </HorrorPanel>
            )}
          </div>
          <div className="session-mobile-group">
            <SessionGroup room={room} />
          </div>
        </aside>
        <section className="session-center" aria-label="Rolagens e eventos">
          <div className="session-mobile-dice">
            <SessionRoller
              key={String(gm)}
              sheet={currentSheet}
              characterId={focused || null}
              gm={gm}
              active={active}
              privateToGM={room.session.privateRollsToGM}
              act={act}
              busy={mutation.isPending}
            />
            <ErrorBox error={rolls.error} />
            <SessionRollHistory
              rolls={rollRows}
              userId={user.id}
              gm={gm}
              act={act}
              busy={mutation.isPending || !active}
              filter={filter}
              onFilter={setFilter}
              onMore={() => void rolls.fetchNextPage()}
              hasMore={rolls.hasNextPage}
            />
          </div>
          <div className="session-mobile-events">
            <ErrorBox error={events.error} />
            <SessionTimeline
              events={eventRows}
              act={act}
              busy={mutation.isPending}
              gm={gm}
              closed={closed}
              onMore={() => void events.fetchNextPage()}
              hasMore={events.hasNextPage}
            />
            {room.session.status === "FINISHED" && (
              <SummaryPanel
                summary={summary.data?.summary}
                error={summary.error}
              />
            )}
          </div>
        </section>
        <aside className="session-right">
          {gm && (
            <MasterControls room={room} act={act} busy={mutation.isPending} />
          )}
          <div className="session-mobile-notes">
            <ErrorBox error={notes.error} />
            <SessionJournal
              key={String(gm)}
              notes={notes.data?.notes ?? []}
              userId={user.id}
              gm={gm}
              act={act}
              busy={mutation.isPending}
              closed={closed}
            />
          </div>
          <div className="session-mobile-transfers">
            <ErrorBox error={transfers.error} />
            <TransfersPanel
              room={room}
              sheet={currentSheet}
              transfers={transfers.data?.transfers ?? []}
              act={act}
              busy={mutation.isPending}
              userId={user.id}
            />
          </div>
        </aside>
      </div>
    </div>
  );
}
