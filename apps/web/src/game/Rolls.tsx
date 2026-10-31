import { useState } from "react";
import { Dices, Lock, ShieldCheck } from "lucide-react";
import type { SheetDetails } from "../../../../packages/shared/src/index";
import { SKILLS } from "../../../../packages/rpg-rules/src/index";
import { HorrorPanel, SectionHeader } from "../components";
import { visibilityLabels, type SessionRoll, type GameAction } from "./types";
export function SessionRoller({
  sheet,
  characterId,
  gm,
  active,
  privateToGM,
  act,
  busy,
}: {
  sheet?: SheetDetails;
  characterId: string | null;
  gm: boolean;
  active: boolean;
  privateToGM: boolean;
  act: GameAction;
  busy: boolean;
}) {
  const [mode, setMode] = useState("dice"),
    [count, setCount] = useState(1),
    [sides, setSides] = useState(20),
    [skill, setSkill] = useState("atletismo"),
    [visibility, setVisibility] = useState(gm ? "GM_ONLY" : "PUBLIC"),
    [damage, setDamage] = useState(false),
    [modifier, setModifier] = useState(0),
    [reason, setReason] = useState(""),
    [fatigue, setFatigue] = useState("DEFAULT");
  const selected = sheet?.skills.find((s) => s.key === skill),
    context = mode === "skill" && (modifier !== 0 || fatigue !== "DEFAULT");
  return (
    <HorrorPanel>
      <SectionHeader title="Rolador da sessão" />
      <p className="small muted">
        O servidor gera e registra os dados. Nos testes, d20 igual ou inferior
        ao alvo; 20 natural sempre falha.
      </p>
      <form
        className="session-roll-form"
        onSubmit={async (e) => {
          e.preventDefault();
          await act("/rolls", {
            characterId,
            visibility,
            ...(mode === "skill"
              ? {
                  skillKey: skill,
                  ...(gm && context
                    ? {
                        contextModifier: modifier,
                        modifierReason: reason,
                        ...(fatigue === "DEFAULT"
                          ? {}
                          : { fatigueOverride: fatigue === "YES" }),
                      }
                    : {}),
                }
              : {
                  expression: count + "d" + sides,
                  category: damage ? "DAMAGE" : "GENERAL",
                }),
          });
        }}
      >
        <div className="session-form-row">
          <label>
            Tipo de rolagem
            <select
              aria-label="Tipo de rolagem da sessão"
              value={mode}
              onChange={(e) => setMode(e.target.value)}
            >
              <option value="dice">Dados livres</option>
              <option value="skill" disabled={!sheet}>
                Teste de perícia
              </option>
            </select>
          </label>
          <label>
            Quem recebe
            <select
              aria-label="Visibilidade da rolagem"
              value={visibility}
              onChange={(e) => setVisibility(e.target.value)}
            >
              <option value="PUBLIC">Compartilhada com a sessão</option>
              <option value="PRIVATE">
                {privateToGM
                  ? "Privada · você e mestre"
                  : "Privada · somente você"}
              </option>
              {gm && (
                <>
                  <option value="GM_ONLY">Somente mestre</option>
                  <option value="GM_SHARED">
                    Mestre · compartilhar com jogadores
                  </option>
                </>
              )}
            </select>
          </label>
        </div>
        {mode === "dice" ? (
          <>
            <div className="session-form-row">
              <label>
                Quantidade
                <input
                  aria-label="Quantidade de dados da sessão"
                  type="number"
                  min={1}
                  max={100}
                  value={count}
                  onChange={(e) => setCount(Number(e.target.value))}
                />
              </label>
              <label>
                Dado
                <select
                  aria-label="Dado da sessão"
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
            </div>
            <label className="checkbox">
              <input
                type="checkbox"
                checked={damage}
                onChange={(e) => setDamage(e.target.checked)}
              />
              Registrar como rolagem de dano (sem aplicar dano automaticamente)
            </label>
          </>
        ) : (
          <>
            <label className="field">
              <span>Perícia do teste</span>
              <select value={skill} onChange={(e) => setSkill(e.target.value)}>
                {SKILLS.map(([key, name, attribute]) => (
                  <option key={key} value={key}>
                    {name} · {attribute}
                  </option>
                ))}
              </select>
            </label>
            {selected && (
              <div className="session-target-preview">
                <strong>Alvo base {selected.baseTarget}</strong>
                <span>Fadiga {selected.fatiguePenalty}</span>
                <span>Alvo atual {selected.target}</span>
              </div>
            )}
            {gm && (
              <details className="context-modifier">
                <summary>Decisão contextual do mestre</summary>
                <label>
                  Modificador no alvo
                  <input
                    type="number"
                    min={-19}
                    max={19}
                    value={modifier}
                    onChange={(e) => setModifier(Number(e.target.value))}
                  />
                </label>
                <label>
                  Aplicação de fadiga
                  <select
                    value={fatigue}
                    onChange={(e) => setFatigue(e.target.value)}
                  >
                    <option value="DEFAULT">
                      Usar configuração da campanha
                    </option>
                    <option value="YES">Aplicar neste teste</option>
                    <option value="NO">Não aplicar neste teste</option>
                  </select>
                </label>
                <label>
                  Justificativa do modificador
                  <textarea
                    minLength={5}
                    maxLength={500}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                </label>
              </details>
            )}
          </>
        )}
        <button
          className="button primary"
          disabled={
            busy ||
            !active ||
            (!gm && !characterId) ||
            (mode === "skill" && !sheet) ||
            (context && reason.trim().length < 5) ||
            !Number.isInteger(count) ||
            count < 1 ||
            count > 100
          }
        >
          <Dices size={17} />
          {mode === "skill" ? "Rolar teste oficial" : "Rolar dados oficiais"}
        </button>
      </form>
      {!active && (
        <p className="small muted">
          As rolagens ficam disponíveis na sessão em andamento, após entrar com
          sua ficha.
        </p>
      )}
    </HorrorPanel>
  );
}
export function SessionRollHistory({
  rolls,
  userId,
  gm,
  act,
  busy,
  filter,
  onFilter,
  onMore,
  hasMore,
}: {
  rolls: SessionRoll[];
  userId: string;
  gm: boolean;
  act: GameAction;
  busy: boolean;
  filter: string;
  onFilter: (v: string) => void;
  onMore: () => void;
  hasMore: boolean;
}) {
  const [authorize, setAuthorize] = useState<string | null>(null),
    [reason, setReason] = useState(""),
    [category, setCategory] = useState("RESISTANCE");
  return (
    <HorrorPanel>
      <SectionHeader title="Rolagens visíveis" />
      <label className="field">
        <span>Filtrar rolagens</span>
        <select value={filter} onChange={(e) => onFilter(e.target.value)}>
          {[
            ["ALL", "Todas as visíveis"],
            ["MINE", "Minhas rolagens"],
            ["SKILL", "Perícias"],
            ["DAMAGE", "Dano"],
            ["GM", "Rolagens do mestre"],
          ].map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>
      <div className="rolls-list">
        {rolls.map((r) => (
          <article
            className={"roll-result " + (r.outcome ?? "")}
            key={r.id}
            data-testid="session-roll"
          >
            <div className="roll-title">
              <strong>
                {r.characterName ?? "Mestre"} ·{" "}
                {r.skillKey
                  ? SKILLS.find((s) => s[0] === r.skillKey)?.[1]
                  : r.expression}
              </strong>
              <span className="session-visibility">
                {r.visibility === "GM_ONLY" ? <Lock size={13} /> : null}
                {visibilityLabels[r.visibility]}
              </span>
            </div>
            <p className="small muted">
              {r.user.username} ·{" "}
              {new Date(r.createdAt).toLocaleTimeString("pt-BR")}
            </p>
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
                Base {r.baseTarget} · Fadiga {r.fatiguePenalty} · Contexto{" "}
                {r.contextModifier > 0 ? "+" : ""}
                {r.contextModifier}
                {r.effortMode === "BONUS" ? " · PE +2" : ""} · Alvo final{" "}
                {r.target}
              </p>
            )}
            {r.modifierReason && (
              <p className="small">Decisão do mestre: {r.modifierReason}</p>
            )}
            {r.effortMode === "RETRY" && (
              <p>Repetição por 2 PE · original {r.initialResults.join(", ")}</p>
            )}
            {!r.finalizedAt && r.userId === userId && (
              <div className="roll-actions">
                <button
                  className="button secondary"
                  disabled={busy}
                  onClick={() =>
                    act("/rolls/" + r.id + "/effort", {
                      version: r.version,
                      action: "ACCEPT",
                    })
                  }
                >
                  Aceitar resultado
                </button>
                <button
                  className="button secondary"
                  disabled={busy || r.effortMode !== "NONE"}
                  onClick={() =>
                    act("/rolls/" + r.id + "/effort", {
                      version: r.version,
                      action: "BONUS",
                    })
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
                        act("/rolls/" + r.id + "/effort", {
                          version: r.version,
                          action: "REQUEST_RETRY",
                        })
                      }
                    >
                      {r.retryRequestedAt
                        ? "Aguardando mestre"
                        : "Solicitar repetição"}
                    </button>
                  ) : (
                    <button
                      className="button secondary"
                      disabled={busy}
                      onClick={() =>
                        act("/rolls/" + r.id + "/effort", {
                          version: r.version,
                          action: "RETRY",
                        })
                      }
                    >
                      Repetir · 2 PE
                    </button>
                  ))}
              </div>
            )}
            {gm &&
              !r.finalizedAt &&
              r.retryRequestedAt &&
              !r.retryAuthorizedById && (
                <>
                  <button
                    className="button secondary"
                    onClick={() =>
                      setAuthorize(authorize === r.id ? null : r.id)
                    }
                  >
                    <ShieldCheck size={15} />
                    Analisar repetição
                  </button>
                  {authorize === r.id && (
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        if (
                          await act("/rolls/" + r.id + "/authorize-retry", {
                            version: r.version,
                            category,
                            reason,
                          })
                        )
                          setAuthorize(null);
                      }}
                    >
                      <label>
                        Categoria autorizada
                        <select
                          value={category}
                          onChange={(e) => setCategory(e.target.value)}
                        >
                          <option value="RESISTANCE">Resistência</option>
                          <option value="ESCAPE">Fuga</option>
                        </select>
                      </label>
                      <label>
                        Justificativa da repetição
                        <textarea
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                          minLength={5}
                          maxLength={500}
                        />
                      </label>
                      <button
                        className="button primary"
                        disabled={busy || reason.trim().length < 5}
                      >
                        Autorizar repetição
                      </button>
                    </form>
                  )}
                </>
              )}
          </article>
        ))}
      </div>
      {!rolls.length && (
        <p className="management-empty">
          Nenhuma rolagem visível neste filtro.
        </p>
      )}
      {hasMore && (
        <button className="button secondary" onClick={onMore}>
          Carregar rolagens anteriores
        </button>
      )}
    </HorrorPanel>
  );
}
