# Auditoria — Origem / Parte 5 e retomada

**Retomada autorizada em 31/10/2026 (America/Sao_Paulo).** O checkpoint ad71bde foi conferido localmente e no GitHub, sem divergência ou alterações locais. A validação local desta retomada foi concluída, com as ressalvas operacionais abaixo; os resultados distinguem o histórico. Não houve deploy. O checkpoint histórico permanece em [CHECKPOINT_PARTE5.md](CHECKPOINT_PARTE5.md).

Data: 31/10/2026. Versão: 0.5.0. Base: ce85c372fe1101ae0c19ee64a299c4e189cd20d8, cinco commits anteriores preservados. O prompt vigente está em referencias/PARTE5_DEFINITIVA.md; o diagnóstico inicial foi preservado em AUDITORIA_INICIAL_PARTE5.md. Produto Origem e Sistema Híbrido 2.6 continuam entidades conceituais distintas.

## Escopo, método e limites

Inventário de README, RF/RNF/RN, schema/cinco migrações, scripts, regras explícitas, relatórios anteriores, rotas/serviços/middleware, frontend e testes; revisão de diff, contratos, SQL bruto, projeções, dependências e histórico. Git status/log/branch/fetch confirmaram main/origin/main em ad71bde antes desta retomada, com os cinco commits originais preservados. O remoto é público e o bloqueio anterior de push foi resolvido. Nenhum arquivo prévio não commitado foi descartado.

Auditoria estática acompanhada de regressão local real: Vitest, Supertest/MySQL 8.4.13, Chromium/Playwright, migrações desde vazio, TLS com certificado de teste, reinício, backup cifrado/restauração e carga. Testes ativos foram limitados ao ambiente local/sintético. GitHub/npm e documentação oficial foram consultados normalmente; não houve teste de ataque contra fornecedores. Não é auditoria independente, certificação WCAG/LGPD nem prova de inexistência de vulnerabilidades. O manual integral do RPG continua pendente.

A matriz MATRIZ_RASTREABILIDADE.md relaciona os 147 IDs já existentes à implementação, testes e pendências. RF-024, storage de RF-031, versões futuras e homologações não foram marcados como completos.

## Achados de segurança e tratamento

São cinco achados/riscos de hardening revisados: **0 críticos, 3 altos e 2 médios**. Os cinco receberam alterações e verificações; não há achado alto de código conhecido deixado aberto neste escopo. Isso não certifica segurança absoluta nem libera infraestrutura de produção não configurada.

| ID | Severidade | Problema e correção | Verificação | Situação |
|---|---|---|---|---|
| S-01 (A-001 inicial) | ALTO | Contexto de senha podia ficar obsoleto antes de criar sessão. Login agora bloqueia a conta e reconfere hash/versão/estado; recuperação usa ordem coerente e READ COMMITTED. Cookie só após commit. | Dois testes novos forçam recuperação/desativação entre verificação e commit; login é negado e não cria nova sessão. | Corrigido no código; risco inicialmente identificado por revisão estática, sem alegação de exploração externa. |
| S-02 (A-002 inicial) | ALTO | TLS do adaptador não assegurava os mesmos parâmetros no Prisma CLI. Política compartilhada normaliza CA e impõe validação estrita, sem fallback inseguro. | MySQL isolado com transporte seguro obrigatório; engine e API conectam com CA válida e recusam outra CA. Cinco migrações completas desde vazio. | Corrigido e ensaiado localmente; Aiven real ainda precisa de configuração/verificação. |
| S-03 | ALTO | Muitas operações Argon2 simultâneas podiam esgotar memória de uma instância pequena. Dois trabalhos ativos e oito aguardando; excesso 503; vaga vinculada à tarefa, não à conexão HTTP. | Teste de limite/fila/falha/liberação; regressão de autenticação. | Controle implementado; calibrar no plano real. |
| S-04 | MÉDIO | SSE não tinha orçamento total por processo; heartbeat e duração precisavam de limites explícitos. Quatro por conta/cem por processo, backpressure, rotação de 30 min e liberação idempotente. | Teste unitário de orçamento; integração real de limite, revogação e shutdown; carga com 20 streams e 400 sinais. | Corrigido no escopo de processo único; cliente lento foi revisado no código, sem certificação em rede física/proxy real. |
| S-05 | MÉDIO | Código reemitido pelo operador não tinha prazo. Agora vence em 24 h e a emissão incrementa versão/revoga sessões; códigos offline anteriores conservam sua política. | Teste de código expirado sem revogar acesso legítimo; uso único/recuperação existentes preservados. | Corrigido; verificação da identidade do solicitante continua responsabilidade do operador. |

## Qualidade, funcionalidade e rastreabilidade

- A-003: Central de Ajuda com três guias, leitura opcional persistente e isolamento por conta. Não concede privilégios. Tutorial textual gerado da mesma fonte em TUTORIAIS.md.
- A-004: marca Origem, título/descrição, rótulos administrativos e de visibilidade, mensagens de validação e datas em português. Fuso de exibição Brasília; agendamento informa explicitamente o fuso local do dispositivo. Cartão distingue PENDING_APPROVAL. Texto que prometia campanhas futuras foi substituído pelo fluxo real. Detalhes opcionais de auditoria ainda podem mostrar identificadores técnicos dos registros para rastreabilidade.
- A-005: páginas por demanda; principal caiu de 560,09 kB / gzip 165,21 kB para aproximadamente 472,63 kB / gzip 145,59 kB, sem aumentar o limiar de aviso. O relatório de build final confirma os tamanhos.
- A-007: ensaio local completo de instalação/TLS/backup/restauração, sem tocar no datadir de testes anterior. Backup operacional do provedor ainda não existe.
- A-008: matriz de 147 IDs, sem inventar IDs reservados nem marcar exportação/retrato persistente como concluídos.
- A-009: cadastro e ajuda testados em 320/375/390/430/768/1024/1440 px; regressão das demais telas em desktop e Pixel 7 emulado. Labels, foco, atalho ao conteúdo e autocomplete de senha revisados. Não equivale a inspeção integral de todas as telas nessas larguras, auditoria completa de contraste ou leitor de tela.
- Falhas de carregamento de página recebem recuperação explícita; resposta HTML temporária não é aceita como JSON/salvamento. Prévia de imagem blob é permitida pela CSP, sem liberar scripts externos.
- Renovação do prazo ocioso deixou de escrever a cada polling e é gravada no máximo a cada cinco minutos; sessão continua lida por requisição. Consultas independentes da sala executam em paralelo, depois da autorização.

As Partes 1–4 mantêm contas, ficha, inventário, condições, campanhas/aprovações, administração, rolagens no servidor, PE, diário/visibilidades e SSE/fallback. Regras matemáticas não foram alteradas. Não há combate, cura, progressão ou dano de armas inventados. Não houve substituição de MySQL por arquivo/SQLite, reinicialização de projeto ou simplificação de recursos anteriores.

## Resultados executados

| Comando / verificação | Resultado | Limite |
|---|---|---|
| npm test | 91 testes aprovados, 7 arquivos | 78 de entrada + 13 da Parte 5; sem banco, incluindo quatro casos do medidor SSE |
| npm run test:integration | 95 testes aprovados, 4 arquivos | MySQL real dedicado, incluindo 5 casos novos de conta/ajuda/payload |
| PLAYWRIGHT_BROWSERS_PATH=/workspace/.cache/ms-playwright npm run test:e2e | 20 execuções aprovadas novamente nesta retomada: 10 cenários em desktop e 10 em celular | Chromium emulado; não aparelho físico nem todos os navegadores |
| npm run typecheck | Aprovado | API, contratos/regras, testes e frontend |
| npm run build | Aprovado, frontend/API compilados | Build local; Render ainda não executou build |
| npm run db:generate / db:validate | Cliente gerado e schema válido | Prisma 7.10.1 |
| npm run db:test:deploy | Quinta migração aplicada no MySQL existente, sem reset | Sem migração de produção |
| npm run audit:database | Cinco migrações desde vazio; TLS, persistência após restart, AES-256-GCM/checksum, restauração, consulta pela API e smoke do servidor compilado com NODE_ENV=production aprovados; CA errada recusada pela API e engine | Contêiner local descartável com dados sintéticos; certificado/provedor real não configurado |
| npm run audit:load -- 300 | 20 participantes com fichas, 6.000 leituras, zero erros; 400/400 sinais SSE; p95 REST 261,51 ms e SSE 1.996,68 ms | Cinco minutos locais; processo misto de servidor + clientes chegou a 531 MiB e não estima sozinho a memória do backend |
| npm run audit:load:compiled -- 300 | Retomada APROVADA: 20 fichas/streams, 6.000 leituras, zero erros, 400/400 pares evento/cliente e nenhuma entrega ausente; REST p95 265,66 ms / SSE 2.024,04 ms; RSS isolado pico 318,83 MiB com old space 192 MiB. Vinte streams liberados, saída 0, sem reinício | Backend separado dos clientes; memória local medida, capacidade do Render Free ainda não homologada |
| npm run security:secrets | Sem credencial real conhecida identificada nos arquivos/histórico examinados | Padrões limitados e revisão de placeholders/fixtures; não certifica ausência de qualquer segredo ou PII |
| npm audit --json | Zero vulnerabilidades conhecidas reportadas | Base consultada em 31/10/2026; não prova ausência de falhas |
| npm ls --all --json | Sem problemas de dependências reportados | Não substitui auditoria forense de cada pacote |
| git diff --check / links relativos da documentação | Sem erro / sem link relativo quebrado | Estado conferido ao revisar entrega |

A regressão desta retomada aprovou **206 execuções de testes** (91 + 95 + 20); não somar rodadas repetidas, preparação ou ensaios manuais como novos cenários. O benchmark e o ensaio de banco são evidências adicionais, não testes unitários. CI remota preparada não é declarada aprovada sem consultar uma execução concluída no GitHub.

## Persistência, migrações e backup

A migração 202610310005_security_and_help acrescenta expiresAt nullable e tutorial_progress, preservando códigos e fichas existentes. O ensaio isolado usa credencial aleatória, CA própria, MySQL 8.4 com TLS obrigatório e porta somente loopback; aplica Prisma deploy/status desde vazio. Cria e reabre a ficha pela API, verifica identificação/atributos/treinamentos/recursos/inventário/condições/progresso do tutorial após restart e após restauração em outro banco. Ledger Prisma também é restaurado/verificado. Testa acesso negado ao segundo cliente. Certificados, volume e backup sintéticos são removidos ao terminar. O relatório inicial de 17 passos foi ampliado para 18 com o tutorial.

RPO 24 h e RTO 4 h continuam metas do procedimento; não foram comprovados em Aiven/Render. Não há agendamento real, retenção definida pelo proprietário ou backup real de jogadores nesta tarefa. Não há credenciais de produção nem publicação de backup no GitHub.

## Segredos, dependências e CI

O verificador percorreu os 195 blobs do histórico de entrada e arquivos novos/modificados na primeira auditoria. Na retomada, reconferiu 271 blobs históricos alcançáveis (incluindo o checkpoint) e os arquivos de trabalho, sem achados; revisão final é repetida antes do push. Valores não são impressos. Esses totais de histórico crescem com os commits. Só .env.example e .env.test.example aparecem como exemplos; .env/.env.test não foram versionados. Valores encontrados em testes são sintéticos. A URL fictícia do guia foi sinalizada e substituída por placeholder explícito. Não foram identificados segredos reais que exigissem revogação nesta auditoria; não se reescreveu histórico.

Gitleaks não estava instalado; foi implementado verificador próprio com limites descritos em SEGURANCA.md. Ausência de achados por padrões não prova ausência de PII/segredo arbitrário. Examinar antes de cada publicação e usar scanner especializado/revisão independente quando disponível.

Nenhuma dependência runtime foi adicionada; versões do lockfile foram mantidas, com versão da aplicação 0.5.0. Há scripts de instalação conhecidos em engines Prisma, Argon2 e esbuild; fsevents é opcional por plataforma. Metadados/integrity e comandos foram revistos sem desativar scripts de segurança para aprovar testes. Prettier foi usado temporariamente em cache privado de tarefa; não virou dependência de produção.

Workflow com ações oficiais checkout/setup-node por SHA conferido, contents:read, credenciais de checkout não persistidas e MySQL efêmero com credencial sintética. PR comum, sem pull_request_target, segredos de produção, comentários automáticos ou deploy. Aprovação de contribuições externas e resultado efetivo da CI devem ser revisados pelo proprietário. SECURITY.md orienta divulgação privada; habilitar o canal e designar responsáveis são ações externas.

## Falhas intermediárias e correções do ensaio

- Primeiras tentativas do ensaio TLS falharam porque certificados públicos copiados ao contêiner não tinham leitura pelo processo MySQL. Corrigidas permissões dos certificados de teste e prontidão TCP; verificação de certificado não foi desativada. Em seguida, conexão válida e rejeição de CA inválida foram comprovadas.
- Primeira rodada E2E esperava PENDING e texto administrativo em inglês. A interface foi traduzida como solicitado; os testes passaram a exigir os rótulos em português e mantiveram as verificações de aprovação/permissões. A primeira execução também ocorreu durante edições/HMR; a regressão final ocorreu com código estável.
- Primeiro ensaio de carga simultâneo com E2E: p95 REST 609,76 ms excedeu meta de 500 ms; zero erros e SSE 1.967,11 ms. Foi registrado como falha, não reclassificado como aprovação. Depois de reduzir escritas de sessão e executar em condição controlada, o cenário com 20 fichas ficou abaixo das metas locais. Memória foi separada em ensaio compilado para não confundir clientes com backend.
- Com old space de 192 MiB, o benchmark registrou 399/400 sinais e falhou. Identificada corrida no medidor: SSE pode chegar antes de o POST e a consulta do ID registrarem o evento. SignalMeasurements agora reconcilia entregas antecipadas por evento/cliente e elimina duplicatas; dois testes unitários passaram, sem reduzir a exigência de 400/400. A repetição integral com o medidor corrigido foi interrompida com SIGTERM, saída 143, a pedido do proprietário. Essa validação ficou pendente naquele checkpoint; a retomada concluiu nova rodada completa com 400/400 e dados por cliente, sem reclassificar a falha antiga. Pico RSS 320 MiB é observação da rodada reprovada, não prova de aprovação do plano de 512 MB.
- Sandbox inicialmente impediu acesso padrão ao socket Docker; acesso de rede autorizado permitiu consultar o daemon local gerenciado. Não foi reiniciado nem substituído o daemon.

## Preparação de produção e pendências

A-006/A-010 iniciais são agora gates externos de implantação, não funcionalidades fictícias: GitHub acessível/publicado, Render/Aiven ainda não provisionados. PUBLICACAO.md contém tabela exata do Web Service, banco, TLS, variáveis, migrações no computador autorizado e smoke tests. Modelo render.yaml tem plan free e autoDeployTrigger off; não há Static Site separado nem deploy executado. npm run start:render executa o servidor compilado com old space de 192 MiB (não é limite de RSS total) em PORT/0.0.0.0; frontend é servido na mesma origem.

Planos consultados em 31/10/2026: Render Free 0,1 CPU/512 MB, suspensão/cold start/disco efêmero e limites mensais; Aiven Free com nó único/1 GB RAM/1 GB disco/max_connections 76, sem SLA e região não escolhida. Limites/custos/retenção precisam de confirmação no painel. Não houve contratação nem promessa de disponibilidade contínua ou custo total zero.

Antes de usuários reais: configurar fornecedores/CA/privilégios/backup, validar HTTPS/proxy/cookies/SSE/cold start, medir CPU/RAM/latência no plano real, revisar privacidade/retenção/menores e designar operação/incidentes. Manual e proposta de fadiga dependem de Marcus. Retrato persistente e exportação de ficha seguem pendentes; rate limit compartilhado é necessário antes de múltiplas réplicas. Navegadores físicos/leitor de tela/contraste WCAG integral não foram certificados.

## Medidor SSE e memória na retomada

A correção salva no checkpoint foi preservada e reforçada: cada evento possui conjunto explícito de clientes esperados; chegadas antecipadas são reconciliadas e duplicatas/clientes inesperados/eventos de preparação não completam entregas ausentes. Quatro unitários exercitam esses casos. A exigência de 400/400 e o cálculo de latência desde o POST foram mantidos. Não foi necessário alterar o transporte SSE da aplicação para fazer o ensaio passar. A nova aprovação não prova retrospectivamente que a subcontagem antiga inteira era somente instrumentação.

O backend compilado foi instrumentado exclusivamente por preload/IPC no teste, sem rota pública, telemetria externa ou logs de credenciais. As amostras a cada 100 ms medem memória do próprio PID; clientes e MySQL ficam fora. As métricas brutas resumidas estão em EVIDENCIAS_PARTE5.json; o método está em DESEMPENHO.md.

| Medida | Resultado em MiB |
|---|---|
| RSS na prontidão | 144,68 |
| RSS ao abrir os 20 streams | 230,33 |
| Pico RSS | 318,83 |
| Pico heapUsed | 110,41 |
| Pico heapTotal | 192,84 |
| Pico memória externa / arrayBuffers | 15,30 / 9,52 |
| Limite total de heap informado pelo V8 | 384,00; old space configurado em 192 MiB é apenas uma parte |
| Após desconexões + 5 s ocioso | RSS 318,83; heapUsed 54,56; externa 8,59; zero streams |
| Ao fechar servidor | RSS 318,83; heapUsed 54,59; zero streams |
| Após saída | Código 0, sem sinal, PID ausente, zero reinícios; não existe RSS do processo encerrado para amostrar |

Heap utilizado recuou e os streams foram liberados, mas o processo manteve RSS alocado. Não se forçou GC. O período curto e a retenção observada não provam ausência de vazamentos nem estabelecem tendência de longo prazo. A autenticação preparatória foi sequencial; logins concorrentes sob carga ainda precisam de homologação no plano real. Sem OOM/reinício nesta rodada. Falhas anteriores de p95 e 399/400, além da interrupção 143, permanecem documentadas em CHECKPOINT_PARTE5.md.

O schema MySQL existente foi validado, migrate status confirmou cinco migrações, e migrate diff banco→schema retornou sem diferenças. Os scripts TypeScript passaram a integrar o typecheck habitual; arquivos de instrumentação JavaScript passaram por node --check. Não há lint configurado e nenhum resultado de lint foi inventado.

## Classificação e ações externas

**PRONTO COM RESSALVAS.** A auditoria/validação local da Parte 5 foi concluída: 206 execuções aprovadas, build/typecheck, persistência/TLS/restauração, smoke compilado e carga de 400/400 com memória separada. Isso prepara o código para implantação controlada e não libera uso real antes de configurar e homologar a infraestrutura. Não há prova de capacidade do plano gratuito nem declaração de ausência absoluta de vulnerabilidades. A configuração e os limites atuais do Render foram conferidos na documentação oficial: Free, 0,1 CPU/512 MB, suspensão após 15 minutos, 750 horas/mês, disco efêmero e restrições de operação. As páginas oficiais Aiven consultadas retornaram HTTP 403 neste ambiente; os limites anteriormente registrados são referência histórica, sujeitos à confirmação no painel, e não uma nova verificação de oferta.

Mesmo com RSS local abaixo do orçamento nominal, a capacidade de CPU/RAM/latência do Render Free não foi homologada. Antes de usuários reais: confirmar oferta gratuita/região/retenção Aiven, criar serviços manualmente, segregar privilégios, configurar CA/segredos, migrar sem reset, testar HTTPS/proxy/cookies/CSRF/SSE/reconexão/cold start e backup/restauração do provedor. Não houve contratação ou deploy. Revisão do manual/fadiga com Marcus, retrato persistente, exportação e revisão integral de acessibilidade/privacidade continuam pendências explícitas.

## Git, alterações e próximos passos

A retomada preservou o checkpoint e o histórico original; não alterou o motor de regras nem removeu funcionalidades. Mudanças adicionais concentram-se em scripts/signal-measurements.ts, audit-load.ts, audit-load-compiled.mjs, novo audit-runtime.mjs, quatro testes do medidor, inclusão de scripts TypeScript no typecheck e documentação/evidências. A matriz manteve os 147 IDs definidos, sem inventar reservados, e teve referências genéricas corrigidas para os módulos reais.

Commits de código e documentação são preparados separadamente, segredos/arquivos são conferidos e main é enviada apenas por avanço normal. Hash final e igualdade com GitHub são confirmados ao encerrar. O workflow continua sem deploy ou segredos de produção; o resultado remoto só será declarado aprovado se observado.

Próxima ação do proprietário: ler PUBLICACAO.md, confirmar que Render/Aiven ainda oferecem os planos desejados e aceitar suas limitações antes de criar serviços manualmente. Depois configurar TLS/usuários/CA/segredos, migrar com credencial apropriada, criar ADMIN por CLI e solicitar/autorizar a implantação. Validar HTTPS/proxy/cookies/CSRF, cold start, reconexão, recursos e backup real em staging antes de jogadores. Marcus deve homologar as regras pendentes. Nenhum serviço externo, plano pago ou deploy foi criado nesta retomada.

## CI remota observada e publicação do código

[GitHub Actions 41211653751](https://github.com/bkluis1234/site_sistema_hibridoRPG/actions/runs/41211653751) concluiu com **success** no commit `6b495eba79623933d66a30a52a77c445c5de9a2b`, em 31/10/2026 às 11:52:10 (America/Sao_Paulo). Todas as etapas terminaram com sucesso: instalação reproduzível, scanner, npm audit, Prisma/generation/migrações/validação, typecheck, unitários, integração MySQL, build, instalação Chromium e E2E. Não executa deploy; ensaios de carga/memória/TLS/backup desta auditoria foram executados localmente e não são confundidos com passos da CI.

Este resultado é registrado em commit posterior somente de documentação com [skip ci]; nenhum código muda após a execução aprovada. Main é sincronizada sem force push; hash final é confirmado pelo Git no encerramento. MySQL local parado preservando volume, sem testes ou servidores locais pendentes. A checagem documental inicial encontrou espaços finais na referência colada; foram normalizados e git diff da retomada passou. A checagem da matriz passou a considerar as 147 linhas definidas do catálogo, excluindo corretamente menções a IDs reservados em prosa. Nenhum critério de entrega SSE foi afrouxado.
