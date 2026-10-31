# Auditoria obrigatória antes da Parte 4

Data: 31/10/2026 UTC. Base auditada: 40532c3 (0.3.0). README, PROGRESSO, RF/RNF/RN, auditoria anterior, schema/migrações, autenticação, autorização e serviços/componentes de fichas/campanhas foram inspecionados antes da ampliação. Não há troca de tecnologias nem banco simulado.

## Execuções anteriores à implementação

- npm run typecheck: passou.
- npm test: 51/51 aprovados.
- npm run build: passou; aviso de chunk JS 555,42 kB / gzip 163,58 kB permanece.
- npm run db:test:deploy: três migrações atualizadas, MySQL 8.4 local real, sem reset.
- npm run test:integration: 60/60 aprovados.
- PLAYWRIGHT_BROWSERS_PATH=/workspace/.cache/ms-playwright npm run test:e2e: 14/14 aprovados (7 desktop/7 celular).

Os fluxos exercitam login, abertura/edição/persistência MySQL, histórico, GM criando/administrando campanha e editando ficha autorizada, negação de edição alheia, painel ADMIN com autorização reforçada e retorno à ficha própria. JSON de segredos é verificado nos testes de integração e navegador. 125 cenários distintos; não contar repetições como novos testes.

A primeira chamada de migração ocorreu imediatamente após iniciar o contêiner MySQL e falhou enquanto ele ainda inicializava. A segunda chamada, após prontidão, passou; nenhum SQL novo foi aplicado nesse momento. Não houve falha crítica de aplicação na auditoria.

## Lacunas e decisões para a Parte 4

Ainda não há sessão de jogo, presença, eventos compartilhados, SSE ou diário de sessão. Rolagens existentes são pessoais da ficha, geradas pelo servidor. A integração deverá reutilizar esse motor e impedir vazamento de rolagens secretas por endpoints/histórico legados. Alterações feitas fora da sala também precisam gerar eventos mecânicos na sessão ativa, com projeção segura.

Adotar SSE com eventos persistidos e polling alternativo, sem Redis/WebSockets inicialmente. Usar cursores opacos e filtragem antes da paginação/contagem para não revelar eventos secretos. Presença aproximada por heartbeat/tab, com expiração e agregação por usuário. Transferências ficam desativadas por configuração até aprovação da mecânica; não inventar consumo/combate.

## Limites externos

Não há produção Render/MySQL gerenciado, TLS real, storage de imagens, remoto Git, manual completo homologado, carga, auditoria WCAG ou aparelhos físicos verificados. Os pré-requisitos críticos locais passaram; esses limites continuam pendentes. Resultados e correções da ampliação serão registrados em VALIDACAO.md e PROGRESSO.md.


## Resultado após a implementação

Parte 4 integrada e regressão completa aprovada: 78 unitários, 90 integrações MySQL e 18 E2E, total 186 cenários distintos. A migração nova preservou registros; quatro SQLs passaram desde vazio em instância isolada (33 tabelas), e Prisma status/diff ficaram atualizados. Regressões introduzidas durante desenvolvimento foram corrigidas e repetidas sem enfraquecer testes, inclusive isolamento READ COMMITTED para leituras após locks. Detalhes em VALIDACAO.md. Produção/homologação e demais limites externos continuam pendentes.
