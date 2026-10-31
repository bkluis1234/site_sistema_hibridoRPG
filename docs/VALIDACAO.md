# Validação — checkpoint da Parte 5 / Origem 0.5.0

31/10/2026 UTC. **Parte 5 em andamento, pausada a pedido do proprietário.** Não houve deploy ou teste em provedores de produção. Histórico da Parte 4 preservado em [VALIDACAO_PARTE4.md](VALIDACAO_PARTE4.md).

| Verificação | Resultado observado |
|---|---|
| `npm test` | 89/89 em 7 arquivos; repetidos no encerramento |
| `npm run typecheck` | Aprovado, inclusive na verificação rápida do checkpoint |
| `npm run test:integration` | 95/95, quatro arquivos, MySQL 8.4.13 real dedicado |
| `npm run test:e2e` | 20/20 execuções: 10 cenários em desktop e celular Chromium emulado |
| `npm run build` | Aprovado; principal 472,63 kB / gzip 145,59 kB |
| Prisma generate/validate e migração de teste | Aprovados; quinta migração sem reset |
| `npm run audit:database` | Aprovado: cinco migrações desde vazio, TLS obrigatório, rejeição de CA inválida, restart, backup AES-256-GCM/restauração e smoke local do servidor compilado em modo production |
| `npm run audit:load -- 300` | Aprovado: 6.000 leituras, 400/400 sinais, p95 REST 261,51 ms / SSE 1.996,68 ms; RSS misto 531 MiB |
| `npm run audit:load:compiled -- 300`, sem old space restrito | Aprovado: 6.000 leituras, 400/400, p95 REST 254,18 ms / SSE 2.003,77 ms; RSS só backend 449 MiB |
| Carga compilada com old space 192 MiB, medidor anterior | REPROVADA: 399/400 sinais, zero erros HTTP; p95 REST 290,80 ms / SSE 2.021,54 ms; RSS 320 MiB |
| Carga com medidor SSE corrigido e old space 192 MiB | INCOMPLETA: interrompida a pedido do proprietário, SIGTERM/saída 143; sem relatório final |
| Dois testes do medidor corrigido | Aprovados, já incluídos nos 89 unitários |
| `npm run security:secrets`, `git diff --check` | Aprovados antes do checkpoint; scanner por padrões, sem garantia absoluta |
| `npm audit --json`, `npm ls --all --json` | Zero vulnerabilidades conhecidas reportadas / sem problemas de dependências na consulta desta etapa |
| CI remota e homologação Render/Aiven | Pendentes; não declaradas aprovadas |

Total de regressão: **204 execuções** (89 + 95 + 20), sem contar rodadas repetidas ou ensaios adicionais como casos novos. Resultados de carga são locais; não validam o limite de CPU/RAM do Render Free.

A explicação da corrida do medidor, métricas, falhas intermediárias, comandos de retomada e processos parados estão em [CHECKPOINT_PARTE5.md](CHECKPOINT_PARTE5.md). A revisão parcial está em [AUDITORIA_FINAL.md](AUDITORIA_FINAL.md), cujo nome foi preservado por continuidade, sem declaração de auditoria final concluída.
