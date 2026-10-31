# Modo Sessão — Parte 4

A sala de jogo pertence a uma campanha e é diferente da sessão de autenticação. Exige conta ativa e vínculo ACTIVE na campanha; ADMIN global não recebe acesso narrativo nem controle automático. Marcus precisa do vínculo GM real, preparado conforme CAMPANHAS.md. Nenhuma conta padrão foi criada.

## Usar na mesa

1. Na campanha, abrir Sessões de jogo. Mestre escolhe Gerenciar como mestre e Agendar sessão, com título e horário opcional.
2. Definir na criação se rolagens PRIVATE podem ser consultadas pelo GM. Essa permissão não se aplica às anotações pessoais.
3. Abrir Entrar como mestre e Iniciar sessão, com justificativa pública. Só uma sessão ACTIVE ou PAUSED é permitida por campanha.
4. Jogadores abrem a sala e entram com uma ficha própria, vinculada e não arquivada. GM pode acompanhar sem personagem. Ingressar na campanha por convite/aceite continua obrigatório.
5. Usar Minha ficha para recursos, condições, ferimentos e inventário; Dados para rolagens; Grupo para presença/recursos autorizados; Eventos para linha do tempo; Anotações para o diário.
6. Ao final, GM encerra com confirmação. O histórico permanece consultável e o resumo reúne registros reais autorizados. Resumo narrativo é escrito manualmente pelo mestre; nenhum acontecimento é inventado.

Desktop usa três colunas (sobrevivência/grupo, dados/eventos, ferramentas/diário). No celular, cinco abas e barra fixa de PV/SAN/PE substituem a redução do layout desktop. O GM também pode usar celular, com controles próprios. O módulo carrega por rotas separadas para evitar baixar toda a sala no login.

## Estados

| Estado atual | Ações do GM | Resultado |
|---|---|---|
| SCHEDULED | start / cancel | ACTIVE / CANCELLED |
| ACTIVE | pause / finish | PAUSED / FINISHED |
| PAUSED | resume / finish | ACTIVE / FINISHED |
| FINISHED / CANCELLED | Consulta autorizada | Sem reabertura automática |

Operações mecânicas da sala e entrada exigem ACTIVE. Diário e acontecimentos podem ser preparados enquanto a sessão está aberta. FINISHED/CANCELLED bloqueiam novas ações da sala; o GM ainda pode publicar o resumo narrativo de uma sessão encerrada. A ficha continua independente: uma edição permitida fora da sala pode ocorrer durante a pausa e será registrada no histórico mecânico da sessão aberta. Não há combate tático, consumo automático ou rolagens automáticas.

## Sobrevivência e inventário

PV/SAN/PE usam serviços da Parte 2, limites e versões próprios. Dano informado, ajuste e recuperação são ações distintas; os controles detalhados permitem quantidades. PV zero, sangramento, fadiga, ferimentos e estado crítico seguem as regras implementadas. Crítico mostra sucessos/falhas/estabilização; nenhuma rolagem, morte ou cura é inferida fora dessas regras.

Inventário permite consultar, criar, editar, remover e registrar uso/descarte por quantidade. Usar um item reduz somente a quantidade informada; não aplica efeitos ou cura presumidos. Itens/equipamentos continuam canônicos, sem duplicação. Movimentações geram eventos mecânicos seguros; notas privadas e descrições de ferimentos não são copiadas ao histórico compartilhado.

Compartilhamento de recursos de colegas exige campanha e ficha habilitadas. Sem isso, alterações ficam PRIVATE para responsáveis e GM no contexto autorizado. Grupo não ganha permissão de escrita. GM escolhe uma ficha da própria campanha para corrigir; servidor revalida vínculo e personagem em cada operação.

## Transferências optativas

Desativadas por padrão na migração. Após aprovar o procedimento para a campanha, GM pode habilitar e escolher confirmação pelo destinatário ou destinatário/GM. Configuração exige motivo e versão e é auditada. Não habilitamos campanhas reais nesta entrega.

Proposta não reserva nem duplica estoque. No aceite, servidor bloqueia campanha e ambas as fichas em ordem estável, confere proprietário/vínculo, versão do item, quantidade e capacidade do destinatário. Atualiza origem, cria item no destino e registra decisão/eventos numa transação. Duplicação/aceite concorrente não movimenta duas vezes. Estoque alterado exige nova conferência; falta de capacidade faz rollback. Não há transferência entre campanhas nem envio de observações privadas do objeto.

## Diário e privacidade

PUBLIC: disponível aos membros autorizados da sala. PRIVATE: somente autor da nota. GM_ONLY: GM ativo em contexto explícito. Visibilidade é imutável; para publicar um segredo, criar uma nova anotação deliberadamente compartilhada. Autor edita suas notas; GM pode corrigir notas públicas/de mestre, mas não as pessoais de outro usuário. Versão obsoleta gera 409 e preserva o formulário; é possível copiar o texto local.

Notas pessoais não viram públicas no resumo. O mesmo filtro se aplica a eventos, rolagens, paginação e contagens. Modo jogador do ADMIN/GM não baixa notas GM_ONLY. Operador com acesso SQL/backups permanece na fronteira de confiança da infraestrutura.

## Resumo e limites

Encerramento grava um retrato de recursos/condições/participantes. A consulta filtra esse retrato e os registros conforme o usuário/contexto. Contagens são somente de eventos visíveis; não mostram totais secretos. Rolagens (até 1.000) e notas (até 200) aparecem no resumo, com limites explícitos; rolagens e eventos completos usam paginação. Listagem de sessões: últimas 100; diário: últimas 200 notas; transferências: últimas 100.

Sem imagens persistentes, notificações push, sons obrigatórios ou fila offline persistente. Avisos discretos podem ser silenciados na sala. Fechar/recarregar um formulário não enviado pode perder o rascunho. Infraestrutura Render/TLS/MySQL gerenciado, escala horizontal, carga e dispositivos físicos precisam de validação própria; ver SINCRONIZACAO.md e VALIDACAO.md.
