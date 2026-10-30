import { useEffect, useState } from "react";
import {
  Plus,
  Minus,
  HeartPulse,
  Brain,
  ShieldCheck,
  Footprints,
  Dumbbell,
  Users,
} from "lucide-react";
import { type SheetDetails } from "../../../../packages/shared/src/index";
import {
  ATTRIBUTE_KEYS,
  ATTRIBUTE_NAMES,
  calculateAvailablePoints,
  calculateMaxima,
  validateAttributes,
} from "../../../../packages/rpg-rules/src/index";
import type { Act } from "./types";
export function AttributeCard({
  attribute,
  value,
  onChange,
  canIncrease,
  canDecrease,
  disabled,
}: {
  attribute: (typeof ATTRIBUTE_KEYS)[number];
  value: number;
  onChange: (v: number) => void;
  canIncrease: boolean;
  canDecrease: boolean;
  disabled: boolean;
}) {
  const icons = {
    AGI: Footprints,
    FOR: Dumbbell,
    INT: Brain,
    PRE: Users,
    VIG: HeartPulse,
  };
  const Icon = icons[attribute];
  return (
    <article className="sheet-attribute">
      <span>{ATTRIBUTE_NAMES[attribute]}</span>
      <h3>{attribute}</h3>
      <Icon size={29} strokeWidth={1.5} />
      <div className="attribute-value">
        <button
          type="button"
          aria-label={"Diminuir " + ATTRIBUTE_NAMES[attribute]}
          disabled={disabled || !canDecrease}
          onClick={() => onChange(value - 1)}
        >
          <Minus size={15} />
        </button>
        <strong>{value}</strong>
        <button
          type="button"
          aria-label={"Aumentar " + ATTRIBUTE_NAMES[attribute]}
          disabled={disabled || !canIncrease}
          onClick={() => onChange(value + 1)}
        >
          <Plus size={15} />
        </button>
      </div>
    </article>
  );
}
export function Attributes({
  sheet,
  act,
  busy,
}: {
  sheet: SheetDetails;
  act: Act;
  busy: boolean;
}) {
  const [values, setValues] = useState(sheet.attributes);
  useEffect(() => setValues(sheet.attributes), [sheet.attributesVersion]);
  const remaining = calculateAvailablePoints(values);
  const error = validateAttributes(values);
  const dirty = JSON.stringify(values) !== JSON.stringify(sheet.attributes);
  return (
    <>
      <div className="attribute-distribution">
        {ATTRIBUTE_KEYS.map((k) => (
          <AttributeCard
            key={k}
            attribute={k}
            value={values[k]}
            onChange={(value) => setValues({ ...values, [k]: value })}
            canIncrease={values[k] < 3 && remaining > 0}
            canDecrease={
              values[k] > 0 &&
              (values[k] > 1 ||
                !ATTRIBUTE_KEYS.some((key) => values[key] === 0))
            }
            disabled={busy || sheet.status !== "DRAFT"}
          />
        ))}
      </div>
      <div className="allocation-footer">
        <span>
          Pontos disponíveis: <strong>{remaining}</strong>
        </span>
        <button
          className="button secondary"
          onClick={() =>
            act("/attributes", {
              version: sheet.attributesVersion,
              attributes: values,
            })
          }
          disabled={busy || !dirty || !error.valid || sheet.status !== "DRAFT"}
        >
          Salvar atributos
        </button>
      </div>
      <p className="sheet-help">
        Comece em 1, distribua 3 pontos. Máximo 3; apenas um atributo pode
        chegar a 0. Soma final: 8.
      </p>
      {dirty && (
        <p className="sheet-help">
          Máximos após confirmar: PV {calculateMaxima(values).PV} · SAN{" "}
          {calculateMaxima(values).SAN} · PE {calculateMaxima(values).PE}.
          Aumentar máximos não recupera recursos.
        </p>
      )}
      {sheet.status !== "DRAFT" && (
        <p className="sheet-lock">
          <ShieldCheck size={14} /> Atributos protegidos pelo estado da ficha.
        </p>
      )}
    </>
  );
}
