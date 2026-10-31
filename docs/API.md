# API REST v0.4

Base `/api`. JSON; campos desconhecidos são recusados. Sessão por cookie; nunca bearer em localStorage. Mutações exigem `Origin: APP_ORIGIN` e `X-CSRF-Token`, obtido por GET `/auth/csrf` na mesma sessão de cookies. Erros: `{error:{code,message,fields?,requestId?}}`. Sem detalhes SQL ou credenciais.

| Método e rota | Autorização | Entrada / saída |
|---|---|---|
| GET /health | Pública | Liveness; não prova acesso ao banco |
| GET /ready | Pública | Readiness SELECT 1; 503 se banco falhar |
| GET /auth/csrf | Pública | `{csrfToken}`, cookie de segurança |
| POST /auth/register | Pública + CSRF | username, password, confirmPassword, characterName?, inviteCode? → user público, recoveryCodes uma vez |
| POST /auth/login | Pública + CSRF | username, password → user público e cookie rotacionado |
| POST /auth/logout | CSRF | Revoga sessão atual, idempotente, 204 |
| POST /auth/recover | Pública + CSRF | username, recoveryCode, password, confirmPassword → mensagem; invalida todas as sessões |
| GET /auth/me | Sessão ativa | id, username, role, canCreateCampaigns |
| GET /characters | Sessão | Até 100 fichas próprias não arquivadas; paginação futura |
| POST /characters | Sessão + CSRF | name → ficha rascunho versão 1 |
| GET /characters/:id | Proprietário | Projeção de identificação, regras e versão |
| PATCH /characters/:id | Proprietário + CSRF | name, concept, version → nova versão; 409 em conflito |
| GET /campaigns | Sessão | Vínculos ACTIVE/PENDING da conta; metadados sem segredos |
| GET /admin/gm-invites | ADMIN | Metadados dos últimos 50 convites; sem hash/código |
| POST /admin/gm-invites | ADMIN + CSRF | expiresInHours entre 1 e 168 → code uma vez, id e expiresAt |
| DELETE /admin/gm-invites/:id | ADMIN + CSRF | Revoga convite não utilizado, 204; 409 se indisponível |

Ficha pública nesta etapa: id, name, concept, status, rulesVersion, version, updatedAt, campaignId. Erro 404 para ficha inexistente ou de terceiro. Papel ADMIN não elimina a regra de propriedade. Vínculos de campanha e compartilhamento são expostos pelas rotas da Parte 3 abaixo.

Status principais: 201 criado; 204 concluído sem body; 400 validação/código inválido; 401 sem sessão/credencial incorreta; 403 CSRF ou papel insuficiente; 404 registro não visível; 409 unicidade/versão; 429 limite; 503 indisponibilidade. Client não repete mutações automaticamente.


## Ficha interativa — Parte 2

Todos os endpoints abaixo exigem sessão; mutações também Origin/CSRF. Proprietário ou GM com vínculo ativo na campanha da ficha podem consultar/operar os campos autorizados. ADMIN sem vínculo não recebe acesso universal. Mecânica protegida em PENDING_APPROVAL/APPROVED para jogador; GM responsável pode corrigir com reason; ficha ARCHIVED bloqueia escrita. Campanha ARCHIVED bloqueia gestão e edição GM de terceiros. Identidade vem da sessão; ownerId/role/resultados oficiais não são aceitos no payload.

Mutações recebem operationId UUID. Dados iguais com mesmo UUID/caminho/ator retornam o resultado anterior; reutilização diferente gera 409 OPERATION_REUSED. version é do domínio em questão, não necessariamente Character.version. Rotas legadas de identificação continuam disponíveis com versão global e também atualizam identityVersion.

| Método/rota | Contrato resumido |
|---|---|
| GET /characters/:id/sheet | SheetDetails: identificação, versões, atributos, recursos atuais/máximos, 21 perícias com alvo base/penalidade/final, inventário/carga, condições, ferimentos e capacidade de retrato |
| PATCH /characters/:id/identity | version=identityVersion, nome/conceito/apelido/idade/altura/peso/profissão/histórico/aparência/personalidade/objetivos/notas; nulos nos números opcionais |
| PATCH /characters/:id/attributes | version=attributesVersion e attributes {AGI,FOR,INT,PRE,VIG}; recalcula máximos e limita atuais se necessário; reason em mecânica protegida |
| PATCH /characters/:id/skills | version=skillsVersion e trained [skill_key], no máximo quatro chaves distintas em rascunho; reason em mecânica protegida |
| PATCH /characters/:id/resources | version do recurso, key PV/SAN/PE, mode SET/ADJUST, value inteiro, event ADJUSTMENT/DAMAGE/SINGLE_ATTACK/HEALING |
| POST /characters/:id/inventory | name, quantity, slotsPerUnit, description, notes, equipment, type, damage; sem versão inicial |
| PATCH /characters/:id/inventory/:itemId | Campos completos do item e sua version |
| DELETE /characters/:id/inventory/:itemId | version do item; exclusão auditada |
| PATCH /characters/:id/conditions | version das condições e fatigue e/ou bleeding |
| PATCH /characters/:id/critical | version das condições e action SUCCESS/FAILURE/START/RESET |
| POST /characters/:id/injuries | description, location, consequences, status ACTIVE/TREATED/RESOLVED |
| PATCH /characters/:id/injuries/:injuryId | Campos do ferimento e version |
| POST /characters/:id/submit | version global; valida e passa para PENDING_APPROVAL, não aprova |
| POST /characters/:id/reopen | version global; PENDING_APPROVAL → DRAFT |
| PATCH /characters/:id/fatigue-policy | Somente GM vinculado: version da campanha e physicalSkillKeys; configuração persistente |
| POST /dice/roll | characterId e expression OU skillKey; resultado/target vêm do servidor; fatigueOverride opcional exclusivo de GM vinculado |
| GET /characters/:id/rolls | Últimas 50 rolagens autorizadas, resultados, soma, baseTarget, fatiguePenalty, target, outcome, esforço e versão |
| POST /characters/:id/rolls/:rollId/effort | version da rolagem e action ACCEPT/BONUS/REQUEST_RETRY/RETRY |
| POST /characters/:id/rolls/:rollId/authorize-retry | GM: version da rolagem, category ESCAPE/RESISTANCE e reason; requer pedido de repetição |
| GET /characters/:id/history?before=N | Até 50 eventos em ordem decrescente; nextBefore para paginação |

Tamanhos/formatos completos em packages/shared/src/sheet.ts e regras em REGRAS_RPG.md. Respostas não permitem fabricar atributos derivados nem rolagens. Sem endpoint de upload até existir storage persistente configurado. GET /characters/:id é a projeção leve legada; /sheet é a representação detalhada.


## Campanhas, privacidade e gestão — Parte 3

Mutações de gestão exigem operationId UUID (legado gm-invites aceita omissão), Origin/CSRF e sessão ativa. Ator é sempre a sessão. Versão é do registro/domínio indicado. Idempotência não reapresenta códigos secretos. X-View-Context: gm habilita segredos apenas depois de comprovar vínculo GM; /manage é contexto GM explícito. /sheet informa access.redactedFields e sharing. Sem cabeçalho GM, notas e logs GM_ONLY não são enviados.

| Método/rota | Autorização e contrato |
|---|---|
| GET /settings/public | Público: registrationOpen, systemVersion, imageStorageConfigured=false |
| POST /campaigns | Conta habilitada ou ADMIN; name, description?, notices?, status?, shareSheets?; 201 com campaign; sistema fixo 2.6 |
| GET /campaigns/:id | Membro; pendente recebe só metadados/estado; ativo recebe elenco e cartões autorizados, sem gmNotes |
| GET /campaigns/:id/manage | GM ativo; informações operacionais, recursos atuais/máximos, condições, pedidos e gmNotes |
| PATCH /campaigns/:id | GM; version de campanha e campos de configuração |
| PATCH /campaigns/:id/gm-notes | GM; version de campanha e gmNotes |
| GET /campaigns/:id/invites | GM; até 100 metadados, sem hash/código |
| POST /campaigns/:id/invites | GM; expiresInHours 1..168, maxUses 1..100; 201, código mostrado uma vez |
| DELETE /campaigns/:id/invites/:inviteId | GM; version do convite; revoga |
| POST /campaign-memberships/join | Sessão; code; cria pedido PENDING/PLAYER e consome uso atomicamente |
| PATCH /campaigns/:id/members/:userId | GM; version do membro, decision ACCEPT/REJECT/REMOVE, reason; remoção preserva dados |
| GET /campaigns/:id/eligible-characters | GM; até 200 fichas vinculáveis de membros ativos, apenas identificação/versão |
| POST/DELETE /campaigns/:id/characters | Dono aceito ou GM; characterId, version global; vincula/desvincula sem excluir |
| GET /campaigns/:campaignId/characters/:characterId/shared | Participante aceito + compartilhamento de campanha e ficha; DTO PUBLIC somente leitura |
| GET /campaigns/:id/history?before=UUID | GM; até 50 logs, cursor pelo último ID |
| GET /campaigns/:id/scoped-notes | GM; até 100 notas GM_ONLY da campanha de origem, inclusive de ficha depois movida |
| GET /campaigns/:id/requests | GM; até 100 pedidos mecânicos pendentes da campanha |
| POST /characters/:id/approval | GM; version global, decision APPROVE/CORRECTION, comment |
| GET /characters/:id/change-requests | Dono/GM; até 50 solicitações e comentários |
| POST /characters/:id/change-requests | Dono APPROVED; version de atributos/treinos, reason, change discriminado {kind:ATTRIBUTES,attributes} ou {kind:SKILLS,trained} |
| POST /characters/:id/change-requests/:requestId/review | GM; version da solicitação, decision APPROVE/REJECT, comment; aprovação verifica baseVersion e aplica em transação |
| PATCH /characters/:id/sharing | Somente dono; version=sharingVersion, sharingEnabled, publicFields; notas pessoais nunca públicas |
| GET /characters/:id/notes | Dono/GM; PUBLIC e PRIVATE do dono; GM_ONLY só no contexto GM e campanha de origem |
| POST /characters/:id/notes | title, body, visibility PUBLIC/PRIVATE/GM_ONLY; classe autorizada conforme ator |
| PATCH /characters/:id/notes/:noteId | title, body, visibility imutável e version da nota |
| DELETE /characters/:id/notes/:noteId | version da nota; autorização também por classe e escopo |
| GET /notifications | Até 50 notificações próprias e contagem unread |
| PATCH /notifications/:id | JSON vazio; marca notificação própria lida; 204 |

## Administração

Todas as rotas /admin exigem ADMIN ativo. GET não devolve hashes/sessões/códigos. Reautenticação retorna token de uso único para header X-Admin-Authorization, válido 5 minutos e vinculado à sessão. Nenhum token sensível em localStorage. Novos ADMIN e alterações de conta administrativa exigem autorização strong (senha + recoveryCode).

| Método/rota | Entrada/saída |
|---|---|
| GET /admin/users?q=texto | Até 100 contas; id, login, papel, habilitação, disabledAt, version, datas |
| POST /admin/reauth | password, recoveryCode? → token, strong, expiresInSeconds; limite 10/15min/IP |
| PATCH /admin/users/:userId/account | version de usuário, disabled, reason + autorização; revoga sessões ao desativar |
| PATCH /admin/users/:userId/privileges | version, canCreateCampaigns, reason + autorização |
| PATCH /admin/users/:userId/role | version, role ADMIN/PLAYER, confirmation=login destino, reason + autorização strong; revoga sessões |
| GET /admin/campaigns | Até 100 metadados com contagens; sem narrativas |
| PATCH /admin/campaigns/:id | version de campanha, status, reason + autorização |
| GET /admin/campaigns/:id/members | Metadados de papéis; sem fichas/notas |
| PATCH /admin/campaigns/:id/members/:userId/role | version de membro, role GM/PLAYER, reason + autorização; protege último GM |
| GET /admin/audit | Últimos 100 logs administrativos, sem conteúdo narrativo |
| GET /admin/settings | Flags globais, versão/datas; sem segredos do ambiente |
| PATCH /admin/settings | version, registrationOpen, campaignCreationEnabled, reason + autorização |

Convites privilegiados preservam as rotas anteriores e respostas 201/204. Não há criação pública de ADMIN, exclusão física nem endpoint de upload. Gestão usa limites de listagem; pesquisa por usuário e cursor de histórico estão disponíveis, paginação completa permanece futura. Contratos completos: packages/shared/src/campaigns.ts.

## Modo Sessão — Parte 4

As rotas abaixo exigem sessão de autenticação válida e membro ACTIVE na campanha. ADMIN não é bypass. Contexto de mestre: X-View-Context: gm nas rotas REST; query context=gm no SSE, sempre conferindo função GM. Mutações exigem Origin/CSRF, operationId UUID, versão conforme domínio e autorização revalidada antes de replay idempotente. O contexto da URL não concede papel.

| Método/rota | Contrato resumido |
|---|---|
| GET /campaigns/:campaignId/sessions | Últimas 100 sessões, metadados públicos e isGM do vínculo |
| POST /campaigns/:campaignId/sessions | GM; title, scheduledAt ISO/null, privateRollsToGM; 201 com session SCHEDULED |
| GET /sessions/:sessionId | Metadados, GM/contexto, participação própria, elenco/presença e projeções de recursos autorizadas; sem snapshot bruto |
| POST /sessions/:id/start | GM; version da sessão, reason público; SCHEDULED→ACTIVE |
| POST /sessions/:id/pause | GM; version, reason; ACTIVE→PAUSED |
| POST /sessions/:id/resume | GM; version, reason; PAUSED→ACTIVE |
| POST /sessions/:id/finish | GM; version, reason; ACTIVE/PAUSED→FINISHED com retrato final |
| POST /sessions/:id/cancel | GM; version, reason; SCHEDULED→CANCELLED |
| POST /sessions/:id/join | ACTIVE; characterId próprio/vinculado; GM pode enviar null |
| POST /sessions/:id/heartbeat | clientId UUID e away boolean; não recebe operationId; exige participante; data do servidor |
| GET /sessions/:id/characters | Fichas próprias vinculadas ou elenco operacional do GM em contexto explícito |
| GET /sessions/:id/characters/:characterId/sheet | Dono/GM autorizado; SheetDetails da ficha vinculada, com campos privados filtrados |
| GET /sessions/:id/events?before=UUID&category=... | Até 50 eventos visíveis desc; nextBefore, nextAfter; category MECHANICAL/NARRATIVE/ADMINISTRATIVE |
| GET /sessions/:id/events?after=UUID | Até 50 eventos visíveis após cursor, asc; before e after são mutuamente exclusivos |
| POST /sessions/:id/events | title, body, visibility PUBLIC/PRIVATE/GM_ONLY; cria evento narrativo, não mecânico arbitrário |
| GET /sessions/:id/rolls?filter=ALL&before=UUID | Até 50 rolagens visíveis, nextBefore; filtros ALL/MINE/SKILL/DAMAGE/GM |
| POST /sessions/:id/rolls | ACTIVE; characterId ou null GM, expression OU skillKey, visibility PUBLIC/PRIVATE/GM_ONLY/GM_SHARED, category GENERAL/DAMAGE; contextModifier/fatigueOverride/modifierReason só GM autorizado |
| POST /sessions/:id/rolls/:rollId/effort | version de rolagem, action ACCEPT/BONUS/REQUEST_RETRY/RETRY; somente autor; regra PE reutilizada |
| POST /sessions/:id/rolls/:rollId/authorize-retry | GM explícito; version, category ESCAPE/RESISTANCE, reason |
| PATCH /sessions/:id/resources | characterId + contrato de recurso da ficha; version do recurso; anterior calculado no servidor |
| PATCH /sessions/:id/conditions | characterId + version da condição + fatigue/bleeding |
| PATCH /sessions/:id/critical | characterId + version + action da ficha |
| POST /sessions/:id/injuries | characterId + contrato de criação de ferimento |
| PATCH /sessions/:id/injuries/:injuryId | characterId + contrato/versão de ferimento |
| POST /sessions/:id/inventory | characterId + contrato de criação de item |
| PATCH /sessions/:id/inventory/:itemId | characterId + contrato completo/versão de item |
| DELETE /sessions/:id/inventory/:itemId | characterId, version do item |
| POST /sessions/:id/inventory/:itemId/use | characterId, version do item, quantity positiva, kind USE/DISCARD; reduz somente quantidade informada |
| GET /sessions/:id/notes | Até 200 notas autorizadas; sem total oculto |
| POST /sessions/:id/notes | title, body, visibility; PRIVATE só autor, GM_ONLY só GM explícito |
| PATCH /sessions/:id/notes/:noteId | title, body, visibility imutável e version da nota |
| DELETE /sessions/:id/notes/:noteId | version da nota; respeita autoria e classe |
| GET /sessions/:id/summary | Somente FINISHED; retrato/contagens/rolagens/notas autorizados, limites explícitos |
| PATCH /sessions/:id/summary | GM; version da sessão e narrativeSummary público escrito manualmente |
| GET /sessions/:id/stream?context=player&after=UUID | text/event-stream, cookie HttpOnly, Last-Event-ID aceito; payload change {eventId,type} já autorizado |
| PATCH /sessions/:id/transfer-settings | GM; version da campanha, enabled, approvalMode RECIPIENT/RECIPIENT_OR_GM, reason |
| GET /sessions/:id/transfers | Até 100 propostas visíveis a remetente/destinatário/GM; enabled da configuração |
| POST /sessions/:id/transfers | Opt-in da campanha; itemId, destinationCharacterId, quantity, version do item; não movimenta ainda |
| POST /sessions/:id/transfers/:transferId/review | Destinatário ou GM quando configurado; version da proposta, decision APPROVE/REJECT, reason |

Mecânicas exigem sessão ACTIVE e ficha presente/autorizada. Diário/acontecimentos são editáveis enquanto a sessão está aberta; encerramento conserva consulta, com exceção da narrativa manual do resumo pelo GM. Histórico/paginação filtra antes de limitar; cursores secretos retornam 409 CURSOR_INVALID. Nenhuma resposta pública inclui eventSequence ou snapshot integral. Rotas legadas de rolagem excluem registros de sessão; rotas legadas de decisão recusam sessionId incompatível.

Retentativa com o mesmo UUID não reaplica efeito. Mesmo UUID com conteúdo/rota diferentes gera 409. A criação de uma nova rolagem pode fechar a decisão anterior da mesma ficha; consultar a versão atual antes de gastar PE. Contratos completos em packages/shared/src/game.ts; detalhes e limites em MODO_SESSAO.md, ROLAGENS.md e SINCRONIZACAO.md.


## Parte 5 — ajuda, credenciais e disponibilidade

- GET /api/help: autenticação obrigatória; retorna os três guias e apenas o progresso da própria conta.
- PATCH /api/help/progress/:key: key em jogador/mestre/administrador, corpo estrito `{ "completed": true }` ou false, sessão e CSRF obrigatórios. O usuário é inferido da sessão; userId enviado no corpo é recusado. Retorno contém guideKey/completed/updatedAt, sem dados de outras contas.
- Login reconfere conta/credencial na transação; recuperação invalida sessões e a versão. Códigos reemitidos pelo operador expiram em 24 h. Os códigos offline originais conservam a política de uso único.
- AUTH_BUSY (503): dois trabalhos Argon2 em execução e oito aguardando; cliente deve aguardar antes de tentar novamente. RATE_LIMITED (429), limites por IP/conta/usuário, permanecem independentes.
- Erros Zod retornam mensagens públicas em português, sem reproduzir conteúdo sensível. Corpos acima de 128 KiB retornam 413. HTML temporário de cold start não é JSON válido de API nem confirmação de persistência.
- /api/health é liveness do processo; /api/ready é readiness com SELECT 1 no MySQL. Não retornam versão do banco, credenciais ou detalhes internos.
