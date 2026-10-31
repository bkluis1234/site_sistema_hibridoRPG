import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { gameNoteCreateSchema } from "../../../../packages/shared/src/index";
import type { z } from "zod";
import { HorrorPanel, SectionHeader } from "../components";
import {
  visibilityLabels,
  eventLabels,
  type Note,
  type Event,
  type GameAction,
} from "./types";
const schema = gameNoteCreateSchema.omit({ operationId: true });
type Fields = z.infer<typeof schema>;
export function SessionJournal({
  notes,
  userId,
  gm,
  act,
  busy,
  closed,
}: {
  notes: Note[];
  userId: string;
  gm: boolean;
  act: GameAction;
  busy: boolean;
  closed: boolean;
}) {
  const [editing, setEditing] = useState<Note | null | undefined>(undefined),
    [remove, setRemove] = useState<Note | null>(null);
  const form = useForm<Fields>({
    resolver: zodResolver(schema),
    defaultValues: { title: "", body: "", visibility: "PRIVATE" },
  });
  const open = (note?: Note) => {
    setEditing(note ?? null);
    form.reset(
      note
        ? { title: note.title, body: note.body, visibility: note.visibility }
        : { title: "", body: "", visibility: gm ? "GM_ONLY" : "PRIVATE" },
    );
  };
  return (
    <HorrorPanel>
      <SectionHeader title="Diário da sessão" />
      {!closed && (
        <button className="button secondary" onClick={() => open()}>
          Nova anotação
        </button>
      )}
      <p className="small muted">
        Anotações pessoais ficam com o autor. Notas do mestre aparecem somente
        no contexto de mestre. Para publicar conteúdo, crie uma nova anotação
        compartilhada.
      </p>
      {editing !== undefined && (
        <form
          className="session-note-form"
          onSubmit={form.handleSubmit(async (values) => {
            if (
              await act(
                "/notes" + (editing ? "/" + editing.id : ""),
                { ...values, ...(editing ? { version: editing.version } : {}) },
                editing ? "PATCH" : "POST",
              )
            )
              setEditing(undefined);
          })}
        >
          <label className="field">
            <span>Título da anotação</span>
            <input maxLength={100} {...form.register("title")} />
            <small>{form.formState.errors.title?.message}</small>
          </label>
          <label className="field">
            <span>Conteúdo da anotação</span>
            <textarea rows={7} maxLength={12000} {...form.register("body")} />
            <small>{form.formState.errors.body?.message}</small>
          </label>
          <label className="field">
            <span>Visibilidade da anotação</span>
            <select
              {...form.register("visibility")}
              aria-readonly={Boolean(editing)}
              onChange={(e) =>
                form.setValue(
                  "visibility",
                  editing?.visibility ??
                    (e.target.value as Fields["visibility"]),
                )
              }
            >
              <option value="PRIVATE">Pessoal · somente autor</option>
              <option value="PUBLIC">Compartilhada com a sessão</option>
              {gm && <option value="GM_ONLY">Reservada ao mestre</option>}
            </select>
          </label>
          <div className="form-buttons">
            <button className="button primary" disabled={busy || closed}>
              Salvar anotação
            </button>
            <button
              type="button"
              className="button secondary"
              onClick={() => setEditing(undefined)}
            >
              Cancelar
            </button>
          </div>
          <details>
            <summary>Preservar texto local antes de atualizar</summary>
            <textarea
              readOnly
              aria-label="Cópia local da anotação"
              value={form.watch("body")}
            />
          </details>
        </form>
      )}
      {remove && (
        <div
          className="sheet-confirm"
          role="dialog"
          aria-label="Remover anotação"
        >
          <p>
            Remover {remove.title}? O registro da remoção permanece no histórico
            autorizado.
          </p>
          <button
            className="button primary"
            disabled={busy}
            onClick={async () => {
              if (
                await act(
                  "/notes/" + remove.id,
                  { version: remove.version },
                  "DELETE",
                )
              )
                setRemove(null);
            }}
          >
            Confirmar remoção da anotação
          </button>
          <button className="button secondary" onClick={() => setRemove(null)}>
            Cancelar
          </button>
        </div>
      )}
      <div className="session-notes">
        {notes.map((n) => (
          <article
            key={n.id}
            className={"session-note " + n.visibility.toLowerCase()}
          >
            <span className="session-visibility">
              {visibilityLabels[n.visibility]}
            </span>
            <h3>{n.title}</h3>
            <p className="session-prose">{n.body}</p>
            <small>
              {n.author.username} ·{" "}
              {new Date(n.updatedAt).toLocaleString("pt-BR")}
            </small>
            {!closed &&
              (n.authorId === userId || (gm && n.visibility !== "PRIVATE")) && (
                <div className="form-buttons">
                  <button className="sheet-quiet" onClick={() => open(n)}>
                    Editar anotação
                  </button>
                  <button className="sheet-quiet" onClick={() => setRemove(n)}>
                    Remover anotação
                  </button>
                </div>
              )}
          </article>
        ))}
      </div>
      {!notes.length && (
        <p className="management-empty">
          Nenhuma anotação autorizada disponível.
        </p>
      )}
    </HorrorPanel>
  );
}
export function SessionTimeline({
  events,
  act,
  busy,
  gm,
  closed,
  onMore,
  hasMore,
}: {
  events: Event[];
  act: GameAction;
  busy: boolean;
  gm: boolean;
  closed: boolean;
  onMore: () => void;
  hasMore: boolean;
}) {
  const [writing, setWriting] = useState(false),
    [title, setTitle] = useState(""),
    [body, setBody] = useState(""),
    [visibility, setVisibility] = useState(gm ? "GM_ONLY" : "PUBLIC");
  return (
    <HorrorPanel>
      <SectionHeader title="Histórico da sessão" />
      {!closed && (
        <button
          className="button secondary"
          onClick={() => setWriting(!writing)}
        >
          Registrar acontecimento
        </button>
      )}
      {writing && (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            if (await act("/events", { title, body, visibility })) {
              setWriting(false);
              setTitle("");
              setBody("");
            }
          }}
        >
          <label className="field">
            <span>Título do acontecimento</span>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={120}
            />
          </label>
          <label className="field">
            <span>O que aconteceu</span>
            <textarea
              required
              value={body}
              onChange={(e) => setBody(e.target.value)}
              maxLength={4000}
            />
          </label>
          <label className="field">
            <span>Visibilidade do acontecimento</span>
            <select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value)}
            >
              <option value="PUBLIC">Compartilhado</option>
              <option value="PRIVATE">Pessoal</option>
              {gm && <option value="GM_ONLY">Somente mestre</option>}
            </select>
          </label>
          <button className="button primary" disabled={busy || closed}>
            Confirmar acontecimento
          </button>
        </form>
      )}
      <ol className="audit-list session-events">
        {events.map((event) => (
          <li key={event.id}>
            <div className="audit-dot" />
            <div>
              <span className="session-event-kind">
                {event.category === "MECHANICAL"
                  ? "Registro mecânico"
                  : event.category === "NARRATIVE"
                    ? "Narrativa informada"
                    : "Organização da sessão"}
              </span>
              <h3>{eventLabels[event.type] ?? "Atualização registrada"}</h3>
              <p className="small muted">
                {event.author.username} ·{" "}
                {new Date(event.createdAt).toLocaleString("pt-BR")} ·{" "}
                {visibilityLabels[event.visibility]}
              </p>
              {event.data.characterName && (
                <strong>{event.data.characterName}</strong>
              )}
              {event.data.resource && (
                <p>
                  {event.data.resource}: {event.data.previous} →{" "}
                  {event.data.current} (
                  {Number(event.data.difference) > 0 ? "+" : ""}
                  {event.data.difference})
                </p>
              )}
              {event.data.title && <h4>{event.data.title}</h4>}
              {event.data.body && (
                <p className="session-prose">{event.data.body}</p>
              )}
              {event.data.reason && <p>{event.data.reason}</p>}
              {event.data.name && (
                <p>
                  {event.data.name} · quantidade {event.data.quantity}
                </p>
              )}
              {event.data.roll && (
                <p>
                  {event.data.roll.characterName ?? "Mestre"} ·{" "}
                  {event.data.roll.expression}:{" "}
                  {event.data.roll.results.join(" + ")}
                  {event.data.roll.target !== null
                    ? " · alvo " +
                      event.data.roll.target +
                      " · " +
                      (event.data.roll.outcome === "SUCCESS"
                        ? "sucesso"
                        : "falha")
                    : ""}
                </p>
              )}
              {event.data.conditions && (
                <p>
                  Fadiga {event.data.conditions.fatigue ?? "—"} · Sangramento{" "}
                  {event.data.conditions.bleeding ? "sim" : "não"} · Crítico{" "}
                  {event.data.conditions.critical ? "sim" : "não"}
                </p>
              )}
            </div>
          </li>
        ))}
      </ol>
      {hasMore && (
        <button className="button secondary" onClick={onMore}>
          Carregar eventos anteriores
        </button>
      )}
    </HorrorPanel>
  );
}
