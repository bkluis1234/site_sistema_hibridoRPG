import { useSheetClient } from "./client";
import { useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Save } from "lucide-react";
import { ApiError } from "../api";
import { ErrorBox } from "../components";
import {
  identityFields,
  type SheetDetails,
  type IdentityFields,
} from "../../../../packages/shared/src/index";
const identityFormSchema = z.object(identityFields).strict();
const draftMemory = new Map<
  string,
  { values: IdentityFields; version: number }
>();
import { InputField, Portrait } from "./ui";
import { operationId } from "./types";
const op = operationId;
export function Identification({
  sheet,
  actorId,
  onState,
  onSaved,
  onRefetch,
}: {
  sheet: SheetDetails;
  actorId: string;
  onState: (state: "dirty" | "saving" | "saved" | "error" | "conflict") => void;
  onSaved: () => void;
  onRefetch: () => Promise<unknown>;
}) {
  const { api, gm } = useSheetClient();
  const memoryKey = actorId + ":" + sheet.id + ":" + gm;
  const cached = draftMemory.get(memoryKey);
  const version = useRef(cached?.version ?? sheet.identityVersion);
  const pending = useRef<{
    body: Record<string, unknown>;
    values: IdentityFields;
  } | null>(null);
  const form = useForm<IdentityFields>({
    resolver: zodResolver(identityFormSchema),
    defaultValues: cached?.values ?? sheet.identity,
    mode: "onChange",
  });
  const values = useWatch({ control: form.control });
  const valuesRef = useRef(form.getValues());
  valuesRef.current = form.getValues();
  const [localError, setLocalError] = useState<unknown>(null);
  const [changed, setChanged] = useState(Boolean(cached));
  const base = useRef(
    JSON.stringify(cached ? sheet.identity : form.getValues()),
  );
  const mutation = useMutation({
    mutationFn: (payload: {
      body: Record<string, unknown>;
      values: IdentityFields;
    }) =>
      api<{ identityVersion: number }>(
        "/characters/" + sheet.id + "/identity",
        { method: "PATCH", body: JSON.stringify(payload.body) },
      ),
    onMutate: () => onState("saving"),
    onSuccess: (response, payload) => {
      version.current = response.identityVersion;
      base.current = JSON.stringify(payload.values);
      pending.current = null;
      setLocalError(null);
      const current = form.getValues();
      const stillChanged = JSON.stringify(current) !== base.current;
      setChanged(stillChanged);
      if (!stillChanged) {
        form.reset(payload.values);
        draftMemory.delete(memoryKey);
        onState("saved");
      } else {
        draftMemory.set(memoryKey, {
          values: current,
          version: version.current,
        });
        onState("dirty");
      }
      onSaved();
    },
    onError: (error) => {
      setLocalError(error);
      onState(
        error instanceof ApiError && error.status === 409
          ? "conflict"
          : "error",
      );
    },
  });
  const save = () => {
    if (mutation.isPending || sheet.status === "ARCHIVED") return;
    const parsed = identityFormSchema.safeParse(form.getValues());
    if (!parsed.success) {
      form.trigger();
      return;
    }
    const payload = {
      values: parsed.data,
      body: { ...parsed.data, version: version.current, operationId: op() },
    };
    pending.current = payload;
    mutation.mutate(payload);
  };
  useEffect(() => {
    const current = form.getValues();
    const dirty = JSON.stringify(current) !== base.current;
    setChanged(dirty);
    if (dirty) {
      draftMemory.set(memoryKey, { values: current, version: version.current });
      if (!mutation.isPending && !localError) onState("dirty");
    }
    if (
      !dirty ||
      mutation.isPending ||
      localError ||
      sheet.status === "ARCHIVED"
    )
      return;
    const timer = window.setTimeout(save, 850);
    return () => window.clearTimeout(timer);
  }, [values, mutation.isPending, localError]);
  useEffect(() => {
    if (
      sheet.identityVersion !== version.current &&
      !changed &&
      !mutation.isPending
    ) {
      version.current = sheet.identityVersion;
      base.current = JSON.stringify(sheet.identity);
      form.reset(sheet.identity);
    }
  }, [sheet.identityVersion]);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (changed || mutation.isPending) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [changed, mutation.isPending]);
  const conflict = localError instanceof ApiError && localError.status === 409;
  return (
    <div className="identity-and-portrait">
      <form
        onSubmit={form.handleSubmit(() => save())}
        className="identity-form"
      >
        <fieldset disabled={sheet.status === "ARCHIVED"}>
          {sheet.access.redactedFields.length > 0 && (
            <p className="sheet-help">
              Campos privados do proprietário não foram enviados; aparecem
              vazios e não podem ser alterados neste contexto.
            </p>
          )}
          <div className="identity-grid">
            <InputField
              label="Nome do personagem"
              error={form.formState.errors.name?.message}
            >
              <input {...form.register("name")} maxLength={80} />
            </InputField>
            <InputField label="Apelido">
              <input {...form.register("nickname")} maxLength={80} />
            </InputField>
            <InputField
              label="Idade"
              error={form.formState.errors.age?.message}
            >
              <input
                type="number"
                {...form.register("age", {
                  setValueAs: (v) =>
                    v === "" || v === null || v === undefined
                      ? null
                      : Number(v),
                })}
                min={0}
                max={200}
              />
            </InputField>
            <InputField
              label="Altura (m)"
              error={form.formState.errors.height?.message}
            >
              <input
                type="number"
                {...form.register("height", {
                  setValueAs: (v) =>
                    v === "" || v === null || v === undefined
                      ? null
                      : Number(v),
                })}
                min={0.1}
                max={4}
                step=".01"
              />
            </InputField>
            <InputField
              label="Peso (kg)"
              error={form.formState.errors.weight?.message}
            >
              <input
                type="number"
                {...form.register("weight", {
                  setValueAs: (v) =>
                    v === "" || v === null || v === undefined
                      ? null
                      : Number(v),
                })}
                min={0.1}
                max={1500}
                step=".01"
              />
            </InputField>
            <InputField label="Profissão">
              <input {...form.register("profession")} maxLength={160} />
            </InputField>
          </div>
          <InputField
            label="Conceito e história"
            error={form.formState.errors.concept?.message}
          >
            <textarea
              {...form.register("concept")}
              readOnly={sheet.access.redactedFields.includes("concept")}
              rows={3}
              maxLength={2000}
            />
          </InputField>
          <details className="narrative-details">
            <summary>Histórico, aparência e outros detalhes</summary>
            <div className="narrative-grid">
              {(
                [
                  ["backstory", "Histórico"],
                  ["appearance", "Aparência"],
                  ["personality", "Personalidade"],
                  ["objectives", "Objetivos"],
                  ["personalNotes", "Observações pessoais"],
                ] as const
              ).map(([key, label]) => (
                <InputField
                  key={key}
                  label={label}
                  error={form.formState.errors[key]?.message}
                >
                  <textarea
                    {...form.register(key)}
                    readOnly={sheet.access.redactedFields.includes(key)}
                    rows={4}
                    maxLength={key === "backstory" ? 12000 : 4000}
                  />
                </InputField>
              ))}
            </div>
          </details>
        </fieldset>
        <ErrorBox error={localError} />
        {Boolean(localError) && (
          <div className="sheet-recovery">
            <p>
              O rascunho permanece em memória nesta sessão. Copie o texto antes
              de descartar alterações.
            </p>
            {conflict && (
              <textarea
                aria-label="Cópia das alterações locais"
                readOnly
                value={JSON.stringify(form.getValues(), null, 2)}
                rows={5}
              />
            )}
            <button
              className="button secondary"
              type="button"
              onClick={() => {
                if (!conflict && pending.current)
                  mutation.mutate(pending.current);
                else {
                  setLocalError(null);
                  mutation.reset();
                  save();
                }
              }}
              disabled={mutation.isPending || conflict}
            >
              Tentar novamente
            </button>
            {conflict && (
              <button
                type="button"
                className="button secondary"
                onClick={async () => {
                  const result = await api<{ sheet: SheetDetails }>(
                    "/characters/" + sheet.id + "/sheet",
                  ).catch((error) => {
                    setLocalError(error);
                    return null;
                  });
                  if (!result) return;
                  version.current = result.sheet.identityVersion;
                  base.current = JSON.stringify(result.sheet.identity);
                  form.reset(result.sheet.identity);
                  draftMemory.delete(memoryKey);
                  setChanged(false);
                  setLocalError(null);
                  mutation.reset();
                  onState("saved");
                  await onRefetch();
                }}
              >
                Carregar versão do servidor
              </button>
            )}
          </div>
        )}
        <div className="identity-save">
          <p className="sheet-help">
            Salvamento automático após uma pausa na digitação.
          </p>
          <button
            className="button secondary"
            disabled={
              mutation.isPending ||
              !changed ||
              conflict ||
              sheet.status === "ARCHIVED"
            }
          >
            <Save size={15} />
            {mutation.isPending ? "Salvando…" : "Salvar alterações"}
          </button>
        </div>
      </form>
      <Portrait settings={sheet.portrait} />
    </div>
  );
}
