# Requisitos — Sistema Híbrido 2.6

Escopo: fundação e ficha interativa da Parte 2. P0 = essencial à base; P1 = próxima funcionalidade; P2 = expansão. Uma entidade modelada não significa funcionalidade concluída. Resultados efetivamente executados ficam em VALIDACAO.md. Testes indicados como planejados ainda não existem.

## Funcionais

| ID | Requisito | Prioridade | Critério de aceitação | Testes correspondentes | Situação |
|---|---|---|---|---|---|
| RF-001 | Cadastro de usuários | P0 | Cadastrar login único, senha confirmada e personagem opcional numa transação; exibir 8 códigos uma vez. | Integração: RF-001/005, unicidade; E2E: cadastro | Implementado |
| RF-002 | Login por nome de usuário e senha | P0 | Credenciais corretas criam sessão; erro genérico nas incorretas; login ignora maiúsculas. | Integração: RF-002/003, enumeração; E2E: login | Implementado |
| RF-003 | Logout | P0 | Revogar sessão no MySQL e limpar cookie; cookie antigo não autentica. | Integração: RF-002/003; E2E: logout | Implementado |
| RF-004 | Recuperação de conta | P0 | Consumir código atomicamente, alterar hash e encerrar todas as sessões; reuso falha. Sem código, operador verifica identidade por contato prévio. | Integração: RF-004, código inválido; E2E: recuperação; CLI administrativa requer ensaio operacional | Parcial: recuperação pública pronta; procedimento CLI a ensaiar |
| RF-005 | Criação de personagens | P0 | Conta pode criar vários rascunhos identificados pelo proprietário e pela versão das regras. | Integração: RF-001/005, RF-005/006/007/008/018/022; E2E: rascunho | Implementado: ficha inicializada com mecânica 2.6 |
| RF-006 | Edição de personagens próprios | P0 | Proprietário edita nome/história; terceiro não edita; campos mecânicos não disponíveis são rejeitados. | Integração: persistência, isolamento, campos mecânicos; E2E: ficha | Implementado nos campos da Parte 2; aprovação mecânica na Parte 3 |
| RF-007 | Salvamento persistente | P0 | Servidor confirma transação MySQL; falhas não alteram interface para salvo. | Integração: persistência; E2E: falha de rede | Implementado: identidade e operações da ficha no MySQL |
| RF-008 | Consulta de fichas existentes | P0 | Listar fichas próprias após novo login e abrir por ID autorizado. | Integração: persistência e isolamento; E2E: recarga | Implementado: proprietário e GM vinculado em /sheet |
| RF-009 | Cálculo de recursos derivados | P1 | Aplicar fórmulas exatas do manual homologado por Marcus; resultados reproduzíveis por versão. | Unitários de regras, integração de atributos/alvos/fadiga e E2E da ficha | Implementado pelas fórmulas explícitas da Parte 2; homologação com manual pendente |
| RF-010 | Cálculo de alvos de perícias | P1 | Aplicar fórmula homologada incluindo modificadores autorizados. | Unitários de regras, integração de atributos/alvos/fadiga e E2E da ficha | Implementado: alvo base, treino e fadiga separados |
| RF-011 | Gerenciamento de inventário | P1 | Adicionar, editar e remover itens próprios com quantidade válida, autorização e versão. | Integração CRUD, versão, isolamento e E2E inventário/equipamento | Implementado: CRUD, espaços e equipamento canônico |
| RF-012 | Condições físicas | P1 | Registrar/encerrar condições e ferimentos conforme manual com auditoria. | Unitários e integração de condições/crítico/ferimentos; E2E | Implementado: ferimentos, sangramento, fadiga e crítico |
| RF-013 | Criação de campanhas | P1 | Usuário habilitado cria campanha e torna-se GM daquele vínculo. | Planejado: integração permissão global versus vínculo GM | Modelado; etapa 3 |
| RF-014 | Associação de jogadores a campanhas | P1 | Convite temporário, único e revogável associa somente a campanha autorizada. | Planejado: integração concorrência e expiração de campaign_invites | Modelado; etapa 3 |
| RF-015 | Visualização autorizada das fichas dos colegas | P1 | Somente membro com compartilhamento habilitado recebe projeção pública da ficha. | Planejado: matriz entre campanhas e teste de ausência de segredos | Pendente; acesso fechado por padrão |
| RF-016 | Edição pelo mestre responsável | P1 | Membro GM edita somente fichas vinculadas à sua campanha e registra ação. | Planejado: integração GM na campanha A versus B | API da ficha autoriza GM vinculado; descoberta/painel de campanha na Parte 3 |
| RF-017 | Permissões por papel | P0 | ADMIN global, habilitação de criação e papel GM por campanha distintos; backend rejeita escalada. | Integração: RN-008/019, convite GM, isolamento; cobertura por campanha planejada | Auth/ADMIN/proprietário e GM vinculado implementados; matriz completa da Parte 3 pendente |
| RF-018 | Registro de alterações relevantes | P0 | Criação/edição de identidade e ações de convites geram logs transacionais sem credenciais. | Integração: cadastro, persistência, concorrência; futuras ações exigem testes próprios | Implementado: histórico paginado com antes/depois nas operações da Parte 2 |
| RF-019 | Aprovação de mudanças mecânicas | P1 | Ficha aprovada não recebe alteração mecânica sem solicitação/revisão de GM autorizado; conferir versão base. | Planejado: integração aprovação/rejeição e conflito | Modelado; etapa 3 |
| RF-020 | Painel administrativo | P1 | ADMIN gerencia convites GM; gestão de contas/campanhas e consulta de logs com autorização. | Integração: convite e restrição ADMIN; E2E administrativo planejado | Parcial: convites temporários prontos |
| RF-021 | Uso em dispositivos móveis | P0 | Login/cadastro/ficha/dashboard operáveis por toque a partir de 360 px sem rolagem horizontal da página. | E2E em Pixel 7 e desktop; revisão visual e teclado | Verificado em Chromium desktop/Pixel 7; aparelhos físicos pendentes |
| RF-022 | Sincronização entre dispositivos | P0 | Leitura de novo dispositivo obtém estado MySQL; edição concorrente recebe 409. | Integração: persistência e concorrência | Implementado por consulta/refetch, sem atualização push |
| RF-023 | Indicação do salvamento | P0 | Distinguir dados carregados, alterações locais, salvando, persistido, falha e conflito. | E2E: salvamento e falha de rede; conflito visual testado em desktop/mobile | Implementado: autosave, operações imediatas e recuperação de conflito |
| RF-024 | Exportação de fichas | P2 | Exportar somente campos autorizados e preservar versão das regras. | Planejado: snapshot de exportação e autorização | Etapa 4 |
| RF-025 | Evolução das regras | P0 | Separar regras e contratos, registrar rulesVersion em cada ficha; migração explícita sem reinterpretar fichas antigas. | Unitário: manual ausente; futuros testes por versão e migração | Regras 2.6 compartilhadas; snapshots de rolagens preservados; manual completo pendente |

## Não funcionais

Nenhum RNF é declarado integralmente atendido apenas pela escolha de biblioteca. As evidências abaixo têm os limites descritos.

| ID | Requisito | Meta / critério verificável | Evidência e limites |
|---|---|---|---|
| RNF-001 | Interface responsiva mobile-first | Testar 360/393/1280 px; layout sem overflow de página e controles de toque ≥ 40 px; melhorar para 44 px onde aplicável. | Playwright desktop/Pixel 7 e inspeção visual; 360 px/teclado pendentes. |
| RNF-002 | HTTPS em produção | APP_ORIGIN deve ser HTTPS; proxy Render termina TLS, cookies Secure e HSTS. | Config e flags de cookie testáveis localmente; certificado/redirecionamento reais dependem da publicação. |
| RNF-003 | Hash apropriado | Argon2id: memória 64 MiB, 3 iterações, paralelismo 1, sal por hash. | Unitário e inspeção do registro MySQL; calibrar custo sob carga no plano Render. |
| RNF-004 | Persistência relacional | MySQL 8.4, relações, índices, unicidade e migração Prisma versionada. | Integração real MySQL, validação de schema e verificação de migração. |
| RNF-005 | Módulos organizados | Separar web/api/shared/rpg-rules; dependências unidirecionais. | Inspeção da estrutura e build TypeScript; não significa revisão arquitetural independente. |
| RNF-006 | Navegadores modernos | Chrome/Edge/Firefox/Safari atuais e duas versões anteriores como alvo. | Chromium por Playwright; Firefox/WebKit e dispositivos físicos ainda pendentes. |
| RNF-007 | Feedback visual | Operações têm pending/error/success, rótulos e estado anunciado via status/alert. | E2E fluxo e falha de rede; verificação de leitor de tela pendente. |
| RNF-008 | Validação nas duas camadas | Schemas Zod compartilhados e DTO estrito; UI usa RHF; backend rejeita campos desconhecidos. | Unitários de contratos e integração de payloads proibidos. |
| RNF-009 | Proteção contra acesso indevido | Autorização por proprietário/ADMIN no backend; negar vínculo de campanha até sua implementação. | Integração de isolamento e escalada; matriz de campanha futura. |
| RNF-010 | Falhas de rede | Preservar texto no formulário montado; não marcar como persistido se request falha; permitir tentativa explícita. | E2E com PATCH abortado; fila offline não implementada. |
| RNF-011 | Concorrência | UPDATE condicional por id + proprietário + versão; 409 quando versão ficou obsoleta; auditoria atômica. | Integração com Promise.all; UI exige recarga explícita após preservar texto. |
| RNF-012 | Evolução incremental | Etapas documentadas, regras isoladas e migrações revisáveis. | Inspeção da estrutura; capacidade futura não é garantia de compatibilidade sem testes. |
| RNF-013 | Acessibilidade | Formulários com labels, descrições/erros associados, foco visível, navegação sem mouse e redução de movimento. | Labels exercitados no E2E; auditoria WCAG AA, contraste integral e leitor de tela pendentes. |
| RNF-014 | Logs sem credenciais | Logs HTTP somente event/requestId/category; sem body, cookies, hash de senha ou códigos. | Inspeção do logger e projeções testadas; revisão de logs da infraestrutura pendente. CLI exibe segredos somente no terminal seguro intencionalmente. |
| RNF-015 | Backup/restauração | Meta inicial RPO ≤24h e RTO ≤4h; snapshots + cópia externa cifrada; restauração em ambiente isolado. | Procedimento em OPERACAO.md; nenhuma restauração de produção executada. |
| RNF-016 | Desempenho mensurável | Meta produção aquecida: p95 leitura ≤500ms, salvamento ≤800ms, login ≤2s com 20 usuários simultâneos; medir 5min na região real. | Testes funcionais não provam a meta; teste de carga/latência em staging pendente; free tier com cold start pode não atender. |
| RNF-017 | Testes de regras | Fórmulas exigem casos positivos, limites e exemplos aprovados pelo mestre por versão. | Testes de fórmulas explícitas da Parte 2 passaram; exemplos do manual homologados por Marcus ainda pendentes. |
| RNF-018 | Instalação/publicação documentadas | Pessoa no PC consegue instalar via npm ci, configurar MySQL e iniciar; Render usa MySQL externo. | README, PUBLICACAO.md e comandos de build verificados no cloud; ensaio em outro PC pendente. |
| RNF-019 | Ambientes separados | Testes exigem NODE_ENV=test e nome terminado _test; produção exige HTTPS/TLS. | Guarda executada antes de integração/E2E; produção ainda não provisionada. |
| RNF-020 | Segredos fora do código | Somente exemplos no Git; .env*, dumps, node_modules e traces ignorados. | Verificar git diff --cached e pacote de transferência antes da entrega; nenhuma credencial de produção configurada. |

## Regras de negócio

| ID | Regra | Aplicação | Situação / teste |
|---|---|---|---|
| RN-001 | Conta com identificador único | UUID e login canônico único no MySQL. | Implementado; integração unicidade. |
| RN-002 | Múltiplos personagens por conta | Relação User→Character 1:N. | Implementado; API cria sem limite singular. |
| RN-003 | Proprietário por personagem | ownerId obrigatório com FK Restrict. | Implementado; integração de isolamento. |
| RN-004 | Proprietário edita campos autorizados | DTO de identificação permite apenas nome/conceito/versão. | Implementado para etapa 1. |
| RN-005 | Jogador não modifica terceiros | Busca e UPDATE incluem ownerId da sessão. | Implementado; integração 404 para terceiros. |
| RN-006 | Mestre administra sua campanha | Exigir CampaignMember.role=GM e campaignId correspondente. | Modelado; autorização/rotas na etapa 3. |
| RN-007 | Administrador também joga | ADMIN pode usar mesmas rotas de personagens próprios; papel não elimina propriedade. | Implementado na arquitetura; ampliar cenários de campanha. |
| RN-008 | Sem privilégio administrativo público | DTO não aceita role; somente CLI cria primeiro ADMIN; bootstrapKey única. | Implementado; integração de escalada e revisão do CLI. |
| RN-009 | Atributos aprovados exigem autorização | Solicitação com baseVersion e revisão pelo GM responsável. | Mecânica de ficha aprovada bloqueada; solicitações de revisão definitiva na Parte 3. |
| RN-010 | Perícias aprovadas exigem autorização | Mesmo fluxo de solicitações, sem atualização direta do jogador. | Treinamentos protegidos em APPROVED/PENDING_APPROVAL; revisão na Parte 3. |
| RN-011 | Manual Híbrido 2.6 é fonte das fórmulas | Somente implementar fórmulas após receber manual e confirmar exemplos. | Fórmulas explícitas da Parte 2 implementadas e testadas; manual completo pendente de conferência. |
| RN-012 | Rascunhos incompletos | Criar com nome, conceito vazio e sem valores mecânicos presumidos. | Implementado; integração de cadastro. |
| RN-013 | Finalização validada mecanicamente | Transição DRAFT→APPROVED depende de validador homologado. | Submit valida mecanicamente e pede aprovação; aprovação definitiva não exposta. |
| RN-014 | Fichas alheias exigem vínculo/permissão | Compartilhamento desativado por padrão e projeções explícitas. | Acesso a terceiros bloqueado; etapa 3 habilitará o autorizado. |
| RN-015 | Segredos do mestre não enviados | Não carregar relações ou campos de bastidor em respostas públicas. | DTO explícito na etapa 1; modelo de segredos de campanha futuro. |
| RN-016 | Auditoria de alterações relevantes | Registrar alteração e log na mesma transação; não gravar credenciais no log. | Implementado nas rotas atuais; completar cobertura com novos módulos. |
| RN-017 | Conta e ficha são entidades diferentes | Users e characters com IDs independentes. | Implementado no schema e rotas. |
| RN-018 | Renomear personagem não altera login | PATCH atualiza somente Character. | Integração de persistência verifica username inalterado. |
| RN-019 | Permissões globais versus campanha | GlobalRole ADMIN/PLAYER; canCreateCampaigns habilita criação; CampaignRole GM/PLAYER define escopo. | Modelado; convite habilita criação, sem acesso irrestrito a fichas. |
| RN-020 | Regras novas preservam fichas antigas | rulesVersion persistida por ficha; novas versões exigirão implementação e migração optativa. | Campo e pacote criados; migração de regras futura ainda não implementada. |


## Requisitos adicionais — Parte 2

| ID | Requisito | Prioridade | Critério de aceitação | Teste correspondente / situação |
|---|---|---|---|---|
| RF-026 | Autosave textual | P0 | Salvar após 850 ms de pausa, preservar edição em andamento e só confirmar após servidor | E2E autosave, falha de rede e conflito; implementado |
| RF-027 | Rolagens oficiais | P0 | Expressões válidas são geradas no servidor; d20 <= alvo e 20 falha | Unitários, integração de dados e E2E; implementado |
| RF-028 | Decisão com PE | P0 | Bônus 1 PE ou repetição 2 PE autorizada por GM, nunca ambos/duplicados | Integração de PE transacional; implementado |
| RF-029 | Condição crítica | P0 | PV zero incapacita; acompanhar 3 sucessos/falhas sem curar/rolar automaticamente | Unitários, integração e E2E; implementado |
| RF-030 | Fadiga configurável | P0 | GM altera lista da campanha sem editar código; exibir base/penalidade/final | Integração de autorização/configuração e E2E; implementado para vínculo existente |
| RF-031 | Retrato | P1 | Selecionar, validar e pré-visualizar; salvar em storage externo autorizado | Prévia e contrato preparados; persistência de imagem pendente |
| RF-032 | Histórico básico | P0 | Dono/GM consultam ator, horário, ação, antes/depois e páginas anteriores | Integração e E2E; implementado |
| RF-033 | Revisão inicial | P0 | Validar oito pontos, quatro treinos e carga antes de pedir aprovação | Integração/E2E submit/reopen; aprovação definitiva na Parte 3 |
| RF-034 | Equipamento sem duplicação | P0 | Uma entrada de inventário aparece na seção de equipamento sem somar espaços duas vezes | Integração CRUD e E2E; implementado |
| RNF-021 | Idempotência | P0 | Repetir operação com mesmo UUID/payload não duplica saldo/log; payload diferente é 409 | Integração concorrente de recursos/PE; implementado no escopo testado |
| RNF-022 | Concorrência entre domínios | P0 | PV e condição independentes persistem; mesma versão de recurso conflita | Integração simultânea e E2E de autosave/recurso |
| RN-021 | Máximos não curam | P0 | Aumento de máximo preserva atual; redução limita e audita | Integração de atributos/recursos |
| RN-022 | Fadiga preserva base | P0 | Penalidade afeta alvo do teste e não altera o valor base/atributo | Unitários, integração e E2E |
| RN-023 | Repetição depende de GM real | P0 | Exigir vínculo ativo, pedido, categoria/justificativa e saldo na transação de consumo | Integração de repetição autorizada |
| RN-024 | Sem duplicar objetos | P0 | Arma/equipamento é a projeção do mesmo item canônico | Integração/E2E |
| RN-025 | Sem aprovação própria fictícia | P0 | Submit gera PENDING_APPROVAL; jogador não envia status APPROVED | Contratos estritos e integração de bloqueio mecânico |

Evidências atuais e limites de execução ficam em VALIDACAO.md. As linhas históricas da fundação permanecem para rastreabilidade; nenhuma declaração de infraestrutura de produção passa a atendida por estes acréscimos.
