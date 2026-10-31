import { useState } from "react";
import { Dices } from "lucide-react";
import {
  type SheetDetails,
  type RollView,
} from "../../../../packages/shared/src/index";
import {
  SKILLS,
  fatiguePenalty,
} from "../../../../packages/rpg-rules/src/index";
import type { Act } from "./types";
import { InputField } from "./ui";
export function DicePanel({
  sheet,
  act,
  busy,
  rolls,
  onGeneric,
}: {
  sheet: SheetDetails;
  act: Act;
  busy: boolean;
  rolls: RollView[];
  onGeneric: (expression: string) => void;
}) {
  const [count, setCount] = useState(1);
  const [sides, setSides] = useState(20);
  const [authorize, setAuthorize] = useState<string | null>(null);
  const [category, setCategory] = useState("RESISTANCE");
  const [reason, setReason] = useState("");
  return (
    <>
      <div className="dice-toolbar">
        <label>
          Quantidade
          <input
            aria-label="Quantidade de dados"
            type="number"
            value={count}
            min={1}
            max={100}
            onChange={(e) => setCount(Number(e.target.value))}
          />
        </label>
        <label>
          Dado
          <select
            aria-label="Tipo de dado"
            value={sides}
            onChange={(e) => setSides(Number(e.target.value))}
          >
            {[4, 6, 8, 10, 12, 20, 100].map((n) => (
              <option key={n} value={n}>
                d{n}
              </option>
            ))}
          </select>
        </label>
        <button
          className="button primary"
          disabled={
            busy ||
            !Number.isInteger(count) ||
            count < 1 ||
            count > 100 ||
            sheet.status === "ARCHIVED"
          }
          onClick={() => onGeneric(count + "d" + sides)}
        >
          <Dices size={17} />
          Rolar dados
        </button>
      </div>
      <p className="sheet-help">
        Resultados gerados e registrados no servidor. Uma nova rolagem encerra a
        janela de PE do teste anterior.
      </p>
      <div className="rolls-list">
        {rolls.slice(0, 10).map((r) => (
          <article className={"roll-result " + (r.outcome ?? "")} key={r.id}>
            <div className="roll-title">
              <span>
                <Dices size={16} />
                {r.skillKey
                  ? SKILLS.find((s) => s[0] === r.skillKey)?.[1]
                  : r.expression}
              </span>
              <time>
                {new Date(r.createdAt).toLocaleTimeString("pt-BR", {
                  timeZone: "America/Sao_Paulo",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </time>
            </div>
            <div className="roll-numbers">
              <strong>
                {r.results.join(" + ")}
                {r.results.length > 1 ? " = " + r.total : ""}
              </strong>
              {r.target !== null && (
                <span>
                  Alvo {r.target} ·{" "}
                  {r.outcome === "SUCCESS" ? "Sucesso" : "Falha"}
                </span>
              )}
            </div>
            {r.skillKey && (
              <p>
                Base {r.baseTarget} · Fadiga {r.fatiguePenalty}{" "}
                {r.effortMode === "BONUS" ? "· Bônus PE +2 (limite 19)" : ""}
                {r.effortMode === "RETRY"
                  ? "· Repetição por 2 PE; original " +
                    r.initialResults.join(", ")
                  : ""}
              </p>
            )}
            {!r.finalizedAt && (
              <div className="roll-actions">
                <button
                  className="button secondary"
                  disabled={busy}
                  onClick={() =>
                    act(
                      "/rolls/" + r.id + "/effort",
                      { version: r.version, action: "ACCEPT" },
                      "POST",
                    )
                  }
                >
                  Aceitar resultado
                </button>
                <button
                  className="button secondary"
                  disabled={
                    busy ||
                    r.effortMode !== "NONE" ||
                    sheet.resources.find((p) => p.key === "PE")!.current < 1
                  }
                  onClick={() =>
                    act(
                      "/rolls/" + r.id + "/effort",
                      { version: r.version, action: "BONUS" },
                      "POST",
                    )
                  }
                >
                  Bônus +2 · 1 PE
                </button>
                {r.outcome === "FAILURE" &&
                  (!r.retryAuthorizedById ? (
                    <button
                      className="button secondary"
                      disabled={busy || Boolean(r.retryRequestedAt)}
                      onClick={() =>
                        act(
                          "/rolls/" + r.id + "/effort",
                          { version: r.version, action: "REQUEST_RETRY" },
                          "POST",
                        )
                      }
                    >
                      {r.retryRequestedAt
                        ? "Aguardando autorização"
                        : "Solicitar repetição"}
                    </button>
                  ) : (
                    <button
                      className="button primary"
                      disabled={
                        busy ||
                        sheet.resources.find((p) => p.key === "PE")!.current < 2
                      }
                      onClick={() =>
                        act(
                          "/rolls/" + r.id + "/effort",
                          { version: r.version, action: "RETRY" },
                          "POST",
                        )
                      }
                    >
                      Repetir · 2 PE
                    </button>
                  ))}
              </div>
            )}
            {sheet.isGM &&
              r.retryRequestedAt &&
              !r.retryAuthorizedById &&
              !r.finalizedAt && (
                <div>
                  <button
                    className="sheet-quiet"
                    onClick={() => setAuthorize(r.id)}
                  >
                    Revisar pedido como GM
                  </button>
                  {authorize === r.id && (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        act(
                          "/rolls/" + r.id + "/authorize-retry",
                          { version: r.version, category, reason },
                          "POST",
                        );
                        setAuthorize(null);
                      }}
                    >
                      <InputField label="Elegibilidade confirmada pelo mestre">
                        <select
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                        >
                          <option value="RESISTANCE">Resistência</option>
                          <option value="ESCAPE">Fuga</option>
                        </select>
                      </InputField>
                      <InputField label="Justificativa da autorização">
                        <input
                          minLength={5}
                          maxLength={500}
                          required
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                        />
                      </InputField>
                      <button className="button secondary" disabled={busy}>
                        Autorizar repetição
                      </button>
                    </form>
                  )}
                </div>
              )}
          </article>
        ))}
      </div>
      {!rolls.length && (
        <p className="sheet-empty">
          Os resultados desta ficha aparecerão aqui.
        </p>
      )}
    </>
  );
}
