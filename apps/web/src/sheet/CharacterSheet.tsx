import { useState } from "react";
import {
  Link,
  useParams,
  useOutletContext,
  useSearchParams,
} from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  HeartPulse,
  Activity,
  Dices,
  Backpack,
  ShieldCheck,
  Check,
  Clock,
  BookOpen,
  History,
  FileText,
  Crosshair,
} from "lucide-react";
import { useSheetClient } from "./client";
import { PrivacyPanel, ChangeRequestPanel } from "./Privacy";
import { ErrorBox, SaveStatus } from "../components";
import {
  type SheetDetails,
  type RollView,
  type PublicUser,
} from "../../../../packages/shared/src/index";
import type { Act, Action } from "./types";
import { Panel, InputField } from "./ui";
import { Identification } from "./Identification";
import { Attributes } from "./Attributes";
import { ResourceControl } from "./Resources";
import { Skills } from "./Skills";
import { InventoryTable } from "./Inventory";
import { Injuries, ConditionTracker, FatiguePolicy } from "./Conditions";
import { DicePanel } from "./Dice";
import { HistoryPanel } from "./History";
import { operationId } from "./types";
import "./sheet.css";
const op = operationId;
export function CharacterSheet() {
  const { api, gm } = useSheetClient();
  const [searchParams] = useSearchParams();
  const { id } = useParams();
  const { user } = useOutletContext<{ user: PublicUser }>();
  const qc = useQueryClient();
  const [tab, setTab] = useState(
    [
      "attributes",
      "skills",
      "inventory",
      "equipment",
      "conditions",
      "dice",
      "history",
      "privacy",
      "requests",
    ].includes(searchParams.get("section") ?? "")
      ? searchParams.get("section")!
      : "summary",
  );
  const [saveState, setSaveState] = useState<
    "idle" | "dirty" | "saving" | "saved" | "error" | "conflict"
  >("idle");
  const [notice, setNotice] = useState("");
  const [askSubmit, setAskSubmit] = useState(false);
  const [contextFatigue, setContextFatigue] = useState<
    "DEFAULT" | "YES" | "NO"
  >("DEFAULT");
  const query = useQuery({
    queryKey: ["sheet", id, gm],
    queryFn: () => api<{ sheet: SheetDetails }>("/characters/" + id + "/sheet"),
  });
  const rolls = useQuery({
    queryKey: ["sheet-rolls", id, gm],
    enabled: tab === "dice",
    queryFn: () => api<{ rolls: RollView[] }>("/characters/" + id + "/rolls"),
  });
  const refresh = async () => {
    await Promise.all([
      qc.invalidateQueries({ queryKey: ["sheet", id] }),
      qc.invalidateQueries({ queryKey: ["characters"] }),
      qc.invalidateQueries({ queryKey: ["sheet-history", id] }),
      qc.invalidateQueries({ queryKey: ["sheet-rolls", id] }),
      qc.invalidateQueries({ queryKey: ["character-notes", id] }),
      qc.invalidateQueries({ queryKey: ["change-requests", id] }),
    ]);
  };
  const mutation = useMutation({
    mutationFn: (action: Action) =>
      api<{ alert?: string }>(action.path, {
        method: action.method ?? "PATCH",
        body: JSON.stringify(action.body),
      }),
    onMutate: () => setNotice(""),
    onSuccess: async (response) => {
      setNotice(response?.alert ?? "Alteração confirmada pelo servidor.");
      await refresh();
    },
    onError: () => setNotice(""),
  });
  const act: Act = async (suffix, body, method) => {
    if (mutation.isPending) return false;
    try {
      await mutation.mutateAsync({
        path: "/characters/" + id + suffix,
        body: { ...body, operationId: op() },
        method,
      });
      return true;
    } catch {
      return false;
    }
  };
  if (query.isPending)
    return (
      <div className="loading" role="status">
        Abrindo ficha…
      </div>
    );
  if (!query.data)
    return (
      <>
        <Link to="/" className="back-link">
          <ArrowLeft size={16} />
          Voltar
        </Link>
        <ErrorBox error={query.error} />
        <button className="button secondary" onClick={() => query.refetch()}>
          Tentar novamente
        </button>
      </>
    );
  const s = query.data.sheet;
  const busy = mutation.isPending;
  const roll = (key: string) => {
    mutation.mutate({
      path: "/dice/roll",
      method: "POST",
      body: {
        characterId: s.id,
        skillKey: key,
        operationId: op(),
        ...(s.isGM && contextFatigue !== "DEFAULT"
          ? { fatigueOverride: contextFatigue === "YES" }
          : {}),
      },
    });
    setTab("dice");
  };
  const generic = (expression: string) =>
    mutation.mutate({
      path: "/dice/roll",
      method: "POST",
      body: { characterId: s.id, expression, operationId: op() },
    });
  const show = (section: string) =>
    tab === "summary"
      ? [
          "identity",
          "attributes",
          "resources",
          "skills",
          "inventory",
          "equipment",
          "conditions",
          "injuries",
          "policy",
        ].includes(section)
      : tab === "attributes"
        ? ["attributes", "resources"].includes(section)
        : tab === "conditions"
          ? ["conditions", "injuries", "policy"].includes(section)
          : tab === section;
  return (
    <div className="character-sheet">
      <Link className="back-link" to="/">
        <ArrowLeft size={15} />
        Seus personagens
      </Link>
      <header className="sheet-heading">
        <div>
          <span className="eyebrow">
            SISTEMA HÍBRIDO 2.6 · ARQUIVO DE PERSONAGEM
          </span>
          <h1>
            <em>Ficha</em> de personagem
          </h1>
          <p>
            {s.name}
            <span className="tag">
              {s.status === "DRAFT"
                ? "Rascunho"
                : s.status === "PENDING_APPROVAL"
                  ? "Aguardando aprovação"
                  : s.status === "APPROVED"
                    ? "Aprovada"
                    : "Arquivada"}
            </span>
          </p>
        </div>
        <div className="sheet-heading-actions">
          <SaveStatus state={saveState} />
          {s.status === "DRAFT" && (
            <button
              className="button primary"
              disabled={
                busy ||
                saveState === "saving" ||
                saveState === "dirty" ||
                saveState === "error" ||
                saveState === "conflict"
              }
              onClick={() => setAskSubmit(true)}
            >
              <ShieldCheck size={16} />
              Finalizar criação
            </button>
          )}
          {s.status === "PENDING_APPROVAL" && (
            <button
              className="button secondary"
              disabled={busy}
              onClick={() => act("/reopen", { version: s.version }, "POST")}
            >
              Reabrir rascunho
            </button>
          )}
        </div>
      </header>
      <div
        className="sheet-quick-resources"
        aria-label="Recursos de acesso rápido"
      >
        {s.resources.map((r) => (
          <div className={r.key.toLowerCase()} key={r.key}>
            <span>{r.key}</span>
            <strong>
              {r.current}
              <small>/{r.maximum}</small>
            </strong>
          </div>
        ))}
      </div>
      <nav className="sheet-navigation" aria-label="Seções da ficha">
        {[
          ["summary", "Resumo", FileText],
          ["attributes", "Atributos", Activity],
          ["skills", "Perícias", BookOpen],
          ["inventory", "Inventário", Backpack],
          ["equipment", "Equipamentos", Crosshair],
          ["conditions", "Condições", HeartPulse],
          ["dice", "Rolagens", Dices],
          ["history", "Histórico", History],
          ["privacy", "Privacidade e notas", ShieldCheck],
          ...(s.access.isOwner && s.status === "APPROVED"
            ? [["requests", "Solicitar alteração", FileText]]
            : []),
        ].map(([key, label, Icon]) => (
          <button
            key={key as string}
            className={tab === key ? "active" : ""}
            aria-current={tab === key ? "page" : undefined}
            onClick={() => setTab(key as string)}
          >
            <Icon size={16} />
            {label as string}
          </button>
        ))}
      </nav>
      <ErrorBox error={query.error} />
      {busy && (
        <div className="sheet-notice" role="status">
          <Clock size={16} />
          Salvando operação no servidor…
        </div>
      )}
      <ErrorBox error={mutation.error} />
      {mutation.error && (
        <div className="sheet-recovery">
          <p>
            Esta operação não foi confirmada na interface. Repetir a mesma
            operação não duplica seus efeitos.
          </p>
          <button
            className="button secondary"
            disabled={busy}
            onClick={() =>
              mutation.variables && mutation.mutate(mutation.variables)
            }
          >
            Tentar novamente a operação
          </button>
          <button
            className="button secondary"
            onClick={() => {
              refresh();
              mutation.reset();
            }}
          >
            Atualizar dados do servidor
          </button>
        </div>
      )}
      {notice && (
        <div className="sheet-notice" role="status">
          <Check size={16} />
          {notice}
        </div>
      )}
      {askSubmit && (
        <div
          className="sheet-confirm"
          role="dialog"
          aria-label="Finalizar criação"
        >
          <h2>Enviar para revisão?</h2>
          <p>
            É necessário distribuir oito pontos, escolher quatro perícias e
            resolver excesso de carga. A ficha ficará aguardando aprovação; a
            aprovação definitiva será integrada ao painel do mestre na Parte 3.
          </p>
          <div className="form-buttons">
            <button
              className="button primary"
              disabled={busy}
              onClick={() => {
                act("/submit", { version: s.version }, "POST");
                setAskSubmit(false);
              }}
            >
              Validar e enviar
            </button>
            <button
              className="button secondary"
              onClick={() => setAskSubmit(false)}
            >
              Continuar editando
            </button>
          </div>
        </div>
      )}
      {tab === "privacy" && <PrivacyPanel sheet={s} act={act} busy={busy} />}
      {tab === "requests" && s.access.isOwner && s.status === "APPROVED" && (
        <ChangeRequestPanel sheet={s} act={act} busy={busy} />
      )}
      <div className="sheet-grid" data-tab={tab}>
        <div
          className={
            "sheet-section section-identity " +
            (show("identity") ? "visible" : "")
          }
        >
          <Panel title="Identificação" icon={<FileText size={20} />}>
            <Identification
              sheet={s}
              actorId={user.id}
              onState={setSaveState}
              onSaved={() => {
                qc.invalidateQueries({ queryKey: ["sheet", id] });
                qc.invalidateQueries({ queryKey: ["characters"] });
                qc.invalidateQueries({ queryKey: ["sheet-history", id] });
              }}
              onRefetch={() => query.refetch()}
            />
          </Panel>
        </div>
        <div
          className={
            "sheet-section section-attributes " +
            (show("attributes") ? "visible" : "")
          }
        >
          <Panel title="Atributos" icon={<Activity size={22} />}>
            <Attributes sheet={s} act={act} busy={busy} />
          </Panel>
        </div>
        <div
          className={
            "sheet-section section-resources " +
            (show("resources") ? "visible" : "")
          }
        >
          <Panel title="Recursos" icon={<HeartPulse size={22} />}>
            <div className="resources-grid">
              {s.resources.map((r) => (
                <ResourceControl
                  key={r.key}
                  resource={r}
                  act={act}
                  busy={busy}
                  archived={s.status === "ARCHIVED"}
                />
              ))}
            </div>
          </Panel>
        </div>
        <div
          className={
            "sheet-section section-skills " + (show("skills") ? "visible" : "")
          }
        >
          <Panel title="Perícias" icon={<BookOpen size={22} />}>
            <Skills sheet={s} act={act} busy={busy} onRoll={roll} />
            {s.isGM && (
              <InputField label="Fadiga contextual neste teste (GM)">
                <select
                  value={contextFatigue}
                  onChange={(e) =>
                    setContextFatigue(e.target.value as typeof contextFatigue)
                  }
                >
                  <option value="DEFAULT">Usar lista da campanha</option>
                  <option value="YES">Aplicar fadiga</option>
                  <option value="NO">Não aplicar fadiga</option>
                </select>
              </InputField>
            )}
          </Panel>
        </div>
        <div
          className={
            "sheet-section section-inventory " +
            (show("inventory") ? "visible" : "")
          }
        >
          <Panel title="Inventário" icon={<Backpack size={22} />}>
            <InventoryTable sheet={s} act={act} busy={busy} />
          </Panel>
        </div>
        <div
          className={
            "sheet-section section-equipment " +
            (show("equipment") ? "visible" : "")
          }
        >
          <Panel title="Armas e equipamentos" icon={<Crosshair size={22} />}>
            <InventoryTable sheet={s} act={act} busy={busy} equipmentOnly />
          </Panel>
        </div>
        <div
          className={
            "sheet-section section-conditions " +
            (show("conditions") ? "visible" : "")
          }
        >
          <Panel title="Condições" icon={<HeartPulse size={22} />}>
            <ConditionTracker sheet={s} act={act} busy={busy} />
          </Panel>
        </div>
        <div
          className={
            "sheet-section section-injuries " +
            (show("injuries") ? "visible" : "")
          }
        >
          <Panel title="Ferimentos graves" icon={<Activity size={22} />}>
            <Injuries sheet={s} act={act} busy={busy} />
          </Panel>
        </div>
        <div
          className={
            "sheet-section section-policy " + (show("policy") ? "visible" : "")
          }
        >
          <FatiguePolicy sheet={s} act={act} busy={busy} />
        </div>
        <div
          className={
            "sheet-section section-dice " + (show("dice") ? "visible" : "")
          }
        >
          <Panel title="Rolagens" icon={<Dices size={22} />}>
            <ErrorBox error={rolls.error} />
            <DicePanel
              sheet={s}
              act={act}
              busy={busy}
              rolls={rolls.data?.rolls ?? []}
              onGeneric={generic}
            />
          </Panel>
        </div>
        <div
          className={
            "sheet-section section-history " +
            (show("history") ? "visible" : "")
          }
        >
          <Panel title="Histórico" icon={<History size={22} />}>
            {tab === "history" && <HistoryPanel id={s.id} />}
          </Panel>
        </div>
      </div>
    </div>
  );
}
