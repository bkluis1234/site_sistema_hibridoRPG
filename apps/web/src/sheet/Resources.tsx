import { useEffect, useState } from "react";
import { Plus, Minus, HeartPulse, Brain, Zap } from "lucide-react";
import { type SheetDetails } from "../../../../packages/shared/src/index";
import type { Act } from "./types";
export function ResourceControl({
  resource,
  act,
  busy,
  archived,
}: {
  resource: SheetDetails["resources"][number];
  act: Act;
  busy: boolean;
  archived: boolean;
}) {
  const [current, setCurrent] = useState(String(resource.current));
  const [amount, setAmount] = useState("1");
  const [event, setEvent] = useState("DAMAGE");
  useEffect(
    () => setCurrent(String(resource.current)),
    [resource.current, resource.version],
  );
  const icons = { PV: HeartPulse, SAN: Brain, PE: Zap };
  const Icon = icons[resource.key];
  const labels = {
    PV: "Pontos de vida",
    SAN: "Sanidade",
    PE: "Pontos de esforço",
  };
  const n = Number(amount);
  return (
    <article className={"resource-control " + resource.key.toLowerCase()}>
      <header>
        <Icon size={25} />
        <div>
          <span>{labels[resource.key]}</span>
          <h3>{resource.key}</h3>
        </div>
      </header>
      <div className="resource-number">
        <button
          className="icon-button"
          aria-label={"Reduzir " + resource.key}
          onClick={() =>
            act("/resources", {
              key: resource.key,
              mode: "ADJUST",
              value: -1,
              event: "ADJUSTMENT",
              version: resource.version,
            })
          }
          disabled={busy || archived || resource.current === 0}
        >
          <Minus size={18} />
        </button>
        <strong>
          {resource.current}
          <span> / {resource.maximum}</span>
        </strong>
        <button
          className="icon-button"
          aria-label={"Aumentar " + resource.key}
          onClick={() =>
            act("/resources", {
              key: resource.key,
              mode: "ADJUST",
              value: 1,
              event: "ADJUSTMENT",
              version: resource.version,
            })
          }
          disabled={busy || archived || resource.current >= resource.maximum}
        >
          <Plus size={18} />
        </button>
      </div>
      <progress
        value={resource.current}
        max={resource.maximum}
        aria-label={labels[resource.key]}
      />
      <details>
        <summary>Ajustar {resource.key}</summary>
        <label>
          Valor atual
          <input
            aria-label={"Valor atual de " + resource.key}
            type="number"
            min={0}
            max={resource.maximum}
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
          />
        </label>
        <button
          className="button secondary"
          disabled={
            busy ||
            archived ||
            !/^\d+$/.test(current) ||
            Number(current) > resource.maximum
          }
          onClick={() =>
            act("/resources", {
              key: resource.key,
              mode: "SET",
              value: Number(current),
              event: "ADJUSTMENT",
              version: resource.version,
            })
          }
        >
          Confirmar valor
        </button>
        <label>
          Quantidade
          <input
            aria-label={"Quantidade para " + resource.key}
            type="number"
            min={1}
            max={100000}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </label>
        {resource.key === "PV" && (
          <label>
            Tipo de evento
            <select
              aria-label="Tipo de evento de PV"
              value={event}
              onChange={(e) => setEvent(e.target.value)}
            >
              <option value="DAMAGE">Dano informado</option>
              <option value="SINGLE_ATTACK">Dano de ataque único</option>
              <option value="ADJUSTMENT">Ajuste de recurso</option>
            </select>
          </label>
        )}
        <div className="resource-actions">
          <button
            className="button secondary"
            disabled={busy || archived || !Number.isInteger(n) || n < 1}
            onClick={() =>
              act("/resources", {
                key: resource.key,
                mode: "ADJUST",
                value: -n,
                event: resource.key === "PV" ? event : "ADJUSTMENT",
                version: resource.version,
              })
            }
          >
            Reduzir {n || "—"}
          </button>
          <button
            className="button secondary"
            disabled={
              busy ||
              archived ||
              !Number.isInteger(n) ||
              n < 1 ||
              resource.current + n > resource.maximum
            }
            onClick={() =>
              act("/resources", {
                key: resource.key,
                mode: "ADJUST",
                value: n,
                event: resource.key === "PV" ? "HEALING" : "ADJUSTMENT",
                version: resource.version,
              })
            }
          >
            Aumentar {n || "—"}
          </button>
        </div>
      </details>
    </article>
  );
}
