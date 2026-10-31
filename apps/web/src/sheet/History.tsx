import { useInfiniteQuery } from "@tanstack/react-query";
import { useSheetClient } from "./client";
import { ErrorBox } from "../components";
import { type HistoryEntry } from "../../../../packages/shared/src/index";
const historyLabels: Record<string, string> = {
  CHARACTER_CREATED: "Ficha criada",
  IDENTITY_UPDATED: "Identificação atualizada",
  ATTRIBUTES_UPDATED: "Atributos atualizados",
  TRAINING_UPDATED: "Treinamentos alterados",
  RESOURCE_CHANGED: "Recurso alterado",
  ITEM_CREATED: "Item adicionado",
  ITEM_UPDATED: "Item atualizado",
  ITEM_DELETED: "Item removido",
  CONDITIONS_UPDATED: "Condições atualizadas",
  INJURY_CREATED: "Ferimento registrado",
  INJURY_UPDATED: "Ferimento atualizado",
  DICE_ROLLED: "Dados rolados",
  EFFORT_BONUS: "Gasto de 1 PE — bônus",
  EFFORT_RETRY: "Gasto de 2 PE — repetição",
  APPROVAL_REQUESTED: "Enviado para aprovação",
  DRAFT_REOPENED: "Rascunho reaberto",
  FATIGUE_POLICY_UPDATED: "Configuração de fadiga alterada",
};
export function HistoryPanel({ id }: { id: string }) {
  const { api, gm } = useSheetClient();
  const query = useInfiniteQuery({
    queryKey: ["sheet-history", id, gm],
    initialPageParam: null as number | null,
    queryFn: ({ pageParam }) =>
      api<{ entries: HistoryEntry[]; nextBefore: number | null }>(
        "/characters/" +
          id +
          "/history" +
          (pageParam ? "?before=" + pageParam : ""),
      ),
    getNextPageParam: (last) => last.nextBefore ?? undefined,
  });
  return (
    <>
      <ErrorBox error={query.error} />
      <ol className="audit-list">
        {query.data?.pages
          .flatMap((p) => p.entries)
          .map((e) => (
            <li key={e.id}>
              <div className="audit-dot" />
              <div>
                <strong>
                  {historyLabels[e.action] ??
                    e.action.replaceAll("_", " ").toLowerCase()}
                </strong>
                <p>
                  {e.actor.username} ·{" "}
                  {new Date(e.createdAt).toLocaleString("pt-BR")} · versão{" "}
                  {e.recordVersion}
                </p>
                {e.reason && <p>Justificativa: {e.reason}</p>}
                {Boolean(e.beforeData || e.afterData) && (
                  <details>
                    <summary>Conferir antes e depois</summary>
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
      {query.isPending && (
        <p className="sheet-help" role="status">
          Carregando histórico…
        </p>
      )}
      {query.hasNextPage && (
        <button
          className="button secondary"
          disabled={query.isFetchingNextPage}
          onClick={() => query.fetchNextPage()}
        >
          Carregar registros anteriores
        </button>
      )}
    </>
  );
}
