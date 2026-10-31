# Rolagens oficiais e compartilhadas

O motor único apps/api/src/dice-engine.ts é utilizado por fichas, sala e repetição de teste. Gera valores com crypto.randomInt, sem aceitar resultados do navegador. Expressões: 1–100 dados de 4, 6, 8, 10, 12, 20 ou 100 faces; exemplos 1d20 e 2d6. Não aceita somas arbitrárias, dados incompatíveis ou quantidades fora do limite.

A sala reutiliza createRoll, effort e authorizeRetry da Parte 2. GM pode rolar dados livres sem personagem; teste de perícia exige ficha autorizada e vinculada. Jogador usa sua ficha escolhida ao entrar. Dano é uma classificação do registro de dados, sem aplicação automática a recursos.

## Teste de perícia

Servidor consulta atributo/treinamento/configuração persistidos, calcula alvo base e fadiga, aplica decisão contextual autorizada e rola 1d20. Sucesso: resultado <= alvo final; 20 natural falha sempre. Limite superior do alvo continua 19. Não se usa d20 + bônus contra dificuldade.

Base, fadiga, modificador contextual, alvo final, resultado e conclusão ficam persistidos. A política atual da campanha prevalece; não é sobrescrita pela lista inicial de Atletismo, Acrobacia, Furtividade, Luta e Reflexos. Níveis 0..3: 0/−2/−4/−6 no alvo. O valor base não é alterado. GM pode decidir aplicação contextual e modificador numérico, com justificativa; jogador não pode se autorizar. Manual completo e homologação da proposta de fadiga por Marcus continuam pendentes.

## Visibilidade

| Tipo | Quem recebe |
|---|---|
| PUBLIC | Membros ativos autorizados da campanha/sala |
| PRIVATE | Autor da rolagem e, se permitido na sessão, GM em contexto explícito |
| GM_ONLY | Apenas GM ativo em contexto explícito |
| GM_SHARED | Rolagem realizada pelo GM e compartilhada com os membros autorizados |

PRIVATE para rolagem é diferente de nota PRIVATE: nota pessoal nunca ganha leitura automática pelo GM. A permissão de leitura PRIVATE pelo mestre é escolhida ao criar sessão e registrada em cada rolagem. Solicitar repetição é um ato explícito de compartilhar aquele teste com o GM para análise, mesmo quando o padrão privado da sessão o exclui.

GM_ONLY/GM_SHARED exigem função e contexto no backend. ADMIN global sem GM não autoriza visibilidade de mestre. Retirar o papel GM bloqueia inclusive repetição idempotente de resposta secreta. Endpoints pessoais /characters/:id/rolls retornam apenas rolagens sem sessão de jogo; decisões de uma rolagem de sessão também não são aceitas pelas rotas legadas. Resultados da sala não são copiados para snapshots de auditoria da ficha. A sala é a fonte autorizada para consultar esses resultados.

Filtros ALL/MINE/SKILL/DAMAGE/GM são aplicados depois da autorização SQL. Não há contador total de rolagens escondidas. Cursores são UUIDs opacos, pertencentes a registros visíveis. Tentar usar ID secreto para paginação não revela o registro nem sua posição interna.

## Pontos de esforço

- BONUS: 1 PE, +2 no alvo limitado a 19, reavalia o resultado, sem nova rolagem.
- REQUEST_RETRY: pedido sobre teste recém-falhado; não gasta PE.
- Autorização: GM ativo, categoria ESCAPE (fuga) ou RESISTANCE (resistência) e justificativa.
- RETRY: 2 PE, nova rolagem 1d20 do servidor, preservando initialResults. Reconfere autorização GM e saldo na transação.
- ACCEPT: encerra a janela sem custo. Novo teste fecha a janela anterior da mesma ficha, como na Parte 2.

Bônus e repetição não se combinam, e PE não fica negativo. UUID de operação, versão da rolagem, bloqueios e transação impedem gasto duplo por clique/reconexão/concorrência. A sala exige ACTIVE para decisões novas. Repetir a mesma requisição confirmada retorna a confirmação original, sem aplicar de novo, sempre após revalidar autorização; o frontend consulta o estado atual em seguida.

Histórico da sala registra mudança da rolagem com a mesma visibilidade. Gasto de PE gera também evento mecânico sem copiar resultado privado para a auditoria legada. Não há regras novas de recuperação incompleta, dano de armas, vantagens ou progressão presumidas.
