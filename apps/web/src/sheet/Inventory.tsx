import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Plus,
  Minus,
  Backpack,
  Trash2,
  Pencil,
  AlertTriangle,
  Crosshair,
} from "lucide-react";
import {
  inventoryFields,
  type SheetDetails,
  type InventoryFields,
} from "../../../../packages/shared/src/index";
import { calculateInventoryUsage } from "../../../../packages/rpg-rules/src/index";
import type { Act } from "./types";
const inventoryFormSchema = z.object(inventoryFields).strict();
import { InputField } from "./ui";
const emptyItem: InventoryFields = {
  name: "",
  quantity: 1,
  slotsPerUnit: 0,
  description: "",
  notes: "",
  equipment: false,
  type: "",
  damage: "",
};
export function InventoryTable({
  sheet,
  act,
  busy,
  equipmentOnly = false,
}: {
  sheet: SheetDetails;
  act: Act;
  busy: boolean;
  equipmentOnly?: boolean;
}) {
  const [edit, setEdit] = useState<
    SheetDetails["inventory"][number] | null | undefined
  >(undefined);
  const [remove, setRemove] = useState<
    SheetDetails["inventory"][number] | null
  >(null);
  const form = useForm<InventoryFields>({
    resolver: zodResolver(inventoryFormSchema),
    defaultValues: emptyItem,
  });
  const isEquipment = useWatch({ control: form.control, name: "equipment" });
  const items = sheet.inventory.filter((i) => !equipmentOnly || i.equipment);
  const over = sheet.inventoryUsage > sheet.inventoryCapacity;
  return (
    <>
      <div className={"inventory-capacity " + (over ? "over" : "")}>
        <span>
          Espaços utilizados{" "}
          <strong>
            {sheet.inventoryUsage} / {sheet.inventoryCapacity}
          </strong>
        </span>
        <progress
          value={Math.min(sheet.inventoryUsage, sheet.inventoryCapacity)}
          max={sheet.inventoryCapacity}
          aria-label="Ocupação do inventário"
        />
        {over && (
          <p role="alert">
            <AlertTriangle size={14} /> Excesso de carga: resolva antes de
            finalizar. Nenhum item será excluído automaticamente.
          </p>
        )}
      </div>
      <div className="inventory-list">
        {items.length ? (
          items.map((i) => (
            <article className="inventory-item" key={i.id}>
              <div className="item-icon">
                {i.equipment ? <Crosshair size={20} /> : <Backpack size={20} />}
              </div>
              <div className="item-description">
                <h3>{i.name}</h3>
                <p>
                  {i.equipment
                    ? [i.type, i.damage].filter(Boolean).join(" · ")
                    : i.description || "Item de inventário"}
                </p>
                <small>
                  {i.quantity} × {i.slotsPerUnit} ={" "}
                  {calculateInventoryUsage([i])} espaços
                </small>
              </div>
              <div className="item-quantity">
                <button
                  className="icon-button"
                  aria-label={"Diminuir quantidade de " + i.name}
                  disabled={
                    busy || i.quantity === 0 || sheet.status === "ARCHIVED"
                  }
                  onClick={() => {
                    const { id, version, ...fields } = i;
                    act("/inventory/" + id, {
                      ...fields,
                      quantity: i.quantity - 1,
                      version,
                    });
                  }}
                >
                  <Minus size={14} />
                </button>
                <span>{i.quantity}</span>
                <button
                  className="icon-button"
                  aria-label={"Aumentar quantidade de " + i.name}
                  disabled={busy || sheet.status === "ARCHIVED"}
                  onClick={() => {
                    const { id, version, ...fields } = i;
                    act("/inventory/" + id, {
                      ...fields,
                      quantity: i.quantity + 1,
                      version,
                    });
                  }}
                >
                  <Plus size={14} />
                </button>
              </div>
              <div className="item-actions">
                <button
                  className="icon-button"
                  aria-label={"Editar " + i.name}
                  disabled={busy || sheet.status === "ARCHIVED"}
                  onClick={() => {
                    setEdit(i);
                    const { id, version, ...fields } = i;
                    form.reset(fields);
                  }}
                >
                  <Pencil size={15} />
                </button>
                <button
                  className="icon-button"
                  aria-label={"Excluir " + i.name}
                  disabled={busy || sheet.status === "ARCHIVED"}
                  onClick={() => setRemove(i)}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </article>
          ))
        ) : (
          <p className="sheet-empty">
            {equipmentOnly
              ? "Nenhuma arma ou equipamento registrado."
              : "Seu inventário está vazio."}
          </p>
        )}
      </div>
      {remove && (
        <div
          className="sheet-confirm"
          role="alertdialog"
          aria-label="Confirmar exclusão de item"
        >
          <p>
            Excluir <strong>{remove.name}</strong>? A descrição e as observações
            serão removidas do inventário e preservadas apenas no histórico.
          </p>
          <button
            className="button primary"
            disabled={busy}
            onClick={async () => {
              if (
                await act(
                  "/inventory/" + remove.id,
                  { version: remove.version },
                  "DELETE",
                )
              )
                setRemove(null);
            }}
          >
            Confirmar exclusão
          </button>
          <button className="button secondary" onClick={() => setRemove(null)}>
            Cancelar
          </button>
        </div>
      )}
      {edit !== undefined && (
        <form
          className="sheet-subform"
          onSubmit={form.handleSubmit(async (fields) => {
            if (
              await act(
                "/inventory" + (edit ? "/" + edit.id : ""),
                { ...fields, ...(edit ? { version: edit.version } : {}) },
                edit ? "PATCH" : "POST",
              )
            )
              setEdit(undefined);
          })}
        >
          <h3>{edit ? "Editar item" : "Novo item"}</h3>
          <InputField
            label="Nome do item"
            error={form.formState.errors.name?.message}
          >
            <input {...form.register("name")} maxLength={100} />
          </InputField>
          <div className="two-fields">
            <InputField
              label="Quantidade"
              error={form.formState.errors.quantity?.message}
            >
              <input
                type="number"
                {...form.register("quantity", { valueAsNumber: true })}
                min={0}
                max={1000000}
              />
            </InputField>
            <InputField
              label="Espaços por unidade"
              error={form.formState.errors.slotsPerUnit?.message}
            >
              <input
                type="number"
                {...form.register("slotsPerUnit", { valueAsNumber: true })}
                min={0}
                max={999999.99}
                step=".01"
              />
            </InputField>
          </div>
          <InputField label="Descrição do item">
            <textarea
              {...form.register("description")}
              maxLength={4000}
              rows={3}
            />
          </InputField>
          <InputField label="Observações do item">
            <textarea
              {...form.register("notes")}
              readOnly={!sheet.access.isOwner}
              maxLength={4000}
              rows={2}
            />
          </InputField>
          <label className="sheet-checkbox">
            <input
              type="checkbox"
              {...form.register("equipment")}
              onChange={(e) => {
                form.setValue("equipment", e.target.checked);
                if (!e.target.checked) {
                  form.setValue("type", "");
                  form.setValue("damage", "");
                }
              }}
            />
            Mostrar também em armas e equipamentos
          </label>
          {isEquipment && (
            <div className="two-fields">
              <InputField label="Tipo do equipamento">
                <input {...form.register("type")} maxLength={100} />
              </InputField>
              <InputField label="Dano (opcional)">
                <input
                  {...form.register("damage")}
                  placeholder="Informe somente se aprovado"
                  maxLength={80}
                />
              </InputField>
            </div>
          )}
          <p className="sheet-help">
            Espaços e dano são informados pelo grupo. Nenhum custo ou dano será
            atribuído automaticamente.
          </p>
          <div className="form-buttons">
            <button className="button primary" disabled={busy}>
              Salvar item
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
      )}
      {edit === undefined && (
        <button
          className="sheet-add"
          disabled={busy || sheet.status === "ARCHIVED"}
          onClick={() => {
            setEdit(null);
            form.reset({ ...emptyItem, equipment: equipmentOnly });
          }}
        >
          <Plus size={17} />
          {equipmentOnly ? "Adicionar arma ou equipamento" : "Adicionar item"}
        </button>
      )}
      {equipmentOnly && (
        <p className="sheet-help">
          Esta é outra visualização dos mesmos itens. Os espaços são contados
          uma única vez.
        </p>
      )}
    </>
  );
}
