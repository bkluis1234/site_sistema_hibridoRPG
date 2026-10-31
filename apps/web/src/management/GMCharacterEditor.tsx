import { useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { api } from "../api";
import { CharacterSheet } from "../sheet/CharacterSheet";
import { SheetClientProvider } from "../sheet/client";
import type { CampaignData } from "./types";
import { Back, ErrorBox } from "./common";
import { ShieldCheck } from "lucide-react";
export function GMCharacterEditor() {
  const { campaignId, id } = useParams();
  const access = useQuery({
    queryKey: ["campaign", campaignId, true],
    queryFn: () => api<CampaignData>("/campaigns/" + campaignId + "/manage"),
  });
  if (access.isPending)
    return <p role="status">Verificando vínculo de mestre…</p>;
  if (access.error || !access.data?.characters?.some((c) => c.id === id))
    return (
      <>
        <Back to={"/campaigns/" + campaignId} />
        <ErrorBox
          error={
            access.error ??
            new Error("Esta ficha não está vinculada à campanha indicada.")
          }
        />
      </>
    );
  return (
    <SheetClientProvider gm>
      <div className="context-banner">
        <ShieldCheck size={19} />
        <div>
          <strong>Editar como mestre · {access.data.campaign.name}</strong>
          <p>
            Justifique mudanças em atributos/treinamentos protegidos. Notas
            pessoais do proprietário não são enviadas.
          </p>
        </div>
      </div>
      <Back to={"/campaigns/" + campaignId + "/gm"}>Painel do mestre</Back>
      <CharacterSheet />
    </SheetClientProvider>
  );
}
