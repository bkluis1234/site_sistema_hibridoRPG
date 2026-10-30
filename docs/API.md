# API REST v0.2

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
| GET /campaigns | Sessão | Vínculos existentes; criação/edição ainda indisponíveis |
| GET /admin/gm-invites | ADMIN | Metadados dos últimos 50 convites; sem hash/código |
| POST /admin/gm-invites | ADMIN + CSRF | expiresInHours entre 1 e 168 → code uma vez, id e expiresAt |
| DELETE /admin/gm-invites/:id | ADMIN + CSRF | Revoga convite não utilizado, 204; 409 se indisponível |

Ficha pública nesta etapa: id, name, concept, status, rulesVersion, version, updatedAt, campaignId. Erro 404 para ficha inexistente ou de terceiro. Papel ADMIN não elimina a regra de propriedade. Ative vínculos/permissões de campanha somente com a implementação da etapa 3.

Status principais: 201 criado; 204 concluído sem body; 400 validação/código inválido; 401 sem sessão/credencial incorreta; 403 CSRF ou papel insuficiente; 404 registro não visível; 409 unicidade/versão; 429 limite; 503 indisponibilidade. Client não repete mutações automaticamente.


## Ficha interativa — Parte 2

Todos os endpoints abaixo exigem sessão; mutações também Origin/CSRF. Proprietário ou GM com vínculo ativo na campanha da ficha podem consultar/operar os campos autorizados. ADMIN sem vínculo não recebe acesso universal. Mecânica protegida em PENDING_APPROVAL/APPROVED; qualquer escrita bloqueada em ARCHIVED. Identidade vem da sessão; ownerId/role/resultados oficiais não são aceitos no payload.

Mutações recebem operationId UUID. Dados iguais com mesmo UUID/caminho/ator retornam o resultado anterior; reutilização diferente gera 409 OPERATION_REUSED. version é do domínio em questão, não necessariamente Character.version. Rotas legadas de identificação continuam disponíveis com versão global e também atualizam identityVersion.

| Método/rota | Contrato resumido |
|---|---|
| GET /characters/:id/sheet | SheetDetails: identificação, versões, atributos, recursos atuais/máximos, 21 perícias com alvo base/penalidade/final, inventário/carga, condições, ferimentos e capacidade de retrato |
| PATCH /characters/:id/identity | version=identityVersion, nome/conceito/apelido/idade/altura/peso/profissão/histórico/aparência/personalidade/objetivos/notas; nulos nos números opcionais |
| PATCH /characters/:id/attributes | version=attributesVersion e attributes {AGI,FOR,INT,PRE,VIG}; recalcula máximos e limita atuais se necessário |
| PATCH /characters/:id/skills | version=skillsVersion e trained [skill_key], no máximo quatro chaves distintas |
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
