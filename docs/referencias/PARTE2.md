# SISTEMA HÍBRIDO 2.6 — PLATAFORMA DIGITAL DE RPG
## PROMPT MASTER PARA CODEX
### PARTE 2 — FICHA DIGITAL INTERATIVA, REGRAS, INVENTÁRIO, ROLAGENS E PERSISTÊNCIA

Você continuará o desenvolvimento da plataforma web Sistema Híbrido 2.6, iniciada na Parte 1.

Nesta etapa, sua responsabilidade é construir o núcleo principal da aplicação: **a ficha de personagem digital, editável, responsiva, persistente e mecanicamente consistente com as regras do Sistema Híbrido 2.6 de Marcus.**

A ficha deverá funcionar em celulares e computadores e manter a estética da imagem oficial fornecida.

Esta não é uma solicitação para criar um protótipo visual.

Implemente componentes React reais, validações, endpoints Express, integração Prisma/MySQL, testes e persistência.

---

# 1. CONTINUIDADE DO PROJETO

Antes de modificar qualquer arquivo:

1. Inspecione a estrutura existente.
2. Leia README.md.
3. Leia /docs/REQUISITOS.md.
4. Leia /docs/PROGRESSO.md.
5. Examine as migrações Prisma existentes.
6. Verifique os componentes já implementados.
7. Identifique quais funcionalidades da Parte 1 estão realmente prontas.
8. Execute os testes existentes, quando possível.

Não recrie o projeto do zero.

Não altere a arquitetura aprovada sem necessidade técnica justificada.

Tecnologias:

- React.
- TypeScript.
- Vite.
- Tailwind CSS.
- React Router.
- TanStack Query.
- React Hook Form.
- Zod.
- Node.js.
- Express.
- Prisma.
- MySQL.

Se alguma dependência ainda não estiver instalada, instale-a no ambiente autorizado e documente a alteração.

Se a Parte 1 não estiver concluída, implemente apenas os pré-requisitos indispensáveis e registre as pendências.

---

# 2. REFERÊNCIAS OBRIGATÓRIAS

A ficha deve utilizar:

**Referência visual:** imagem oficial "Ficha de Personagem — Sistema Híbrido 2.6".

**Referência mecânica:** Manual do Sistema Híbrido 2.6 de Marcus.

**Referência arquitetural:** Parte 1 do projeto.

A imagem contém as seções:

1. Identificação.
2. Atributos.
3. Recursos.
4. Perícias.
5. Inventário.
6. Armas e equipamentos.
7. Condições.

Não remover essas seções.

Não acrescentar classes, níveis, poderes, Defesa fixa ou outros elementos de sistemas diferentes sem aprovação.

Quando existir divergência entre a imagem, o manual e as instruções, documente a divergência e peça confirmação antes de implementar uma regra controversa.

Não invente regras ausentes.

---

# 3. OBJETIVO DA PARTE 2

Ao concluir esta etapa, um jogador autenticado deverá conseguir:

- Criar um personagem.
- Preencher sua identificação.
- Distribuir atributos.
- Selecionar perícias treinadas.
- Consultar alvos calculados.
- Visualizar PV, SAN e PE.
- Atualizar recursos atuais.
- Adicionar itens.
- Remover itens.
- Controlar espaços de inventário.
- Registrar armas e equipamentos.
- Registrar ferimentos.
- Controlar sangramento.
- Controlar fadiga.
- Registrar estado crítico.
- Realizar rolagens.
- Salvar alterações.
- Reabrir a ficha em outro dispositivo.
- Consultar um histórico básico de alterações.

A ficha deverá funcionar como ferramenta de jogo, não apenas como formulário de cadastro.

---

# 4. DESIGN DA FICHA

## 4.1. Estética

Reproduzir a identidade visual da ficha original:

- Fundo preto texturizado.
- Painéis escuros.
- Cabeçalhos vermelhos.
- Bordas desgastadas.
- Tipografia temática.
- Campos cinza-claro.
- Ícones de sobrevivência.
- Vermelho para PV.
- Roxo para SAN.
- Azul para PE.
- Âmbar para fadiga.

Manter contraste e legibilidade.

Não usar efeitos visuais que dificultem a leitura dos valores.

Criar a estética com CSS, recursos próprios e imagens autorizadas.

Não depender de uma única imagem estática como interface.

## 4.2. Layout desktop

Utilizar um layout semelhante ao documento original:

**Cabeçalho**
- Nome do sistema.
- Nome do personagem.
- Indicador de salvamento.
- Ações principais.

**Parte superior**
- Identificação.
- Retrato do personagem.

**Parte central**
- Atributos.
- Recursos.
- Perícias.
- Inventário.

**Parte inferior**
- Armas.
- Equipamentos.
- Condições.

Utilizar grid responsivo.

## 4.3. Layout mobile

Não reduzir toda a ficha proporcionalmente.

Organizar em seções ou abas:

- Resumo.
- Atributos.
- Perícias.
- Inventário.
- Condições.
- Histórico.

Exibir PV, SAN e PE em posição de acesso rápido.

Priorizar botões utilizáveis com os dedos.

Evitar tabelas horizontais excessivamente largas.

---

# 5. ESTADOS DO PERSONAGEM

Implementar os estados:

**DRAFT — Rascunho**

A ficha pode estar incompleta.

O jogador pode alterar atributos, perícias e identificação.

**PENDING_APPROVAL — Aguardando aprovação**

O jogador concluiu a criação.

A ficha está aguardando revisão, caso a campanha exija aprovação.

**APPROVED — Aprovada**

A ficha foi validada e aprovada.

Atributos iniciais e perícias treinadas ficam protegidos contra alterações não autorizadas.

**ARCHIVED — Arquivada**

A ficha permanece disponível para consulta, mas não é utilizada ativamente.

Não implementar a aprovação definitiva de forma a depender de um painel do mestre ainda inexistente.

Preparar o fluxo e integrar com a Parte 3.

Não confundir estado da ficha com condição física do personagem.

---

# 6. IDENTIFICAÇÃO

Implementar os campos:

- Nome.
- Apelido.
- Idade.
- Altura.
- Peso.
- Profissão.
- Imagem.

Campos narrativos complementares:

- Histórico.
- Aparência.
- Personalidade.
- Objetivos.
- Observações pessoais.

## Validação

Nome obrigatório para finalizar.

Apelido opcional.

Idade deve ser válida.

Altura e peso devem aceitar valores plausíveis, mas não devem determinar atributos automaticamente.

Profissão como texto livre.

Não implementar uma lista fechada de profissões.

## Imagem

Permitir:

- Selecionar arquivo.
- Pré-visualizar.
- Remover.
- Substituir.

Validar:

- Tipo de arquivo.
- Tamanho máximo configurável.
- Autorização do usuário.
- Armazenamento seguro.

Utilizar storage persistente compatível com o ambiente de produção.

Não depender do disco temporário do Render.

Se o storage ainda não estiver configurado, preparar o componente e a integração, deixando claramente identificado o que falta.

---

# 7. ATRIBUTOS

Os atributos são:

AGI — Agilidade.

FOR — Força.

INT — Intelecto.

PRE — Presença.

VIG — Vigor.

## Distribuição

Todos começam em 1.

O jogador recebe três pontos adicionais.

Pode reduzir um atributo para 0 e recuperar um ponto.

Limite inicial: 3.

A soma final deve ser 8.

## Interface

Criar cinco cartões interativos.

Cada cartão terá:

- Nome.
- Sigla.
- Ícone.
- Valor.
- Botão de aumentar.
- Botão de diminuir.
- Descrição curta.

Exibir:

"Pontos disponíveis: X"

Ao aumentar ou diminuir um atributo, atualizar imediatamente o saldo.

Não permitir ultrapassar os limites.

## Validação

Validar no frontend e no backend.

Rascunhos poderão conter distribuições incompletas.

A finalização exigirá uma distribuição válida.

Após aprovação, alterações dependerão de autorização apropriada.

---

# 8. RECURSOS

Implementar três cartões principais.

## Pontos de Vida

PV máximo = 10 + 2 × VIG.

## Sanidade

SAN máxima = 10 + 2 × PRE.

## Pontos de Esforço

PE máximo = 3 + PRE.

## Interface

Cada recurso deverá mostrar:

- Nome.
- Sigla.
- Valor atual.
- Valor máximo.
- Barra visual.
- Botão +.
- Botão −.
- Campo de edição numérica.

Exemplo:

PV 11/14.

## Regras

Os valores atuais não podem ser negativos.

Não podem superar os máximos sem exceção autorizada.

O usuário deve conseguir reduzir ou aumentar os valores durante a sessão.

Ao modificar atributos em um rascunho, recalcular os máximos.

Não conceder recuperação automática de recursos apenas porque o máximo aumentou.

Quando o máximo diminuir, limitar o valor atual ao novo máximo, registrando a alteração.

Ao criar um personagem novo, inicializar os recursos atuais com seus máximos quando os atributos estiverem definidos.

---

# 9. ALTERAÇÕES RÁPIDAS DE RECURSOS

Criar um componente ResourceControl.

Permitir:

- Reduzir 1 ponto.
- Aumentar 1 ponto.
- Informar quantidade personalizada.
- Confirmar alteração.
- Visualizar resultado.

Exemplo:

PV atual: 14.

Jogador registra 4 de dano.

Novo PV: 10.

Salvar a alteração no servidor.

Registrar no histórico:

- Recurso alterado.
- Valor anterior.
- Valor novo.
- Usuário responsável.
- Data e hora.

Não registrar automaticamente que um ataque acertou apenas porque o usuário reduziu PV.

---

# 10. PERÍCIAS

Implementar as 21 perícias:

Atletismo — FOR.

Acrobacia — AGI.

Crime — AGI.

Diplomacia — PRE.

Fortitude — VIG.

Furtividade — AGI.

Iniciativa — AGI.

Intimidação — PRE.

Intuição — PRE.

Investigação — INT.

Luta — FOR.

Medicina — INT.

Ocultismo — INT.

Percepção — PRE.

Pilotagem — AGI.

Pontaria — AGI.

Profissão — INT.

Reflexos — AGI.

Religião — PRE.

Sobrevivência — INT.

Vontade — PRE.

## Treinamento

Cada personagem começa com quatro perícias treinadas.

O treinamento fornece +2 ao alvo.

A profissão e o histórico justificam as escolhas narrativamente.

Não atribuir treinamento automaticamente com base no texto da profissão.

O jogador deverá selecionar as perícias.

## Fórmula

Alvo = 8 + (3 × atributo) + treinamento.

Limite máximo: 19.

## Tabela de referência

Atributo 0:
- Não treinado: 8.
- Treinado: 10.

Atributo 1:
- Não treinado: 11.
- Treinado: 13.

Atributo 2:
- Não treinado: 14.
- Treinado: 16.

Atributo 3:
- Não treinado: 17.
- Treinado: 19.

## Interface

Exibir:

- Nome da perícia.
- Atributo.
- Checkbox de treinamento.
- Alvo calculado.
- Botão de rolagem.

No celular, permitir visualizar as perícias em cartões ou linhas compactas.

Adicionar filtro:

- Todas.
- Treinadas.
- Não treinadas.

Permitir pesquisa pelo nome.

## Validação

Exatamente quatro perícias treinadas na finalização.

Rascunhos podem ter menos.

Não permitir mais de quatro na criação.

Mudanças posteriores deverão respeitar as permissões da campanha.

---

# 11. ROLADOR DE DADOS

Implementar um sistema de rolagens.

Suportar:

- d4.
- d6.
- d8.
- d10.
- d12.
- d20.
- d100.

Permitir rolagens de múltiplos dados.

Exemplo:

2d6.

Exibir cada resultado e a soma.

## Segurança e aleatoriedade

Utilizar geração aleatória adequada no ambiente escolhido.

Não usar resultados fixos ou sequências previsíveis.

Se as rolagens forem compartilhadas com a campanha, gerar ou validar o resultado no servidor, impedindo que o cliente envie resultados arbitrários como oficiais.

## Testes de perícia

O sistema utiliza rolagem igual ou inferior ao alvo.

Procedimento:

1. Identificar perícia.
2. Consultar atributo.
3. Calcular alvo.
4. Rolar 1d20.
5. Comparar resultado.
6. Exibir sucesso ou falha.

Um 20 natural sempre falha.

Exemplo:

Percepção.

Alvo: 13.

Resultado: 9.

Sucesso.

Não utilizar d20 + bônus contra CD.

## Apresentação

Mostrar:

- Perícia.
- Alvo.
- Resultado.
- Sucesso ou falha.
- Data e hora.

Adicionar animação discreta de rolagem.

A animação não deve atrasar excessivamente o resultado.

---

# 12. PONTOS DE ESFORÇO NOS TESTES

Implementar o registro das opções previstas no manual.

## Bônus

Gastar 1 PE para aumentar o alvo em 2.

Permitir decisão após visualizar o resultado da rolagem, mas antes de confirmar sua consequência.

Respeitar o limite máximo de alvo.

## Repetição

Gastar 2 PE para repetir um teste recém-falhado de fuga ou resistência, quando autorizado pelo mestre.

## Restrições

Não combinar bônus e repetição no mesmo teste.

Não permitir gastar mais PE do que o personagem possui.

Não permitir PE negativo.

Não permitir que o sistema declare automaticamente uma ação como elegível para repetição sem confirmação apropriada.

## Interface

Após a rolagem, quando aplicável:

- Aceitar resultado.
- Aplicar bônus de PE.
- Solicitar repetição com PE.

Registrar o gasto no histórico.

Impedir gasto duplicado por cliques repetidos.

Usar operações transacionais no servidor para registrar gasto e resultado de maneira consistente.

---

# 13. INVENTÁRIO

A ficha possui um inventário baseado em espaços.

## Capacidade

Espaços totais = FOR × 5.

Exceção:

FOR 0 = 2 espaços.

Tabela:

FOR 0: 2 espaços.

FOR 1: 5 espaços.

FOR 2: 10 espaços.

FOR 3: 15 espaços.

## Estrutura dos itens

Cada item terá:

- ID.
- Nome.
- Quantidade.
- Espaços por unidade.
- Descrição.
- Observações opcionais.

Espaços ocupados pelo item = quantidade × espaços por unidade.

Capacidade ocupada = soma dos espaços de todos os itens.

## Interface

Mostrar:

- Espaços utilizados.
- Capacidade máxima.
- Barra de ocupação.
- Lista de itens.
- Botão adicionar.
- Botão remover.
- Controles de quantidade.

## Exemplo

Mochila: 2 espaços.

Lanterna: 1 espaço.

Garrafa: 1 espaço.

Total: 4 espaços.

Esses valores são apenas exemplos de interface, não custos oficiais dos objetos.

O jogador ou mestre deverá definir os espaços conforme as regras aprovadas.

## Restrições

Quantidade não pode ser negativa.

Espaços não podem ser negativos.

Validar entradas numéricas.

Impedir a confirmação de uma ficha inicial com inventário acima da capacidade, salvo exceção formal aprovada.

Não excluir itens automaticamente quando a capacidade diminuir.

Em vez disso, indicar excesso de carga e exigir resolução.

---

# 14. GERENCIAMENTO DE ITENS

Implementar operações:

- Criar.
- Consultar.
- Editar.
- Excluir.
- Alterar quantidade.

Permitir descrições detalhadas.

Ao excluir, solicitar confirmação quando houver risco de perda de informações.

Registrar alterações relevantes no histórico.

Preparar a estrutura para transferências de itens entre personagens em uma versão futura.

Não implementar transferências sem autorização e validação.

---

# 15. ARMAS E EQUIPAMENTOS

Criar uma seção própria com os campos:

- Nome.
- Tipo.
- Dano.
- Descrição.

Referências propostas:

- Objeto leve ou improvisado: 1d4.
- Arma comum perigosa: 1d6.
- Arma especialmente perigosa: 1d8.

Essas categorias deverão ser tratadas conforme o status de aprovação no manual.

Não atribuir automaticamente dano a um equipamento desconhecido.

Não inventar propriedades de armas.

Permitir cadastrar ferramentas e equipamentos sem dano.

## Integração com inventário

Evitar contagem duplicada de itens.

Preferir que uma arma seja um item de inventário com informações adicionais de combate, mantendo uma visualização específica na seção de armas.

Se o modelo de dados existente usar tabelas separadas, manter referência consistente entre elas.

Não permitir que o mesmo objeto ocupe espaços duas vezes por erro de modelagem.

---

# 16. FERIMENTOS GRAVES

Implementar uma lista de ferimentos.

Cada ferimento terá:

- ID.
- Descrição.
- Localização.
- Consequências.
- Data de registro.
- Estado: ativo, tratado ou resolvido.

Permitir adicionar e editar ferimentos.

Não aplicar penalidades mecânicas automaticamente sem regra confirmada.

## Regra de referência

Dano de um único ataque igual ou superior à metade dos PV máximos exige teste de VIG + Fortitude, conforme o manual.

O sistema poderá mostrar um alerta quando o jogador registrar dano de um único ataque que atinja esse limite.

Não presumir que toda redução de PV corresponde a um ataque único.

O alerta deverá depender do tipo de evento informado.

---

# 17. SANGRAMENTO

Criar um controle:

Sangramento:

- Não.
- Sim.

Exibir indicador vermelho quando ativo.

A regra opcional de perda de 1 PV por rodada deverá permanecer desativada por padrão.

Não executar perda automática de PV com temporizadores no navegador.

Se Marcus aprovar essa regra futuramente, implementá-la como opção configurável da campanha.

---

# 18. FADIGA

Implementar níveis de 0 a 3.

Nível 0:
- Sem penalidade.

Nível 1:
- −2 no alvo de testes físicos.

Nível 2:
- −4 no alvo de testes físicos.

Nível 3:
- −6 no alvo de testes físicos.
- Deslocamento reduzido.
- Recuperação incompleta de PE.

## Interface

Criar quatro opções:

0, 1, 2, 3.

Mostrar o nível atual.

Mostrar os efeitos correspondentes.

Não presumir que todas as perícias são físicas.

Criar uma classificação configurável ou solicitar confirmação sobre quais testes recebem penalidade.

Enquanto essa classificação não estiver aprovada, não aplicar automaticamente a penalidade a todas as perícias.

O mestre deverá poder ajustar a interpretação conforme o manual.

---

# 19. ESTADO CRÍTICO

Implementar:

- Indicador de estado crítico.
- Contador de sucessos.
- Contador de falhas.

Limites:

3 sucessos.

3 falhas.

Quando PV chegar a zero, registrar a condição de incapacitado e disponibilizar o acompanhamento de estado crítico conforme o manual.

Não realizar testes automaticamente sem interação apropriada.

## Interface

Sucessos:

0/3.

Falhas:

0/3.

Permitir registrar resultados.

Três sucessos estabilizam.

Três falhas indicam morte conforme a regra.

Novo dano durante estado crítico acrescenta uma falha.

Não restaurar PV automaticamente após estabilização.

Registrar transições importantes.

---

# 20. PAINEL DE CONDIÇÕES

Criar o componente ConditionTracker.

Exibir:

- Ferimentos graves.
- Sangramento.
- Fadiga.
- Estado crítico.

Utilizar cores e ícones distintos.

Evitar depender exclusivamente de cores para transmitir informação.

Exibir textos claros.

Exemplo:

Fadiga: Nível 2.

Sangramento: Sim.

Ferimento: Perna esquerda lesionada.

Estado crítico: Não.

---

# 21. SALVAMENTO AUTOMÁTICO

Implementar autosave real.

## Funcionamento

Após alterações em campos de texto, aguardar um pequeno intervalo sem digitação antes de salvar.

Para ações críticas, como gasto de PE, alteração de PV ou registro de condição, utilizar operações imediatas e seguras.

## Estados

- Não salvo.
- Salvando.
- Salvo.
- Erro.

Não mostrar "Salvo" antes da confirmação do servidor.

## Falhas

Se a conexão falhar:

- Preservar o estado local temporário.
- Exibir aviso.
- Permitir tentar novamente.
- Evitar perda silenciosa de alterações.

Não considerar o armazenamento local uma substituição do banco.

---

# 22. CONCORRÊNCIA

O jogador e o mestre poderão abrir a mesma ficha em dispositivos diferentes.

Implementar controle de versão.

Exemplo:

Ficha versão 10.

O jogador modifica PV.

O mestre modifica uma condição.

As alterações não devem sobrescrever dados independentes.

Utilizar operações específicas por campo ou transações apropriadas.

Se houver conflito real, informar o usuário e oferecer atualização ou reconciliação.

Não sobrescrever silenciosamente dados recentes.

---

# 23. BACKEND E API

Implementar endpoints REST autenticados.

Sugestões:

GET /api/characters

POST /api/characters

GET /api/characters/:id

PATCH /api/characters/:id

POST /api/characters/:id/submit

GET /api/characters/:id/skills

PATCH /api/characters/:id/skills

PATCH /api/characters/:id/attributes

PATCH /api/characters/:id/resources

GET /api/characters/:id/inventory

POST /api/characters/:id/inventory

PATCH /api/characters/:id/inventory/:itemId

DELETE /api/characters/:id/inventory/:itemId

GET /api/characters/:id/conditions

PATCH /api/characters/:id/conditions

POST /api/characters/:id/injuries

PATCH /api/characters/:id/injuries/:injuryId

GET /api/characters/:id/history

POST /api/dice/roll

Adapte as rotas se necessário, mantendo consistência.

## Autorização

Todo endpoint deverá verificar:

- Usuário autenticado.
- Propriedade do personagem.
- Permissões de campanha.
- Papel administrativo.
- Estado de aprovação da ficha.
- Campos que podem ser modificados.

Não aceitar owner_id fornecido pelo cliente como prova de propriedade.

Obter identidade da sessão autenticada.

---

# 24. MODELAGEM DO BANCO

Revisar e completar as tabelas existentes.

## Characters

Campos essenciais:

- id.
- owner_id.
- campaign_id.
- name.
- nickname.
- age.
- height.
- weight.
- profession.
- backstory.
- personality.
- appearance.
- image_path.
- status.
- version.
- created_at.
- updated_at.

## CharacterAttributes

- character_id.
- agi.
- for_value.
- int_value.
- pre.
- vig.

## CharacterResources

- character_id.
- current_pv.
- current_san.
- current_pe.

## CharacterSkills

- character_id.
- skill_key.
- trained.

## InventoryItems

- id.
- character_id.
- name.
- quantity.
- slots_per_unit.
- description.

## CharacterConditions

- character_id.
- fatigue.
- bleeding.
- critical.
- critical_successes.
- critical_failures.
- stabilization_state.

## CharacterInjuries

- id.
- character_id.
- description.
- location.
- consequences.
- status.
- created_at.

## DiceRolls

- id.
- character_id.
- user_id.
- dice_expression.
- results.
- total.
- skill_key.
- target.
- outcome.
- created_at.

## CharacterAuditLogs

- id.
- character_id.
- actor_id.
- action.
- before_data.
- after_data.
- created_at.

Usar tipos adequados.

Criar índices e relações.

Não duplicar informações derivadas sem necessidade.

Os valores máximos de PV, SAN, PE e alvos podem ser calculados a partir dos atributos e regras versionadas.

---

# 25. CAMADA DE REGRAS

Criar um módulo independente em:

/packages/rpg-rules

Implementar funções puras para:

- Validar atributos.
- Calcular pontos disponíveis.
- Calcular PV máximo.
- Calcular SAN máxima.
- Calcular PE máximo.
- Calcular capacidade de inventário.
- Calcular alvo de perícia.
- Validar quantidade de perícias treinadas.
- Calcular espaços ocupados.
- Determinar sucesso de teste.
- Consultar penalidades de fadiga.
- Verificar limites de recursos.

Exemplos de nomes:

validateAttributes()

calculateMaxPV()

calculateMaxSAN()

calculateMaxPE()

calculateInventoryCapacity()

calculateSkillTarget()

validateTrainedSkills()

calculateInventoryUsage()

resolveSkillCheck()

Não espalhar fórmulas em componentes React.

O backend deverá utilizar a mesma camada de regras ou uma implementação compartilhada segura.

---

# 26. VALIDAÇÕES

Implementar schemas Zod compartilhados quando apropriado.

Validar:

- Strings.
- Valores numéricos.
- Identificadores.
- Quantidades.
- Estados permitidos.
- Campos obrigatórios.
- Limites mecânicos.
- Permissões.

O frontend deverá fornecer feedback imediato.

O backend deverá rejeitar dados inválidos independentemente do frontend.

---

# 27. TESTES AUTOMATIZADOS

Criar testes unitários.

## Atributos

- Distribuição padrão válida.
- Distribuição com atributo 0.
- Distribuição acima do limite.
- Distribuição incompleta.
- Tentativa de atributo negativo.

## Recursos

- PV com VIG 0, 1, 2 e 3.
- SAN com PRE 0, 1, 2 e 3.
- PE com PRE 0, 1, 2 e 3.
- Atualização de valores atuais.
- Limites mínimos e máximos.

## Perícias

- Alvos treinados.
- Alvos não treinados.
- Limite 19.
- Quatro perícias treinadas.
- Tentativa de cinco perícias.
- Resultado natural 20.

## Inventário

- Capacidade com FOR 0.
- Capacidade com FOR 1, 2 e 3.
- Soma de espaços.
- Quantidades.
- Itens sem espaços válidos.
- Excesso de capacidade.

## Condições

- Fadiga 0 a 3.
- Sangramento.
- Ferimentos.
- Estado crítico.
- Sucessos e falhas.
- Estabilização.

## Persistência

- Criar ficha.
- Editar ficha.
- Salvar.
- Reabrir.
- Rejeitar alterações inválidas.
- Impedir acesso de usuário não autorizado.

---

# 28. CRITÉRIOS DE ACEITAÇÃO

A Parte 2 estará concluída quando:

1. Um jogador conseguir criar uma ficha.
2. Conseguir preencher identificação.
3. Conseguir distribuir atributos.
4. Conseguir selecionar quatro perícias.
5. Visualizar alvos corretos.
6. Visualizar PV, SAN e PE corretos.
7. Conseguir alterar recursos atuais.
8. Conseguir cadastrar itens.
9. Visualizar a capacidade do inventário.
10. Conseguir registrar equipamentos.
11. Conseguir registrar ferimentos.
12. Conseguir modificar fadiga.
13. Conseguir marcar sangramento.
14. Conseguir acompanhar estado crítico.
15. Conseguir rolar dados.
16. Conseguir salvar alterações.
17. Conseguir reabrir a ficha.
18. Conseguir acessar a ficha no celular.
19. Conseguir acessar a mesma ficha no computador.
20. Não conseguir editar fichas alheias sem permissão.
21. Não perder dados silenciosamente.
22. Os testes automatizados principais passarem.

Não declarar a etapa concluída se os campos forem apenas visuais e não estiverem conectados ao backend.

---

# 29. DOCUMENTAÇÃO

Atualizar:

README.md

/docs/REQUISITOS.md

/docs/PROGRESSO.md

Criar:

/docs/REGRAS_RPG.md

/docs/FICHA_DIGITAL.md

/docs/API.md

Documentar:

- Fórmulas.
- Regras de validação.
- Endpoints.
- Estrutura dos componentes.
- Modelagem.
- Funcionalidades prontas.
- Funcionalidades pendentes.
- Problemas conhecidos.

Adicionar novos RF, RNF e RN conforme necessário.

Não apagar requisitos da Parte 1.

---

# 30. CONTINUIDADE PARA A PARTE 3

Preparar interfaces e serviços para:

- Campanhas.
- Membros.
- Permissões de mestre.
- Solicitações de aprovação.
- Visualização das fichas dos colegas.
- Compartilhamento de informações.
- Painel administrativo.

Não implementar permissões temporárias inseguras apenas para facilitar o desenvolvimento.

Não conceder acesso universal a todas as fichas.

---

# 31. COMANDO FINAL

Continue o projeto existente.

Implemente a ficha digital interativa completa do Sistema Híbrido 2.6.

Utilize a imagem oficial como referência visual.

Utilize o manual como referência mecânica.

Desenvolva a interface em React e TypeScript.

Utilize Express para a API.

Utilize Prisma e MySQL para persistência.

Implemente cálculos, validações, recursos, perícias, inventário, armas, equipamentos, condições e rolagens.

Garanta responsividade.

Garanta salvamento real.

Garanta que cada usuário tenha acesso apenas aos dados autorizados.

Execute testes e corrija os erros encontrados.

Documente tudo para continuar posteriormente no computador.

Não entregue apenas componentes demonstrativos.

**OBJETIVO FINAL DA PARTE 2: Cada jogador conseguir abrir, utilizar, editar e salvar sua ficha digital durante uma sessão real de RPG.**

# FIM DA PARTE 2 — FICHA DIGITAL INTERATIVA.
