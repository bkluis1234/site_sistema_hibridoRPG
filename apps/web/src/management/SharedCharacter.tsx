import { useParams, Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "../api";
import type { SharedCharacter } from "../../../../packages/shared/src/index";
import {
  HorrorPanel,
  SectionHeader,
  ErrorBox,
  ManagementHeading,
  Back,
} from "./common";
import { Eye, LockKeyhole } from "lucide-react";
export function SharedCharacterView() {
  const { campaignId, id } = useParams();
  const query = useQuery({
    queryKey: ["shared-character", campaignId, id],
    queryFn: () =>
      api<{ character: SharedCharacter }>(
        "/campaigns/" + campaignId + "/characters/" + id + "/shared",
      ),
    refetchInterval: 30000,
  });
  if (query.isPending)
    return <p role="status">Carregando versão compartilhada…</p>;
  if (!query.data)
    return (
      <>
        <Back to={"/campaigns/" + campaignId} />
        <ErrorBox error={query.error} />
      </>
    );
  const c = query.data.character;
  return (
    <div className="management-page shared-character">
      <Back to={"/campaigns/" + campaignId} />
      <ManagementHeading
        eyebrow="FICHA COMPARTILHADA · SOMENTE LEITURA"
        title={c.name}
      />
      <div className="context-banner">
        <Eye size={19} />
        <span>
          Somente leitura. Esta resposta contém apenas os dados compartilhados.
        </span>
      </div>
      <HorrorPanel>
        <SectionHeader title="Identificação" />
        <p>{[c.nickname, c.profession].filter(Boolean).join(" · ")}</p>
        {Object.entries(c.narratives).map(([key, value]) => (
          <div key={key} className="shared-narrative">
            <h3>
              {{
                concept: "Conceito",
                backstory: "Histórico",
                appearance: "Aparência",
                personality: "Personalidade",
                objectives: "Objetivos",
              }[key] ?? key}
            </h3>
            <p>{value}</p>
          </div>
        ))}
      </HorrorPanel>
      <div className="shared-columns">
        <HorrorPanel>
          <SectionHeader title="Atributos e recursos" />
          <div className="shared-attributes">
            {Object.entries(c.attributes).map(([key, value]) => (
              <div key={key}>
                <span>{key}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
          <div className="mini-resources">
            {c.resources.map((r) => (
              <span className={r.key.toLowerCase()} key={r.key}>
                {r.key} {r.current}/{r.maximum}
              </span>
            ))}
          </div>
        </HorrorPanel>
        <HorrorPanel>
          <SectionHeader title="Condições" />
          <p>Fadiga: {c.conditions.fatigue}</p>
          <p>Sangramento: {c.conditions.bleeding ? "Sim" : "Não"}</p>
          <p>Estado crítico: {c.conditions.critical ? "Sim" : "Não"}</p>
        </HorrorPanel>
      </div>
      <HorrorPanel>
        <SectionHeader title="Perícias" />
        <div className="shared-skills">
          {c.skills.map((s) => (
            <div key={s.key}>
              <span>
                {s.name} · {s.attribute}
                {s.trained ? " · treinada" : ""}
              </span>
              <strong>{s.target}</strong>
            </div>
          ))}
        </div>
      </HorrorPanel>
      <HorrorPanel>
        <SectionHeader title="Inventário e equipamentos" />
        {c.inventory.map((i) => (
          <article className="shared-item" key={i.id}>
            <strong>
              {i.name} × {i.quantity}
            </strong>
            <p>{i.description}</p>
            {i.equipment && (
              <p>{[i.type, i.damage].filter(Boolean).join(" · ")}</p>
            )}
          </article>
        ))}
      </HorrorPanel>
      {c.notes.length > 0 && (
        <HorrorPanel>
          <SectionHeader title="Notas públicas" />
          {c.notes.map((n) => (
            <article key={n.id}>
              <h3>{n.title}</h3>
              <p>{n.body}</p>
            </article>
          ))}
        </HorrorPanel>
      )}
    </div>
  );
}
