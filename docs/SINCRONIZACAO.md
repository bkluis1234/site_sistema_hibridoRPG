# Sincronização, presença e reconexão

## Escolha adotada

SSE distribui sinais de atualização; REST e MySQL continuam sendo a fonte oficial. Sem Redis, WebSocket ou estado narrativo oficial apenas em memória. O servidor consulta eventos persistidos a cada 2 segundos por stream e o navegador revalida TanStack Query após o sinal autorizado, com agrupamento de 250 ms. Essa escolha funciona entre processos que compartilhem o mesmo MySQL, com limites de escala a medir.

A transação de alteração mecânica grava também SessionEvent (outbox persistente). A integração inclui alterações pelas rotas de ficha fora da sala, durante ACTIVE/PAUSED. Campos de eventos são construídos por listas explícitas; não copiar snapshots de auditoria inteiros. Recurso informa valor anterior consultado no banco, novo valor, diferença, recurso, personagem e autor/data do servidor. Condições, inventário e ferimentos usam projeções sem notas privadas.

Ordem de bloqueios: campanha antes de sala/ficha; transferências bloqueiam fichas em ordem de ID. Um slot único por campanha limita a uma sala ACTIVE/PAUSED. EventSequence é interno para ordenação/serialização, separado da versão pública de ciclo de vida, evitando que uma nota secreta altere um contador público.

## Protocolo

GET /api/sessions/:id/stream?context=player|gm&after=UUID opcional. Cookie HttpOnly de autenticação, sem token de sessão na URL. O contexto não concede papel: backend confere vínculo GM. Last-Event-ID é aceito para reconexão nativa. Payload SSE contém apenas eventId UUID e type de evento **já autorizado**, sem resultados/notas. Conteúdo vem de GET autorizado; não há broadcast indiscriminado seguido de filtro no React.

Cache-Control: no-cache, no-transform; Content-Type: text/event-stream; X-Accel-Buffering: no. Sem middleware de compressão em SSE. Comentários de heartbeat mantêm conexão e não indicam contadores secretos. Limite de quatro streams por usuário e processo; o fallback permanece disponível. A cada tick, sessão de autenticação, validade, conta ativa e vínculo/papel são revalidados. Logout, desativação ou remoção encerram a conexão. Falha de consulta também encerra, sem enviar detalhes internos.

Cursores de eventos/rolagens são IDs de registros visíveis. Autorização precede paginação, filtros e contagens. Sequência numérica e lacunas privadas não são enviadas ao cliente. Ao reconectar, recuperar após cursor válido ou reconsultar o histórico recente. Páginas de eventos/rolagens têm 50 registros; os anteriores permanecem no MySQL e podem ser carregados por cursor.

## Navegador

EventSource reconecta automaticamente. Após três erros consecutivos, a sala usa consultas a cada 15 segundos e tenta SSE novamente após 30 segundos. Quando online, o evento online invalida os snapshots e reconecta. Dados recebem deduplicação por ID; sinais repetidos/fora de ordem apenas provocam revalidação de snapshots ordenados no servidor, sem reaplicar mudanças de saldo.

UI informa conectando/ao vivo/reconectando/atualização periódica/sem conexão. Metadados/presença revalidam periodicamente; dados de ficha/rolagem/diário usam invalidação e polling alternativo. Retorno à aba também utiliza refetch do TanStack. Avisos podem ser silenciados, sem áudio/push obrigatório. Preferência de silêncio é local à sala montada e não contém credencial.

Mutações da sala usam networkMode=always para falhar imediatamente offline; não ficam enfileiradas silenciosamente para envio automático ao reconectar. Salvo/confirmado só aparece após resposta do backend. Tentar novamente repete o mesmo UUID/payload; versão obsoleta retorna 409 e não sobrescreve o servidor. Formularios de nota/resumo mantêm o texto local durante erro, com opção de cópia/recarga explícita; não existe fila offline persistente.

## Presença aproximada

Heartbeat autenticado a cada 20 segundos, com UUID por aba montada, estado document.hidden e relógio do servidor. ONLINE: alguma aba visível vista há menos de 45 s. AWAY: alguma aba vista há menos de 90 s. OFFLINE: nenhuma recente. Múltiplas abas são agregadas numa pessoa; não duplicam o participante. O navegador pode ser suspenso; fechar aba não é a única fonte de saída. Registros usam FK da sessão de autenticação, removida no logout. Não significa presença física na mesa.

## Limites e produção

SSE consulta o banco por conexão; medir capacidade/custo com o grupo real. Metas iniciais em staging aquecido: mudança confirmada → tela <=5 s por SSE e <=20 s no fallback, p95 com 20 usuários. E2E tem limites funcionais de espera, não constitui teste de carga/p95. Leituras/salvamentos preservam metas RNF-016; ainda não verificadas em produção.

Rate limits: borda 12.000 requests/IP/15 min; conta autenticada 600 requests/15 min na API comum e 2.400/15 min nas rotas de jogo. Sem conta válida, cota por IP continua 600/15 min. Tentativas de credenciais mantêm 40/IP/15 min e 12/login/15 min; /auth/me e /csrf não consomem a cota de tentativas de senha. O grupo no mesmo Wi-Fi não divide a cota de uma única conta. Identidade do limitador vem da sessão verificada, nunca de header fornecido pelo usuário. Stores/caps ainda são locais ao processo: antes de escalar, adotar store compartilhado e testar topologia/proxy.

Render deve servir React/API na mesma origem HTTPS; MySQL gerenciado externo persistente com TLS. Conferir buffering/timeout/reconexão no plano real; não há publicação validada nesta entrega. Conexões SSE serão encerradas no desligamento do processo e os clientes recuperarão pelo MySQL. Limpeza agendada de presenças/eventos/operacoes e retenção exigem política antes da produção. Não apagar histórico para resolver conexão instável.


## Limites reforçados na Parte 5

Há quatro streams por conta e cem por processo, com reserva/liberação idempotentes. Backpressure fecha a conexão inclusive no heartbeat; reconexão recupera o estado pelo MySQL. Cada stream é rotacionado após trinta minutos. Intervalo de revalidação de autorização continua dois segundos; revogação não é instantânea. Shutdown fecha todos os streams. O limite de recebimento HTTP de trinta segundos não é limite da duração da resposta SSE já iniciada. Antes de múltiplas réplicas, revisar rate limit, orçamento de conexões, métricas e limites globais em infraestrutura compartilhada.
