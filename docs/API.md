# API REST v0.1

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
