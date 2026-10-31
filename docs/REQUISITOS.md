# Requisitos — Sistema Híbrido 2.6

Escopo: fundação, ficha interativa e gestão multiusuário da Parte 3. P0 = essencial à base; P1 = próxima funcionalidade; P2 = expansão. Uma entidade modelada não significa funcionalidade concluída. Resultados efetivamente executados ficam em VALIDACAO.md. Testes indicados como planejados ainda não existem.

## Funcionais

| ID | Requisito | Prioridade | Critério de aceitação | Testes correspondentes | Situação |
|---|---|---|---|---|---|
| RF-001 | Cadastro de usuários | P0 | Cadastrar login único, senha confirmada e personagem opcional numa transação; exibir 8 códigos uma vez. | Integração: RF-001/005, unicidade; E2E: cadastro | Implementado |
| RF-002 | Login por nome de usuário e senha | P0 | Credenciais corretas criam sessão; erro genérico nas incorretas; login ignora maiúsculas. | Integração: RF-002/003, enumeração; E2E: login | Implementado |
| RF-003 | Logout | P0 | Revogar sessão no MySQL e limpar cookie; cookie antigo não autentica. | Integração: RF-002/003; E2E: logout | Implementado |
| RF-004 | Recuperação de conta | P0 | Consumir código atomicamente, alterar hash e encerrar todas as sessões; reuso falha. Sem código, operador verifica identidade por contato prévio. | Integração: RF-004, código inválido; E2E: recuperação; CLI administrativa requer ensaio operacional | Parcial: recuperação pública pronta; procedimento CLI a ensaiar |
| RF-005 | Criação de personagens | P0 | Conta pode criar vários rascunhos identificados pelo proprietário e pela versão das regras. | Integração: RF-001/005, RF-005/006/007/008/018/022; E2E: rascunho | Implementado: ficha inicializada com mecânica 2.6 |
| RF-006 | Edição de personagens próprios | P0 | Proprietário edita campos autorizados, respeitando estados e versão; colega recebe negação. | Integração anterior e campaigns.test.ts: bloqueio mecânico/solicitações; E2E management | Implementado |
| RF-007 | Salvamento persistente | P0 | Servidor confirma transação MySQL; falhas não alteram interface para salvo. | Integração: persistência; E2E: falha de rede | Implementado: identidade e operações da ficha no MySQL |
| RF-008 | Consulta de fichas existentes | P0 | Listar fichas próprias após novo login e abrir por ID autorizado. | Integração: persistência e isolamento; E2E: recarga | Implementado: proprietário e GM vinculado em /sheet |
| RF-009 | Cálculo de recursos derivados | P1 | Aplicar fórmulas exatas do manual homologado por Marcus; resultados reproduzíveis por versão. | Unitários de regras, integração de atributos/alvos/fadiga e E2E da ficha | Implementado pelas fórmulas explícitas da Parte 2; homologação com manual pendente |
| RF-010 | Cálculo de alvos de perícias | P1 | Aplicar fórmula homologada incluindo modificadores autorizados. | Unitários de regras, integração de atributos/alvos/fadiga e E2E da ficha | Implementado: alvo base, treino e fadiga separados |
| RF-011 | Gerenciamento de inventário | P1 | Adicionar, editar e remover itens próprios com quantidade válida, autorização e versão. | Integração CRUD, versão, isolamento e E2E inventário/equipamento | Implementado: CRUD, espaços e equipamento canônico |
| RF-012 | Condições físicas | P1 | Registrar/encerrar condições e ferimentos conforme manual com auditoria. | Unitários e integração de condições/crítico/ferimentos; E2E | Implementado: ferimentos, sangramento, fadiga e crítico |
| RF-013 | Criação de campanhas | P1 | Conta habilitada ou ADMIN cria campanha; criador ganha vínculo GM ativo. | campaigns.test.ts: criação autorizada, escalada; E2E management | Implementado |
| RF-014 | Associação de jogadores a campanhas | P1 | Convite válido cria PENDING/PLAYER com uso atômico; só aceite permite acesso; expirado/revogado recusado. | campaigns.test.ts: convites, concorrência, remoção; E2E management | Implementado |
| RF-015 | Visualização autorizada das fichas dos colegas | P1 | Colegas aceitos recebem DTO PUBLIC somente leitura com dupla autorização; sem notas privadas. | campaigns.test.ts: dupla autorização/segredos; E2E management | Implementado |
| RF-016 | Edição pelo mestre responsável | P1 | GM ativo edita ficha vinculada; outra campanha negada; mecânica protegida exige justificativa. | campaigns.test.ts: GM, justificativa, preservação PRIVATE; E2E management | Implementado |
| RF-017 | Permissões por papel | P0 | Separar ADMIN global, habilitação de criação e GM de campanha; cliente não promove contas. | Integração anterior + campaigns.test.ts: matriz/elevação/contextos | Implementado no escopo testado |
| RF-018 | Registro de alterações relevantes | P0 | Criação/edição de identidade e ações de convites geram logs transacionais sem credenciais. | Integração: cadastro, persistência, concorrência; futuras ações exigem testes próprios | Implementado: histórico paginado com antes/depois nas operações da Parte 2 |
| RF-019 | Aprovação de mudanças mecânicas | P1 | Solicitação guarda versão mecânica; GM aprova em transação ou rejeita comentando; obsoleto retorna 409. | campaigns.test.ts: aprovação simultânea/obsoleta/rejeição; E2E management | Implementado para atributos/treinamentos |
| RF-020 | Painel administrativo | P1 | ADMIN pesquisa/desativa/reativa contas, administra papéis/estados/configurações, convites e logs. Promoção exige senha+código único. | campaigns.test.ts: administração/provas/sessões; E2E management | Implementado; exclusão física não exposta |
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
| RNF-009 | Proteção contra acesso indevido | Autorização por dono, vínculo/estado de campanha e escopo; ADMIN não recebe bypass narrativo. | Integração de isolamento/escalada e matriz de campanhas da Parte 3. |
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
| RN-004 | Proprietário edita campos autorizados | Contratos por domínio e visibilidade; mecânica depende do estado e função. | Implementado por domínio nas Partes 2/3. |
| RN-005 | Jogador não modifica terceiros | Busca e UPDATE incluem ownerId da sessão. | Implementado; integração 404 para terceiros. |
| RN-006 | Mestre administra sua campanha | Exigir CampaignMember.role=GM e campaignId correspondente. | Implementado; campaigns.test.ts e E2E management. |
| RN-007 | Administrador também joga | ADMIN pode usar mesmas rotas de personagens próprios; papel não elimina propriedade. | Verificado na integração e E2E management: ADMIN com ficha própria. |
| RN-008 | Sem privilégio administrativo público | DTO não aceita role; somente CLI cria primeiro ADMIN; próximos ADMIN exigem prova reforçada no servidor. | Implementado; integração de escalada e revisão do CLI. |
| RN-009 | Atributos aprovados exigem autorização | Solicitação com baseVersion e revisão pelo GM responsável. | Implementado com pedido/revisão transacional; campaigns.test.ts. |
| RN-010 | Perícias aprovadas exigem autorização | Mesmo fluxo de solicitações, sem atualização direta do jogador. | Protegido; pedido de SKILLS e revisão por GM implementados. |
| RN-011 | Manual Híbrido 2.6 é fonte das fórmulas | Somente implementar fórmulas após receber manual e confirmar exemplos. | Fórmulas explícitas da Parte 2 implementadas e testadas; manual completo pendente de conferência. |
| RN-012 | Rascunhos incompletos | Criar com nome, conceito vazio e valores iniciais definidos nas regras explícitas da Parte 2, podendo permanecer incompletos. | Implementado; integração de cadastro. |
| RN-013 | Finalização validada mecanicamente | Transição DRAFT→APPROVED depende de validador homologado. | Submit valida; GM aprova ou devolve DRAFT com comentário e auditoria. |
| RN-014 | Fichas alheias exigem vínculo/permissão | Compartilhamento desativado por padrão e projeções explícitas. | DTO compartilhado com dupla autorização; sem mutação por colega. |
| RN-015 | Segredos do mestre não enviados | Não carregar relações ou campos de bastidor em respostas públicas. | PUBLIC/PRIVATE/GM_ONLY, escopo de origem e filtragem de histórico testados. |
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
| RF-033 | Revisão inicial | P0 | Validar oito pontos, quatro treinos e carga; GM aprova ou pede correção com comentário. | Integração submit/reopen + campaigns.test.ts aprovação; E2E management; Implementado |
| RF-034 | Equipamento sem duplicação | P0 | Uma entrada de inventário aparece na seção de equipamento sem somar espaços duas vezes | Integração CRUD e E2E; implementado |
| RNF-021 | Idempotência | P0 | Repetir operação com mesmo UUID/payload não duplica saldo/log; payload diferente é 409 | Integração concorrente de recursos/PE; implementado no escopo testado |
| RNF-022 | Concorrência entre domínios | P0 | PV e condição independentes persistem; mesma versão de recurso conflita | Integração simultânea e E2E de autosave/recurso |
| RN-021 | Máximos não curam | P0 | Aumento de máximo preserva atual; redução limita e audita | Integração de atributos/recursos |
| RN-022 | Fadiga preserva base | P0 | Penalidade afeta alvo do teste e não altera o valor base/atributo | Unitários, integração e E2E |
| RN-023 | Repetição depende de GM real | P0 | Exigir vínculo ativo, pedido, categoria/justificativa e saldo na transação de consumo | Integração de repetição autorizada |
| RN-024 | Sem duplicar objetos | P0 | Arma/equipamento é a projeção do mesmo item canônico | Integração/E2E |
| RN-025 | Sem aprovação própria fictícia | P0 | Submit gera PENDING_APPROVAL; jogador não envia status APPROVED | Contratos estritos e integração de bloqueio mecânico |

Evidências atuais e limites de execução ficam em VALIDACAO.md. As linhas históricas da fundação permanecem para rastreabilidade; nenhuma declaração de infraestrutura de produção passa a atendida por estes acréscimos.

## Requisitos adicionais — Parte 3

| ID | Requisito | Prioridade | Critério verificável | Testes / situação |
|---|---|---|---|---|
| RF-035 | Painel do mestre | P0 | Exibir elenco, fichas, recursos atuais/máximos, condições, pedidos, convites e configuração apenas ao GM ativo | campaigns.test.ts; E2E management; implementado |
| RF-036 | Privacidade classificada | P0 | PRIVATE só dono; GM_ONLY só GM explícito da campanha de origem; shared DTO sem segredos | campaigns.test.ts ausência de segredos e mudança de campanha; implementado |
| RF-037 | Gestão de participantes | P0 | Aceitar/recusar/remover com versão e motivo; remoção preserva ficha e revoga acesso GM ao personagem | campaigns.test.ts; E2E management; implementado |
| RF-038 | Configuração de campanha | P1 | Persistir descrição/avisos/estado/compartilhamento; versão obsoleta retorna 409 | campaigns.test.ts notas/conflito; E2E criação; imagem persistente pendente |
| RF-039 | Administração reforçada | P0 | Nova função ADMIN exige senha+código de recuperação único+confirmação do login; negar prova ausente/usada/expirada/de outra sessão | campaigns.test.ts; E2E management; implementado |
| RF-040 | Desativar e reativar contas | P0 | Desativar revoga sessões sem apagar personagens; reativar exige login novo | campaigns.test.ts; E2E management; implementado |
| RF-041 | Notificações internas | P1 | Somente destinatário consulta/marca; decisões geram aviso na transação | campaigns.test.ts; implementado, polling 30 s |
| RF-042 | Administrador jogador | P0 | ADMIN usa ficha própria e painel separado sem receber conteúdo GM automaticamente | campaigns.test.ts; E2E management; implementado |
| RNF-023 | Projeções privadas no servidor | P0 | Ausência dos marcadores PRIVATE/GM_ONLY em JSON público/administrativo; sanitizar snapshots | Integração e E2E de privacidade |
| RNF-024 | Gestão concorrente | P0 | Uma decisão por versão; convite limitado não excede usos; UUID não duplica criação | Integração simultânea e repetição idempotente |
| RNF-025 | Prova administrativa efêmera | P0 | Hash no banco, conta/sessão vinculadas, 5 minutos, uso único, sem segredo em ledger/log | Integração administrativa |
| RN-026 | Convite não promove participante | P0 | Convite de campanha sempre cria PLAYER/PENDING | Integração de ingresso |
| RN-027 | Desvincular não apaga ficha | P0 | Remoção mantém dono/dados e desfaz vínculo | Integração de remoção |
| RN-028 | Dupla autorização para compartilhar | P0 | Campanha e dono habilitam; ambos usuários com vínculo ACTIVE | Integração de leitura compartilhada |
| RN-029 | Segredo pertence à campanha de origem | P0 | GM de outra campanha não recebe notas/logs GM_ONLY antigos | Integração de mudança de campanha |
| RN-030 | Proteger funções administrativas | P0 | Sem autodesativação/perda de ADMIN; não remover último GM ativo pelo painel de papéis | Integração de autoperda e de preservação do último GM |
| RN-031 | Registro antigo não vira público | P0 | Migração mantém logs antigos PRIVATE e sharingEnabled=false | SQL versionado e ensaio SQL desde vazio; staging Prisma pendente |

A fonte integral da Parte 3 está em referencias/PARTE3.md. Situações implementadas descrevem o código e o escopo dos testes indicados; resultados efetivamente executados e infraestrutura ainda pendente estão em VALIDACAO.md.
