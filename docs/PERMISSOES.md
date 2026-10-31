# Permissões e privacidade — Parte 3

A identidade vem da sessão MySQL. IDs, botões, cabeçalhos de contexto e papéis enviados pelo cliente não concedem privilégios. Autenticação, usuário ativo, propriedade, vínculo e papel são conferidos na API; mutações críticas repetem a conferência dentro da transação.

| Ação | Dono PLAYER/ADMIN | Colega aceito | GM ativo da campanha | ADMIN sem vínculo GM |
|---|---|---|---|---|
| Criar/editar ficha própria | Sim, respeitando estado mecânico | Só a própria | Só a própria | Só a própria |
| Ler ficha de outro participante | Via compartilhamento autorizado | PUBLIC, dupla autorização | Operacional, com campos privados filtrados | Sem bypass |
| Editar ficha alheia | Não | Não | Apenas vinculada à sua campanha | Não |
| Ler notas PRIVATE | Somente proprietário | Não | Não, salvo se também proprietário | Não |
| Ler GM_ONLY | Não automaticamente | Não | Contexto explícito GM e campanha de origem | Não automaticamente |
| Aprovar ficha/alteração | Não por propriedade | Não | Sim, com comentário e versão | Sem bypass |
| Aceitar/remover participante | Não | Não | Sim; preserva conta/fichas | Gestão de papel administrativo separada |
| Administrar contas/papéis | Não | Não | Não por ser GM | Sim, com reautenticação |

GlobalRole contém ADMIN/PLAYER. canCreateCampaigns habilita criação; não é autorização de leitura nem papel de campanha. CampaignMember.role contém GM/PLAYER; somente status ACTIVE concede acesso. Convite comum cria PENDING/PLAYER e nunca promove. ADMIN pode criar uma campanha, tornando-se GM explicitamente nesse vínculo, ou participar como PLAYER.

## Contextos e projeções

Modo jogador usa /campaigns/:id; o painel do mestre usa /campaigns/:id/gm e /manage. O editor GM tem rota própria e envia X-View-Context: gm; esse cabeçalho só habilita segredos depois de comprovar o vínculo GM no servidor. Chaves de cache e rascunhos de ficha separam os contextos. O painel administrativo recebe metadados de usuários/campanhas; não consulta fichas ou narrativas.

Compartilhamento de colegas exige shareSheets na campanha, sharingEnabled na ficha e ambos os participantes aceitos. A resposta /shared é construída por lista explícita: identificação básica, atributos/recursos/perícias, inventário sem notas privadas, condições e notas PUBLIC. Narrativas só entram se o dono marcar os campos em publicFields. personalNotes nunca entra. Não há controles de edição nessa tela; tentar escrever pela API continua negado.

PRIVATE é exclusivo do proprietário, incluindo observações pessoais e notas de itens. GM recebe identificação operacional e narrativas deliberadamente públicas; campos omitidos vêm vazios e marcados redactedFields. Reenviar vazios pelo editor GM preserva os originais; tentar escrever conteúdo privado é recusado. PUBLIC significa compartilhável com participantes autorizados, não acesso anônimo à internet.

GM_ONLY pertence à campanha de origem. Ao mover/desvincular a ficha, notas e logs reservados antigos não ficam visíveis ao GM da nova campanha. Mestres antigos consultam notas de sua campanha em /scoped-notes, sem recuperar acesso operacional à ficha removida. Visibilidade de uma nota existente é imutável: publicar conteúdo exige criar outra nota deliberadamente.

Histórico PRIVATE fica com o dono; GM_ONLY exige contexto e campanha de origem; PUBLIC exige dono ou GM autorizado. Snapshots de histórico para não proprietários também são filtrados, impedindo vazamento indireto de notas/narrativas. Colegas não recebem o histórico completo.

## Limites de confiança

Acesso direto à infraestrutura, backups ou credenciais SQL pode revelar dados; modos da interface não protegem contra o operador do banco. Não existe promessa de ausência absoluta de spoilers. Exceções mecânicas de GM exigem justificativa e ainda respeitam os limites matemáticos implementados. Novas regras fora desses limites dependem de manual e aprovação de Marcus.

Campanhas arquivadas são consultáveis por membros autorizados e bloqueiam gestão/edição GM. O proprietário conserva a própria ficha. Reativação da campanha é administrativa e auditada. Conta desativada perde sessões e acesso; remover membro desfaz vínculos de fichas sem apagar os dados.

Evidências: tests/integration/campaigns.test.ts (isolamento, segredos, mudança de campanha, concorrência e administração), testes anteriores de autorização e tests/e2e/management.spec.ts. Resultados executados em VALIDACAO.md.


## Sessões de jogo (Parte 4)

Sala exige vínculo ACTIVE na campanha, independentemente do papel global. GM controla o ciclo de vida; GM_ONLY e segredos requerem contexto explícito. Jogador realiza mecânicas com ficha própria presente; GM corrige fichas vinculadas. Remoção/desativação/logout revogam REST e fecham SSE no ciclo de revalidação. Nenhum token de autenticação é colocado na URL de stream.

Rolagem PRIVATE pode ser consultada pelo mestre quando permitido na criação da sessão; nota PRIVATE continua exclusiva do autor. Solicitar repetição compartilha explicitamente o teste com GM para análise. PUBLIC/GM_SHARED são compartilhados com membros aceitos; GM_ONLY apenas mestres autorizados no contexto próprio. Filtrar antes de paginação/contagem; sem sequência numérica pública ou totais ocultos. Rotas legadas não expõem rolagens da sala nem snapshots dos resultados secretos.

Operações e consentimento de transferência, escopo do diário/resumo e limites de cache/infraestrutura estão em MODO_SESSAO.md e ROLAGENS.md. Acesso anterior legitimamente recebido pode ter sido guardado pelo usuário; revogação não apaga cópias já vistas ou backups de infraestrutura.
