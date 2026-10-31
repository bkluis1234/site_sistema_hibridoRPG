import { useEffect, useState } from "react";
import { Dices, Search } from "lucide-react";
import { type SheetDetails } from "../../../../packages/shared/src/index";
import { fatiguePenalty } from "../../../../packages/rpg-rules/src/index";
import type { Act } from "./types";
export function Skills({
  sheet,
  act,
  busy,
  onRoll,
}: {
  sheet: SheetDetails;
  act: Act;
  busy: boolean;
  onRoll: (key: string) => void;
}) {
  const [trained, setTrained] = useState(
    sheet.skills.filter((s) => s.trained).map((s) => s.key),
  );
  const [reason, setReason] = useState("");
  const locked = sheet.status !== "DRAFT" && !sheet.isGM;
  const needsReason = sheet.status !== "DRAFT" && sheet.isGM;
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  useEffect(
    () => setTrained(sheet.skills.filter((s) => s.trained).map((s) => s.key)),
    [sheet.skillsVersion],
  );
  const dirty =
    JSON.stringify([...trained].sort()) !==
    JSON.stringify(
      sheet.skills
        .filter((s) => s.trained)
        .map((s) => s.key)
        .sort(),
    );
  const shown = sheet.skills.filter(
    (s) =>
      (filter === "all" ||
        (filter === "trained"
          ? trained.includes(s.key)
          : !trained.includes(s.key))) &&
      s.name
        .toLocaleLowerCase("pt-BR")
        .includes(search.toLocaleLowerCase("pt-BR")),
  );
  return (
    <>
      <div className="skills-toolbar">
        <label className="search-box">
          <Search size={16} />
          <input
            aria-label="Pesquisar perícia"
            placeholder="Buscar perícia…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <select
          aria-label="Filtrar perícias"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">Todas</option>
          <option value="trained">Treinadas</option>
          <option value="untrained">Não treinadas</option>
        </select>
      </div>
      <div className="skill-column-labels">
        <span>Perícia</span>
        <span>Atr.</span>
        <span>Treino</span>
        <span>Alvo</span>
        <span />
      </div>
      <div className="skills-list">
        {shown.map((s) => (
          <div className="sheet-skill" key={s.key}>
            <div>
              <strong>{s.name}</strong>
              {s.fatiguePenalty !== 0 && (
                <small>
                  Base {s.baseTarget} · fadiga {s.fatiguePenalty}
                </small>
              )}
            </div>
            <span className="skill-attribute">{s.attribute}</span>
            <input
              type="checkbox"
              aria-label={"Treinar " + s.name}
              checked={trained.includes(s.key)}
              disabled={
                busy ||
                locked ||
                (!trained.includes(s.key) && trained.length >= 4)
              }
              onChange={(e) =>
                setTrained(
                  e.target.checked
                    ? [...trained, s.key]
                    : trained.filter((k) => k !== s.key),
                )
              }
            />
            <strong
              className="skill-target"
              title={
                "Alvo base " + s.baseTarget + "; fadiga " + s.fatiguePenalty
              }
            >
              {s.target}
            </strong>
            <button
              className="icon-button"
              aria-label={"Rolar " + s.name}
              disabled={busy || dirty || sheet.status === "ARCHIVED"}
              onClick={() => onRoll(s.key)}
            >
              <Dices size={19} />
            </button>
          </div>
        ))}
      </div>
      {needsReason && (
        <label className="sheet-field">
          <span>Justificativa mecânica do mestre</span>
          <textarea
            aria-label="Justificativa mecânica dos treinamentos"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            minLength={5}
            maxLength={1000}
          />
        </label>
      )}
      <div className="allocation-footer">
        <span>
          Treinadas: <strong>{trained.length}/4</strong>
        </span>
        <button
          className="button secondary"
          disabled={
            busy ||
            !dirty ||
            locked ||
            (needsReason && (reason.trim().length < 5 || trained.length !== 4))
          }
          onClick={() =>
            act("/skills", {
              trained,
              version: sheet.skillsVersion,
              ...(needsReason ? { reason } : {}),
            })
          }
        >
          Salvar treinamentos
        </button>
      </div>
      <p className="sheet-help">
        Role 1d20 igual ou abaixo do alvo. Um 20 natural sempre falha.
        Alterações de treino só valem após salvar.
      </p>
    </>
  );
}
