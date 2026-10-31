import { useState } from "react";
import { Link, useNavigate, useOutletContext } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Users, KeyRound, ArrowRight } from "lucide-react";
import { api } from "../api";
import {
  campaignCreateSchema,
  type CampaignSummary,
  type PublicUser,
} from "../../../../packages/shared/src/index";
import {
  HorrorPanel,
  SectionHeader,
  ErrorBox,
  ManagementHeading,
  Feedback,
  useManage,
  statusLabel,
} from "./common";
export function CampaignsPage() {
  const { user } = useOutletContext<{ user: PublicUser }>();
  const navigate = useNavigate();
  const [create, setCreate] = useState(false);
  const [code, setCode] = useState("");
  const query = useQuery({
    queryKey: ["campaigns"],
    queryFn: () => api<{ campaigns: CampaignSummary[] }>("/campaigns"),
    refetchInterval: 30000,
  });
  const mutation = useManage([["campaigns"]]);
  const form = useForm({
    resolver: zodResolver(campaignCreateSchema.omit({ operationId: true })),
    defaultValues: {
      name: "",
      description: "",
      notices: "",
      status: "ACTIVE" as const,
      shareSheets: false,
    },
  });
  return (
    <div className="management-page">
      <ManagementHeading eyebrow="HISTÓRIAS COMPARTILHADAS" title="Campanhas">
        {(user.canCreateCampaigns || user.role === "ADMIN") && (
          <button className="button primary" onClick={() => setCreate(!create)}>
            <Plus size={16} />
            {create ? "Fechar criação" : "Criar campanha"}
          </button>
        )}
      </ManagementHeading>
      <HorrorPanel>
        <SectionHeader title="Ingressar no grupo" />
        <form
          className="join-form"
          onSubmit={async (e) => {
            e.preventDefault();
            const result = await mutation.act("/campaign-memberships/join", {
              code,
            });
            if (result) {
              setCode("");
              navigate("/campaigns/" + result.campaignId);
            }
          }}
        >
          <label>
            Código de convite
            <input
              aria-label="Código de convite da campanha"
              autoComplete="off"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              minLength={20}
              maxLength={128}
              required
            />
          </label>
          <button className="button secondary" disabled={mutation.isPending}>
            <KeyRound size={16} />
            Solicitar participação
          </button>
        </form>
        <p className="small muted">
          Convites de campanha criam pedidos de participação. O mestre precisa
          aceitar; eles não concedem GM ou ADMIN.
        </p>
      </HorrorPanel>
      {create && (
        <HorrorPanel>
          <SectionHeader title="Nova campanha" />
          <form
            onSubmit={form.handleSubmit(async (fields) => {
              const result = await mutation.act("/campaigns", fields);
              if (result) navigate("/campaigns/" + result.campaign.id + "/gm");
            })}
          >
            <label className="field">
              <span>Nome da campanha</span>
              <input {...form.register("name")} maxLength={100} />
              {form.formState.errors.name && (
                <small role="alert">{form.formState.errors.name.message}</small>
              )}
            </label>
            <label className="field">
              <span>Descrição da campanha</span>
              <textarea
                {...form.register("description")}
                maxLength={8000}
                rows={3}
              />
            </label>
            <label className="field">
              <span>Status inicial</span>
              <select {...form.register("status")}>
                <option value="ACTIVE">Ativa</option>
                <option value="DRAFT">Rascunho</option>
                <option value="PAUSED">Pausada</option>
              </select>
            </label>
            <label className="checkbox">
              <input type="checkbox" {...form.register("shareSheets")} />
              Permitir fichas compartilhadas entre participantes
            </label>
            <p className="small muted">
              Cada jogador também escolhe compartilhar sua ficha. Sistema:
              Híbrido 2.6. Imagens aguardam storage persistente.
            </p>
            <button className="button primary" disabled={mutation.isPending}>
              Criar e abrir painel do mestre
            </button>
          </form>
        </HorrorPanel>
      )}
      <Feedback mutation={mutation} />
      <ErrorBox error={query.error} />
      {query.isPending ? (
        <p role="status">Carregando campanhas…</p>
      ) : (
        <div className="campaign-grid">
          {query.data?.campaigns.map((c) => (
            <Link
              key={c.id}
              className="campaign-list-card"
              to={"/campaigns/" + c.id}
            >
              <Users size={25} />
              <div>
                <span className="eyebrow">SISTEMA HÍBRIDO 2.6</span>
                <h2>{c.name}</h2>
                <p>
                  {statusLabel(c.status)} ·{" "}
                  {c.role === "GM" ? "Mestre" : "Jogador"} ·{" "}
                  {statusLabel(c.membershipStatus)}
                </p>
              </div>
              <ArrowRight size={18} />
            </Link>
          ))}
        </div>
      )}
      {query.data?.campaigns.length === 0 && (
        <p className="management-empty">
          Você ainda não participa de uma campanha.
        </p>
      )}
    </div>
  );
}
