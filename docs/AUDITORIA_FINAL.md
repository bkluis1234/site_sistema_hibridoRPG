# Auditoria da Parte 5 — rascunho preservado no checkpoint

**Estado: EM ANDAMENTO.** Trabalho pausado a pedido do proprietário. Este arquivo preserva a revisão parcial e não declara a Parte 5 concluída. O ponto de retomada está em [CHECKPOINT_PARTE5.md](CHECKPOINT_PARTE5.md).

Data: 31/10/2026. Versão: 0.5.0. Base: ce85c372fe1101ae0c19ee64a299c4e189cd20d8, cinco commits anteriores preservados. O prompt vigente está em referencias/PARTE5_DEFINITIVA.md; o diagnóstico inicial foi preservado em AUDITORIA_INICIAL_PARTE5.md. Produto Origem e Sistema Híbrido 2.6 continuam entidades conceituais distintas.

## Escopo, método e limites

Inventário de README, RF/RNF/RN, schema/cinco migrações, scripts, regras explícitas, relatórios anteriores, rotas/serviços/middleware, frontend e testes; revisão de diff, contratos, SQL bruto, projeções, dependências e histórico. Git fetch confirmou main/origin/main na base antes das alterações. O remoto é público e o bloqueio anterior de push foi resolvido. Nenhum arquivo prévio não commitado foi descartado.

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
| npm test | 89 testes aprovados, 7 arquivos | 78 de entrada + 11 novos; sem banco |
| npm run test:integration | 95 testes aprovados, 4 arquivos | MySQL real dedicado, incluindo 5 casos novos de conta/ajuda/payload |
| PLAYWRIGHT_BROWSERS_PATH=/workspace/.cache/ms-playwright npm run test:e2e | 20 execuções aprovadas: 10 cenários em desktop e 10 em celular | Chromium emulado; não aparelho físico nem todos os navegadores |
| npm run typecheck | Aprovado | API, contratos/regras, testes e frontend |
| npm run build | Aprovado, frontend/API compilados | Build local; Render ainda não executou build |
| npm run db:generate / db:validate | Cliente gerado e schema válido | Prisma 7.10.1 |
| npm run db:test:deploy | Quinta migração aplicada no MySQL existente, sem reset | Sem migração de produção |
| npm run audit:database | Cinco migrações desde vazio; TLS, persistência após restart, AES-256-GCM/checksum, restauração, consulta pela API e smoke do servidor compilado com NODE_ENV=production aprovados; CA errada recusada pela API e engine | Contêiner local descartável com dados sintéticos; certificado/provedor real não configurado |
| npm run audit:load -- 300 | 20 participantes com fichas, 6.000 leituras, zero erros; 400/400 sinais SSE; p95 REST 261,51 ms e SSE 1.996,68 ms | Cinco minutos locais; processo misto de servidor + clientes chegou a 531 MiB e não estima sozinho a memória do backend |
| npm run audit:load:compiled -- 300 | Sem heap restrito: aprovado, 6.000 leituras, 400/400 sinais, REST p95 254,18 ms, SSE p95 2.003,77 ms, pico RSS 449 MiB. Com old space 192 MiB: rodada falhou com 399/400, pico RSS 320 MiB. Medidor corrigido; repetição interrompida a pedido, sem resultado final | Backend separado dos clientes; não representa CPU/rede/limites do Render Free. Não declarar o orçamento de memória validado |
| npm run security:secrets | Sem credencial real conhecida identificada nos arquivos/histórico examinados | Padrões limitados e revisão de placeholders/fixtures; não certifica ausência de qualquer segredo ou PII |
| npm audit --json | Zero vulnerabilidades conhecidas reportadas | Base consultada em 31/10/2026; não prova ausência de falhas |
| npm ls --all --json | Sem problemas de dependências reportados | Não substitui auditoria forense de cada pacote |
| git diff --check / links relativos da documentação | Sem erro / sem link relativo quebrado | Estado conferido ao revisar entrega |

São **204 execuções de testes** na regressão (89 + 95 + 20); não somar rodadas repetidas, preparação ou ensaios manuais como novos cenários. O benchmark e o ensaio de banco são evidências adicionais, não testes unitários. CI remota preparada não é declarada aprovada sem consultar uma execução concluída no GitHub.

## Persistência, migrações e backup

A migração 202610310005_security_and_help acrescenta expiresAt nullable e tutorial_progress, preservando códigos e fichas existentes. O ensaio isolado usa credencial aleatória, CA própria, MySQL 8.4 com TLS obrigatório e porta somente loopback; aplica Prisma deploy/status desde vazio. Cria e reabre a ficha pela API, verifica identificação/atributos/treinamentos/recursos/inventário/condições/progresso do tutorial após restart e após restauração em outro banco. Ledger Prisma também é restaurado/verificado. Testa acesso negado ao segundo cliente. Certificados, volume e backup sintéticos são removidos ao terminar. O relatório inicial de 17 passos foi ampliado para 18 com o tutorial.

RPO 24 h e RTO 4 h continuam metas do procedimento; não foram comprovados em Aiven/Render. Não há agendamento real, retenção definida pelo proprietário ou backup real de jogadores nesta tarefa. Não há credenciais de produção nem publicação de backup no GitHub.

## Segredos, dependências e CI

O verificador percorreu os 195 blobs do histórico de entrada e os arquivos novos/modificados, com revisão manual dos resultados. Só .env.example e .env.test.example aparecem como exemplos; .env/.env.test não foram versionados. Valores encontrados em testes são sintéticos. A URL fictícia do guia foi sinalizada e substituída por placeholder explícito. Não foram identificados segredos reais que exigissem revogação nesta auditoria; não se reescreveu histórico.

Gitleaks não estava instalado; foi implementado verificador próprio com limites descritos em SEGURANCA.md. Ausência de achados por padrões não prova ausência de PII/segredo arbitrário. Examinar antes de cada publicação e usar scanner especializado/revisão independente quando disponível.

Nenhuma dependência runtime foi adicionada; versões do lockfile foram mantidas, com versão da aplicação 0.5.0. Há scripts de instalação conhecidos em engines Prisma, Argon2 e esbuild; fsevents é opcional por plataforma. Metadados/integrity e comandos foram revistos sem desativar scripts de segurança para aprovar testes. Prettier foi usado temporariamente em cache privado de tarefa; não virou dependência de produção.

Workflow com ações oficiais checkout/setup-node por SHA conferido, contents:read, credenciais de checkout não persistidas e MySQL efêmero com credencial sintética. PR comum, sem pull_request_target, segredos de produção, comentários automáticos ou deploy. Aprovação de contribuições externas e resultado efetivo da CI devem ser revisados pelo proprietário. SECURITY.md orienta divulgação privada; habilitar o canal e designar responsáveis são ações externas.

## Falhas intermediárias e correções do ensaio

- Primeiras tentativas do ensaio TLS falharam porque certificados públicos copiados ao contêiner não tinham leitura pelo processo MySQL. Corrigidas permissões dos certificados de teste e prontidão TCP; verificação de certificado não foi desativada. Em seguida, conexão válida e rejeição de CA inválida foram comprovadas.
- Primeira rodada E2E esperava PENDING e texto administrativo em inglês. A interface foi traduzida como solicitado; os testes passaram a exigir os rótulos em português e mantiveram as verificações de aprovação/permissões. A primeira execução também ocorreu durante edições/HMR; a regressão final ocorreu com código estável.
- Primeiro ensaio de carga simultâneo com E2E: p95 REST 609,76 ms excedeu meta de 500 ms; zero erros e SSE 1.967,11 ms. Foi registrado como falha, não reclassificado como aprovação. Depois de reduzir escritas de sessão e executar em condição controlada, o cenário com 20 fichas ficou abaixo das metas locais. Memória foi separada em ensaio compilado para não confundir clientes com backend.
- Com old space de 192 MiB, o benchmark registrou 399/400 sinais e falhou. Identificada corrida no medidor: SSE pode chegar antes de o POST e a consulta do ID registrarem o evento. SignalMeasurements agora reconcilia entregas antecipadas por evento/cliente e elimina duplicatas; dois testes unitários passaram, sem reduzir a exigência de 400/400. A repetição integral com o medidor corrigido foi interrompida com SIGTERM, saída 143, a pedido do proprietário. A correção ainda precisa de validação de carga completa. Pico RSS 320 MiB é observação da rodada reprovada, não prova de aprovação do plano de 512 MB.
- Sandbox inicialmente impediu acesso padrão ao socket Docker; acesso de rede autorizado permitiu consultar o daemon local gerenciado. Não foi reiniciado nem substituído o daemon.

## Preparação de produção e pendências

A-006/A-010 iniciais são agora gates externos de implantação, não funcionalidades fictícias: GitHub acessível/publicado, Render/Aiven ainda não provisionados. PUBLICACAO.md contém tabela exata do Web Service, banco, TLS, variáveis, migrações no computador autorizado e smoke tests. Modelo render.yaml tem plan free e autoDeployTrigger off; não há Static Site separado nem deploy executado. npm run start:render executa o servidor compilado com old space de 192 MiB (não é limite de RSS total) em PORT/0.0.0.0; frontend é servido na mesma origem.

Planos consultados em 31/10/2026: Render Free 0,1 CPU/512 MB, suspensão/cold start/disco efêmero e limites mensais; Aiven Free com nó único/1 GB RAM/1 GB disco/max_connections 76, sem SLA e região não escolhida. Limites/custos/retenção precisam de confirmação no painel. Não houve contratação nem promessa de disponibilidade contínua ou custo total zero.

Antes de usuários reais: configurar fornecedores/CA/privilégios/backup, validar HTTPS/proxy/cookies/SSE/cold start, medir CPU/RAM/latência no plano real, revisar privacidade/retenção/menores e designar operação/incidentes. Manual e proposta de fadiga dependem de Marcus. Retrato persistente e exportação de ficha seguem pendentes; rate limit compartilhado é necessário antes de múltiplas réplicas. Navegadores físicos/leitor de tela/contraste WCAG integral não foram certificados.

## Estado no encerramento solicitado

**EM ANDAMENTO — CHECKPOINT, PARTE 5 NÃO CONCLUÍDA.** A classificação final de prontidão foi adiada. Os resultados locais aprovados acima permanecem evidências; o ensaio completo do medidor SSE corrigido e do orçamento de memória está incompleto. Revisão final de código/documentação e validação remota da CI também permanecem pendentes. Não houve deploy, contratação ou alteração de banco de produção. A retomada deve começar por CHECKPOINT_PARTE5.md.
