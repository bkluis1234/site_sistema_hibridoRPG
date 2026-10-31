# Validação — Parte 4 / aplicação 0.4.0

Data: 31/10/2026 UTC. Linux cloud, Node 24.19.0, npm 11.9.0, MySQL 8.4.13 real e Chromium Playwright 1.64.1. Banco dedicado hibrido_test, sem contas ou infraestrutura de produção. Antes de desenvolver, a auditoria repetiu os 125 cenários da Parte 3: AUDITORIA_PARTE_4.md. Históricos anteriores preservados em VALIDACAO_PARTE3.md, VALIDACAO_PARTE2.md e VALIDACAO_PARTE1.md.

## Resultados executados

| Verificação | Resultado | Limite |
|---|---|---|
| npm run typecheck | Passou | API/shared/regras e frontend |
| npm test | 78/78 aprovados | 51 anteriores + 27 novos de ciclo/presença/motor/contratos |
| npm run test:integration | 90/90 aprovados, quatro arquivos | MySQL real; 60 anteriores + 30 novos de sessão/segurança/conexão |
| npm run test:e2e | 18/18 aprovados (9 desktop + 9 celular) | Chromium desktop/Pixel 7 emulado; não aparelho físico |
| npm run build | Passou | Principal 560,09 kB / gzip 165,21 kB; sala em chunk separado ~41,15 kB / gzip 11,40 kB; aviso >500 kB anterior permanece |
| Prisma validate | Passou | Schema e cliente gerado 7.10.1 |
| Prisma migrate status | Atualizado, quatro migrações | Banco de teste existente preservado |
| Prisma migrate diff banco → schema --exit-code | Sem diferenças, código 0 | CHECKs adicionais definidos em SQL |
| node scripts/audit-migrations.mjs hibrido-mysql-test | Quatro SQLs passaram desde vazio, 33 tabelas, constraints e configuração | Instância isolada temporária, sem rede; não executa ledger Prisma nem substitui staging |
| Revisão visual | Sala desktop GM e celular jogador inspecionados | Não é auditoria integral WCAG/contraste |

Total de cenários distintos aprovados na regressão: **186** (78 unitários + 90 de integração + 18 E2E). Não contar repetições, ensaio de SQL ou auditoria inicial novamente como casos novos. Relatórios/snapshots em test-results e playwright-report ignorados no Git, pois podem conter dados/códigos sintéticos.

## Cobertura da Parte 4

- GM cria/inicia/pausa/retoma/encerra; versões e slot único impedem duas salas vivas. PLAYER e ADMIN global sem vínculo GM não controlam nem acessam campanha alheia.
- Entrada em ACTIVE com ficha própria vinculada; GM acompanha sem personagem. Elenco filtra usuários ativos/aceitos e não entrega recursos de fichas privadas.
- Rolagens oficiais reutilizam motor seguro, sete faces suportadas e limites de quantidade. SQL confirma expressão/resultados/sessão/campanha. Cliente não injeta results/outcome nem modifica alvo/visibilidade GM sem autorização.
- PUBLIC/PRIVATE/GM_ONLY/GM_SHARED em listagens, filtros, eventos, SSE, contexto e resumo. PRIVATE pode excluir o GM. Rotas/histórico legados não expõem a rolagem secreta da sala. Revogação de papel também bloqueia replay idempotente secreto.
- Fadiga usa configuração real persistida, base preservada e modificador contextual GM justificado. Bônus/repetição PE usam transações/idempotência, sem duplicar saldo. Pedido privado de repetição divulga explicitamente o teste ao GM autorizado.
- Recursos geram anterior/novo/diferença a partir do MySQL; máximos derivados também geram eventos sem cura automática. Condições, crítico, ferimentos, uso/descarte de itens e alterações pelas rotas anteriores entram no histórico com projeções sem notas privadas.
- Diário aplica autoria, classe imutável e versão. GM não lê nota pessoal alheia. Eventos/contagens/cursor secreto não revelam dados proibidos.
- Presença agrega múltiplas abas e expira em 45/90 segundos sem depender de fechar página. Consulta /auth/me não consome tentativas de senha.
- SSE real sobre HTTP entrega somente IDs autorizados, fecha após remoção de membro, limita conexões e pode ser encerrado limpidamente no shutdown. Cursores REST recuperam eventos perdidos e não expõem sequência numérica interna.
- Resumo usa retrato e registros reais, com contagens visíveis e narrativa manual. Sessão encerrada mantém consulta e bloqueia novas ações mecânicas da sala.
- Transferências desativadas por padrão. Testes habilitam apenas campanha sintética e verificam confirmação, quantidade total preservada, concorrência, notas privadas não copiadas, capacidade/estoque/versão/campanha revalidados com rollback.
- E2E da sala: GM agenda/inicia, jogador e ADMIN jogador entram, resultado público e recurso aparecem em outro navegador por SSE, resultado/diário privados são omitidos, condições se atualizam, contexto GM não baixa segredos no modo jogador e encerramento disponibiliza resumo.
- E2E de rede: navegador offline não confirma nem altera MySQL; outro usuário atualiza enquanto desconectado; reconexão recupera estado. SSE bloqueado ativa fallback; consultas recuperam nova alteração; silêncio de avisos e reconexão SSE exercitados.

O teste de repetição usa fixture MySQL de falha natural 20 para exercitar autorização/custo sem depender do acaso; a nova rolagem vem do motor real. A geração oficial é verificada separadamente em testes de faces/limites e integração HTTP, sem resultado arbitrário aceito do cliente.

## Problemas encontrados e corrigidos

A auditoria inicial das Partes 1/2/3 não encontrou falha crítica de aplicação. Primeira chamada de migração durante a inicialização do contêiner foi repetida após prontidão; três migrações estavam atualizadas. A migração nova 202610310004_game_sessions foi aplicada depois, sem reset e sem falha SQL. O conjunto de quatro SQLs passou desde vazio em mysqld isolado com datadir temporário, sem tocar no principal.

A nova ordem de locks (campanha antes da ficha) introduziu uma leitura anterior ao lock na transação antiga de ficha. No isolamento MySQL padrão REPEATABLE READ, essa leitura fixava snapshot obsoleto: quatro testes anteriores de concorrência/idempotência falharam. Corrigido mutate para READ COMMITTED, consultando o estado confirmado depois do lock; os testes foram mantidos. A regressão seguinte passou 90/90, incluindo os quatro casos, os novos casos e todo o fluxo de PE. Nenhuma falha foi escondida removendo funcionalidade ou relaxando expectativas.

A primeira execução da suíte nova teve sete falhas de fixtures que usavam chave inglesa de perícia e supunham retorno item.id, em vez dos contratos existentes (atletismo e id/versão). Ajustados somente os fixtures. Suíte nova passou 23/23, ampliada depois para 28 e finalmente 30 casos. Durante o desenvolvimento, TypeScript detectou alargamento de false para boolean no refetchInterval; tipo corrigido para number|false.

No E2E, seletores de texto de nota coincidiam com histórico/cópia local; foram restringidos ao diário. Navegador offline mostrou que a mutação padrão TanStack podia ser pausada para envio futuro. Mutações da sala agora usam networkMode=always: falham imediatamente sem rede, permitem retentativa explícita com o mesmo UUID e não confirmam persistência antes do backend. Os testes novos desktop/mobile passaram após a correção, antes da regressão final registrada acima.

Rate limit global compartilhado por IP e limitação de todas as consultas /auth também não serviam para vários usuários no mesmo Wi-Fi. Mantida borda IP e proteção de credenciais; a cota autenticada vem de sessão verificada, com cota própria de jogo. /me não consome a cota de tentativas de senha. Teste anterior de 12 falhas por login continua passando e teste novo exercita 45 consultas /me consecutivas. Não há limitação desativada para facilitar as suítes.

Rolagens de sessão não são devolvidas por consultas/decisões legadas. Snapshots de resultado da sala ficam apenas nos eventos autorizados; PE na auditoria de ficha não copia o resultado secreto. Captura de máximos, treinamento e política de fadiga foi integrada para revalidar as telas. SIGTERM encerra streams antes de fechar o servidor; limites de conexão e fechamento são exercitados por HTTP real.

## Reprodução e ambiente

Instalar dependências com npm ci; criar .env.test pelo exemplo, com NODE_ENV=test e MySQL exclusivo terminado _test. Aplicar npm run db:test:deploy, depois npm run typecheck, npm test, npm run test:integration, npm run build. Instalar Chromium e executar npm run test:e2e. Neste cloud: PLAYWRIGHT_BROWSERS_PATH=/workspace/.cache/ms-playwright. Cada arquivo/perfil usa servidores novos para isolar cenários simulados; limites reais não são desativados.

```sh
node --env-file=.env.test node_modules/prisma/build/index.js validate
node --env-file=.env.test node_modules/prisma/build/index.js migrate status
node --env-file=.env.test node_modules/prisma/build/index.js migrate diff --from-config-datasource --to-schema prisma/schema.prisma --exit-code
node scripts/audit-migrations.mjs hibrido-mysql-test
```

O último comando exige Docker local/socket Unix e contêiner MySQL de teste explicitamente terminado -test. Inicializa mysqld sem rede num datadir aleatório temporário, aplica SQL exato e remove apenas esse datadir ao encerrar. Ensaia SQL limpo, sem executar o ledger Prisma; ainda ensaiar prisma migrate deploy em staging vazio e restauração.

## Limites que permanecem

Sem publicação Render, MySQL gerenciado, TLS/HTTPS reais, storage persistente de imagens, remoto Git, homologação do manual/fadiga com Marcus, carga/p95, auditoria WCAG integral, Firefox/WebKit ou aparelhos físicos. Testes funcionais e expectativas de espera não provam p95 para 20 usuários. Nenhuma conta/campanha de produção foi criada ou habilitada; transferências reais continuam desativadas por padrão.

SSE consulta MySQL por conexão; custos/limites do plano/proxy precisam ser medidos. Rate limits/caps são locais ao processo, sem store compartilhado. Retenção/limpeza agendada de presença/sessões/eventos/operacoes, paginação completa de listagens limitadas e observabilidade ficam para a próxima etapa. Sem fila offline persistente: fechar/recarregar texto não enviado pode perdê-lo. Sem sons obrigatórios, push, combate tático, consumo automático ou integração de IA narrativa.

Operador com acesso direto à infraestrutura/backups pode ler dados; contexto de interface não promete proteção absoluta contra spoilers ou apagar cópias já recebidas legitimamente. O núcleo local da Parte 4 tem evidências funcionais; a publicação e homologação do grupo são etapas separadas.
