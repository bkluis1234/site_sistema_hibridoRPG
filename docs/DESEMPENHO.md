# Desempenho e memória do Origem

Ensaio local da retomada da Parte 5 em 31/10/2026 (America/Sao_Paulo). Não mede a infraestrutura Render/Aiven nem certifica disponibilidade ou ausência de vazamento. Resultados desta rodada estão registrados em EVIDENCIAS_PARTE5.json e AUDITORIA_FINAL.md.

## Método reproduzível

Preparar Node 24, MySQL 8.4 dedicado, `.env.test` privado com NODE_ENV=test e banco terminado em `_test`, aplicar as cinco migrações e gerar o build. Executar isoladamente:

```sh
npm run db:generate
npm run db:test:deploy
npm run build
npm run audit:load:compiled -- 300
```

O wrapper recusa um servidor existente em 127.0.0.1:3009, inicia um único processo Node compilado com old space de 192 MiB e roda os clientes em outro processo. Não altera a cota de requisições, o custo Argon2, os intervalos SSE ou a política de privacidade. Requer Linux para a leitura adicional de VmRSS em /proc; o PC Windows pode usar WSL com ambiente MySQL acessível e guarda de banco de teste. Não apontar o script para produção.

São 20 contas sintéticas, cada uma com ficha vinculada e participação ativa, 20 streams SSE e 6.000 consultas de sala em cinco minutos, mais 20 eventos públicos, esperados por cada um dos 20 clientes. Autenticação de preparação é sequencial, não um ensaio de pico de login concorrente. A comparação com o plano real precisa acrescentar esse cenário.

O medidor usa o relógio monotônico dos clientes: conta desde o início do POST até a chegada SSE. Guarda chegadas por evento/cliente antes mesmo de registrar a resposta HTTP. Duplicatas, clientes desconhecidos e eventos de preparação não completam o esperado. Verifica individualmente todas as 400 entregas e lista eventuais pares ausentes. Critérios mantidos: 400/400, zero erros, REST p95 <500 ms e SSE p95 <5.000 ms.

## Instrumentação restrita ao ensaio

`scripts/audit-runtime.mjs` é carregado por `--import` somente no subprocesso de teste com IPC. Não é importado pelo comando de produção e recusa execução sem NODE_ENV=test/IPC. Não cria endpoint, não recebe comandos arbitrários e não coleta corpo, cookie, usuário, URL de banco ou segredo. Acompanha respostas efetivas text/event-stream e sua liberação, memória process.memoryUsage e limite V8 a cada 100 ms. O IPC adiciona algum custo de medição ao ensaio.

Mede RSS, heapUsed, heapTotal, external e arrayBuffers, incluindo picos amostrados; intervalos curtos ainda podem não capturar todo pico instantâneo. Registra fases de prontidão, 20 conexões, desconexão, cinco segundos ociosos, pré-shutdown e fechamento do servidor. Não força GC. Depois do término, confirma saída e ausência do PID: a última amostra antes da saída não é apresentada como consumo de um processo já encerrado. Page cache do sistema e memória de clientes/MySQL não são RSS do backend.

Os sinais SIGINT/SIGTERM do wrapper são encaminhados ao cliente, que aborta streams e limpa somente suas fixtures no banco de teste antes de o wrapper encerrar o servidor. O shutdown do backend tem limite de 12 s no wrapper; encerramento por SIGKILL é falha, não aprovação. O script não reinicia o backend automaticamente.

## Histórico preservado

O checkpoint ad71bde registrou carga compilada com medidor anterior: 399/400 sinais e RSS de 320 MiB com old space 192 MiB. Essa rodada foi reprovada e não é reclassificada retroativamente. A primeira repetição corrigida foi interrompida a pedido do proprietário, saída 143. A retomada acrescenta verificação explícita dos pares evento/cliente e casos de cliente inesperado e perda por evento aos dois testes anteriores.

Outra rodada do checkpoint, sem heap restrito, havia passado com RSS de 449 MiB. A medição mista de API e clientes de 531 MiB não representa o backend isolado. Resultados de condições distintas não devem ser comparados como se fossem a mesma configuração. A falha de p95 REST de 609,76 ms com E2E concorrente também permanece registrada no histórico.

## Limites do plano gratuito

A documentação oficial Render foi reconferida nesta retomada: Web Service Free com 0,1 CPU e 512 MB RAM. Old space 192 MiB não limita RSS: V8, buffers, módulos nativos, TLS e Argon2 (até duas operações de 64 MiB) também consomem memória. Medição local abaixo de 512 MB não prova que o mesmo serviço cumprirá latência/memória na CPU, proxy, banco remoto e cold start do plano Free.

Antes de jogadores reais, homologar recursos no plano escolhido, incluindo logins simultâneos, reconexões, falhas de rede, disponibilidade do banco e recuperação após suspensão. Não manter a instância artificialmente acordada para contornar regras do provedor. Se as metas não forem atendidas, impedir abertura e apresentar alternativas ao proprietário sem contratar plano pago automaticamente. A documentação Render alerta que Free não é indicado para aplicações de produção com exigência de disponibilidade.

## Resultado da rodada completa desta retomada

APROVADA localmente: 20 participantes/fichas, 20 SSE, cinco minutos, 6.000 leituras, zero erros, 400/400 sinais e nenhum par evento/cliente ausente. P95 REST 265,66 ms e SSE 2.024,04 ms. RSS pico isolado 318,83 MiB; heapUsed pico 110,41 MiB, heapTotal pico 192,84 MiB, externa pico 15,30 MiB e arrayBuffers pico 9,52 MiB. V8 informou limite total de heap de 384 MiB; a opção old space 192 MiB não representa esse total.

Após desconexões e cinco segundos ociosos: zero SSE, RSS 318,83 MiB, heapUsed 54,56 MiB e externa 8,59 MiB. RSS retido, sem GC forçado. Shutdown com saída 0, sem sinal e PID ausente; nenhum reinício/OOM observado. Não há RSS do processo depois de sua saída. São 3.140 amostras, não uma certificação de estabilidade de longo prazo. A rodada curta de validação da instrumentação também passou (10 s), mas não substitui nem é somada ao cenário de cinco minutos.
