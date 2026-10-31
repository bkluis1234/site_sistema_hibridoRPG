# Validação — Parte 3 / aplicação 0.3.0

Data do usuário: 30/10/2026 (execuções de 31/10 UTC). Cloud Linux, Node 24, npm 11, MySQL 8.4.13 e Chromium headless Playwright 1.64.1. Banco dedicado hibrido_test, sem dados de produção. Fundação e ficha auditadas **antes** de desenvolver gestão: [AUDITORIA_PARTES_1_2.md](AUDITORIA_PARTES_1_2.md). Resultados anteriores preservados em [VALIDACAO_PARTE2.md](VALIDACAO_PARTE2.md) e VALIDACAO_PARTE1.md.

## Resultados executados

| Verificação | Resultado | Limites |
|---|---|---|
| npm run typecheck | Passou | API/shared/regras e frontend |
| npm test | 51/51 aprovados | Contratos, segurança e regras explícitas; não substitui manual homologado |
| npm run test:integration | 60/60 aprovados, três arquivos | MySQL real; 39 anteriores + 21 novos cenários de gestão |
| npm run test:e2e | 14/14 aprovados | Sete cenários em desktop e sete em Pixel 7, Chromium emulado |
| npm run build | Passou | JS 555,42 kB / gzip 163,58 kB; aviso Vite acima de 500 kB permanece |
| Prisma validate | Passou | Schema compatível com cliente gerado |
| Prisma migrate status | Atualizado, três migrações | Banco de teste existente |
| Prisma migrate diff banco → schema --exit-code | Sem diferenças, código 0 | CHECKs são definidos no SQL, além dos campos Prisma |
| node scripts/audit-migrations.mjs hibrido-mysql-test | Passou: três SQLs, 27 tabelas e configuração inicial | Instância nova isolada, sem rede, datadir temporário; SQL exato, sem ledger Prisma |
| Fluxo contínuo da auditoria + reinício MySQL | Passou antes da Parte 3 | 17 passos em audit-persistence.ts; verificar processo/banco novos preservou os dados |
| Revisão visual | Painel GM mobile e administração desktop inspecionados | Não é auditoria integral WCAG, contraste ou aparelhos físicos |

Total da última regressão completa: **125 cenários distintos aprovados** (51 unitários + 60 integração + 14 E2E). O ensaio de migrações e o fluxo contínuo de auditoria são evidências adicionais, não somados como casos unitários. Repetições não contam como testes novos. Relatórios/snapshots ficam em test-results e playwright-report ignorados pelo Git; incluem contas sintéticas e podem conter credenciais de teste.

## Cobertura nova

- Criação de campanha somente por habilitado/ADMIN e GM por vínculo; rejeição de papel injetado pelo cliente.
- Convite comum PENDING/PLAYER, aceite explícito, limite de usos concorrente, expiração, revogação e hash no banco; repetição idempotente não recria convite nem persiste seu código no ledger.
- Remoção preserva conta/ficha e revoga acesso do GM ao personagem; outro GM/campanha não acessa por manipular URL.
- Persistência de avisos/notas, versões e 409 para edição obsoleta.
- Compartilhamento depende de campanha e dono; DTO somente leitura omite notas privadas, segredos GM e histórico reservado.
- PRIVATE exclusivo do dono; GM_ONLY exige contexto e origem. Mover a ficha não leva segredos/logs antigos ao novo GM.
- Editor GM com campos privados vazios preserva os originais; tentar escrever conteúdo privado é recusado.
- Aprovação inicial, bloqueio mecânico do dono e correção justificada pelo GM. Pedido aprovado aplica uma vez mesmo com decisões simultâneas; pedido obsoleto conflita; rejeição mantém valores e comentário.
- ADMIN jogador com ficha própria, sem acesso universal narrativo. Painel permite pesquisar/desativar/reativar, preserva fichas e invalida sessões.
- Promoção ADMIN exige senha+código único+confirmação de destino. Prova ausente/usada/expirada/de outra sessão é recusada; autoperda e remoção do último GM protegidas.
- Fechar cadastro é conferido no servidor; configuração não expõe segredos. Notificações só podem ser lidas/marcadas pelo destinatário.
- Navegador multiusuário: GM cria campanha/convida/aceita, dono vincula/preenche/compartilha/envia, GM aprova ficha e mudança, edita recurso e nota reservada; colega consulta PUBLIC sem controles de escrita. ADMIN gerencia contas/promove com prova reforçada e volta à própria ficha. Ambos perfis aprovados.

## Falhas encontradas e corrigidas

A auditoria identificou que o acesso GM da Parte 2 ainda projetava narrativas pessoais e snapshots completos. Antes de abrir compartilhamento, /sheet e histórico foram filtrados; testes de ausência de marcadores e preservação de conteúdo privado passaram. Notas/logs GM_ONLY passaram a guardar campanha de origem, evitando vazamento após transferir o personagem. Visibilidade de nota foi tornada imutável para impedir publicação acidental de segredo pelo mesmo registro.

A adaptação inicial de /admin/gm-invites devolvia 200; a regressão anterior exigia o contrato 201. Corrigido sem retirar o teste. Primeira migração local da Parte 3 falhou no CHECK de escopo (MySQL 3823: campanha em FK com ON UPDATE CASCADE). Corrigido para ON UPDATE RESTRICT, completadas apenas as constraints faltantes e conferido migrate diff; migrate resolve --applied registrou a recuperação após verificar o estado. A primeira tentativa de trocar a FK num único ALTER recebeu duplicate 1826; DROP/ADD separados resolveram. Não houve reset, exclusão de registros ou alteração de migrações anteriores. O SQL corrigido completo passou depois numa instância vazia isolada.

Durante implementação, TypeScript identificou um fechamento de objeto incorreto na consulta de máximos, corrigido antes do build final. No E2E novo havia um seletor genérico .sheet-notice que correspondia a duas mensagens; corrigido para a confirmação exata da operação. Desktop/mobile foram repetidos e passaram. O runner isola arquivo e perfil em processos novos para preservar rate limits reais por IP, sem os desativar. Rascunhos de configuração usam a versão carregada e são preservados até resolução explícita; mudar campanha/contexto reinicializa o rascunho GM. Após esse ajuste final, os quatro E2E de gestão foram repetidos (2 desktop/2 mobile) e passaram, assim como TypeScript e build.

## Reprodução

Criar .env.test pelo exemplo com banco exclusivo terminado _test; conferir host/credenciais. Executar npm ci, npm run db:generate, npm run db:test:deploy, npm run typecheck, npm test, npm run test:integration, npm run build. Instalar Chromium com npm exec -- playwright install chromium; executar npm run test:e2e. Neste cloud: PLAYWRIGHT_BROWSERS_PATH=/workspace/.cache/ms-playwright.

Validação Prisma com .env.test, sem imprimir segredos:

```sh
node --env-file=.env.test node_modules/prisma/build/index.js validate
node --env-file=.env.test node_modules/prisma/build/index.js migrate status
node --env-file=.env.test node_modules/prisma/build/index.js migrate diff --from-config-datasource --to-schema prisma/schema.prisma --exit-code
```

O ensaio opcional audit-migrations.mjs exige Docker local, socket Unix e um contêiner MySQL 8.4 já iniciado com nome terminado -test. Inicializa outro mysqld num datadir aleatório em /tmp, sem rede/porta, aplica os três SQLs, consulta tabelas/flags e encerra/remove somente esse datadir. Requer espaço/memória adicionais e binários mysql/mysqld no contêiner. Não aponta para o datadir principal e não substitui testar prisma migrate deploy em staging vazio.

## Pendências externas e limites

Storage de imagens, manual completo/homologação de Marcus (inclusive fadiga proposta), repositório remoto, publicação Render/MySQL gerenciado, HTTPS/TLS reais, backups/restauração, carga/latência, navegadores adicionais e aparelhos físicos não foram verificados. Não existe conta de produção criada para Marcus. Cenários usam identidades sintéticas; a configuração real está descrita em CAMPANHAS.md.

Rate limits ainda são locais ao processo; limpeza agendada e retenção de sessões/provas/operações/notificações precisam ser definidas. Listagens de gestão têm limites; paginação avançada permanece futura. Sem WebSocket, fila offline persistente ou upload persistente; formulários de gestão não enviados podem se perder ao recarregar. Bundle JavaScript continua acima de 500 kB; metas RNF-016 exigem medição em staging, não inferência dos testes funcionais. Acesso direto à infraestrutura pode revelar narrativas.

Nenhum teste crítico local ficou bloqueado ao fim da regressão registrada. Publicação e homologação operacional continuam etapas distintas; a Parte 3 não significa que toda a plataforma/produção esteja concluída.
