import { type ReactNode } from "react";
import { Link } from "react-router";
import {
  ArrowUpRight,
  Check,
  LoaderCircle,
  AlertCircle,
  Skull,
  Package,
  Circle,
} from "lucide-react";
import type { CharacterSummary } from "../../../packages/shared/src/index";
export function HorrorPanel({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <section className={"horror-panel " + className}>{children}</section>;
}
export function SectionHeader({
  eyebrow,
  title,
  children,
}: {
  eyebrow?: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="section-header">
      <div>
        {eyebrow && <span className="eyebrow">{eyebrow}</span>}
        <h2>{title}</h2>
      </div>
      {children}
    </div>
  );
}
export function SaveStatus({
  state,
}: {
  state: "idle" | "dirty" | "saving" | "saved" | "error" | "conflict";
}) {
  const labels = {
    idle: "Dados carregados",
    dirty: "Alterações não salvas",
    saving: "Salvando no servidor…",
    saved: "Persistência confirmada",
    error: "Falha ao salvar",
    conflict: "Conflito entre versões",
  };
  return (
    <span className={"save-status " + state} role="status">
      {state === "saving" ? (
        <LoaderCircle size={14} className="spin" />
      ) : state === "saved" ? (
        <Check size={14} />
      ) : ["error", "conflict"].includes(state) ? (
        <AlertCircle size={14} />
      ) : (
        <Circle size={10} />
      )}{" "}
      {labels[state]}
    </span>
  );
}
export function CharacterCard({ character }: { character: CharacterSummary }) {
  return (
    <Link className="character-card" to={"/characters/" + character.id}>
      <div className="character-mark">
        <Skull size={38} strokeWidth={1} />
        <span>SH / 2.6</span>
      </div>
      <div className="card-body">
        <div className="card-meta">
          <span className="tag">
            {character.status === "DRAFT"
              ? "Rascunho"
              : character.status === "APPROVED"
                ? "Aprovado"
                : "Arquivado"}
          </span>
          <span>V{character.version.toString().padStart(2, "0")}</span>
        </div>
        <h3>{character.name}</h3>
        <p>{character.concept || "Uma história ainda por escrever."}</p>
        <div className="card-footer">
          <span>
            {new Date(character.updatedAt).toLocaleDateString("pt-BR")}
          </span>
          <span>
            Abrir ficha <ArrowUpRight size={16} />
          </span>
        </div>
      </div>
    </Link>
  );
}
export function CampaignCard({ name }: { name: string }) {
  return (
    <HorrorPanel>
      <span className="eyebrow">Campanha</span>
      <h3>{name}</h3>
      <p>Vínculo registrado no servidor.</p>
    </HorrorPanel>
  );
}
export function ResourceBar({
  label,
  current,
  maximum,
}: {
  label: string;
  current: number;
  maximum: number;
}) {
  return (
    <div>
      <div className="resource-label">
        <span>{label}</span>
        <span>
          {current} / {maximum}
        </span>
      </div>
      <progress aria-label={label} max={Math.max(1, maximum)} value={current} />
    </div>
  );
}
export function AttributeCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="attribute-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
export function SkillRow({
  name,
  trained,
}: {
  name: string;
  trained: boolean;
}) {
  return (
    <div className="skill-row">
      <span>{name}</span>
      <span>{trained ? "Treinada" : "Não treinada"}</span>
    </div>
  );
}
export function InventoryTable({
  items,
}: {
  items: { id: string; name: string; quantity: number }[];
}) {
  return (
    <div className="table-scroll">
      <table>
        <caption>Inventário do personagem</caption>
        <thead>
          <tr>
            <th scope="col">Item</th>
            <th scope="col">Quantidade</th>
          </tr>
        </thead>
        <tbody>
          {items.map((i) => (
            <tr key={i.id}>
              <td>{i.name}</td>
              <td>{i.quantity}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
export function ConditionTracker({
  conditions,
}: {
  conditions: { key: string; active: boolean }[];
}) {
  return (
    <ul>
      {conditions.map((c) => (
        <li key={c.key}>
          {c.key}: {c.active ? "Ativa" : "Inativa"}
        </li>
      ))}
    </ul>
  );
}
export function EmptyState({
  title,
  children,
  action,
}: {
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <div className="empty-icon">
        <Package size={28} strokeWidth={1} />
      </div>
      <h3>{title}</h3>
      <p>{children}</p>
      {action}
    </div>
  );
}
export function ErrorBox({ error }: { error: unknown }) {
  return error ? (
    <div className="error-box" role="alert">
      <AlertCircle size={18} />
      <span>
        {error instanceof Error ? error.message : "Não foi possível concluir."}
      </span>
    </div>
  ) : null;
}
