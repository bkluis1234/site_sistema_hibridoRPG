import { formatDate } from "../locale";
import { useState } from "react";
import { Link, useParams, useSearchParams, useNavigate } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CalendarDays, Plus, ArrowUpRight, ShieldCheck } from "lucide-react";
import { gameCreateSchema } from "../../../../packages/shared/src/index";
import { api } from "../api";
import { HorrorPanel, SectionHeader, ErrorBox } from "../components";
import { Back, ManagementHeading } from "../management/common";
import { gameLabels, type Game } from "./types";
import "./game.css";
const formSchema = gameCreateSchema.omit({ operationId: true });
type Fields = z.input<typeof formSchema>;
export function SessionsPage() {
  const { campaignId } = useParams(),
    [params] = useSearchParams(),
    gm = params.get("mode") === "gm",
    navigate = useNavigate(),
    qc = useQueryClient(),
    [creating, setCreating] = useState(false);
  const query = useQuery({
    queryKey: ["game-sessions", campaignId],
    queryFn: () =>
      api<{
        campaign: { id: string; name: string };
        isGM: boolean;
        sessions: Game[];
      }>("/campaigns/" + campaignId + "/sessions"),
    refetchInterval: 30000,
  });
  const form = useForm<Fields>({
    resolver: zodResolver(formSchema),
    defaultValues: { title: "", scheduledAt: null, privateRollsToGM: true },
  });
  const mutation = useMutation({
    mutationFn: (input: Fields) =>
      api<{ session: Game }>("/campaigns/" + campaignId + "/sessions", {
        method: "POST",
        body: JSON.stringify({ ...input, operationId: crypto.randomUUID() }),
      }),
    onSuccess: async (result) => {
      await qc.invalidateQueries({ queryKey: ["game-sessions", campaignId] });
      navigate(
        "/campaigns/" +
          campaignId +
          "/sessions/" +
          result.session.id +
          "?mode=gm",
      );
    },
  });
  if (query.isPending) return <p role="status">Carregando sessões de jogo…</p>;
  if (!query.data)
    return (
      <>
        <Back to={"/campaigns/" + campaignId} />
        <ErrorBox error={query.error} />
      </>
    );
  return (
    <div className="management-page session-list-page">
      <Back to={"/campaigns/" + campaignId}>Campanha</Back>
      <ManagementHeading
        eyebrow="MODO SESSÃO · A MESA CONTINUA AQUI"
        title="Sessões de jogo"
      >
        {query.data.isGM &&
          (gm ? (
            <button
              className="button primary"
              onClick={() => setCreating(!creating)}
            >
              <Plus size={17} />
              Agendar sessão
            </button>
          ) : (
            <Link className="button secondary" to={"?mode=gm"}>
              <ShieldCheck size={17} />
              Gerenciar como mestre
            </Link>
          ))}
      </ManagementHeading>
      <p className="muted">
        {query.data.campaign.name}. Entre com sua ficha quando a sessão estiver
        em andamento. Rolagens e alterações são confirmadas pelo servidor.
      </p>
      <ErrorBox error={query.error} />
      {creating && gm && query.data.isGM && (
        <HorrorPanel>
          <SectionHeader title="Preparar a próxima sessão" />
          <form onSubmit={form.handleSubmit((v) => mutation.mutate(v))}>
            <label className="field">
              <span>Nome da sessão</span>
              <input maxLength={120} {...form.register("title")} />
              <small className="field-error">
                {form.formState.errors.title?.message}
              </small>
            </label>
            <label className="field">
              <span>Data e hora previstas (opcional)</span>
              <small>Preencha no horário do seu dispositivo; a lista mostra o horário de Brasília.</small>
              <input
                type="datetime-local"
                onChange={(e) =>
                  form.setValue(
                    "scheduledAt",
                    e.target.value
                      ? new Date(e.target.value).toISOString()
                      : null,
                  )
                }
              />
            </label>
            <label className="checkbox">
              <input type="checkbox" {...form.register("privateRollsToGM")} />
              Permitir que o mestre consulte rolagens privadas no contexto de
              mestre
            </label>
            <p className="small muted">
              Anotações pessoais continuam exclusivas do autor. Essa escolha se
              aplica às rolagens privadas desta sessão.
            </p>
            <ErrorBox error={mutation.error} />
            <button className="button primary" disabled={mutation.isPending}>
              Criar sessão agendada
            </button>
          </form>
        </HorrorPanel>
      )}
      <div className="session-cards">
        {query.data.sessions.map((session) => (
          <HorrorPanel key={session.id}>
            <div className="session-card-top">
              <CalendarDays size={21} />
              <span className={"session-state " + session.status.toLowerCase()}>
                {gameLabels[session.status]}
              </span>
            </div>
            <h2>{session.title}</h2>
            <p className="small muted">
              {session.scheduledAt
                ? formatDate(session.scheduledAt, "datetime")
                : "Sem horário previsto"}
            </p>
            <div className="form-buttons">
              <Link
                className="button secondary"
                to={"/campaigns/" + campaignId + "/sessions/" + session.id}
              >
                Abrir sala
                <ArrowUpRight size={16} />
              </Link>
              {query.data.isGM && gm && (
                <Link
                  className="button primary"
                  to={
                    "/campaigns/" +
                    campaignId +
                    "/sessions/" +
                    session.id +
                    "?mode=gm"
                  }
                >
                  Entrar como mestre
                </Link>
              )}
            </div>
          </HorrorPanel>
        ))}
      </div>
      {!query.data.sessions.length && (
        <p className="management-empty">
          Nenhuma sessão agendada. O mestre pode preparar a próxima reunião.
        </p>
      )}
    </div>
  );
}
