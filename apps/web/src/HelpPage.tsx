import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";
import { HorrorPanel, SectionHeader, ErrorBox } from "./components";
type Help = {
  guides: { key: string; title: string; steps: string[] }[];
  progress: { guideKey: string; completed: boolean }[];
};
export function HelpPage() {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ["help"],
    queryFn: () => api<Help>("/help"),
  });
  const mutation = useMutation({
    mutationFn: ({ key, completed }: { key: string; completed: boolean }) =>
      api("/help/progress/" + key, {
        method: "PATCH",
        body: JSON.stringify({ completed }),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["help"] }),
  });
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">ORIGEM · PRIMEIROS PASSOS</span>
          <h1>
            Central de ajuda<span>.</span>
          </h1>
          <p>
            Sistema de jogo: Sistema Híbrido 2.6. Tutoriais opcionais; leia no
            seu ritmo.
          </p>
        </div>
      </div>
      <ErrorBox error={query.error || mutation.error} />
      {query.isPending && <p role="status">Carregando tutoriais…</p>}
      <p className="muted">
        Datas e horários são apresentados no fuso de Brasília
        (America/Sao_Paulo). Após uma falha de rede, aguarde a confirmação do
        servidor antes de repetir ações.
      </p>
      <div className="help-guides">
        {query.data?.guides.map((guide) => {
          const completed = query.data.progress.some(
            (p) => p.guideKey === guide.key && p.completed,
          );
          return (
            <HorrorPanel key={guide.key}>
              <SectionHeader title={guide.title} />
              <ol className="help-steps">
                {guide.steps.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ol>
              <button
                className="button secondary"
                disabled={mutation.isPending}
                onClick={() =>
                  mutation.mutate({ key: guide.key, completed: !completed })
                }
              >
                {completed ? "Marcar como não lido: " : "Concluir leitura: "}
                {guide.title}
              </button>
              <p role="status">
                {mutation.isPending && mutation.variables?.key === guide.key
                  ? "Salvando progresso…"
                  : completed
                    ? "Leitura confirmada no servidor."
                    : "Leitura ainda não concluída."}
              </p>
            </HorrorPanel>
          );
        })}
      </div>
    </>
  );
}
