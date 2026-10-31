# Progresso — Origem 0.5.0 / retomada da Parte 5

**Retomada autorizada em 31/10/2026 (America/Sao_Paulo).** **PRONTO COM RESSALVAS:** auditoria e regressão locais concluídas; infraestrutura/homologação externas ainda pendentes. Não houve deploy. O estado da pausa foi preservado como histórico em [CHECKPOINT_PARTE5.md](CHECKPOINT_PARTE5.md).

Atualizado em 31/10/2026. Produto: Origem. Sistema de RPG: Sistema Híbrido 2.6. Base da auditoria: ce85c372fe1101ae0c19ee64a299c4e189cd20d8, com cinco commits anteriores preservados e publicados. O histórico detalhado das Partes 1–4 foi preservado em HISTORICO_PROGRESSO_PARTES_1_4.md. As referências são referencias/PARTE5_DEFINITIVA.md e referencias/RETOMADA_PARTE5.md; os prompts anteriores permanecem arquivados como solicitações, não evidências de conclusão.

## Arquitetura e funcionalidades preservadas

Monorepositório npm com React 19/TypeScript/Vite/Tailwind, TanStack Query/RHF/Zod/Lucide, Express 5, Prisma 7 e MySQL 8.4. Contas sem e-mail, Argon2id, sessões/CSRF, recuperação, convites GM e primeiro ADMIN por CLI; fichas 2.6, aprovações, inventário/condições/PE; campanhas, privacidade e administração; sessões, dados no servidor, diário, presença aproximada, SSE/fallback e transferências optativas preservados. Frontend servido pelo Express na mesma origem em produção. `start:render` reserva margem de memória com old space de 192 MiB; RSS/CPU reais ainda precisam de staging.

## Implementação da Parte 5

- Reconferência transacional de credencial/versão/estado no login; recuperação serializada e códigos reemitidos pelo operador com validade de 24 h. Códigos offline antigos não expiram retroativamente.
- Limite de dois trabalhos Argon2 simultâneos e fila de oito; limite acompanha a operação, mesmo com cliente desconectado. Taxas e validações anteriores mantidas.
- Política MySQL/TLS única para API e Prisma CLI, CA normalizada e modos inseguros recusados; conexão runtime de cinco e padrão CLI de duas.
- SSE com limite por conta/processo, liberação idempotente, backpressure no heartbeat, rotação e shutdown; timeouts de recebimento HTTP e cabeçalhos limitados.
- Renovação de inatividade de sessão gravada no máximo a cada cinco minutos e consultas independentes da sala em paralelo. Leitura de sessão permanece por requisição.
- Identidade pública Origem preservando o nome das regras; validações/status/datas em português e fuso de Brasília; estado de aprovação corrigido no cartão e texto de campanhas disponível.
- Páginas carregadas por demanda; falhas de carregamento e respostas temporárias não JSON exibem erro sem confirmar salvamento. Rótulo/autocomplete de senha e navegação por teclado revisados.
- Central de Ajuda com guias de jogador/mestre/administrador e leitura opcional persistente por conta, sem conceder permissões.
- Verificador local de segredos/histórico, CI com permissões mínimas e sem deploy, modelo render.yaml, guias de segurança/publicação/operação e matriz RF/RNF/RN.

## Migrações e dependências

Cinco migrações versionadas: foundation, interactive_sheet, campaign_management, game_sessions e security_and_help. A quinta acrescenta expiresAt opcional a recovery_codes e tutorial_progress, com FK e unicidade por usuário/guia. Aplicada no MySQL de teste existente sem reset; nenhum banco real foi alterado. Ensaios finais de instalação desde vazio, TLS, persistência e restauração são detalhados em AUDITORIA_FINAL.md.

Nenhuma dependência runtime nova nem atualização indiscriminada de major. Versões exatas seguem o package-lock.json. Prettier é ferramenta temporária de formatação, não uma dependência runtime adicionada. Scripts de auditoria: security:secrets, db:check, audit:database, audit:load e audit:load:compiled (Linux, backend em processo separado). O preload audit-runtime.mjs mede memória/streams somente em teste/IPC, sem endpoint. Nenhuma dependência adicional foi instalada na retomada. Nenhuma contratação, conta de produção, analytics ou upload externo.

## Comandos de execução e validação

```sh
npm ci --include=dev
# Preencher .env e .env.test pelos exemplos; nunca versionar os arquivos privados.
npm run db:generate
npm run db:deploy
npm run dev
npm test
npm run typecheck
npm run test:integration
npm run build
npm run security:secrets
npm run test:e2e
npm run db:check
npm run audit:database
npm run audit:load:compiled -- 300
```

Integração/E2E/carga exigem NODE_ENV=test e banco dedicado terminado em _test. O ensaio audit:database cria somente um contêiner MySQL local aleatório, com porta em loopback, e o remove ao terminar; requer Docker e OpenSSL. Não pode ser apontado a um provedor de produção. No cloud atual, Chromium está em /workspace/.cache/ms-playwright; use PLAYWRIGHT_BROWSERS_PATH nesse caminho. No PC/CI instale Chromium pelo Playwright.

## Evidências e estado real da retomada

O checkpoint ad71bde52a06ca99efcb402d6478f5494cda2a82 foi conferido localmente e no GitHub, limpo e sem divergência. Nenhum arquivo ou commit foi perdido. Os cinco commits originais e o checkpoint permanecem ancestrais do trabalho atual. Commits novos e sincronização são confirmados ao encerrar, sem force push.

- 91 unitários em sete arquivos aprovados, incluindo os quatro casos do medidor; typecheck aprovado agora também para scripts TypeScript; sintaxe JavaScript dos dois scripts de instrumentação validada. Lint não está configurado.
- 95 integrações reais MySQL aprovadas. 20 execuções E2E aprovadas novamente (10 cenários × dois perfis). Total da regressão: 206 (91 + 95 + 20).
- Build de produção aprovado, principal 472,63 kB / gzip 145,59 kB. Node 24.19.0/npm 11.9.0. Schema validado, cinco migrações atualizadas e migrate diff sem diferenças no banco preservado.
- Banco isolado: TLS obrigatório, migrações desde vazio, CA inválida rejeitada por API e Prisma, restart, backup AES-256-GCM/restauração e dados de ficha/tutorial via API aprovados. Smoke do servidor compilado em NODE_ENV=production passou localmente, com prontidão e proteção de rotas; não é prova de HTTPS no provedor.
- Medidor salvo no checkpoint foi reforçado por conjuntos esperados por evento/cliente. Duplicatas, sinais de clientes desconhecidos e eventos de preparação não mascaram perdas. Mantidos 400/400 e metas p95.
- Carga compilada com old space 192 MiB APROVADA: 20 fichas/streams, 6.000 leituras, zero erros, 400/400 sinais, sem pares ausentes; p95 REST 265,66 ms / SSE 2.024,04 ms. RSS pico do backend 318,83 MiB; heapUsed pico 110,41 MiB; heapTotal pico 192,84 MiB; externa pico 15,30 MiB. Limite total V8 informado: 384 MiB (diferente do old space).
- Após desconexões e cinco segundos: zero streams; RSS 318,83 MiB, heapUsed 54,56 MiB e externa 8,59 MiB. Encerramento com saída 0, PID ausente, sem OOM/reinício. Não se forçou GC; RSS retido e cinco minutos de ensaio não provam ausência de vazamento nem capacidade real do Render Free.
- Rodada antiga 399/400 continua REPROVADA; repetição 143 antiga continua INTERROMPIDA. Não reclassificadas. Nova rodada aprovada fornece evidência do estado atual, não da causa de toda a subcontagem antiga.
- npm audit voltou a reportar zero vulnerabilidades conhecidas. Scanner próprio e revisão de arquivos/histórico continuam com limites descritos em SEGURANCA.md. CI remota aprovada: [execução 41211653751](https://github.com/bkluis1234/site_sistema_hibridoRPG/actions/runs/41211653751), commit 6b495eb, concluída em 31/10/2026 às 11:52:10 (America/Sao_Paulo).

Métricas resumidas sem credenciais: EVIDENCIAS_PARTE5.json; método: DESEMPENHO.md; relatório: AUDITORIA_FINAL.md. Resultados antigos de 78 unitários/90 integrações e histórico das Partes 1–4 permanecem nos documentos históricos. Não somar repetições como novos testes.

## Pendências e próximos passos

0. CI remota foi aprovada e documentada; futuras alterações exigem nova revisão/CI. Não confundir verificações locais/remotas com homologação em Render/Aiven. Classificação: PRONTO COM RESSALVAS.

1. Proprietário: confirmar aceitação das limitações/custos dos planos Free, criar MySQL Aiven e serviço Render manualmente, configurar CA/usuários/privilégios/segredos. Os comandos exatos estão em PUBLICACAO.md. Render Free foi reconferido (0,1 CPU/512 MB); páginas Aiven retornaram HTTP 403 nesta retomada, então confirmar oferta/limites no painel.
2. Antes de jogadores reais: smoke tests HTTPS/cookies/proxy/SSE/cold start, backup e restauração no provedor, desempenho/memória no plano escolhido, responsáveis por incidentes e canal privado de segurança.
3. Marcus: homologar o manual completo, a proposta de fadiga e exceções ainda não fornecidas. Nenhuma regra de outro sistema foi adicionada.
4. Provedor de retratos não definido: seletor continua apenas prévia local. Exportação de fichas e novas versões de regras seguem previstas, sem funcionalidade fictícia.
5. Acessibilidade completa WCAG/leitor de tela, Firefox/WebKit/aparelhos físicos e auditoria independente ainda não foram certificadas. Testes automáticos cobrem os fluxos explicitados no relatório.
6. Definir privacidade/retenção, atendimento envolvendo menores e canal de titulares com responsável; não se declara conformidade LGPD. Rate limit compartilhado e orçamento de conexões precisam ser revistos antes de múltiplas réplicas.
7. Habilitar divulgação privada no GitHub e revisar workflows futuros. A primeira execução desta retomada passou; isso não certifica infraestrutura de produção.

## Encerramento desta retomada

Código/testes da medição e documentação foram registrados separadamente; um ajuste de espaços na referência foi preservado em commit próprio, sem reescrever histórico. A CI aprovou 6b495eb. O registro posterior dessa aprovação é somente documental, com [skip ci] para evitar repetição sem alteração de código. O hash final publicado é conferido no Git ao encerrar. Não há suíte/servidor local ativo; MySQL hibrido-mysql-test foi parado sem remover dados/volume. Nenhum erro permanece aberto nas verificações executadas; limitações de longo prazo, recursos pendentes e infraestrutura estão listadas acima, sem garantia de ausência de outros problemas.
