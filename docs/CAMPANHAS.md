# Campanhas e painel do mestre

Somente Híbrido 2.6 é aceito. Nome, descrição, avisos, estado e compartilhamento são persistidos no MySQL. Estados: DRAFT, ACTIVE, PAUSED, FINISHED, ARCHIVED. Imagem tem campo preparado no modelo, mas upload persistente permanece indisponível até configurar storage externo; não gravar imagens no disco efêmero do Render.

## Preparar o grupo de Marcus

1. Criar o primeiro ADMIN no servidor com npm run admin:create, usando terminal interativo seguro.
2. Para Marcus ainda sem conta: ADMIN gera convite de mestre em Administração → Convites privilegiados. Marcus usa o código no cadastro. Para conta existente: Administração → Usuários → Habilitar criação de campanhas, com senha e justificativa.
3. Marcus entra em Campanhas → Criar campanha. O servidor cria o vínculo ACTIVE/GM do criador. O nome Marcus não concede privilégio; não há conta/senha padrão.
4. No painel do mestre, gerar convite de jogador com validade de 1–168 horas e limite de 1–100 usos. O código aparece uma vez; banco guarda somente hash.
5. Jogador insere o código em Campanhas. O pedido fica PENDING, sem acesso às fichas. Marcus aceita em Jogadores, com justificativa; só então o participante está ACTIVE.
6. Dono ou GM vincula uma ficha de participante aceito. Uma ficha só pode pertencer a uma campanha por vez. Desvincular/remover preserva conta, personagem e histórico.
7. Para colegas consultarem: GM permite compartilhamento na campanha e dono habilita a ficha em Privacidade e notas. Dono escolhe narrativas públicas. A tela compartilhada é somente leitura.

Convites de campanha nunca concedem GM/ADMIN. Consumo, limite de usos e criação do pedido são transacionais, inclusive com tentativas simultâneas. Convite inválido/expirado/revogado é recusado; há limite de tentativas. Metadados permitem revogação, não recuperar o código.

## Trabalhar como mestre

O painel tem Visão geral, Jogadores, Personagens, Recursos, Condições, Solicitações, Convites, Histórico, Configurações e Notas do mestre. Cartões mostram estado da ficha e proprietário; Recursos apresenta atuais/máximos calculados. Condições apresenta fadiga, sangramento e estado crítico. Editar como mestre abre contexto explícito e auditado. Painel da campanha em modo jogador não baixa notas GM.

O editor permite identificação operacional, atributos, treinamentos, recursos, itens e condições. Dados PRIVATE permanecem protegidos do GM. Mudanças em atributos/treinamentos protegidos exigem justificativa; não é permitido fabricar resultados ou ultrapassar os limites implementados. A política de fadiga continua configurável por campanha na ficha, sem editar código; proposta inicial ainda depende da revisão de Marcus.

## Aprovação e alterações

DRAFT → validar oito pontos, quatro treinamentos, identificação e carga → PENDING_APPROVAL. GM confere a ficha e decide APPROVE (APPROVED) ou CORRECTION (DRAFT), com comentário. O dono recebe notificação e pode acompanhar o histórico. Reabrir antes da decisão continua disponível com controle de versão.

Em APPROVED, o proprietário não edita atributos/treinamentos diretamente. Solicitar alteração guarda proposta, justificativa e versão do domínio. PENDING → APPROVED/REJECTED exige GM responsável. Aprovação aplica mudanças, recalcula recursos, valida ficha, registra decisão/log e notifica na mesma transação. Proposta obsoleta retorna 409; não aplica valores sobre uma edição mais nova. Alteração de PV, por ser outro domínio, não invalida uma proposta de atributos.

## Sincronização e conflitos

TanStack Query invalida consultas após confirmação, revalida ao retornar à aba e consulta campanha/solicitações/notificações a cada 30 segundos. Não há WebSocket ou promessa de atualização instantânea. Mutações usam UUID de operação e versões; repetição idêntica não duplica efeitos. Códigos de convite não são guardados no resultado idempotente: se a primeira resposta se perder, revogar o convite e gerar outro.

Configurações e notas GM preservam a versão carregada enquanto há rascunho. Outra edição confirmada provoca 409 em vez de sobrescrita silenciosa. Configurações oferecem cópia local antes de descartar/recarregar. Navegação/recarga de formulários de gestão ainda pode perder texto não enviado; não há fila offline persistente.

Notificações internas são exclusivas do destinatário, com marcação de leitura. Não enviam e-mail/push nem conteúdo narrativo secreto. Histórico de campanha é restrito ao GM; auditoria administrativa contém metadados. Listagens têm limites documentados na API; paginação avançada e retenção permanecem futuras.

Testes: integração MySQL em campaigns.test.ts e navegador em management.spec.ts. Infraestrutura real de Marcus e dispositivos físicos exigem configuração/homologação pelo grupo; o ensaio usa contas sintéticas isoladas.
