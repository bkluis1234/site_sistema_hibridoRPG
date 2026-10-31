# Registro histórico anterior à Parte 5 definitiva

Este arquivo preserva o registro anterior; estados de Git/produção devem ser consultados em PROGRESSO.md.

# Progresso — Sistema Híbrido 2.6

Atualizado em 31/10/2026 UTC. Versão da aplicação: 0.4.0. Partes 1/2/3 auditadas antes de implementar o Modo Sessão. Referências: imagem oficial e texto explícito da Parte 2; Manual completo ainda pendente. Sem publicação em produção. Repositório privado informado e origin configurado; push bloqueado por falta de acesso efetivo ao remoto.

## Arquitetura adotada

Monorepositório npm: React/TypeScript/Vite em apps/web, Express/TypeScript em apps/api, contratos Zod em packages/shared e regras 2.6 em packages/rpg-rules. MySQL 8.4 é a fonte oficial; Prisma 7 e migrações SQL versionadas. Sessão segura e CSRF da Parte 1 mantidos. Produção planejada: aplicação Render na mesma origem e MySQL gerenciado externo com TLS.

Ficha usa versões independentes para identificação, atributos, treinamentos e registros de recursos/itens/condições/ferimentos/rolagens. Transação ordena operações por ficha; operationId evita efeitos duplicados. Auditoria tem ator/data/ação/antes/depois. Sem dados simulados ou arquivos JSON como banco.

## Funcionalidades implementadas

- Parte 1: contas sem e-mail, login/logout, Argon2id, cookies seguros, recuperação por códigos, primeiro ADMIN por CLI, convites temporários de mestre e dashboard.
- Identificação completa: nome/apelido/idade/altura/peso/profissão e narrativas; autosave 850 ms, validação RHF/Zod, estado de salvamento, falha/repetição e reconciliação explícita de conflito.
- Rascunho textual em memória por conta/ficha, preservado ao navegar internamente; aviso ao fechar/recarregar com edição pendente. Sem fila offline persistente.
- Atributos AGI/FOR/INT/PRE/VIG com distribuição inicial e validação de oito pontos; quatro treinamentos; 21 perícias com alvo calculado e filtros/pesquisa.
- PV/SAN/PE derivados, controles rápidos e quantidade personalizada, confirmação no servidor e eventos de dano explícitos. Máximo aumentado não cura; reduzido limita atual e audita.
- Inventário com CRUD, quantidade/espaços e alerta de carga; armas/equipamentos como projeção do mesmo objeto, sem dupla contagem ou dano automático.
- Ferimentos ativos/tratados/resolvidos, sangramento sem temporizador, fadiga 0..3 e acompanhamento crítico com três sucessos/falhas, sem cura ou testes automáticos.
- Fadiga inicial em Atletismo, Acrobacia, Furtividade, Luta e Reflexos, conforme instrução adicional do proprietário. Alvo base/penalidade/final separados. Lista substituível pelo GM vinculado e override contextual autorizado por teste. Proposta sujeita à revisão de Marcus.
- Dados d4/d6/d8/d10/d12/d20/d100, múltiplos dados, resultado/soma no servidor e rolagens persistentes. Teste d20 <= alvo e 20 natural falha.
- Opções de PE: aceitar, bônus 1 PE ou pedir repetição 2 PE; repetição exige GM ativo da campanha, categoria/justificativa e nova conferência do vínculo ao gastar. Transação e idempotência impedem gasto duplo.
- Submit valida e passa a PENDING_APPROVAL; reabrir pedido devolve DRAFT. Fichas APPROVED protegem mecânica e ARCHIVED são somente leitura, inclusive pela rota legada.
- Histórico paginado com projeções autorizadas, antes/depois e preservação de snapshots das rolagens.
- Layout baseado na ficha oficial, com campos claros/painéis pretos/cabeçalhos vermelhos, PV vermelho, SAN roxo, PE azul e fadiga âmbar. Mobile por abas e recursos de acesso rápido.
- Prévia/seleção/substituição/remoção local de retrato, tipos e tamanho configurável. API declara storage não configurado e contrato PortraitStorage foi preparado.

## Migrações executadas

- 202610300001_foundation: fundação da Parte 1, reparada em teste conforme histórico em VALIDACAO.md.
- 202610300002_interactive_sheet: aplicada com sucesso no MySQL local hibrido_test; completa narrativas, versões, dados estruturados de condições, rolagens, idempotência, espaços/equipamentos e auditoria. Preenche fichas anteriores e remove máximo redundante dos recursos. Status atualizado e migrate diff sem diferenças.

- 202610310003_campaign_management: aplicada ao MySQL de teste existente, preservando dados. Acrescenta estados, convites limitados, notas com escopo, privacidade, solicitações, auditoria, notificações, provas administrativas e configurações. CHECK/FK de notas corrigido e migração local recuperada sem reset; detalhes em VALIDACAO.md. Status atualizado e diff sem diferenças.
- As três migrações SQL passaram desde vazio em instância MySQL isolada (27 tabelas), sem tocar no datadir principal. Ensaio não executa ledger Prisma.

- 202610310004_game_sessions: aplicada com sucesso ao MySQL de teste existente, sem reset. GameSession, SessionParticipant, SessionEvent, SessionNote, PresenceRecord e ItemTransfer; DiceRoll ampliado, sem segundo motor. Slot único vivo/CHECKs/índices e transferências desativadas por padrão. Nenhum histórico anterior publicado automaticamente.

Nenhuma migração executada em produção. Ensaiar prisma migrate deploy em staging vazio e restauração antes de publicar.

## Dependências e comandos

Não foram acrescentadas dependências runtime nas Partes 2/3/4; SSE usa Express/EventSource nativos. Mantidas versões do lockfile: Node 24, React 19.3.1, Vite 8.3.5, TypeScript 5.9.3, Express 5.3.0, Prisma 7.10.1, Zod 4.6.7, Tailwind 4.3.3, Vitest 4.1.12, Supertest 7.3.1, Playwright 1.64.1 e demais bibliotecas aprovadas. Formatação realizada por Prettier temporário, sem dependência nova no projeto.

```sh
npm ci
# Criar .env pelo exemplo, com MySQL e segredos próprios.
npm run db:generate
npm run db:deploy
npm run dev
```

Testes: criar .env.test por .env.test.example e usar banco dedicado terminado _test. Executar `npm run db:test:deploy`, `npm test`, `npm run test:integration`. Instalar Chromium e executar `npm run test:e2e`. O runner E2E executa cada arquivo e perfil desktop/mobile com processos distintos para não somar tentativas de perfis simulados no mesmo limite por IP. A proteção real da API não foi desativada. Relatórios por perfil ficam ignorados em test-results e playwright-report.

Neste cloud, o Chromium headless está em /workspace/.cache/ms-playwright; foi usado PLAYWRIGHT_BROWSERS_PATH nesse caminho. No PC, instalar normalmente pelo Playwright. Comandos completos no README. ADMIN de produção não existe; credenciais criadas aqui são exclusivamente sintéticas do banco de teste.

## Validação

Entrada da Parte 4: 51 unitários, 60 integrações MySQL e 14 E2E desktop/mobile aprovados (125 casos), antes do código novo. TypeScript, build, schema Prisma, três migrações/status e diff passaram. Auditoria contínua comprovou persistência após reiniciar MySQL e API antes da Parte 3. SQL de instalação vazia aprovado separadamente. Falhas intermediárias/correções e limites em VALIDACAO.md; evidências prévias em AUDITORIA_PARTES_1_2.md.

## Funcionalidades acrescentadas na Parte 3

- Campanhas Híbrido 2.6 com estados, descrição/avisos/compartilhamento; criação habilitada e GM por vínculo, sem recriar autenticação ou regras.
- Convites aleatórios, hash-only, validade/limite/revogação, ingresso PENDING e aceite GM; remoção/vínculos preservam contas e personagens.
- Painel GM com elenco, fichas, recursos atuais/máximos, condições, pedidos, convites, histórico/configurações e notas reservadas; editor com justificativa mecânica auditada.
- Compartilhamento somente leitura com dupla autorização; notas PUBLIC/PRIVATE/GM_ONLY filtradas no servidor, histórico sanitizado e segredos presos à campanha de origem.
- Aprovação inicial/correção e solicitações de atributos/treinamentos com comentários, versão base e aplicação transacional; conflito impede sobrescrita silenciosa.
- Administração de usuários/papéis/estados/configurações/convites/logs, senha recente e prova de uso único; promoção ADMIN exige código de recuperação e confirmação do destino. ADMIN conserva ficha própria.
- Notificações internas e polling 30 s/refetch/invalidação; idempotência de gestão sem guardar códigos secretos.
- Documentos CAMPANHAS.md, PERMISSOES.md, ADMINISTRACAO.md, auditoria obrigatória e referência integral da Parte 3.

## Pendências e limitações

1. Storage externo persistente de retrato: UI é prévia local; não salva imagem no banco ou no disco temporário do Render. Configurar provedor e validação real de imagem no backend antes de habilitar upload.
2. Conferir os fluxos com Marcus/grupo real após configurar a infraestrutura. Aprovação/painéis/compartilhamento e Modo Sessão estão integrados. Transferências são optativas, desativadas por padrão até aprovação explícita na campanha.
3. Conferir manual completo e exemplos com Marcus, especialmente fadiga proposta, dano de armas, exceções, reentrada em crítico, deslocamento e recuperação incompleta de PE.
4. Repositório privado criado: https://github.com/bkluis1234/site_sistema_hibridoRPG.git. Origin configurado, mas leitura/fetch negados (HTTP 403; API 404). Sem push e sem confirmação da divergência; habilitar acesso da integração ao repositório antes de publicar. O commit/bundle local não se sincroniza automaticamente com o PC.
5. Produção: Render, MySQL gerenciado, TLS real, backups/restauração, monitoramento, carga e política de retenção/anonimização não provisionados/verificados.
6. SSE/fallback em sala; sem fila offline persistente ou merge automático de texto. Fechar/recarregar ignorando o aviso pode perder rascunho ainda não confirmado; o MySQL continua fonte oficial.
7. Rate limit permanece em memória por processo: store compartilhado antes de escala horizontal. Rotina agendada de limpeza de sessões/operações e política de retenção precisam ser definidas.
8. Listagens de fichas/rolagens/convites ainda têm limites; histórico já tem cursor. Histórico com narrativas muito longas e chunk JS ~560,09 kB (~165,21 kB gzip) pedem medição/otimização em staging. O build avisou sobre chunk >500 kB; não é falha de compilação nem prova de meta de latência.
9. Navegadores físicos, Firefox/WebKit, leitor de tela, auditoria WCAG/contraste completa e testes de carga permanecem pendentes.
10. Exportação, retenção/limpeza agendada e ferramentas avançadas futuras seguem pendentes; sem combate tático ou consumo automático.

## Continuidade Git

Histórico das Partes 1/2/3 preservado; novas alterações registradas em commit da Parte 4. Pacote sistema-hibrido-parte4.zip inclui código versionado, histórico completo em historico.git.bundle e instruções CONTINUAR_NO_PC.md; não inclui .env, node_modules, dados MySQL, credenciais ou traces. O commit exato consta em ENTREGA.json no pacote.

Extraia o ZIP e execute `git clone historico.git.bundle sistema-hibrido` para recuperar o histórico. Nessa cópia restaurada, confira o origin antes de apontá-lo para `https://github.com/bkluis1234/site_sistema_hibridoRPG.git`. Nesta cópia do Codex, origin já está configurado. Após liberar o acesso, faça fetch e confira o histórico remoto antes de um push normal, sem force. No outro dispositivo, clone o remoto somente após confirmar a publicação do código.


## Próximos passos no computador

1. Habilitar o acesso GitHub ao novo repositório privado, fazer fetch, conferir divergências e publicar main sem force; clonar esse remoto nos demais dispositivos após confirmar o push. O bundle continua disponível como alternativa de transferência.
2. Instalar com npm ci; configurar MySQL próprio e segredos pelo .env.example, gerar Prisma e aplicar quatro migrações com db:deploy. Não copiar o banco/credenciais de teste deste cloud.
3. Criar primeiro ADMIN por CLI; habilitar Marcus por convite ou conta existente; ele cria campanha e convida o grupo conforme CAMPANHAS.md.
4. Homologar manual e proposta de fadiga; configurar storage persistente se desejar imagens; ensaiar instalação Prisma limpa, backup/restauração, TLS/Render e carga antes de produção.
5. Continuar Parte 5 a partir de AUDITORIA_FINAL.md: correções de segurança, identidade Origem, ajuda/tutoriais, requisitos e homologação integral; publicação, backups/restauração, monitoramento, desempenho/acessibilidade continuam pendentes.

## Registro inicial da Parte 5 e preparação do GitHub

Somente documentação acrescentada nesta etapa: duas referências integrais da Parte 5 e relatório de auditoria inicial. Nenhuma funcionalidade solicitada da Parte 5 foi declarada concluída. Regressão da aplicação existente: 78 unitários, 90 integrações MySQL e 18 E2E aprovados; typecheck/build passaram, com aviso de bundle >500 kB. Ensaio local adicional confirmou persistência após reiniciar MySQL/API e negou acesso ao segundo cliente; limpeza sintética concluída. Não foram instaladas dependências nem executadas novas migrações nesta etapa.

Antes de preparar o commit, foram examinados os quatro commits existentes (190 blobs históricos), os arquivos versionados e os três documentos pendentes com padrões de tokens, chaves privadas e credenciais literais. Os resultados foram revisados: exemplos usam placeholders, testes usam valores sintéticos e as quatro migrações SQL são schema/dados de evolução, não dumps de jogadores. Nenhuma credencial real foi identificada nessa verificação; ela não constitui garantia exaustiva. `.env` e `.env.test` estão ignorados e nunca constaram nos históricos examinados; apenas `.env.example` e `.env.test.example` estão versionados. Não houve exclusão de arquivos ou reescrita do histórico.

GitHub CLI reconhece a conta do proprietário, mas Git/API não permitem acessar este repositório privado. Não foi possível verificar os commits remotos ou a existência/divergência de main. Nenhum push foi realizado. Liberar acesso ao repositório é a próxima dependência; conectar ao Render e prover MySQL externo só vêm após o envio confirmado e a resolução dos bloqueios de produção.

Verificação deste registro documental: `npm test` repetido com 78 testes aprovados; `git diff --cached --check` sem erros. Revisão final dos cinco documentos preparados sem padrões de credenciais reais identificados. Integração/E2E/build não foram repetidos nesta alteração exclusivamente documental; os resultados acima pertencem à auditoria anterior da mesma versão da aplicação.


## Funcionalidades acrescentadas na Parte 4

- Auditoria obrigatória das Partes 1/2/3, com 125 cenários anteriores repetidos antes de implementar.
- Sessões de jogo por campanha: agendar, iniciar, pausar, retomar, encerrar/cancelar, uma viva por campanha; membro entra com ficha própria e GM pode acompanhar sem personagem.
- Sala responsiva com três painéis no desktop, cinco abas no celular, barra de recursos, controles de sobrevivência/inventário/crítico e ferramentas GM.
- Rolagens oficiais do mesmo motor, PUBLIC/PRIVATE/GM_ONLY/GM_SHARED, filtros/cursores opacos, alvos/fadiga/contexto e PE transacional/idempotente. Sem vazamento por histórico/endpoints legados.
- Eventos mecânicos persistidos na transação, inclusive alterações pelas rotas anteriores de ficha; projeções sem notas privadas; eventos narrativos explícitos e categorias distintas.
- Diário com autoria/versão/visibilidade imutável, notas GM em contexto explícito; resumo de registros reais após encerramento e narrativa manual publicada pelo GM.
- SSE filtrado por usuário/contexto, reconexão, refetch/deduplicação e polling alternativo. Validação periódica fecha streams revogados; encerramento do servidor fecha streams antes do shutdown.
- Presença aproximada por heartbeat, expiração e agregação de abas. Avisos discretos silenciáveis, sem áudio/push obrigatório.
- Transferência optativa: configuração GM auditada, proposta/aceite, mesma campanha, quantidade/capacidade/versão revalidadas e movimentação atômica; sem copiar notas privadas. Default false preservado em campanhas reais.
- Limites por conta autenticada e borda IP; consultas /me não usam a cota de tentativas de senha. Proteção de credenciais preservada. Mutações da sala falham imediatamente offline, sem envio automático de ações pendentes ao reconectar.
- Rotas novas carregadas sob demanda; sem dependências novas. Documentos MODO_SESSAO, ROLAGENS, SINCRONIZACAO e AUDITORIA_PARTE_4.

Resultados finais da ampliação, falhas encontradas e limites ficam em VALIDACAO.md. Nenhuma configuração de produção, credencial real ou remoto Git foi criada automaticamente.


## Fechamento da Parte 4

Regressão final completa: **186 cenários aprovados** — 78 unitários, 90 integrações MySQL e 18 E2E (9 desktop/9 celular). TypeScript/build, Prisma validate/status/diff e ensaio dos quatro SQLs desde vazio passaram (33 tabelas). O problema de snapshot obsoleto introduzido na ordenação de locks foi corrigido com READ COMMITTED, mantendo todos os testes anteriores. Nenhum teste crítico local ficou pendente. Resultados/falhas intermediárias e limites externos em VALIDACAO.md.
