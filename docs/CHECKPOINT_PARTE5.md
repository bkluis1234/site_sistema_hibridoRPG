# Checkpoint de encerramento — Parte 5 do Origem

**Documento histórico da pausa.** A retomada posterior e seus resultados ficam em [PROGRESSO.md](PROGRESSO.md) e [AUDITORIA_FINAL.md](AUDITORIA_FINAL.md); as informações abaixo registram exatamente o estado de ad71bde.

31/10/2026 UTC. **EM ANDAMENTO. A Parte 5 não foi concluída.** Trabalho pausado a pedido do proprietário; não executar deploy ou novas rodadas longas sem retomar a tarefa. Nenhuma alteração foi descartada. Versão 0.5.0 indica desenvolvimento, não aprovação de produção.

## Git e continuidade

Projeto: `/workspace/sistema-hibrido`. Branch: `main`. Remoto: https://github.com/bkluis1234/site_sistema_hibridoRPG. Base preservada: `ce85c372fe1101ae0c19ee64a299c4e189cd20d8`, com seus cinco commits originais. Fetch antes do checkpoint confirmou local/remoto sem divergência. As alterações da Parte 5 são preservadas em um commit de checkpoint; consultar `git log -1` para o hash. Publicação efetiva será confirmada por comparação de HEAD com origin/main e pelo relatório da conversa, sem force push.

O commit usa `[skip ci]` para não iniciar outra rodada remota enquanto o trabalho está pausado. O workflow fica preservado, mas sua execução no GitHub permanece pendente. Render/Aiven não foram provisionados, contratados ou publicados.

No próximo ambiente, usar o repositório remoto como referência. Não presumir que `/tmp`, node_modules, navegadores, variáveis privadas, bancos ou volumes deste cloud existam no PC. Não copiar segredos por conversa, commit ou argumentos de comando.

## Alterações preservadas

- Login reconfere hash/versão/desativação sob lock antes da criação de sessão; recuperação serializada, expiração de código administrativo e revogação de sessões.
- Fila limitada de Argon2, política TLS compartilhada API/Prisma, limites de SSE, timeouts HTTP e redução de escritas de renovação de sessão.
- Quinta migração `202610310005_security_and_help`: expiração opcional de códigos e progresso de tutorial por usuário. Aplicada somente em teste, sem reset de dados existentes.
- Marca Origem, PT-BR/datas, lazy loading, feedback de erro, foco/acessibilidade básica e Central de Ajuda persistente.
- Scanner de segredos, workflow CI sem deploy, modelo Render Free, scripts locais de banco/carga e documentação de requisitos, segurança, operação e publicação.
- Motor do RPG preservado; manual completo e aprovação de Marcus ainda pendentes. Retrato persistente/exportação não foram apresentados como concluídos.

## Testes aprovados

| Verificação | Evidência local |
|---|---|
| Unitários | 89/89 em 7 arquivos; repetidos no encerramento, incluindo os 2 novos casos do medidor SSE |
| Typecheck | Aprovado; repetido no encerramento |
| Integração | 95/95 em 4 arquivos, MySQL real dedicado |
| E2E | 20/20 execuções, 10 cenários em desktop e celular Chromium emulado |
| Build frontend/API | Aprovado; principal 472,63 kB / gzip 145,59 kB |
| Prisma | Geração/validação e quinta migração em teste aprovadas |
| Banco isolado | Cinco migrações desde vazio, TLS obrigatório/CA inválida rejeitada em API e engine, persistência após restart, backup cifrado AES-256-GCM/checksum, restauração e consulta pela API |
| Smoke compilado | Servidor compilado com NODE_ENV=production e old space 192 MiB: prontidão, frontend Origem, API privada 401, 404 JSON e encerramento SIGTERM aprovados em loopback. Não testa HTTPS/provedor real |
| Dependências | npm audit sem vulnerabilidades conhecidas reportadas; npm ls sem problemas na consulta desta etapa |
| Segredos/diff | Verificador próprio e git diff --check aprovados na preparação do checkpoint; limites do scanner em SEGURANCA.md |

Regressão funcional: **204 execuções (89 + 95 + 20)**, sem contar repetições e ensaios operacionais como cenários novos. Logs brutos estão ignorados no Git. Este documento conserva somente os resultados sem credenciais. Não foram usados serviços externos de upload ou monitoramento.

## Carga, SSE e memória: onde exatamente parou

| Rodada | Resultado |
|---|---|
| Carga simultânea com E2E | REPROVADA: p95 REST 609,76 ms acima da meta local de 500 ms. Depois houve redução de escritas de sessão e execução isolada |
| Processo misto API + clientes, 5 min | APROVADA: 20 usuários com fichas, 6.000 leituras, zero erros, 400/400 sinais; p95 REST 261,51 ms / SSE 1.996,68 ms; RSS pico 531 MiB. Inclui clientes, não mede backend isoladamente |
| Backend compilado separado, sem heap restrito, 5 min | APROVADA: 6.000 leituras, zero erros, 400/400 sinais; p95 REST 254,18 ms / SSE 2.003,77 ms; RSS só backend pico 449 MiB |
| Backend compilado, old space 192 MiB, medidor anterior, 5 min | REPROVADA: 399/400 sinais, zero erros HTTP; p95 REST 290,80 ms / SSE 2.021,54 ms; RSS só backend pico 320 MiB |
| Backend compilado, old space 192 MiB, medidor corrigido | INCOMPLETA: interrompida com SIGTERM a pedido do proprietário, saída 143. Não produziu relatório final; não pode ser aprovada ou usada como prova de memória |

A corrida identificada estava na instrumentação: um sinal SSE podia chegar antes de a resposta POST e a consulta do ID registrarem o evento no medidor, sendo ignorado. `scripts/signal-measurements.ts` registra chegadas por evento/cliente e reconcilia ao registrar a publicação, sem duplicar entregas. Dois testes em `tests/unit/signal-measurements.test.ts` comprovam entrega antecipada e que duplicatas não ocultam um cliente ausente. `scripts/audit-load.ts` usa a classe e continua exigindo a quantidade exata de sinais, zero erros, REST p95 <500 ms e SSE p95 <5.000 ms.

**A hipótese explica uma possível subcontagem, mas não comprova que toda a rodada 399/400 foi erro do medidor.** É necessário concluir uma nova rodada completa com a correção. Não diminuir o esperado para 399 nem eliminar a asserção. O wrapper `scripts/audit-load-compiled.mjs` usa NODE_OPTIONS com old space 192 MiB, alinhado ao comando `start:render`. O limite de old space não limita toda a memória do processo: buffers, código nativo e Argon2 também consomem RSS.

As três medições 531/449/320 MiB pertencem a condições diferentes. Não declarar que o Render Free de 512 MB está validado: CPU de 0,1, proxy/rede, banco remoto, cold start e concorrência real ainda não foram ensaiados. Registrar também os picos durante autenticação simultânea na homologação futura.

## Processos e limpeza ao encerrar

A rodada interrompida e o backend de teste receberam SIGTERM; o orquestrador retornou 143. Não havia outra suíte ou servidor de desenvolvimento ativo identificado na verificação. As 20 contas sintéticas da rodada interrompida foram removidas pelo helper existente, somente após conferir NODE_ENV=test e nome de banco terminado em `_test`. Nenhuma conta de produção foi acessada.

O contêiner `hibrido-mysql-test` foi parado com Docker stop; não removido e nenhum volume apagado. O contêiner aleatório do ensaio TLS já havia sido removido pelo próprio script depois de passar. Não parar o daemon Docker ou processos do ambiente Codex. Processos defunct não executam testes e são responsabilidade do processo pai do ambiente.

## Próxima ação ao retomar

1. Ler este arquivo e PROGRESSO.md. Conferir `git status`, `git log -1`, remote e divergência; preservar o checkpoint e os cinco commits originais.
2. Preparar Node 24, dependências (`npm ci --include=dev`), MySQL 8.4 dedicado e `.env.test` privado conforme exemplo; instalar Chromium somente se for repetir E2E. No mesmo cloud, iniciar o contêiner preservado com `docker --host=unix:///var/run/docker.sock start hibrido-mysql-test`. No PC, criar ambiente local pelos guias, sem presumir o volume cloud.
3. Gerar Prisma, verificar/aplicar migrações somente no banco de teste (`npm run db:generate`, `npm run db:test:deploy`) e compilar (`npm run build`).
4. Executar sozinho `npm run audit:load:compiled -- 300` em Linux com banco `_test`. Não disputar CPU com E2E/build. Conferir saída 0, 6.000 leituras, 400/400 sinais, zero erros e metas p95. Se falhar, investigar sem relaxar critérios. Em Windows, o ensaio de RSS via /proc requer Linux/WSL compatível; não fingir resultado equivalente.
5. Revisar o medidor e a limpeza/sinais dos scripts de auditoria; se interrompidos novamente, verificar processos e fixtures. A interrupção atual foi tratada manualmente com limpeza limitada ao banco sintético.
6. Fechar revisão final de código/documentação, status/diff de migrações do banco existente e links. AUDITORIA_FINAL.md é rascunho preservado; não assumir classificação final. Rever rastreabilidade e executar testes adicionais apenas conforme alterações/risco.
7. Rodar/verificar CI remota em retomada autorizada. Publicação futura exige ações manuais em PUBLICACAO.md, segredos privados/CA/TLS, smoke HTTPS/proxy/cookies/SSE, backup/restauração do provedor e validação de recursos. Nenhum deploy foi autorizado nesta pausa.

Outras pendências: homologação do manual/fadiga por Marcus, persistência de retratos, exportação, revisão WCAG/navegadores físicos, privacidade/retenção e responsáveis de operação. Não declarar conclusão da Parte 5 antes de resolver ou classificar explicitamente os itens restantes.
