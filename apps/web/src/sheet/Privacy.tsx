import { label } from "../locale";
import { useState, useEffect } from "react";
import { Link } from "react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  noteFields,
  narrativeFields,
  type SheetDetails,
} from "../../../../packages/shared/src/index";
import {
  ATTRIBUTE_KEYS,
  SKILLS,
  validateAttributes,
  validateTrainedSkills,
} from "../../../../packages/rpg-rules/src/index";
import { Panel, InputField } from "./ui";
import { useSheetClient } from "./client";
import type { Act } from "./types";
import { LockKeyhole, FileText, Plus, ShieldCheck } from "lucide-react";
import { ErrorBox } from "../components";
const labels: Record<string, string> = {
  concept: "Conceito",
  backstory: "Histórico",
  appearance: "Aparência",
  personality: "Personalidade",
  objectives: "Objetivos",
};
const noteSchema = z.object(noteFields).strict();
type Note = {
  id: string;
  title: string;
  body: string;
  visibility: "PUBLIC" | "PRIVATE" | "GM_ONLY";
  version: number;
};
export function PrivacyPanel({
  sheet,
  act,
  busy,
}: {
  sheet: SheetDetails;
  act: Act;
  busy: boolean;
}) {
  const { api, gm } = useSheetClient();
  const qc = useQueryClient();
  const [enabled, setEnabled] = useState(sheet.sharing.enabled);
  const [fields, setFields] = useState(sheet.sharing.publicFields);
  const [editing, setEditing] = useState<Note | null | undefined>(undefined);
  const [remove, setRemove] = useState<Note | null>(null);
  const query = useQuery({
    queryKey: ["character-notes", sheet.id, gm],
    queryFn: () => api<{ notes: Note[] }>("/characters/" + sheet.id + "/notes"),
    refetchInterval: 30000,
  });
  const form = useForm<z.infer<typeof noteSchema>>({
    resolver: zodResolver(noteSchema),
    defaultValues: {
      title: "",
      body: "",
      visibility: sheet.isGM && !sheet.access.isOwner ? "GM_ONLY" : "PRIVATE",
    },
  });
  useEffect(() => {
    setEnabled(sheet.sharing.enabled);
    setFields(sheet.sharing.publicFields);
  }, [sheet.sharing.version]);
  const submitNote = async (data: z.infer<typeof noteSchema>) => {
    if (
      await act(
        "/notes" + (editing ? "/" + editing.id : ""),
        { ...data, ...(editing ? { version: editing.version } : {}) },
        editing ? "PATCH" : "POST",
      )
    ) {
      setEditing(undefined);
      qc.invalidateQueries({ queryKey: ["character-notes", sheet.id] });
    }
  };
  return (
    <div className="privacy-panel">
      {sheet.access.isOwner && (
        <Panel title="Compartilhamento" icon={<ShieldCheck size={20} />}>
          <p className="sheet-help">
            Compartilhe somente com membros aceitos da mesma campanha. A
            campanha também precisa permitir compartilhamento. Notas pessoais e
            observações de itens permanecem privadas.
          </p>
          <label className="sheet-checkbox">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
              disabled={busy || sheet.status === "ARCHIVED"}
            />
            Compartilhar minha ficha com a campanha
          </label>
          <div className="privacy-fields">
            {narrativeFields.map((key) => (
              <label className="sheet-checkbox" key={key}>
                <input
                  type="checkbox"
                  checked={fields.includes(key)}
                  onChange={(e) =>
                    setFields(
                      e.target.checked
                        ? [...fields, key]
                        : fields.filter((k) => k !== key),
                    )
                  }
                  disabled={busy || sheet.status === "ARCHIVED"}
                />
                {labels[key]} público para o grupo
              </label>
            ))}
          </div>
          <button
            className="button primary"
            disabled={busy || sheet.status === "ARCHIVED"}
            onClick={() =>
              act(
                "/sharing",
                {
                  sharingEnabled: enabled,
                  publicFields: fields,
                  version: sheet.sharing.version,
                },
                "PATCH",
              )
            }
          >
            Salvar compartilhamento
          </button>
        </Panel>
      )}
      <Panel
        title={sheet.isGM ? "Notas autorizadas · Mestre" : "Notas da ficha"}
        icon={<LockKeyhole size={20} />}
      >
        <p className="sheet-help">
          PUBLIC: compartilhamento autorizado. PRIVATE: apenas proprietário.
          GM_ONLY: mestre da campanha de origem em contexto explícito. A
          visibilidade de uma nota criada é fixa.
        </p>
        <ErrorBox error={query.error} />
        <div className="note-list">
          {query.data?.notes.map((n) => (
            <article
              className={"note " + n.visibility.toLowerCase()}
              key={n.id}
            >
              <span className="tag">{label(n.visibility)}</span>
              <h3>{n.title}</h3>
              <p>{n.body}</p>
              <div className="form-buttons">
                <button
                  className="button secondary"
                  disabled={busy || sheet.status === "ARCHIVED"}
                  onClick={() => {
                    setEditing(n);
                    form.reset({
                      title: n.title,
                      body: n.body,
                      visibility: n.visibility,
                    });
                  }}
                >
                  Editar nota
                </button>
                <button
                  className="button secondary"
                  disabled={busy || sheet.status === "ARCHIVED"}
                  onClick={() => setRemove(n)}
                >
                  Excluir nota
                </button>
              </div>
            </article>
          ))}
        </div>
        {remove && (
          <div
            className="sheet-confirm"
            role="dialog"
            aria-label="Excluir nota"
          >
            <p>
              Excluir a nota {remove.title}? O histórico será mantido na mesma
              classificação de acesso.
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
                ) {
                  setRemove(null);
                  qc.invalidateQueries({
                    queryKey: ["character-notes", sheet.id],
                  });
                }
              }}
            >
              Confirmar exclusão da nota
            </button>
            <button
              className="button secondary"
              onClick={() => setRemove(null)}
            >
              Cancelar
            </button>
          </div>
        )}
        {editing !== undefined ? (
          <form
            className="sheet-subform"
            onSubmit={form.handleSubmit(submitNote)}
          >
            <InputField
              label="Título da nota"
              error={form.formState.errors.title?.message}
            >
              <input {...form.register("title")} maxLength={100} />
            </InputField>
            <InputField
              label="Conteúdo da nota"
              error={form.formState.errors.body?.message}
            >
              <textarea {...form.register("body")} rows={6} maxLength={12000} />
            </InputField>
            <InputField label="Visibilidade da nota">
              <select
                {...form.register("visibility")}
                aria-readonly={Boolean(editing)}
                onChange={(e) =>
                  form.setValue(
                    "visibility",
                    editing
                      ? editing.visibility
                      : (e.target.value as Note["visibility"]),
                  )
                }
              >
                {sheet.access.isOwner && (
                  <option value="PRIVATE">
                    PRIVATE — somente proprietário
                  </option>
                )}
                <option value="PUBLIC">PUBLIC — grupo autorizado</option>
                {sheet.isGM && (
                  <option value="GM_ONLY">
                    GM_ONLY — mestre desta campanha
                  </option>
                )}
              </select>
            </InputField>
            <div className="form-buttons">
              <button className="button primary" disabled={busy}>
                Salvar nota
              </button>
              <button
                className="button secondary"
                type="button"
                onClick={() => setEditing(undefined)}
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
              setEditing(null);
              form.reset({
                title: "",
                body: "",
                visibility: sheet.isGM ? "GM_ONLY" : "PRIVATE",
              });
            }}
          >
            <Plus size={16} />
            Nova nota
          </button>
        )}
      </Panel>
    </div>
  );
}
type Change = {
  id: string;
  kind: string;
  reason: string;
  status: string;
  reviewComment: string | null;
  createdAt: string;
  patch: unknown;
};
export function ChangeRequestPanel({
  sheet,
  act,
  busy,
}: {
  sheet: SheetDetails;
  act: Act;
  busy: boolean;
}) {
  const { api } = useSheetClient();
  const qc = useQueryClient();
  const [kind, setKind] = useState("ATTRIBUTES");
  const [reason, setReason] = useState("");
  const [attributes, setAttributes] = useState(sheet.attributes);
  const [trained, setTrained] = useState(
    sheet.skills.filter((s) => s.trained).map((s) => s.key),
  );
  const query = useQuery({
    queryKey: ["change-requests", sheet.id],
    queryFn: () =>
      api<{ requests: Change[] }>(
        "/characters/" + sheet.id + "/change-requests",
      ),
    refetchInterval: 30000,
  });
  useEffect(() => setAttributes(sheet.attributes), [sheet.attributesVersion]);
  useEffect(
    () => setTrained(sheet.skills.filter((s) => s.trained).map((s) => s.key)),
    [sheet.skillsVersion],
  );
  const valid =
    kind === "ATTRIBUTES"
      ? validateAttributes(attributes, true).valid
      : validateTrainedSkills(trained, true).valid;
  return (
    <Panel title="Solicitações mecânicas" icon={<FileText size={20} />}>
      <p className="sheet-help">
        Uma ficha aprovada exige revisão do mestre para alterar atributos ou
        treinamentos. Ajustes de recursos/condições continuam disponíveis.
      </p>
      <form
        className="sheet-subform"
        onSubmit={async (e) => {
          e.preventDefault();
          const change =
            kind === "ATTRIBUTES" ? { kind, attributes } : { kind, trained };
          if (
            await act(
              "/change-requests",
              {
                change,
                reason,
                version:
                  kind === "ATTRIBUTES"
                    ? sheet.attributesVersion
                    : sheet.skillsVersion,
              },
              "POST",
            )
          ) {
            setReason("");
            qc.invalidateQueries({ queryKey: ["change-requests", sheet.id] });
          }
        }}
      >
        <InputField label="Tipo de alteração">
          <select value={kind} onChange={(e) => setKind(e.target.value)}>
            <option value="ATTRIBUTES">Atributos</option>
            <option value="SKILLS">Perícias treinadas</option>
          </select>
        </InputField>
        {kind === "ATTRIBUTES" ? (
          <div className="change-attributes">
            {ATTRIBUTE_KEYS.map((key) => (
              <InputField label={key} key={key}>
                <input
                  aria-label={"Novo atributo " + key}
                  type="number"
                  min={0}
                  max={3}
                  value={attributes[key]}
                  onChange={(e) =>
                    setAttributes({
                      ...attributes,
                      [key]: Number(e.target.value),
                    })
                  }
                />
              </InputField>
            ))}
          </div>
        ) : (
          <div className="policy-options">
            {SKILLS.map(([key, name]) => (
              <label className="sheet-checkbox" key={key}>
                <input
                  type="checkbox"
                  checked={trained.includes(key)}
                  disabled={!trained.includes(key) && trained.length >= 4}
                  onChange={(e) =>
                    setTrained(
                      e.target.checked
                        ? [...trained, key]
                        : trained.filter((k) => k !== key),
                    )
                  }
                />
                {name}
              </label>
            ))}
          </div>
        )}
        <InputField label="Justificativa da alteração">
          <textarea
            aria-label="Justificativa da alteração"
            required
            minLength={5}
            maxLength={1000}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </InputField>
        <button
          className="button primary"
          disabled={busy || !valid || reason.trim().length < 5}
        >
          Enviar solicitação de alteração
        </button>
      </form>
      <ErrorBox error={query.error} />
      {query.data?.requests.map((r) => (
        <article className="request-history" key={r.id}>
          <span className="tag">{label(r.status)}</span>
          <h3>{r.kind === "ATTRIBUTES" ? "Atributos" : "Treinamentos"}</h3>
          <p>{r.reason}</p>
          {r.reviewComment && <p>Resposta do mestre: {r.reviewComment}</p>}
        </article>
      ))}
    </Panel>
  );
}
