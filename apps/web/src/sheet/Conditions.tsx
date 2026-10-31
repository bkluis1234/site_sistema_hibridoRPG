import { formatDate } from "../locale";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Pencil } from "lucide-react";
import {
  injuryFields,
  type SheetDetails,
  type InjuryFields,
} from "../../../../packages/shared/src/index";
import {
  SKILLS,
  fatiguePenalty,
} from "../../../../packages/rpg-rules/src/index";
import type { Act } from "./types";
const injuryFormSchema = z.object(injuryFields).strict();
import { InputField } from "./ui";
export function Injuries({
  sheet,
  act,
  busy,
}: {
  sheet: SheetDetails;
  act: Act;
  busy: boolean;
}) {
  const [edit, setEdit] = useState<
    SheetDetails["injuries"][number] | null | undefined
  >(undefined);
  const form = useForm<InjuryFields>({
    resolver: zodResolver(injuryFormSchema),
    defaultValues: {
      description: "",
      location: "",
      consequences: "",
      status: "ACTIVE",
    },
  });
  return (
    <>
      <div className="injury-list">
        {sheet.injuries.map((i) => (
          <article key={i.id}>
            <div>
              <h3>{i.description}</h3>
              <p>
                {i.location || "Localização não informada"} ·{" "}
                {i.status === "ACTIVE"
                  ? "Ativo"
                  : i.status === "TREATED"
                    ? "Tratado"
                    : "Resolvido"}
              </p>
              {i.consequences && <p>{i.consequences}</p>}
              <small>{formatDate(i.createdAt, "date")}</small>
            </div>
            <button
              className="icon-button"
              aria-label={"Editar ferimento " + i.description}
              disabled={busy || sheet.status === "ARCHIVED"}
              onClick={() => {
                setEdit(i);
                form.reset({
                  description: i.description,
                  location: i.location,
                  consequences: i.consequences,
                  status: i.status,
                });
              }}
            >
              <Pencil size={15} />
            </button>
          </article>
        ))}
      </div>
      {edit !== undefined ? (
        <form
          className="sheet-subform"
          onSubmit={form.handleSubmit(async (fields) => {
            if (
              await act(
                "/injuries" + (edit ? "/" + edit.id : ""),
                { ...fields, ...(edit ? { version: edit.version } : {}) },
                edit ? "PATCH" : "POST",
              )
            )
              setEdit(undefined);
          })}
        >
          <InputField
            label="Descrição do ferimento"
            error={form.formState.errors.description?.message}
          >
            <input {...form.register("description")} maxLength={4000} />
          </InputField>
          <InputField label="Localização">
            <input {...form.register("location")} maxLength={160} />
          </InputField>
          <InputField label="Consequências">
            <textarea {...form.register("consequences")} maxLength={4000} />
          </InputField>
          <InputField label="Estado do ferimento">
            <select {...form.register("status")}>
              <option value="ACTIVE">Ativo</option>
              <option value="TREATED">Tratado</option>
              <option value="RESOLVED">Resolvido</option>
            </select>
          </InputField>
          <div className="form-buttons">
            <button className="button primary" disabled={busy}>
              Salvar ferimento
            </button>
            <button
              className="button secondary"
              type="button"
              onClick={() => setEdit(undefined)}
            >
              Cancelar
            </button>
          </div>
        </form>
      ) : (
        <button
          className="sheet-add"
          disabled={busy || sheet.status === "ARCHIVED"}
          onClick={() => {
            setEdit(null);
            form.reset({
              description: "",
              location: "",
              consequences: "",
              status: "ACTIVE",
            });
          }}
        >
          <Plus size={16} />
          Registrar ferimento
        </button>
      )}
    </>
  );
}
export function ConditionTracker({
  sheet,
  act,
  busy,
}: {
  sheet: SheetDetails;
  act: Act;
  busy: boolean;
}) {
  const c = sheet.conditions;
  const [bleeding, setBleeding] = useState(c.bleeding);
  useEffect(() => setBleeding(c.bleeding), [c.bleeding, c.version]);
  const disabled = busy || sheet.status === "ARCHIVED";
  return (
    <div className="condition-grid">
      <article
        className={"condition-card bleeding " + (c.bleeding ? "active" : "")}
      >
        <h3>Sangramento</h3>
        <label className="sheet-checkbox">
          <input
            type="checkbox"
            aria-label="Sangramento ativo"
            checked={bleeding}
            disabled={disabled}
            onChange={async (e) => {
              const value = e.target.checked;
              setBleeding(value);
              if (
                !(await act("/conditions", {
                  version: c.version,
                  bleeding: value,
                }))
              )
                setBleeding(c.bleeding);
            }}
          />
          {c.bleeding ? "Sim — ativo" : "Não"}
        </label>
        <p>Sem perda automática de PV por rodada.</p>
      </article>
      <article className="condition-card fatigue">
        <h3>Fadiga</h3>
        <div
          className="fatigue-choices"
          role="group"
          aria-label="Nível de fadiga"
        >
          {[0, 1, 2, 3].map((level) => (
            <button
              key={level}
              className={c.fatigue === level ? "selected" : ""}
              aria-pressed={c.fatigue === level}
              aria-label={"Fadiga nível " + level}
              disabled={disabled}
              onClick={() =>
                act("/conditions", { version: c.version, fatigue: level })
              }
            >
              {level}
            </button>
          ))}
        </div>
        <p>
          {c.fatigue === 0
            ? "Sem penalidade."
            : `${fatiguePenalty(c.fatigue)} nos alvos das perícias afetadas.`}
        </p>
        {c.fatigue === 3 && (
          <p>
            Deslocamento reduzido e recuperação incompleta de PE. Consulte
            Marcus para quantificar.
          </p>
        )}
      </article>
      <article
        className={"condition-card critical " + (c.critical ? "active" : "")}
      >
        <h3>Estado crítico</h3>
        <strong>
          {c.stabilization === "DEAD"
            ? "Morte registrada"
            : c.stabilization === "STABLE"
              ? "Estabilizado"
              : c.critical
                ? "Em acompanhamento"
                : "Não"}
        </strong>
        {c.incapacitated && <p>Incapacitado · PV chegou a zero.</p>}
        <div className="critical-count">
          <span>Sucessos {c.successes}/3</span>
          <button
            className="icon-button"
            aria-label="Registrar sucesso crítico"
            disabled={disabled || !c.critical || c.stabilization !== "UNSTABLE"}
            onClick={() =>
              act("/critical", { version: c.version, action: "SUCCESS" })
            }
          >
            <Plus size={15} />
          </button>
        </div>
        <div className="critical-count">
          <span>Falhas {c.failures}/3</span>
          <button
            className="icon-button"
            aria-label="Registrar falha crítica"
            disabled={disabled || !c.critical || c.stabilization !== "UNSTABLE"}
            onClick={() =>
              act("/critical", { version: c.version, action: "FAILURE" })
            }
          >
            <Plus size={15} />
          </button>
        </div>
        {!c.critical ? (
          <button
            className="sheet-quiet"
            disabled={disabled}
            onClick={() =>
              act("/critical", { version: c.version, action: "START" })
            }
          >
            Iniciar acompanhamento
          </button>
        ) : (
          <button
            className="sheet-quiet"
            disabled={
              disabled ||
              sheet.resources.find((r) => r.key === "PV")?.current === 0
            }
            onClick={() =>
              act("/critical", { version: c.version, action: "RESET" })
            }
          >
            Encerrar e limpar contadores
          </button>
        )}
        <p>Não rola testes nem recupera PV automaticamente.</p>
      </article>
    </div>
  );
}
export function FatiguePolicy({
  sheet,
  act,
  busy,
}: {
  sheet: SheetDetails;
  act: Act;
  busy: boolean;
}) {
  const [selected, setSelected] = useState(sheet.physicalSkillKeys);
  useEffect(
    () => setSelected(sheet.physicalSkillKeys),
    [JSON.stringify(sheet.physicalSkillKeys)],
  );
  return (
    <details className="fatigue-policy">
      <summary>Perícias afetadas pela fadiga</summary>
      <p className="sheet-help">
        {sheet.physicalSkillsConfirmed
          ? "Configuração registrada pelo mestre da campanha."
          : "Configuração inicial proposta; sujeita à revisão de Marcus."}{" "}
        A penalidade modifica o alvo do teste, sem alterar o valor base.
      </p>
      <p className="policy-list">
        {sheet.skills
          .filter((s) => s.physical)
          .map((s) => s.name)
          .join(" · ") || "Nenhuma perícia selecionada."}
      </p>
      {sheet.isGM && sheet.campaignVersion !== null && (
        <>
          <div className="policy-options">
            {SKILLS.map(([key, name]) => (
              <label className="sheet-checkbox" key={key}>
                <input
                  type="checkbox"
                  checked={selected.includes(key)}
                  onChange={(e) =>
                    setSelected(
                      e.target.checked
                        ? [...selected, key]
                        : selected.filter((k) => k !== key),
                    )
                  }
                />
                {name}
              </label>
            ))}
          </div>
          <button
            className="button secondary"
            disabled={busy}
            onClick={() =>
              act("/fatigue-policy", {
                version: sheet.campaignVersion,
                physicalSkillKeys: selected,
              })
            }
          >
            Salvar configuração da campanha
          </button>
        </>
      )}
    </details>
  );
}
