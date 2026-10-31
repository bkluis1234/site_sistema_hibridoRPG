# Validação — Parte 5 e retomada / Origem 0.5.0

31/10/2026 (America/Sao_Paulo). **Validação local concluída, PRONTO COM RESSALVAS.** Não houve deploy ou teste em provedores de produção. Histórico da Parte 4 preservado em [VALIDACAO_PARTE4.md](VALIDACAO_PARTE4.md).

| Verificação | Resultado observado |
|---|---|
| `npm test` | 91/91 em 7 arquivos; quatro casos específicos do medidor SSE |
| `npm run typecheck` | Aprovado; inclui agora os scripts TypeScript, além de API/contratos/regras/testes/web |
| `npm run test:integration` | 95/95 novamente na retomada, quatro arquivos, MySQL 8.4.13 real dedicado |
| `npm run test:e2e` | 20/20 execuções novamente na retomada: 10 cenários em desktop e celular Chromium emulado |
| `npm run build` | Aprovado; principal 472,63 kB / gzip 145,59 kB |
| Prisma generate/validate e migração de teste | Aprovados; quinta migração sem reset |
| `npm run audit:database` | Aprovado: cinco migrações desde vazio, TLS obrigatório, rejeição de CA inválida, restart, backup AES-256-GCM/restauração e smoke local do servidor compilado em modo production |
| `npm run audit:load -- 300` | Aprovado: 6.000 leituras, 400/400 sinais, p95 REST 261,51 ms / SSE 1.996,68 ms; RSS misto 531 MiB |
| `npm run audit:load:compiled -- 300`, sem old space restrito | Aprovado: 6.000 leituras, 400/400, p95 REST 254,18 ms / SSE 2.003,77 ms; RSS só backend 449 MiB |
| Carga compilada com old space 192 MiB, medidor anterior | REPROVADA: 399/400 sinais, zero erros HTTP; p95 REST 290,80 ms / SSE 2.021,54 ms; RSS 320 MiB |
| Carga interrompida no checkpoint | INCOMPLETA naquele momento: SIGTERM/143, sem relatório; histórico preservado |
| Carga completa na retomada, medidor por evento/cliente e old space 192 MiB | APROVADA: 6.000 leituras, 400/400, nenhum par ausente, zero erros; REST p95 265,66 ms / SSE 2.024,04 ms; RSS backend pico 318,83 MiB |
| Memória/streams e shutdown | HeapUsed pico 110,41 MiB, heapTotal 192,84 MiB e externa 15,30 MiB; zero streams após desconexões e saída 0/PID ausente. Método/limites em DESEMPENHO.md |
| Quatro testes do medidor corrigido | Aprovados, já incluídos nos 91 unitários |
| `npm run security:secrets`, `git diff --check` | Aprovados antes do checkpoint; scanner por padrões, sem garantia absoluta |
| `npm audit --json`, `npm ls --all --json` | Zero vulnerabilidades conhecidas reportadas / sem problemas de dependências na consulta desta etapa |
| CI GitHub Actions | APROVADA: [execução 41211653751](https://github.com/bkluis1234/site_sistema_hibridoRPG/actions/runs/41211653751) no commit 6b495eba79623933d66a30a52a77c445c5de9a2b; instalação, segredos, audit, Prisma/migrações, tipos, unitários, integração, build e E2E |
| Homologação Render/Aiven | Pendente; não declarada aprovada |

Total de regressão: **206 execuções** (91 + 95 + 20), sem contar rodadas repetidas ou ensaios adicionais como casos novos. Resultados de carga são locais; não validam o limite de CPU/RAM do Render Free.

O histórico da corrida/interrupção permanece em [CHECKPOINT_PARTE5.md](CHECKPOINT_PARTE5.md). Resultado atual, classificação e ressalvas em [AUDITORIA_FINAL.md](AUDITORIA_FINAL.md), método em [DESEMPENHO.md](DESEMPENHO.md) e métricas resumidas em EVIDENCIAS_PARTE5.json. Sem lint configurado; node --check dos dois arquivos JavaScript passou. Migrações: schema válido, cinco atualizadas e migrate diff sem diferenças no banco preservado. Verificação de links/matriz usa somente IDs de linhas definidas; IDs reservados em prosa não são requisitos implementados.

A confirmação remota é registrada por commit posterior somente documental com [skip ci], sem mudanças de código após a execução aprovada. O teste de carga/instrumentação de memória e o ensaio Docker/TLS/backup foram locais; não são etapas deste workflow.
