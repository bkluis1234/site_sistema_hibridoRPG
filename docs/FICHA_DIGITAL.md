# Ficha digital — estrutura e uso

## Interface

A ficha usa a imagem oficial como referência: fundo preto, painéis com bordas discretamente desgastadas, cabeçalhos vermelhos, campos cinza-claro e recursos PV vermelho, SAN roxo, PE azul; fadiga em âmbar. Toda interação é HTML/React real. A imagem da ficha não é usada como interface estática. Não houve inclusão de fontes/imagens sem licença ou de mecânicas de outro sistema.

Desktop organiza identificação/retrato, atributos/recursos e perícias/inventário/equipamentos em grid, com condições e ferimentos abaixo. Mobile tem resumo, atributos, perícias, inventário, equipamentos, condições, rolagens e histórico; barra de PV/SAN/PE fica acessível durante a rolagem da página. As áreas de toque principais foram ampliadas. Navegadores físicos, leitor de tela e auditoria completa de contraste ainda precisam de revisão.

## Componentes

Pasta apps/web/src/sheet:

| Arquivo | Responsabilidade |
|---|---|
| CharacterSheet.tsx | Consultas, operações, navegação, mensagens e estado global da ficha |
| Identification.tsx | RHF/Zod, identificação, narrativas, autosave e conflitos |
| Attributes.tsx | Cartões interativos, distribuição e prévia de máximos |
| Resources.tsx | ResourceControl, ajuste simples/personalizado e eventos de dano |
| Skills.tsx | 21 linhas, pesquisa, filtro, treino e rolagem |
| Inventory.tsx | InventoryTable, CRUD, equipamento canônico e confirmação de exclusão |
| Conditions.tsx | ConditionTracker, ferimentos, crítico e política configurável de fadiga |
| Dice.tsx | Expressões, resultados, gastos PE e revisão pelo GM |
| History.tsx | Auditoria paginada, ator/data/antes/depois |
| ui.tsx | Painel temático, campos e prévia de retrato |
| types.ts | Contrato de ações e geração de operationId |
| sheet.css | Layout responsivo e identidade visual |

HorrorPanel, SectionHeader, ResourceBar, CharacterCard, CampaignCard e SaveStatus seguem disponíveis para o restante da plataforma. Componentes interativos da ficha importam regras compartilhadas; o servidor determina os valores oficiais.

## Salvamento e conflitos

Identificação/narrativas usam debounce de 850 ms após digitação válida. Botão Salvar alterações pode antecipar a operação. Campos inválidos exibem erros e não são enviados. Requisição em andamento conclui com seu snapshot; se o usuário continuar digitando, o novo texto permanece e uma próxima operação é agendada. Não há fila automática de repetição após falha.

O estado mostra carregado, alterações locais, salvando, persistência confirmada, erro ou conflito. Somente resposta bem-sucedida permite confirmação. Uma operação de recurso/condição/gasto PE é imediata e separada do autosave. Essas operações exibem andamento e não confundem alteração local com persistência.

Rascunho textual não confirmado fica em memória, por usuário e ficha, durante a sessão do navegador. Ao sair internamente e voltar, pode ser recuperado. Isso não é banco, backup nem funcionamento offline completo. Fechar/recarregar com texto pendente ativa aviso do navegador; ignorar esse aviso pode perder o rascunho. Sair da conta impede outra conta de ver o rascunho, pois a chave inclui o identificador do proprietário. Não há tokens de autenticação em localStorage.

Conflito 409 mantém texto local e oferece cópia para comparação. Carregar versão do servidor é explícito; não há merge automático. Operações não textuais têm botão de repetir a mesma operação idempotente e de atualizar os dados. Formulários de item/ferimento só fecham quando o backend confirma; em erro o preenchimento permanece.

## Consistência no servidor

Cada mutação bloqueia transacionalmente a linha da ficha, autoriza o ator, compara a versão do domínio e verifica operationId/requestHash antes de aplicar. Domínios:

- Identificação: identityVersion.
- Atributos: attributesVersion.
- Treinamentos: skillsVersion.
- Cada recurso, item, ferimento, rolagem e estado estruturado de condições: version próprio.
- Character.version: sequência geral para auditoria e submit.

PV e sangramento podem ser salvos com versões independentes; dois ajustes concorrentes do mesmo PV têm um vencedor e um 409. Atributos que alteram máximos também atualizam versões dos recursos afetados. O lock mantém decisão, saldo e log atômicos; ele não dá permissões adicionais.

CharacterOperation guarda escopo de ficha, UUID, hash de ator/ação/caminho/payload e resultado. Repetir UUID idêntico devolve resultado anterior. Alterar alvo ou conteúdo com o mesmo UUID falha. Cliente não pode fabricar resultado oficial de dados. A inicialização de CSRF no navegador compartilha uma única requisição entre mutações simultâneas.

## Modelagem e migração

Migração 202610300002_interactive_sheet amplia a fundação sem recriar o projeto. Acrescenta campos narrativos/versões, estados estruturados de condições, rolagens oficiais, operações idempotentes e dados de auditoria. Backfill preenche atributos/perícias/recursos ausentes para fichas anteriores. Máximos redundantes foram removidos de character_resources; agora são derivados.

Tabelas EAV de atributos/perícias/recursos continuam como na arquitetura inicial. character_condition_states concentra o acompanhamento estruturado; character_conditions permanece para notas/condições extras futuras. Itens são canônicos; character_weapons legados são vinculados a uma entrada única convertida, com espaços desconhecidos inicializados em zero para revisão do grupo. Ferimentos tratados/resolvidos mantêm datas e estados.

GET do histórico é autorizado, paginado por sequência de versão, com até 50 eventos por página. Logs têm actor, ação, createdAt, beforeData e afterData. Não armazenam senhas/cookies/códigos; narrativas fazem parte da ficha e podem aparecer em histórico acessível ao proprietário/GM autorizado. As observações pessoais pertencem à ficha e não são um cofre privado separado do GM.

## Integrações pendentes

Retrato: seletor, prévia, remoção/substituição local e limite PORTRAIT_MAX_BYTES estão preparados. API informa configured=false. Interface PortraitStorage define put/signedReadUrl/remove, mas nenhum provedor foi configurado e não existe endpoint inseguro para simular upload. Integração futura exige objeto externo persistente, validação real da imagem no servidor, remoção de metadados e autorização por ficha. Não usar disco temporário do Render. A imagem não será salva ao pressionar Salvar identificação nesta entrega.

A Parte 3 integra aprovação definitiva, criação/vínculos de campanhas, painel do mestre e descoberta das fichas compartilhadas. Regras de acesso por vínculo protegem ajustes de fadiga e autorização de repetição. GM usa o editor da campanha; ADMIN sem vínculo não recebe acesso universal.

Compartilhamento de rolagens em tempo real, transferência de itens, exportação e publicação continuam pendentes. As rolagens já são oficiais do servidor e persistem por ficha; acesso acompanha a autorização da ficha.


## Integração da Parte 3

Aprovação definitiva e solicitações de revisão agora são implementadas. A ficha tem seções Privacidade e notas e Solicitar alteração quando aplicável. GM usa editor/contexto próprio; campos PRIVATE não são enviados nem sobrescritos por vazios. Colegas recebem tela somente leitura baseada em DTO compartilhado, com autorização da campanha e do proprietário. Fluxos em CAMPANHAS.md, matriz em PERMISSOES.md e resultados em VALIDACAO.md. Upload continua prévia local até configurar storage externo.
