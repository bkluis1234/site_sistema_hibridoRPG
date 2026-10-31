# Progresso — Origem 0.5.0 / checkpoint da Parte 5

**PARTE 5 EM ANDAMENTO, pausada a pedido do proprietário.** Retomar por [CHECKPOINT_PARTE5.md](CHECKPOINT_PARTE5.md). Não há declaração de conclusão ou deploy.

Atualizado em 31/10/2026. Produto: Origem. Sistema de RPG: Sistema Híbrido 2.6. Base da auditoria: ce85c372fe1101ae0c19ee64a299c4e189cd20d8, com cinco commits anteriores preservados e publicados. O histórico detalhado das Partes 1–4 foi preservado em HISTORICO_PROGRESSO_PARTES_1_4.md. A referência atual é referencias/PARTE5_DEFINITIVA.md; os prompts anteriores permanecem arquivados como solicitações, não evidências de conclusão.

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

Nenhuma dependência runtime nova nem atualização indiscriminada de major. Versões exatas seguem o package-lock.json. Prettier é ferramenta temporária de formatação, não uma dependência runtime adicionada. Scripts novos: security:secrets, db:check, audit:database, audit:load e audit:load:compiled (Linux, backend em processo separado). Nenhuma contratação, conta de produção, analytics ou upload externo.

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
npm run audit:load -- 300
```

Integração/E2E/carga exigem NODE_ENV=test e banco dedicado terminado em _test. O ensaio audit:database cria somente um contêiner MySQL local aleatório, com porta em loopback, e o remove ao terminar; requer Docker e OpenSSL. Não pode ser apontado a um provedor de produção. No cloud atual, Chromium está em /workspace/.cache/ms-playwright; use PLAYWRIGHT_BROWSERS_PATH nesse caminho. No PC/CI instale Chromium pelo Playwright.

## Evidências e estado real

Antes das correções: 78 unitários e 90 integrações reais MySQL passaram; typecheck/build aprovados, bundle inicial de 560,09 kB. Resultados finais, comandos e falhas intermediárias ficam em AUDITORIA_FINAL.md. Não confundir testes locais com execução GitHub Actions ou homologação em Render/Aiven.

Git remoto tornou-se público e o push dos cinco commits originais foi confirmado. As alterações desta etapa foram preparadas para um único commit de checkpoint solicitado pelo proprietário; conferir o hash e a sincronização no Git e no relatório da conversa. Não confundir checkpoint com aprovação final. Nenhum force push, reset de produção ou deploy automático autorizado.

## Resultados preservados no checkpoint

- Aprovados: 89 unitários (repetidos ao encerrar), typecheck (repetido), 95 integrações MySQL e 20 execuções E2E (10 cenários em dois perfis), build, geração/validação Prisma e aplicação da quinta migração em teste. Total de regressão: 204 execuções, sem somar repetições.
- Banco isolado: cinco migrações desde vazio, TLS válido/CA inválida rejeitada, restart, backup cifrado/restauração e smoke do servidor compilado com flags de produção aprovados localmente.
- Carga sem heap restrito aprovada: 20 usuários/6.000 leituras/400 sinais, backend compilado com pico RSS 449 MiB; medição mista cliente+servidor chegou a 531 MiB e não representa backend isolado.
- Carga com old space 192 MiB: pico RSS 320 MiB, zero erros HTTP, mas 399/400 sinais; rodada REPROVADA. Medidor SSE corrigido para entregas antecipadas/duplicatas, dois unitários aprovados; repetição de cinco minutos INTERROMPIDA a pedido (SIGTERM/143), sem resultado final. Exigência de 400/400 mantida.
- Processos de carga e servidor encerrados; somente as 20 fixtures sintéticas da rodada interrompida foram limpas do banco dedicado. Contêiner MySQL de teste foi parado preservando seus dados/volume. Nenhum arquivo de projeto ou commit descartado.
- Segredos: verificador próprio passou antes do checkpoint; limites em SEGURANCA.md. Auditoria npm consultada sem vulnerabilidades conhecidas. CI remota ainda não validada.

## Pendências e próximos passos

0. Retomar o ensaio `npm run audit:load:compiled -- 300` com medidor corrigido, em ambiente isolado, e só aceitar se 400/400, zero erros e metas p95 forem atendidas. Revisar RSS separado e finalizar a revisão da Parte 5 antes de classificá-la como pronta.

1. Proprietário: confirmar aceitação das limitações/custos dos planos Free, criar MySQL Aiven e serviço Render manualmente, configurar CA/usuários/privilégios/segredos. Os comandos exatos estão em PUBLICACAO.md.
2. Antes de jogadores reais: smoke tests HTTPS/cookies/proxy/SSE/cold start, backup e restauração no provedor, desempenho/memória no plano escolhido, responsáveis por incidentes e canal privado de segurança.
3. Marcus: homologar o manual completo, a proposta de fadiga e exceções ainda não fornecidas. Nenhuma regra de outro sistema foi adicionada.
4. Provedor de retratos não definido: seletor continua apenas prévia local. Exportação de fichas e novas versões de regras seguem previstas, sem funcionalidade fictícia.
5. Acessibilidade completa WCAG/leitor de tela, Firefox/WebKit/aparelhos físicos e auditoria independente ainda não foram certificadas. Testes automáticos cobrem os fluxos explicitados no relatório.
6. Definir privacidade/retenção, atendimento envolvendo menores e canal de titulares com responsável; não se declara conformidade LGPD. Rate limit compartilhado e orçamento de conexões precisam ser revistos antes de múltiplas réplicas.
7. Habilitar divulgação privada no GitHub e revisar resultado do workflow após publicação. CI configurada não significa CI executada com sucesso.
