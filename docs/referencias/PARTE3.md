# SISTEMA HÍBRIDO 2.6 — PLATAFORMA DIGITAL DE RPG
## PROMPT MASTER PARA CODEX
### PARTE 3 — CAMPANHAS, PAINEL DO MESTRE, ADMINISTRAÇÃO, PERMISSÕES E COMPARTILHAMENTO DE FICHAS
### VERSÃO ATUALIZADA — COM AUDITORIA OBRIGATÓRIA DAS PARTES 1 E 2

Você continuará o desenvolvimento da plataforma Sistema Híbrido 2.6, iniciada nas Partes 1 e 2.

Sua missão é transformar o sistema de fichas digitais em uma plataforma multiusuário de gerenciamento de campanhas de RPG.

**REGRA ABSOLUTA: Antes de desenvolver a Parte 3, você deverá verificar, testar e corrigir as funcionalidades das Partes 1 e 2. Não avance com funcionalidades que dependam de componentes quebrados ou inexistentes.**

---

# ETAPA 0 — AUDITORIA E CORREÇÃO OBRIGATÓRIA

Esta etapa tem prioridade sobre todas as demais.

## 0.1. Inspeção do projeto

Antes de escrever código novo:

1. Inspecione todos os diretórios e arquivos relevantes.
2. Leia README.md e /docs/PROGRESSO.md.
3. Examine os requisitos RF, RNF e RN.
4. Identifique as tecnologias realmente utilizadas.
5. Verifique o arquivo package.json e as dependências.
6. Verifique a configuração TypeScript.
7. Examine o schema Prisma.
8. Examine as migrações MySQL.
9. Verifique as rotas Express.
10. Verifique os componentes React.
11. Identifique funcionalidades incompletas ou simuladas.
12. Verifique erros de compilação, imports e tipos.

Não confunda código existente com funcionalidade comprovadamente operacional.

## 0.2. Auditoria da Parte 1 — Fundação

Verifique obrigatoriamente:

**Autenticação**
- Cadastro com nome de usuário e senha.
- Login funcional.
- Logout.
- Senhas protegidas por hash seguro.
- Sessões persistentes e protegidas.
- Validação de entradas.
- Proteção contra tentativas excessivas.
- Recuperação de conta ou registro explícito da pendência.

**Contas e permissões**
- Criação de conta PLAYER.
- Procedimento seguro de criação do ADMIN inicial.
- Convites privilegiados para GM.
- Impossibilidade de elevar privilégios pelo frontend.
- Proteção das rotas privadas.

**Banco de dados**
- Conexão real com MySQL.
- Prisma configurado.
- Migrações consistentes.
- Criação de registros.
- Consulta de registros.
- Atualização de registros.
- Persistência após reinicialização.

**Frontend**
- Login responsivo.
- Cadastro responsivo.
- Dashboard.
- Navegação.
- Tratamento de erros.
- Estados de carregamento.

Corrija erros antes de avançar.

## 0.3. Auditoria da Parte 2 — Ficha digital

Verifique:

**Identificação**
- Nome.
- Apelido.
- Idade.
- Altura.
- Peso.
- Profissão.
- Aparência.
- Histórico.
- Imagem, quando houver armazenamento configurado.

**Atributos**
- AGI, FOR, INT, PRE e VIG.
- Distribuição inicial correta.
- Limites de atributos.
- Pontos disponíveis.
- Validação no backend.

**Recursos**
- PV máximo.
- SAN máxima.
- PE máximo.
- Recursos atuais.
- Aumento e redução.
- Persistência das alterações.

**Perícias**
- Lista completa.
- Atributos associados.
- Perícias treinadas.
- Cálculo de alvos.
- Penalidades de fadiga.
- Rolagens.

**Inventário**
- Cadastro de itens.
- Quantidades.
- Espaços ocupados.
- Capacidade.
- Exclusão e edição.

**Condições**
- Ferimentos.
- Sangramento.
- Fadiga.
- Estado crítico.

**Persistência**
- Criar personagem.
- Editar personagem.
- Salvar.
- Fechar a página.
- Reabrir.
- Recuperar todos os dados.
- Acessar de outro dispositivo conectado ao mesmo backend.

## 0.4. Testes obrigatórios de integração

Execute ou implemente testes para:

1. Criar usuário.
2. Fazer login.
3. Criar personagem.
4. Preencher identificação.
5. Distribuir atributos.
6. Selecionar perícias.
7. Salvar a ficha.
8. Consultar a ficha no MySQL.
9. Atualizar PV.
10. Atualizar inventário.
11. Registrar uma condição.
12. Encerrar a sessão.
13. Fazer login novamente.
14. Reabrir o personagem.
15. Confirmar que os dados permanecem corretos.
16. Tentar acessar a ficha de outro usuário.
17. Confirmar que a API rejeita o acesso não autorizado.

Quando o ambiente permitir, execute testes de interface no navegador.

Se o ambiente não permitir conexão real com MySQL, não afirme que a persistência foi comprovada. Execute os testes possíveis, identifique o bloqueio e forneça instruções para testar no computador.

## 0.5. Correção de problemas

Para cada problema encontrado:

- Identifique a causa.
- Corrija o código.
- Execute o teste novamente.
- Verifique se a correção não prejudicou outras funcionalidades.
- Registre o resultado.

Não substitua funcionalidades quebradas por dados fictícios.

Não remova recursos para fazer os testes passarem artificialmente.

## 0.6. Relatório da auditoria

Crie:

/docs/AUDITORIA_PARTES_1_2.md

Registre:

- Funcionalidades aprovadas.
- Funcionalidades corrigidas.
- Funcionalidades pendentes.
- Testes executados.
- Testes aprovados.
- Testes com falha.
- Testes bloqueados pelo ambiente.
- Evidências e comandos utilizados.
- Problemas de segurança encontrados.

**Somente avance para a Parte 3 quando os pré-requisitos críticos estiverem funcionando. Caso haja impedimentos externos, documente-os e não declare a etapa concluída.**

---

# 1. CONTEXTO E OBJETIVO

O projeto será utilizado inicialmente por um grupo privado.

Existem três perfis:

ADMIN — proprietário da plataforma, também jogador.

GM — Marcus, mestre da campanha.

PLAYER — demais participantes.

O sistema deverá permitir campanhas, gerenciamento de jogadores, fichas compartilhadas, aprovações e administração.

---

# 2. ARQUITETURA

Preserve:

- React.
- TypeScript.
- Vite.
- Tailwind CSS.
- React Router.
- TanStack Query.
- Node.js.
- Express.
- Prisma ORM.
- MySQL.

Não recrie o repositório.

Não substitua tecnologias sem autorização.

---

# 3. PERMISSÕES

Separar papéis globais e papéis de campanha.

ADMIN:
- Administra a plataforma.
- Gerencia usuários.
- Gerencia permissões.
- Pode participar como jogador.

GM:
- Administra campanhas autorizadas.
- Edita fichas da própria campanha.
- Aprova alterações.
- Gerencia participantes.

PLAYER:
- Edita sua própria ficha.
- Visualiza informações compartilhadas dos colegas.
- Participa de campanhas.
- Não edita fichas alheias.

Todas as permissões deverão ser verificadas no backend.

---

# 4. ADMINISTRADOR TAMBÉM É JOGADOR

Implementar dois contextos:

**Modo Jogador**
- Ficha própria.
- Campanhas.
- Inventário.
- Recursos.
- Rolagens.

**Modo Administração**
- Usuários.
- Campanhas.
- Permissões.
- Convites privilegiados.
- Auditoria.

Não exibir segredos narrativos automaticamente no modo jogador ou no painel administrativo comum.

O acesso direto à infraestrutura poderá revelar dados; não prometer proteção absoluta contra spoilers.

---

# 5. CAMPANHAS

Implementar criação e gerenciamento de campanhas.

Campos:

- Nome.
- Descrição.
- Imagem.
- Sistema.
- Mestre.
- Status.
- Configurações.

Status:

DRAFT.
ACTIVE.
PAUSED.
FINISHED.
ARCHIVED.

Inicialmente, utilizar apenas o Sistema Híbrido 2.6.

---

# 6. CONVITES

O mestre poderá gerar convites para jogadores.

Cada convite deverá possuir:

- Código seguro.
- Validade.
- Limite de usos.
- Possibilidade de revogação.

O jogador poderá inserir o código e solicitar participação.

Convites de campanha não poderão conceder ADMIN ou GM automaticamente.

---

# 7. PARTICIPANTES

O mestre poderá:

- Consultar participantes.
- Aceitar jogadores.
- Remover jogadores.
- Vincular personagens.
- Consultar status das fichas.

Remover um participante não deverá excluir automaticamente sua conta ou personagem.

---

# 8. DASHBOARD DA CAMPANHA

Exibir:

- Nome.
- Descrição.
- Mestre.
- Participantes.
- Personagens.
- Status.
- Avisos.
- Ações disponíveis.

Cada personagem poderá aparecer em um cartão com retrato, nome, apelido e profissão.

---

# 9. FICHAS COMPARTILHADAS

Jogadores poderão visualizar informações compartilhadas das fichas dos colegas da mesma campanha.

A visualização será somente leitura.

Não permitir:

- Editar atributos.
- Alterar PV, SAN ou PE.
- Modificar inventário.
- Alterar perícias.
- Excluir dados.

A API deverá aplicar essas restrições.

---

# 10. PRIVACIDADE

Classificar dados em:

PUBLIC — compartilhados com participantes autorizados.

PRIVATE — privados do proprietário.

GM_ONLY — reservados ao mestre.

O backend deverá filtrar os dados conforme as permissões.

Não enviar informações secretas ao navegador de usuários não autorizados.

---

# 11. PAINEL DO MESTRE

Criar seções:

- Visão geral.
- Jogadores.
- Personagens.
- Recursos.
- Condições.
- Solicitações.
- Convites.
- Histórico.
- Configurações.

Mostrar informações operacionais como fichas pendentes, condições e recursos dos personagens.

---

# 12. EDIÇÃO PELO MESTRE

Implementar "Editar como mestre".

Permitir ao GM autorizado:

- Corrigir identificação.
- Modificar atributos.
- Modificar perícias.
- Alterar recursos.
- Editar inventário.
- Registrar condições.
- Aprovar mudanças.

Exigir justificativa para exceções mecânicas.

Registrar alterações em auditoria.

---

# 13. APROVAÇÃO DE FICHAS

Fluxo:

1. Jogador conclui rascunho.
2. Sistema valida regras.
3. Jogador envia para aprovação.
4. Mestre analisa.
5. Mestre aprova ou solicita correção.
6. Sistema registra decisão.

Estados:

DRAFT.
PENDING_APPROVAL.
APPROVED.
ARCHIVED.

Após aprovação, proteger campos mecânicos definidos pelas regras.

---

# 14. SOLICITAÇÕES DE ALTERAÇÃO

Permitir solicitar mudanças em:

- Atributos.
- Perícias treinadas.
- Outros campos mecânicos bloqueados.

Fluxo:

PENDING → APPROVED ou REJECTED.

O jogador poderá fornecer justificativa.

O mestre poderá comentar.

Alterações aprovadas deverão ser aplicadas em transação no banco.

---

# 15. HISTÓRICO

Registrar alterações relevantes:

- Autor.
- Personagem.
- Campo.
- Valor anterior.
- Valor novo.
- Data.
- Justificativa.

Não registrar senhas, tokens ou credenciais.

Restringir a visualização dos logs conforme permissões.

---

# 16. SINCRONIZAÇÃO

Utilizar TanStack Query para:

- Atualizar dados após alterações.
- Revalidar periodicamente.
- Atualizar ao retornar à aba.
- Detectar dados desatualizados.

Preparar futura integração de WebSockets.

Implementar controle de concorrência para evitar sobrescrita silenciosa.

---

# 17. PAINEL ADMINISTRATIVO

Criar seções:

- Usuários.
- Campanhas.
- Papéis.
- Convites privilegiados.
- Auditoria.
- Configurações.

Permitir:

- Pesquisar usuários.
- Desativar contas.
- Reativar contas.
- Administrar permissões.
- Gerar convites de mestre.
- Revogar convites.

A criação de novos administradores deverá exigir autorização administrativa reforçada.

Não disponibilizar cadastro público de ADMIN.

---

# 18. SEGURANÇA

Implementar middleware para:

- Autenticação.
- Administração global.
- Administração de campanha.
- Propriedade de personagem.
- Leitura autorizada.
- Edição autorizada.

Não confiar em IDs ou papéis fornecidos pelo frontend.

Proteger contra acesso indevido por manipulação de URLs.

Utilizar transações nas operações críticas.

---

# 19. API

Criar ou adaptar endpoints para:

- Campanhas.
- Participantes.
- Convites.
- Personagens compartilhados.
- Aprovações.
- Solicitações.
- Administração.
- Auditoria.

Utilizar rotas REST consistentes.

Não criar endpoints duplicados sem necessidade.

---

# 20. BANCO DE DADOS

Revisar modelos Prisma para:

- Users.
- Campaigns.
- CampaignMembers.
- CampaignInvites.
- Characters.
- CharacterChangeRequests.
- CharacterAuditLogs.
- AdminAuditLogs.
- PrivilegedInvites.

Criar relações, índices e restrições.

Aplicar migrações de maneira segura.

Preservar dados existentes.

---

# 21. INTERFACE

Manter estética:

- Terror.
- Sobrevivência.
- Preto.
- Vermelho.
- Cinza.
- Texturas discretas.

Criar componentes:

CampaignDashboard.
PlayerRoster.
CharacterOverviewCard.
GMCharacterEditor.
ApprovalQueue.
InviteManager.
AdminDashboard.
AuditTimeline.

Garantir responsividade para celulares e computadores.

---

# 22. REQUISITOS

Atualizar os documentos RF, RNF e RN com as funcionalidades da Parte 3.

Preservar os requisitos anteriores.

Adicionar critérios de aceitação verificáveis.

Relacionar requisitos com testes automatizados.

---

# 23. TESTES DA PARTE 3

Verificar:

- Jogador não cria campanha sem autorização.
- Convite válido permite ingresso.
- Convite inválido é rejeitado.
- Jogador visualiza ficha compartilhada.
- Jogador não edita ficha alheia.
- Mestre edita fichas da própria campanha.
- Mestre não administra campanhas alheias.
- Administrador gerencia contas.
- Jogador não promove a própria conta.
- Convite expirado não funciona.
- Convite revogado não funciona.
- Dados secretos não são expostos.
- Alterações são persistidas.
- Aprovações são registradas.
- Edições simultâneas não causam perda silenciosa.

Executar testes de integração reais quando o ambiente permitir.

---

# 24. CRITÉRIOS DE ACEITAÇÃO

A Parte 3 estará concluída quando:

1. As funcionalidades críticas das Partes 1 e 2 tiverem sido verificadas.
2. O login estiver operacional.
3. A criação de fichas estiver operacional.
4. O salvamento MySQL estiver comprovado.
5. O administrador conseguir acessar seu painel.
6. Marcus conseguir administrar sua campanha.
7. Jogadores conseguirem ingressar por convite.
8. Jogadores conseguirem visualizar fichas compartilhadas.
9. Jogadores não conseguirem editar fichas alheias.
10. O mestre conseguir editar fichas autorizadas.
11. O fluxo de aprovação funcionar.
12. O histórico registrar alterações.
13. O administrador conseguir participar como jogador.
14. As permissões forem validadas no servidor.
15. Os testes essenciais passarem.

Não declarar conclusão com testes críticos pendentes.

---

# 25. DOCUMENTAÇÃO

Atualizar:

README.md.

/docs/REQUISITOS.md.

/docs/PROGRESSO.md.

/docs/API.md.

Criar ou atualizar:

/docs/AUDITORIA_PARTES_1_2.md.

/docs/PERMISSOES.md.

/docs/CAMPANHAS.md.

/docs/ADMINISTRACAO.md.

Registrar:

- Funcionalidades concluídas.
- Testes executados.
- Correções.
- Dependências.
- Migrações.
- Erros conhecidos.
- Pendências.
- Próximos passos.

---

# 26. CONTINUIDADE ENTRE CODEX MOBILE E PC

Manter o projeto no repositório Git.

Não incluir segredos no repositório.

Registrar comandos de instalação, desenvolvimento e testes.

Manter /docs/PROGRESSO.md atualizado.

Não presumir acesso ao MySQL local do computador enquanto estiver no ambiente remoto do Codex.

---

# 27. ORDEM OBRIGATÓRIA DE EXECUÇÃO

**ETAPA 0 — AUDITORIA**

Inspecionar, testar e corrigir as Partes 1 e 2.

**ETAPA A — MODELAGEM**

Campanhas, membros, permissões, convites, aprovações e auditoria.

**ETAPA B — BACKEND**

Endpoints, serviços, autorização, validação e transações.

**ETAPA C — FRONTEND**

Dashboard, campanhas, fichas compartilhadas, painel do mestre e painel administrativo.

**ETAPA D — INTEGRAÇÃO**

Convites, participantes, aprovações, notificações e sincronização.

**ETAPA E — QUALIDADE**

Testes, correções, responsividade, documentação e revisão de segurança.

Não avançar ignorando falhas críticas.

---

# 28. COMANDO FINAL

Continue o projeto existente do Sistema Híbrido 2.6.

**PRIMEIRO: execute uma auditoria completa das Partes 1 e 2.**

Verifique se cadastro, login, criação de personagens, edição, regras, inventário, condições e salvamento MySQL estão funcionando.

Corrija todos os problemas críticos encontrados.

Documente o que foi realmente testado e o que não pôde ser verificado.

**DEPOIS: implemente a Parte 3.**

Desenvolva campanhas, convites, painel do mestre, painel administrativo, compartilhamento de fichas e aprovação de alterações.

Preserve o administrador como participante da campanha, com uma ficha própria.

Marcus será o mestre inicial.

Os jogadores poderão editar suas próprias fichas e visualizar as informações compartilhadas dos colegas.

Garanta permissões seguras no backend e persistência real no MySQL.

Execute testes e documente resultados.

Não declare o projeto concluído sem evidências de funcionamento.

**OBJETIVO FINAL: Entregar uma Parte 3 integrada às Partes 1 e 2, sem funcionalidades críticas quebradas, com gerenciamento de campanhas, fichas e usuários funcionando de maneira consistente.**

# FIM DA PARTE 3 — VERSÃO ATUALIZADA COM AUDITORIA OBRIGATÓRIA.