# SISTEMA HÍBRIDO 2.6 — PLATAFORMA DIGITAL DE RPG
## PROMPT MASTER PARA CODEX
### PARTE 4 DE 5 — MODO SESSÃO, ROLAGENS COMPARTILHADAS, SINCRONIZAÇÃO, CONTROLE DE SOBREVIVÊNCIA E FERRAMENTAS DE JOGO

Você atuará como engenheiro de software full-stack sênior, arquiteto de aplicações multiusuário, especialista em React, TypeScript, Node.js, Express, Prisma, MySQL, segurança e experiência de usuário para jogos de RPG.

Sua missão é continuar o desenvolvimento da plataforma Sistema Híbrido 2.6, acrescentando um **Modo Sessão completo, funcional e integrado às fichas, campanhas e permissões existentes**.

O projeto já passou pelas etapas de arquitetura, autenticação, fichas digitais e administração de campanhas, conforme informado pelo proprietário.

Entretanto, não presuma que todas as funcionalidades estão corretas sem inspecionar o código e executar testes.

O sistema é destinado inicialmente a um grupo privado de RPG presencial.

O mestre Marcus utilizará principalmente o computador, enquanto os jogadores utilizarão principalmente celulares.

O administrador da plataforma também participa como jogador.

Esta etapa deverá tornar a aplicação realmente útil durante as sessões de RPG.

---

# 0. AUDITORIA OBRIGATÓRIA DAS PARTES ANTERIORES

Antes de desenvolver qualquer funcionalidade nova:

1. Inspecione o repositório.
2. Leia README.md.
3. Leia /docs/PROGRESSO.md.
4. Leia /docs/REQUISITOS.md.
5. Leia /docs/AUDITORIA_PARTES_1_2.md, se existir.
6. Examine as migrações Prisma.
7. Verifique os modelos de personagens.
8. Verifique os modelos de campanhas.
9. Verifique o sistema de autenticação.
10. Verifique os papéis ADMIN, GM e PLAYER.
11. Verifique o funcionamento do painel do mestre.
12. Verifique o salvamento das fichas.
13. Verifique o histórico de alterações.
14. Execute os testes disponíveis.
15. Identifique funcionalidades incompletas ou simuladas.

## Testes críticos

Verifique se:

- O jogador consegue fazer login.
- O jogador consegue abrir sua ficha.
- O jogador consegue editar campos permitidos.
- Os dados são salvos no MySQL.
- O mestre consegue acessar sua campanha.
- O mestre consegue visualizar fichas autorizadas.
- O mestre consegue editar fichas da própria campanha.
- Um jogador não consegue editar fichas de colegas.
- O administrador consegue acessar o painel administrativo.
- O administrador consegue utilizar sua própria ficha como jogador.

Corrija falhas críticas antes de avançar.

Se não houver conexão com o MySQL no ambiente atual, documente a limitação e não declare que a persistência foi testada.

Crie ou atualize:

/docs/AUDITORIA_PARTE_4.md

Registre o que foi verificado, corrigido e o que permanece pendente.

---

# 1. ARQUITETURA EXISTENTE

Preserve as tecnologias aprovadas:

Frontend:
- React.
- TypeScript.
- Vite.
- Tailwind CSS.
- React Router.
- TanStack Query.
- React Hook Form.
- Zod.

Backend:
- Node.js.
- Express.
- TypeScript.

Banco:
- MySQL.
- Prisma ORM.

Testes:
- Vitest.
- Supertest.
- Playwright quando disponível.

Hospedagem futura:
- Render para a aplicação.
- MySQL gerenciado compatível.

Não recrie o projeto.

Não substitua tecnologias sem justificativa e aprovação.

Não misture mecânicas de outros sistemas de RPG.

---

# 2. OBJETIVO PRINCIPAL

Implementar um ambiente chamado:

**MODO SESSÃO**

Cada campanha poderá possuir sessões de jogo.

Durante uma sessão, o mestre e os jogadores poderão:

- Entrar na sessão ativa.
- Consultar fichas.
- Rolar dados.
- Compartilhar resultados.
- Registrar ações.
- Alterar recursos.
- Consultar condições.
- Registrar eventos.
- Acompanhar o histórico.
- Receber atualizações.
- Utilizar ferramentas de sobrevivência.

A sessão deverá manter vínculo com a campanha e com os personagens participantes.

Não confundir sessão de jogo com sessão de autenticação.

---

# 3. CICLO DE VIDA DA SESSÃO

Implementar os estados:

SCHEDULED — Agendada.

ACTIVE — Em andamento.

PAUSED — Pausada.

FINISHED — Encerrada.

CANCELLED — Cancelada.

## Permissões

O mestre poderá:

- Criar sessão.
- Iniciar sessão.
- Pausar sessão.
- Retomar sessão.
- Encerrar sessão.
- Consultar histórico completo autorizado.

Jogadores poderão:

- Consultar sessões de suas campanhas.
- Entrar na sessão ativa.
- Registrar ações permitidas.
- Consultar informações compartilhadas.

O administrador global não deverá iniciar ou controlar sessões narrativas automaticamente apenas por possuir o papel ADMIN.

Ações excepcionais de manutenção deverão ser separadas e auditadas.

---

# 4. DASHBOARD DO MODO SESSÃO

Criar uma interface dedicada.

## Desktop

Organizar em painéis:

**Painel esquerdo**
- Participantes.
- Personagens.
- Recursos.
- Condições.

**Painel central**
- Rolagens.
- Eventos.
- Histórico da sessão.

**Painel direito**
- Ferramentas rápidas.
- Anotações.
- Controles do mestre.

## Mobile

Organizar em abas:

- Minha ficha.
- Dados.
- Grupo.
- Eventos.
- Anotações.

Manter PV, SAN e PE acessíveis rapidamente.

Não tentar reproduzir a interface desktop em escala reduzida.

Priorizar usabilidade durante sessões presenciais.

---

# 5. SALA DA SESSÃO

Criar uma rota como:

/campaigns/:campaignId/sessions/:sessionId

A página deverá mostrar:

- Nome da campanha.
- Identificador da sessão.
- Estado atual.
- Mestre.
- Participantes.
- Personagens presentes.
- Rolagens recentes.
- Eventos recentes.
- Ações disponíveis.

Não permitir acesso a usuários que não pertençam à campanha ou não possuam autorização específica.

---

# 6. PARTICIPANTES CONECTADOS

Exibir um indicador de presença.

Estados possíveis:

ONLINE.
AWAY.
OFFLINE.

Não confundir conexão ao site com presença física na sessão.

A presença deverá ser tratada como informação aproximada de conexão.

Utilizar heartbeat ou mecanismo equivalente.

Definir expiração de presença.

Não depender exclusivamente de eventos de fechamento da página, pois celulares podem suspender o navegador.

Preparar suporte para múltiplas abas do mesmo usuário sem duplicar indevidamente participantes.

---

# 7. SINCRONIZAÇÃO EM TEMPO REAL

Implementar atualizações compartilhadas entre dispositivos.

Priorizar uma solução compatível com a arquitetura atual e com a hospedagem prevista.

Avaliar:

- Server-Sent Events.
- WebSockets.
- Polling como fallback.

Escolher a opção mais simples que atenda aos requisitos reais.

Para uma primeira implementação, SSE com TanStack Query e fallback por polling é aceitável.

Não implementar infraestrutura complexa desnecessária.

## Eventos sincronizados

- Nova rolagem.
- Alteração de PV.
- Alteração de SAN.
- Alteração de PE.
- Nova condição.
- Condição removida.
- Item adicionado.
- Item removido.
- Sessão iniciada.
- Sessão pausada.
- Sessão encerrada.
- Novo evento compartilhado.

O servidor deverá controlar quais usuários recebem cada evento.

Não transmitir informações privadas ou secretas a usuários não autorizados.

---

# 8. RECONEXÃO

Celulares podem perder conexão durante uma sessão.

Implementar:

- Reconexão automática.
- Indicador de conexão.
- Atualização de dados ao reconectar.
- Recuperação de eventos recentes.
- Tratamento de eventos duplicados.
- Tratamento de eventos fora de ordem.

Não presumir que eventos enviados em tempo real serão sempre recebidos.

O banco MySQL continuará sendo a fonte oficial de dados.

O mecanismo em tempo real servirá para distribuir atualizações, não para substituir a persistência.

---

# 9. ROLADOR DE DADOS COMPARTILHADO

A Parte 2 já introduziu o rolador de dados.

Nesta etapa, amplie sua integração com campanhas e sessões.

Suportar:

- d4.
- d6.
- d8.
- d10.
- d12.
- d20.
- d100.
- Expressões simples como 2d6.

Não recriar um segundo motor de dados independente se já existir um módulo funcional.

Reutilizar a camada de regras.

---

# 10. TIPOS DE ROLAGEM

Implementar:

## PUBLIC

Resultado compartilhado com todos os participantes autorizados da sessão.

## PRIVATE

Resultado visível apenas ao jogador responsável e ao mestre, quando permitido pelas regras de visibilidade.

## GM_ONLY

Resultado visível somente ao mestre autorizado.

## GM_SHARED

Rolagem realizada pelo mestre e compartilhada com os jogadores.

A visibilidade deverá ser validada no backend.

Não enviar resultados secretos ao navegador de usuários não autorizados.

---

# 11. ROLAGENS OFICIAIS

Rolagens oficiais deverão ser geradas pelo servidor.

Utilizar um gerador aleatório criptograficamente seguro, como crypto.randomInt no Node.js, com limites apropriados.

Não aceitar um resultado arbitrário enviado pelo navegador como se fosse uma rolagem oficial.

O cliente deverá enviar:

- Tipo de dado.
- Quantidade.
- Perícia, quando aplicável.
- Personagem.
- Visibilidade.

O servidor deverá:

1. Autenticar usuário.
2. Verificar permissões.
3. Validar expressão.
4. Gerar resultados.
5. Aplicar regras.
6. Persistir a rolagem.
7. Emitir evento autorizado.
8. Retornar resultado.

Limitar quantidade de dados por operação para evitar abuso.

---

# 12. TESTES DE PERÍCIA

O Sistema Híbrido 2.6 utiliza rolagem de d20 igual ou inferior ao alvo.

Procedimento:

1. Selecionar perícia.
2. Consultar atributo associado.
3. Calcular alvo.
4. Aplicar treinamento.
5. Aplicar modificadores autorizados.
6. Rolar d20.
7. Comparar resultado.
8. Registrar sucesso ou falha.

Um 20 natural sempre falha.

Não utilizar d20 + bônus contra dificuldade.

## Exibição

Mostrar:

- Personagem.
- Perícia.
- Atributo.
- Alvo base.
- Modificadores.
- Alvo final.
- Resultado.
- Sucesso ou falha.

Não expor informações ocultas em rolagens públicas.

---

# 13. FADIGA

Preservar a configuração aprovada no projeto.

Configuração inicial sugerida anteriormente:

- Atletismo.
- Acrobacia.
- Furtividade.
- Luta.
- Reflexos.

Entretanto, consultar a configuração real persistida no projeto.

Não sobrescrever uma lista posteriormente aprovada pelo mestre.

Penalidades:

Fadiga 0: nenhuma.

Fadiga 1: −2.

Fadiga 2: −4.

Fadiga 3: −6.

Mostrar:

- Alvo original.
- Penalidade.
- Alvo final.

Não alterar permanentemente o alvo base da perícia.

Permitir modificadores contextuais autorizados pelo mestre.

---

# 14. PONTOS DE ESFORÇO

Preservar as regras aprovadas.

Bônus:
- Gastar 1 PE para aumentar o alvo em 2.

Repetição:
- Gastar 2 PE para repetir um teste recém-falhado de fuga ou resistência, quando autorizado.

Não combinar bônus e repetição no mesmo teste.

Não permitir PE negativo.

## Integridade

O gasto de PE e a alteração da rolagem deverão ocorrer em operação transacional.

Evitar gasto duplicado por:

- Cliques repetidos.
- Requisições duplicadas.
- Reconexões.
- Tentativas simultâneas.

Implementar identificadores idempotentes para operações críticas.

---

# 15. HISTÓRICO DE ROLAGENS

Registrar:

- ID.
- Sessão.
- Campanha.
- Personagem.
- Usuário.
- Expressão.
- Resultados.
- Alvo.
- Modificadores.
- Resultado final.
- Visibilidade.
- Data e hora.

Permitir filtros:

- Todas as rolagens visíveis.
- Minhas rolagens.
- Rolagens de perícia.
- Rolagens de dano.
- Rolagens do mestre.

Não revelar rolagens privadas por filtros ou contadores indevidos.

---

# 16. CONTROLE RÁPIDO DE RECURSOS

Criar um painel de sobrevivência.

Mostrar:

- PV atual/máximo.
- SAN atual/máximo.
- PE atual/máximo.
- Fadiga.
- Sangramento.
- Ferimentos.
- Estado crítico.

Permitir operações rápidas:

- Sofrer dano.
- Recuperar PV.
- Perder SAN.
- Recuperar SAN.
- Gastar PE.
- Recuperar PE.
- Alterar fadiga.
- Registrar condição.

Todas as operações deverão respeitar as permissões.

---

# 17. EVENTOS DE RECURSOS

Cada alteração deverá gerar um evento estruturado.

Exemplo:

Tipo: RESOURCE_CHANGED.

Personagem: ID correspondente.

Recurso: PV.

Anterior: 14.

Novo: 9.

Diferença: −5.

Responsável: usuário autenticado.

Data: timestamp do servidor.

Não confiar em valores anteriores enviados pelo cliente.

O servidor deverá consultar o estado atual e aplicar a operação de maneira consistente.

---

# 18. HISTÓRICO DA SESSÃO

Criar uma linha do tempo.

Eventos possíveis:

- Sessão iniciada.
- Participante entrou.
- Rolagem realizada.
- Recurso alterado.
- Condição aplicada.
- Item utilizado.
- Ferimento registrado.
- Anotação compartilhada.
- Sessão pausada.
- Sessão retomada.
- Sessão encerrada.

Não registrar automaticamente acontecimentos narrativos que não foram informados.

O histórico deve distinguir:

- Eventos mecânicos confirmados.
- Anotações narrativas.
- Informações administrativas.

---

# 19. VISIBILIDADE DOS EVENTOS

Implementar:

PUBLIC.
PRIVATE.
GM_ONLY.

A API deverá filtrar eventos de acordo com as permissões.

Não enviar eventos secretos aos jogadores.

A visibilidade dos eventos deverá ser independente da visibilidade de outros registros quando necessário.

---

# 20. DIÁRIO DA SESSÃO

Criar um diário com anotações.

Tipos:

- Anotação pessoal.
- Anotação compartilhada.
- Anotação do mestre.

Campos:

- Título.
- Conteúdo.
- Autor.
- Sessão.
- Visibilidade.
- Data de criação.
- Data de atualização.

Permitir edição pelo autor ou usuário autorizado.

Não permitir que um jogador edite anotações privadas de outro.

---

# 21. ANOTAÇÕES DO MESTRE

Criar uma área privada para Marcus.

Permitir registrar:

- Preparação da sessão.
- NPCs.
- Acontecimentos.
- Observações.
- Consequências.
- Segredos narrativos.

Não compartilhar essas informações automaticamente.

O administrador que participa como jogador não deverá visualizar notas narrativas secretas na interface comum.

---

# 22. RESUMO DA SESSÃO

Ao encerrar uma sessão, gerar um resumo estruturado.

Incluir:

- Identificação da campanha.
- Sessão.
- Data.
- Participantes registrados.
- Rolagens.
- Alterações de recursos.
- Condições.
- Eventos.
- Anotações compartilhadas.

Não inventar acontecimentos narrativos.

O resumo automático deverá utilizar somente dados registrados.

Permitir que o mestre acrescente um resumo narrativo manual.

Não exigir integração com IA para essa funcionalidade.

---

# 23. INVENTÁRIO DURANTE A SESSÃO

Integrar o inventário existente.

Permitir:

- Consultar itens.
- Alterar quantidades.
- Registrar uso.
- Registrar descarte.
- Consultar capacidade.
- Adicionar itens autorizados.

Não inventar regras de consumo automático.

O mestre deverá poder corrigir inventários conforme permissões.

Registrar alterações importantes.

---

# 24. TRANSFERÊNCIA DE ITENS

Implementar um fluxo de transferência entre personagens da mesma campanha, se a modelagem existente permitir.

Etapas:

1. Jogador escolhe item.
2. Escolhe quantidade.
3. Escolhe destinatário.
4. Sistema valida propriedade e disponibilidade.
5. Destinatário confirma recebimento ou mestre autoriza, conforme configuração.
6. Servidor valida capacidade.
7. Transferência é aplicada em transação.
8. Evento é registrado.

Não permitir duplicação de itens.

Não permitir transferir quantidade maior que a disponível.

Não permitir transferências entre campanhas sem autorização.

Se a mecânica de transferência ainda não estiver aprovada, deixar o fluxo desativado por configuração, sem impedir a conclusão das demais funcionalidades.

---

# 25. ESTADO CRÍTICO

Integrar o controle da Parte 2.

Mostrar:

- Estado crítico ativo.
- Sucessos.
- Falhas.
- Estabilização.

Não executar rolagens automáticas sem solicitação.

Não declarar morte ou recuperação fora das regras aprovadas.

Registrar alterações no histórico.

---

# 26. FERRAMENTAS DO MESTRE

Criar controles para:

- Iniciar sessão.
- Pausar.
- Retomar.
- Encerrar.
- Consultar participantes.
- Consultar recursos.
- Consultar condições.
- Realizar rolagens secretas.
- Compartilhar eventos.
- Registrar observações.
- Corrigir alterações.
- Consultar histórico.

Não incluir um sistema completo de combate tático nesta etapa sem especificação adicional.

---

# 27. FERRAMENTAS DOS JOGADORES

Criar acesso rápido a:

- Minha ficha.
- Meus recursos.
- Minhas perícias.
- Rolador.
- Inventário.
- Condições.
- Diário.
- Histórico visível.

Priorizar uso com uma mão no celular quando possível.

Evitar muitos cliques para ações frequentes.

---

# 28. NOTIFICAÇÕES DA SESSÃO

Exibir notificações discretas para:

- Nova rolagem pública.
- Alteração relevante de recurso.
- Sessão iniciada.
- Sessão pausada.
- Sessão retomada.
- Sessão encerrada.
- Nova anotação compartilhada.

Permitir silenciar notificações não essenciais.

Não utilizar sons obrigatórios.

Não exigir notificações push do navegador.

---

# 29. BANCO DE DADOS

Revisar o schema Prisma.

Adicionar ou adaptar entidades:

GameSessions.

SessionParticipants.

SessionEvents.

DiceRolls.

SessionNotes.

ItemTransfers.

PresenceRecords, se necessário.

Definir relacionamentos com:

Users.
Campaigns.
Characters.
CharacterResources.
CharacterConditions.
InventoryItems.

Utilizar índices para consultas por campanha, sessão e data.

Evitar duplicação desnecessária.

Aplicar migrações preservando os dados existentes.

---

# 30. API REST

Criar ou adaptar endpoints como:

GET /api/campaigns/:campaignId/sessions

POST /api/campaigns/:campaignId/sessions

GET /api/sessions/:sessionId

POST /api/sessions/:sessionId/start

POST /api/sessions/:sessionId/pause

POST /api/sessions/:sessionId/resume

POST /api/sessions/:sessionId/finish

GET /api/sessions/:sessionId/events

POST /api/sessions/:sessionId/events

POST /api/sessions/:sessionId/rolls

GET /api/sessions/:sessionId/rolls

GET /api/sessions/:sessionId/notes

POST /api/sessions/:sessionId/notes

GET /api/sessions/:sessionId/summary

GET /api/sessions/:sessionId/stream

Adaptar a nomenclatura conforme o projeto.

Todos os endpoints deverão validar autenticação e autorização.

---

# 31. SEGURANÇA

Verificar:

- Pertencimento à campanha.
- Permissão sobre personagem.
- Papel do mestre.
- Visibilidade de rolagens.
- Visibilidade de eventos.
- Visibilidade de anotações.
- Integridade de recursos.
- Proteção contra requisições duplicadas.
- Validação de entradas.
- Limites de taxa.
- Tratamento de erros.

Não permitir que um jogador consulte rolagens secretas alterando parâmetros da URL.

Não permitir que o frontend declare sucesso de uma rolagem oficial sem validação do servidor.

---

# 32. REQUISITOS FUNCIONAIS ADICIONAIS

Adicionar ao documento:

RF-045: Criar sessões de jogo.

RF-046: Iniciar sessões.

RF-047: Pausar sessões.

RF-048: Retomar sessões.

RF-049: Encerrar sessões.

RF-050: Entrar em sessão ativa.

RF-051: Consultar participantes.

RF-052: Realizar rolagens compartilhadas.

RF-053: Realizar rolagens privadas.

RF-054: Realizar rolagens do mestre.

RF-055: Registrar resultados.

RF-056: Sincronizar eventos.

RF-057: Consultar histórico.

RF-058: Alterar recursos durante sessões.

RF-059: Registrar condições.

RF-060: Criar anotações.

RF-061: Consultar anotações autorizadas.

RF-062: Gerar resumo da sessão.

RF-063: Consultar presença aproximada.

RF-064: Recuperar estado após reconexão.

RF-065: Registrar movimentações de inventário.

RF-066: Transferir itens quando autorizado.

---

# 33. REQUISITOS NÃO FUNCIONAIS ADICIONAIS

RNF-031: Sincronização eficiente.

RNF-032: Recuperação após desconexão.

RNF-033: Eventos persistentes.

RNF-034: Controle de acesso a eventos privados.

RNF-035: Geração segura de resultados oficiais.

RNF-036: Proteção contra duplicação de operações.

RNF-037: Interface mobile-first.

RNF-038: Desempenho adequado durante sessões.

RNF-039: Tratamento de conexões instáveis.

RNF-040: Compatibilidade com a infraestrutura de hospedagem.

RNF-041: Integridade transacional.

RNF-042: Histórico auditável.

---

# 34. REGRAS DE NEGÓCIO ADICIONAIS

RN-036: Somente o mestre autorizado poderá iniciar uma sessão.

RN-037: Somente participantes autorizados poderão acessar a sessão.

RN-038: Rolagens oficiais serão geradas pelo servidor.

RN-039: Rolagens privadas não serão exibidas a usuários não autorizados.

RN-040: Eventos secretos não serão enviados a jogadores comuns.

RN-041: Alterações de recursos deverão respeitar os limites mecânicos.

RN-042: Gastos de PE deverão ser transacionais.

RN-043: Uma operação crítica duplicada não poderá produzir efeitos duplicados.

RN-044: Sessões encerradas permanecerão disponíveis para consulta autorizada.

RN-045: Anotações privadas respeitarão suas permissões.

RN-046: A presença online não significará presença física.

RN-047: Transferências de itens deverão preservar quantidades.

RN-048: O administrador não receberá acesso narrativo automático no modo jogador.

RN-049: O banco de dados será a fonte oficial dos registros.

RN-050: A sincronização não substituirá a validação de regras no backend.

---

# 35. TESTES UNITÁRIOS

Testar:

- Rolagens.
- Alvos.
- Sucesso e falha.
- Modificadores.
- Fadiga.
- Gastos de PE.
- Limites de recursos.
- Estados de sessão.
- Validação de participantes.
- Visibilidade.
- Transferência de itens.

Não criar testes que apenas confirmem valores fixos de mocks sem verificar a lógica real.

---

# 36. TESTES DE INTEGRAÇÃO

Testar:

1. Mestre cria sessão.
2. Mestre inicia sessão.
3. Jogador autorizado entra.
4. Jogador não autorizado é rejeitado.
5. Jogador realiza rolagem pública.
6. Outros participantes visualizam resultado.
7. Jogador realiza rolagem privada.
8. Usuário não autorizado não recebe resultado.
9. Jogador reduz PV.
10. Mestre visualiza atualização.
11. Jogador gasta PE.
12. Requisição duplicada não gasta PE novamente.
13. Jogador registra condição.
14. Condição aparece após sincronização.
15. Jogador perde conexão.
16. Jogador reconecta.
17. Dados são recuperados.
18. Mestre pausa sessão.
19. Mestre retoma sessão.
20. Mestre encerra sessão.
21. Histórico permanece salvo.

Utilizar MySQL de teste quando disponível.

Não afirmar que o teste de persistência passou se apenas mocks foram utilizados.

---

# 37. TESTES DE SEGURANÇA

Verificar:

- Acesso indevido entre campanhas.
- Acesso a sessões privadas.
- Vazamento de rolagens secretas.
- Vazamento de anotações do mestre.
- Manipulação de resultados de dados.
- Gastos duplicados de PE.
- Edições de recursos alheios.
- Alteração indevida do estado da sessão.
- Reutilização de requisições.
- Manipulação de IDs.
- Eventos enviados a destinatários incorretos.

O mecanismo de eventos em tempo real também deverá aplicar autorização.

---

# 38. CRITÉRIOS DE ACEITAÇÃO

A Parte 4 estará concluída quando:

1. O mestre conseguir criar uma sessão.
2. O mestre conseguir iniciar a sessão.
3. Os jogadores conseguirem entrar.
4. O sistema exibir participantes.
5. Rolagens públicas forem compartilhadas.
6. Rolagens privadas permanecerem protegidas.
7. Recursos puderem ser atualizados.
8. Alterações forem persistidas.
9. Condições puderem ser registradas.
10. Eventos aparecerem no histórico.
11. Anotações puderem ser criadas.
12. Anotações privadas permanecerem privadas.
13. Reconexão recuperar o estado.
14. Sessões puderem ser pausadas.
15. Sessões puderem ser retomadas.
16. Sessões puderem ser encerradas.
17. O histórico permanecer disponível.
18. O sistema funcionar em celular.
19. O sistema funcionar em computador.
20. Os testes críticos passarem.

Não declarar a etapa concluída apenas porque as páginas foram renderizadas.

---

# 39. DOCUMENTAÇÃO

Atualizar:

README.md.

/docs/REQUISITOS.md.

/docs/PROGRESSO.md.

/docs/API.md.

/docs/REGRAS_RPG.md.

Criar:

/docs/MODO_SESSAO.md.

/docs/ROLAGENS.md.

/docs/SINCRONIZACAO.md.

/docs/AUDITORIA_PARTE_4.md.

Registrar:

- Arquitetura.
- Funcionalidades.
- Endpoints.
- Eventos.
- Regras.
- Permissões.
- Testes.
- Limitações.
- Pendências.

---

# 40. CONTINUIDADE ENTRE CELULAR E PC

Manter o repositório Git atualizado.

Registrar:

- Dependências.
- Migrações.
- Variáveis de ambiente necessárias.
- Comandos de desenvolvimento.
- Comandos de teste.
- Configuração de sincronização.
- Problemas conhecidos.

Não incluir credenciais ou segredos no Git.

Não presumir acesso ao banco local do computador a partir do Codex remoto.

---

# 41. ORDEM DE IMPLEMENTAÇÃO

**ETAPA 0 — AUDITORIA**

Verificar e corrigir os pré-requisitos das Partes 1, 2 e 3.

**ETAPA A — MODELAGEM**

Criar sessões, participantes, eventos, rolagens e anotações.

**ETAPA B — BACKEND**

Implementar serviços, autorização, rolagens oficiais e operações transacionais.

**ETAPA C — FRONTEND**

Construir Modo Sessão responsivo, painel de recursos e histórico.

**ETAPA D — SINCRONIZAÇÃO**

Implementar distribuição de eventos, reconexão e atualização de dados.

**ETAPA E — INTEGRAÇÃO**

Integrar fichas, inventário, condições, rolagens e diário.

**ETAPA F — QUALIDADE**

Executar testes, corrigir problemas e atualizar documentação.

Não avançar ignorando falhas críticas.

---

# 42. COMANDO FINAL

Continue o projeto existente do Sistema Híbrido 2.6.

Primeiro, execute uma auditoria das Partes 1, 2 e 3.

Corrija problemas críticos antes de desenvolver novas funcionalidades.

Depois, implemente um Modo Sessão completo e funcional.

O mestre Marcus deverá conseguir iniciar, controlar e encerrar sessões.

Os jogadores deverão conseguir participar utilizando celulares.

As fichas deverão permanecer integradas ao MySQL.

As rolagens oficiais deverão ser geradas pelo servidor.

Resultados públicos deverão ser compartilhados.

Resultados secretos deverão permanecer protegidos.

Alterações de PV, SAN, PE, condições e inventário deverão ser persistidas.

O sistema deverá suportar reconexão e histórico.

Preserve a identidade visual de terror e sobrevivência.

Não substitua funcionalidades reais por demonstrações estáticas.

Não declare testes concluídos sem executá-los.

Documente o progresso para continuidade posterior no computador.

**OBJETIVO FINAL DA PARTE 4: Transformar o Sistema Híbrido 2.6 em uma plataforma utilizável durante sessões reais de RPG, com mestre e jogadores conectados, fichas interativas, rolagens compartilhadas e histórico persistente.**

# FIM DA PARTE 4 — MODO SESSÃO E FERRAMENTAS DE JOGO.
