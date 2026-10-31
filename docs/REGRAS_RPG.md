# Regras implementadas — Sistema Híbrido 2.6

## Fonte e escopo

A Parte 2 enviada pelo proprietário e a imagem oficial da ficha são as referências disponíveis. O Manual Híbrido 2.6 completo não foi anexado. As regras explícitas abaixo foram implementadas sem importar mecânicas de outros sistemas; regras não informadas permanecem pendentes. A confirmação posterior da lista de fadiga pelo proprietário está registrada ao final desta página. A aprovação de Marcus dessa proposta continua pendente.

Implementação compartilhada: packages/rpg-rules/src/index.ts. Servidor e frontend importam as mesmas funções. A API calcula os valores oficiais; o navegador mostra prévias, nunca envia máximos/alvos/resultados como autoridade. rulesVersion='2.6' permanece em cada ficha; versões desconhecidas são recusadas. Futuras versões exigem um módulo novo/migração explícita, preservando fichas anteriores e snapshots das rolagens.

## Atributos e criação

AGI (Agilidade), FOR (Força), INT (Intelecto), PRE (Presença), VIG (Vigor). Iniciam em 1; há três pontos adicionais. Valores inteiros de 0 a 3; pode reduzir **um** atributo a zero para recuperar um ponto. Implementação interpreta o singular como no máximo um zero. Rascunhos aceitam soma menor que oito, mas não excesso; finalização exige soma oito. Exatamente quatro perícias treinadas na finalização, no máximo quatro durante o rascunho, sem duplicatas.

Estado DRAFT permite mudar atributos/treinamentos. Submit valida nome, distribuição, treinamentos e carga e passa para PENDING_APPROVAL. Não cria aprovação fictícia: painel/fluxo de aprovação definitiva pertencem à Parte 3. O dono pode reabrir o pedido como DRAFT para corrigir. APPROVED bloqueia mudança mecânica direta; ARCHIVED permite somente leitura. Esses estados não são condições físicas.

## Recursos

- PV máximo = 10 + 2 × VIG.
- SAN máxima = 10 + 2 × PRE.
- PE máximo = 3 + PRE.

Recursos atuais são inteiros entre zero e o máximo. Novas fichas começam com os atributos em 1 e recursos 12/12, 12/12, 4/4. Aumentar um atributo depois disso altera o máximo sem recuperar o atual. Diminuir máximo limita o atual ao novo máximo e registra o ajuste. Máximos não são armazenados: derivam da versão de regras/atributos.

Ajustes SET e ADJUST são confirmados no servidor. Dano explicitamente informado em PV limita em zero; um ajuste genérico fora dos limites é rejeitado. Recuperação não ultrapassa o máximo. Não existem exceções de máximo sem fluxo autorizado implementado.

Evento SINGLE_ATTACK registra o dano de um ataque único e alerta quando seu valor é >= metade dos PV máximos. O alerta pede consulta ao teste de VIG/Fortitude; não gera teste, acerto ou ferimento automaticamente. DAMAGE registra dano sem afirmar ataque único. Redução genérica de PV não é interpretada como ataque.

## Perícias

| Perícia | Atributo | Perícia | Atributo |
|---|---|---|---|
| Atletismo | FOR | Acrobacia | AGI |
| Crime | AGI | Diplomacia | PRE |
| Fortitude | VIG | Furtividade | AGI |
| Iniciativa | AGI | Intimidação | PRE |
| Intuição | PRE | Investigação | INT |
| Luta | FOR | Medicina | INT |
| Ocultismo | INT | Percepção | PRE |
| Pilotagem | AGI | Pontaria | AGI |
| Profissão | INT | Reflexos | AGI |
| Religião | PRE | Sobrevivência | INT |
| Vontade | PRE | | |

Alvo base = min(19, 8 + 3 × atributo + 2 se treinada). Atributos 0/1/2/3 produzem 8/11/14/17 sem treino e 10/13/16/19 com treino. Profissão é texto livre e não seleciona treinamento automaticamente.

Rolar 1d20: resultado <= alvo é sucesso, salvo 20 natural, que sempre falha. Não existe d20 + bônus contra CD. Rolagem comum suporta 1 a 100 dados d4/d6/d8/d10/d12/d20/d100 e exibe faces/soma. Limites de quantidade são técnicos para proteger o serviço.

## Fadiga configurável

Níveis 0/1/2/3 aplicam 0/−2/−4/−6 ao alvo afetado. A ficha exibe alvo base, penalidade e alvo modificado separadamente, sem alterar atributos/treinamento. No nível 3, informa também deslocamento reduzido e recuperação incompleta de PE, sem inventar quantidades.

Configuração inicial explicitamente solicitada: **Atletismo, Acrobacia, Furtividade, Luta e Reflexos**. Aplica-se na ausência de configuração de campanha. A tela identifica que é uma proposta sujeita à revisão de Marcus. Campaign.physicalSkillKeys armazena substituição integral da lista; array vazio desativa em todas. Somente GM com vínculo ativo pode salvar a configuração pela tela/endpoint; login ADMIN ou habilitação global de mestre não bastam. Mudança é auditada e afeta próximos testes; rolagens anteriores mantêm seus snapshots.

Fortitude, Pilotagem, Pontaria ou outra perícia podem receber fadiga contextual quando um GM vinculado rola com fatigueOverride. O servidor rejeita o mesmo campo de um jogador. O GM pode aplicar ou não aplicar naquele teste, sem alterar a lista da campanha. Fluxos de membros/campanhas serão disponibilizados na Parte 3; o controle já funciona em fichas vinculadas legitimamente a uma campanha.

## Pontos de esforço nos testes

Após ver a rolagem e antes de confirmar a consequência, o autor pode:

- Aceitar sem gasto.
- Gastar 1 PE para somar 2 ao alvo modificado, limitado a 19. Um 20 continua falhando.
- Solicitar repetição de teste falhado. Um GM vinculado confirma categoria FUGA ou RESISTÊNCIA e justificativa; só então o autor pode gastar 2 PE e repetir 1d20.

Não combinar bônus e repetição, gastar PE insuficiente ou repetir gasto. Transação registra resultado, saldo e auditoria; operationId permite repetir a mesma requisição sem novo gasto. A autorização de GM é conferida novamente no momento do consumo e perde validade se o vínculo/conta deixar de estar ativo. Só existe janela de decisão para o último teste não encerrado; nova rolagem encerra janelas anteriores. Bônus/repetição encerram a decisão e a consequência continua a cargo do grupo.

## Inventário, armas e equipamentos

Capacidade = FOR × 5; FOR zero = 2. Ocupação = soma(quantidade × espaços por unidade), com precisão de duas casas para espaços. Quantidade inteira não negativa. Espaços não negativos; itens de zero espaços são permitidos se informados pelo grupo. Excesso é destacado e bloqueia submit, mas nunca exclui objetos.

Inventário é fonte canônica: equipamento é o mesmo item com equipment=true e campos tipo/dano. A seção de armas/equipamentos é uma projeção dessa lista e não soma espaços novamente. Ferramentas sem dano são aceitas. Referências 1d4/1d6/1d8 foram tratadas como propostas e **não** são atribuídas automaticamente. Dano é texto informado pelo usuário conforme aprovação do mestre; não é executado como código.

## Condições

Ferimentos têm descrição, localização, consequências, data e estado ACTIVE/TREATED/RESOLVED. Não aplicam penalidades automáticas. Sangramento é um indicador manual; perda de 1 PV/rodada permanece desativada, sem temporizador.

PV zero registra incapacitado e abre acompanhamento crítico, sem rolar testes. Sucessos/falhas ficam em 0..3. Três sucessos indicam STABLE, sem restaurar PV; três falhas indicam DEAD. Dano explicitamente informado durante crítico adiciona uma falha, mesmo se PV já era zero. Ajustes numéricos genéricos não adicionam falha. Contadores não realizam testes automaticamente. Acompanhamento estabilizado/morto não recebe novas marcações manuais de testes; dano informado ainda segue o incremento de falha descrito. O encerramento/limpeza manual exige PV acima de zero; não faz cura nem decide ressurreição como regra de jogo.

Reentrada em crítico, efeitos de dano após estabilização, protocolos de cura/ressurreição e detalhes de deslocamento/PE incompleto precisam de conferência com o manual/Marcus. Não há regra adicional presumida.

## Limites técnicos de entrada

Nome 80 caracteres, profissão 160, histórico 12.000, demais narrativas 4.000 (conceito 2.000). Idade 0..200, altura 0,10..4,00 m, peso 0,10..1.500,00 kg; altura/peso com duas casas. Esses limites são validações de formulário, não atributos ou restrições de raça/classe. Campos opcionais vazios permanecem nulos. Retrato tem prévia local PNG/JPEG/WebP, limite configurável; armazenamento externo ainda não conectado.


## Integração de sessão (Parte 4)

O Modo Sessão reutiliza as fórmulas e serviços desta documentação; não cria regras de combate, dano de armas, consumo automático ou cura presumida. Motor único de aleatoriedade em dice-engine.ts para ficha/sala/repetição. Rolagem de perícia persiste base, fadiga, modificador contextual autorizado, alvo final e resultado; 20 natural falha e limite superior continua 19.

Política de fadiga usa a configuração persistida da campanha. GM pode justificar aplicação contextual e modificador no alvo; jogador não pode se autorizar. BONUS 1 PE +2 e RETRY 2 PE mantêm exclusão mútua, autorização real GM e transação, conforme ROLAGENS.md. Presença online não é mecânica de RPG nem presença física. Eventos são registros confirmados, não inferências narrativas.

Transferências seguem somente o fluxo operacional explicitado na Parte 4 (quantidade, aceite, capacidade) e ficam desativadas por padrão até aprovação do GM da campanha. Não foram habilitadas campanhas reais nem presumidas regras adicionais de comércio, peso ou consumo. Manual completo e homologação de Marcus continuam pendentes.
