# ORIGEM — PLATAFORMA DIGITAL DE RPG
## PROMPT MASTER PARA CODEX
### PARTE 5 DE 5 — FINALIZAÇÃO COMPLETA, IDENTIDADE, PT-BR, REQUISITOS, SEGURANÇA, TESTES, TUTORIAIS, MYSQL ONLINE E PUBLICAÇÃO NO RENDER

---

# 0. INSTRUÇÕES GERAIS E CONTEXTO

Você atuará como engenheiro de software full-stack sênior, arquiteto de software, especialista em segurança, banco de dados MySQL, DevOps, React, TypeScript, Express, Prisma, experiência do usuário e engenharia de requisitos.

Sua missão é finalizar a plataforma digital de RPG desenvolvida nas Partes 1, 2, 3 e 4.

O proprietário informou que essas quatro etapas foram concluídas.

Entretanto, você deverá inspecionar o repositório e verificar tecnicamente o estado real do projeto.

Esta Parte 5 deverá transformar a aplicação existente em um produto estável, seguro, documentado, fácil de utilizar e preparado para publicação.

## Identidade oficial provisória

**Nome do site: ORIGEM**

**Sistema de RPG inicialmente utilizado: Sistema Híbrido 2.6**

O nome Origem é provisório e poderá ser alterado futuramente.

Não confundir o nome da plataforma com o nome do sistema de RPG.

Exemplos de apresentação:

- Origem
- Origem — Plataforma de RPG
- Bem-vindo ao Origem
- Suas histórias começam aqui
- Sistema de jogo: Sistema Híbrido 2.6

A frase de apresentação é uma sugestão visual, não uma exigência narrativa.

## Usuários

ADMIN — proprietário da plataforma e também jogador.

GM — Marcus, mestre da campanha inicial.

PLAYER — demais jogadores.

Os jogadores utilizarão principalmente celulares.

O mestre utilizará principalmente computador.

O administrador também deverá conseguir participar normalmente como jogador.

## Tecnologias

Frontend:
- React.
- TypeScript.
- Vite.
- Tailwind CSS.
- React Router.
- TanStack Query.
- React Hook Form.
- Zod.
- Lucide React.

Backend:
- Node.js.
- Express.
- TypeScript.

Banco:
- MySQL 8 compatível.
- Prisma ORM.

Testes:
- Vitest.
- Supertest.
- Playwright.

Hospedagem:
- Render.

Banco de produção:
- MySQL gerenciado em provedor ainda não escolhido.

## Regras absolutas

1. Não recriar o projeto.
2. Não apagar funcionalidades existentes.
3. Não substituir MySQL por outro banco silenciosamente.
4. Não alterar regras aprovadas do RPG sem autorização.
5. Não inventar funcionalidades concluídas.
6. Não declarar testes executados sem executá-los.
7. Não declarar publicação concluída sem URL real e verificação.
8. Não inserir senhas ou segredos no código.
9. Não ignorar problemas críticos de segurança.
10. Toda a interface deverá estar em português brasileiro.
11. Documentar RF, RNF e RN de forma rigorosa.
12. Preservar compatibilidade com celular e computador.
13. Não depender de um provedor MySQL específico.
14. Manter o projeto preparado para mudanças futuras.

---

# 1. AUDITORIA FINAL DAS PARTES 1 A 4

Antes de implementar novas alterações, faça uma auditoria completa.

Inspecione:

- Estrutura do repositório.
- package.json.
- Configuração TypeScript.
- Dependências.
- Componentes React.
- Rotas.
- Serviços Express.
- Middlewares.
- Schema Prisma.
- Migrações.
- Testes.
- Documentação.
- Configurações de ambiente.
- Sistema de autenticação.
- Permissões.
- Fichas digitais.
- Campanhas.
- Painel do mestre.
- Painel administrativo.
- Modo Sessão.
- Rolagens.
- Sincronização.
- Inventário.
- Condições.
- Histórico.

Leia especialmente:

/docs/PROGRESSO.md

/docs/REQUISITOS.md

/docs/API.md

/docs/PERMISSOES.md

/docs/REGRAS_RPG.md

E os relatórios de auditoria existentes.

## Classificação de problemas

CRITICAL — impede uso seguro ou causa risco grave.

HIGH — compromete funcionalidades importantes.

MEDIUM — prejudica experiência ou manutenção.

LOW — problema secundário.

Corrija CRITICAL e HIGH antes de considerar a aplicação pronta.

Crie:

/docs/AUDITORIA_FINAL.md

Documente evidências reais.

---

# 2. RENOMEAÇÃO DO SITE PARA ORIGEM

Atualize a identidade pública da plataforma.

Substitua o nome antigo da aplicação por:

**Origem**

Onde apropriado, atualize:

- Título da página.
- Cabeçalho.
- Login.
- Cadastro.
- Dashboard.
- Menu.
- Rodapé.
- Metadados.
- Nome da aplicação.
- Manifesto web.
- Textos institucionais.
- Documentação de produto.
- Tela de carregamento.
- Mensagens de boas-vindas.

Não renomeie indevidamente o sistema de regras Sistema Híbrido 2.6.

Não altere nomes de tabelas, migrações, pacotes, diretórios ou identificadores internos apenas por estética, se isso puder comprometer a compatibilidade.

## Nome configurável

Centralize a identidade em um arquivo de configuração.

Exemplo conceitual:

APP_NAME = "Origem"

APP_DESCRIPTION = "Plataforma digital de RPG"

DEFAULT_RPG_SYSTEM = "Sistema Híbrido 2.6"

O código real deverá seguir os padrões existentes no projeto.

Evite textos hardcoded com o nome do site espalhados pelos componentes.

O proprietário deverá conseguir trocar Origem por outro nome futuramente de maneira simples.

Documente o procedimento em:

/docs/IDENTIDADE_VISUAL.md

---

# 3. IDENTIDADE VISUAL

Preserve a estética aprovada:

- Terror.
- Suspense.
- Sobrevivência.
- Preto.
- Vermelho.
- Cinza.
- Texturas discretas.
- Interface sombria.
- Boa legibilidade.

Não exagerar em efeitos visuais que prejudicam o desempenho.

Não transformar o site em uma interface genérica sem identidade.

Criar consistência entre:

- Login.
- Cadastro.
- Dashboard.
- Fichas.
- Campanhas.
- Modo Sessão.
- Painel do mestre.
- Administração.
- Central de Ajuda.

Não é necessário criar um novo logotipo nesta etapa.

Caso exista um logotipo, preserve-o até decisão do proprietário.

---

# 4. PORTUGUÊS BRASILEIRO OBRIGATÓRIO

**Toda a interface pública deverá estar em português brasileiro (pt-BR).**

Essa exigência é obrigatória.

Inclui:

- Botões.
- Menus.
- Títulos.
- Campos.
- Formulários.
- Tooltips.
- Modais.
- Notificações.
- Alertas.
- Mensagens de erro.
- Confirmações.
- Estados vazios.
- Estados de carregamento.
- Tutoriais.
- Central de Ajuda.
- Painéis.
- Histórico.
- Configurações.
- Mensagens de validação.

Exemplos:

Login → Entrar.

Sign Up → Criar conta.

Dashboard → Painel.

Character Sheet → Ficha de personagem.

Game Master → Mestre.

Save → Salvar.

Cancel → Cancelar.

Delete → Excluir.

Session Started → Sessão iniciada.

Connection Lost → Conexão perdida.

Access Denied → Acesso negado.

## Formatação brasileira

Utilizar:

- Datas DD/MM/AAAA.
- Horários em formato de 24 horas.
- Locale pt-BR.
- Formatação numérica brasileira quando apropriada.

Armazenar datas de maneira consistente, preferencialmente UTC.

Exibir datas respeitando o fuso configurado.

## Código

Nomes internos de funções, classes, endpoints, bibliotecas e variáveis poderão permanecer em inglês.

Não traduzir identificadores técnicos de maneira que prejudique o projeto.

## Auditoria linguística

Inspecionar todas as telas.

Corrigir textos misturados entre português e inglês.

Criar testes para os principais fluxos em pt-BR.

Não alterar termos canônicos das regras do RPG sem autorização.

---

# 5. ENGENHARIA DE REQUISITOS — RF, RNF E RN

Esta seção é obrigatória e possui alta prioridade.

O projeto deverá possuir requisitos formalmente documentados, organizados, numerados, rastreáveis e testáveis.

## RF — Requisitos Funcionais

Definem o que a aplicação deverá fazer.

Exemplos:

- Cadastrar usuários.
- Autenticar usuários.
- Criar fichas.
- Salvar personagens.
- Gerenciar campanhas.
- Convidar participantes.
- Aprovar fichas.
- Iniciar sessões.
- Realizar rolagens.
- Consultar histórico.
- Administrar contas.
- Exibir tutoriais.

## RNF — Requisitos Não Funcionais

Definem atributos de qualidade e restrições técnicas.

Exemplos:

- Segurança.
- Desempenho.
- Responsividade.
- Acessibilidade.
- Persistência.
- Confiabilidade.
- Recuperação.
- Privacidade.
- Manutenibilidade.
- Compatibilidade com Render.
- Compatibilidade com MySQL.
- Idioma pt-BR.

## RN — Regras de Negócio

Definem regras específicas da aplicação e do RPG.

Exemplos:

- Jogador não edita ficha alheia.
- Mestre administra apenas campanhas autorizadas.
- Convites possuem validade.
- Rolagens oficiais são geradas pelo servidor.
- Atributos obedecem aos limites.
- Recursos obedecem às fórmulas.
- Alterações mecânicas protegidas exigem aprovação.

## Estrutura obrigatória de cada requisito

Cada requisito deverá possuir:

1. Identificador único.
2. Título.
3. Descrição.
4. Categoria.
5. Prioridade.
6. Origem.
7. Atores envolvidos, quando aplicável.
8. Pré-condições.
9. Regras associadas.
10. Critérios de aceitação.
11. Testes relacionados.
12. Status.
13. Evidências de implementação.

Não renumerar requisitos antigos sem necessidade.

Não reutilizar identificadores.

Não declarar requisito implementado somente porque existe um componente visual.

---

# 6. MATRIZ DE RASTREABILIDADE

Criar:

/docs/MATRIZ_RASTREABILIDADE.md

Relacionar:

RF → implementação → endpoint/componente → teste → resultado.

RNF → métrica → procedimento de verificação → resultado.

RN → regra implementada → teste → resultado.

Estados:

IMPLEMENTADO_E_TESTADO.

IMPLEMENTADO_SEM_TESTE_SUFICIENTE.

PARCIAL.

PENDENTE.

BLOQUEADO.

Registrar o motivo de cada pendência.

Não criar uma matriz fictícia.

---

# 7. REVISÃO DAS REGRAS DO SISTEMA HÍBRIDO 2.6

Verificar as regras aprovadas.

## Atributos

AGI.
FOR.
INT.
PRE.
VIG.

Todos começam em 1.

O personagem recebe 3 pontos adicionais.

É possível reduzir um atributo inicial de 1 para 0 e recuperar um ponto.

Limite inicial por atributo: 3.

Total inicial de pontos distribuídos: 8.

## Recursos

PV máximo = 10 + 2 × VIG.

SAN máxima = 10 + 2 × PRE.

PE máximo = 3 + PRE.

## Perícias

Alvo = 8 + 3 × atributo + bônus de treinamento.

Treinamento = +2.

Quatro perícias treinadas inicialmente.

Alvo máximo = 19.

## Rolagens

Utilizar 1d20.

Resultado igual ou inferior ao alvo significa sucesso.

20 natural sempre significa falha.

Não utilizar d20 + modificador contra dificuldade.

## Inventário

Capacidade = FOR × 5.

FOR 0 permite 2 espaços.

## Fadiga

Nível 0: nenhuma penalidade.

Nível 1: −2.

Nível 2: −4.

Nível 3: −6.

Consultar a configuração aprovada para definir quais perícias recebem penalidade.

## Pontos de Esforço

Gastar 1 PE para aumentar o alvo em 2, conforme a regra de utilização após a rolagem.

Gastar 2 PE para repetir teste elegível de fuga ou resistência.

Não combinar os dois benefícios no mesmo teste.

## Condições

Preservar:

- Ferimento grave.
- Sangramento.
- Fadiga.
- Estado crítico.
- Estabilização.

Consultar a documentação aprovada para os procedimentos completos.

Não inventar novas mecânicas.

---

# 8. AUDITORIA DE AUTENTICAÇÃO

Verificar:

- Cadastro.
- Login.
- Logout.
- Hash seguro de senhas.
- Expiração de sessões.
- Revogação.
- Proteção contra força bruta.
- Recuperação de conta.
- Proteção de cookies.
- Tratamento de erros.

Utilizar algoritmos apropriados, como Argon2id ou bcrypt configurado adequadamente.

Não armazenar senhas em texto puro.

Não utilizar SHA-256 puro como hash de senha.

Configurar corretamente:

HttpOnly.

Secure em produção.

SameSite.

Expiração.

Escopo dos cookies.

Implementar proteção CSRF quando necessária.

---

# 9. AUDITORIA DE PERMISSÕES

Verificar os papéis:

ADMIN.
GM.
PLAYER.

Separar papéis globais de papéis de campanha.

Testar:

- PLAYER tentando acessar ADMIN.
- PLAYER tentando acessar GM.
- PLAYER tentando editar ficha de colega.
- GM tentando editar campanha alheia.
- Usuário tentando promover a própria conta.
- Usuário tentando acessar rolagens secretas.
- Usuário tentando consultar anotações privadas.
- Usuário tentando manipular IDs.

Todas as permissões deverão ser verificadas no backend.

O administrador deverá conseguir jogar sem receber spoilers narrativos automaticamente.

---

# 10. PROTEÇÃO DE DADOS

Aplicar o princípio do menor privilégio.

Proteger:

- Contas.
- Credenciais.
- Fichas.
- Histórico.
- Anotações.
- Segredos narrativos.
- Imagens.
- Registros administrativos.

Não enviar informações privadas desnecessárias ao frontend.

Não registrar senhas ou tokens em logs.

Minimizar a coleta de dados pessoais.

Não solicitar informações pessoais desnecessárias para jogar RPG.

---

# 11. VALIDAÇÃO E VULNERABILIDADES

Auditar:

- SQL Injection.
- XSS.
- CSRF.
- Broken Access Control.
- IDOR.
- Rate limiting.
- CORS.
- Upload de arquivos.
- Exposição de dados.
- Dependências vulneráveis.

Utilizar validação Zod ou equivalente.

Não aceitar campos arbitrários em operações sensíveis.

Não construir SQL por concatenação insegura.

Configurar cabeçalhos HTTP de segurança.

---

# 12. INTEGRIDADE DO MYSQL

Verificar:

- Chaves primárias.
- Chaves estrangeiras.
- Índices.
- Relacionamentos.
- Transações.
- Restrições.
- Concorrência.
- Migrações.
- Histórico.

Não permitir:

- Duplicação indevida de itens.
- Gastos duplicados de PE.
- Alterações simultâneas que apaguem dados.
- Convites reutilizados indevidamente.
- Aprovações duplicadas.
- Recursos inválidos.

Utilizar transações nas operações críticas.

---

# 13. BANCO DE PRODUÇÃO — MYSQL EM PROVEDOR INDEFINIDO

O proprietário ainda não escolheu o provedor do banco de dados.

**Não escolher definitivamente um serviço sem autorização.**

O banco deverá continuar sendo MySQL.

A aplicação deverá ser compatível com um serviço MySQL gerenciado.

Documentar:

- Versões compatíveis.
- Requisitos mínimos.
- Conexão segura.
- TLS.
- DATABASE_URL.
- Restrições de rede.
- Migrações.
- Backups.
- Restauração.
- Procedimento de mudança de provedor.

Criar:

/docs/CONFIGURACAO_MYSQL_ONLINE.md

Não utilizar SQLite como substituição silenciosa.

Não presumir que MySQL Workbench hospeda o banco.

MySQL Workbench será uma ferramenta de administração e consulta.

Não afirmar que o banco online está configurado enquanto o proprietário não tiver escolhido e configurado um provedor.

---

# 14. CONFIGURAÇÃO DO PRISMA

Verificar:

- Schema.
- Cliente Prisma.
- Migrações.
- Conexões.
- Compatibilidade com MySQL.
- Integridade dos dados.

Utilizar migrações apropriadas para produção.

Nunca executar prisma migrate reset em produção.

Não executar alterações destrutivas sem backup e autorização.

Não apagar dados reais para resolver incompatibilidades.

---

# 15. VARIÁVEIS DE AMBIENTE

Criar ou atualizar:

.env.example

Documentar:

DATABASE_URL.

NODE_ENV.

PORT.

FRONTEND_URL.

CORS_ORIGIN.

SESSION_SECRET, se utilizado.

COOKIE_DOMAIN, se utilizado.

Variáveis de armazenamento de imagens, se necessárias.

Não incluir credenciais reais.

Garantir que .env esteja no .gitignore.

Validar configurações obrigatórias na inicialização.

---

# 16. HOSPEDAGEM DEFINIDA — RENDER

O proprietário escolheu o Render para hospedar o site.

**Prepare a aplicação especificamente para Render.**

Não substituir automaticamente por Vercel, Netlify, Railway ou outro serviço.

Avalie a estrutura existente.

Escolha justificadamente entre:

A. Frontend estático e backend Express em serviços separados.

B. Aplicação integrada em um único serviço web.

Considere:

- Custo.
- Simplicidade.
- Segurança.
- Manutenção.
- Cookies.
- CORS.
- Sincronização.
- Recursos disponíveis.

Prepare:

- Build de produção.
- Comando start.
- Variáveis de ambiente.
- Health check.
- HTTPS.
- Logs.
- Configuração de domínio.
- Configuração de CORS.
- Cookies seguros.
- Deploy automático, quando apropriado.

Verifique compatibilidade do mecanismo de sincronização com a hospedagem.

Não presumir disponibilidade contínua em planos gratuitos.

---

# 17. ARQUIVOS DE PUBLICAÇÃO

Criar ou adaptar:

render.yaml, se apropriado.

Dockerfile, se necessário.

.dockerignore, se necessário.

Scripts de build.

Scripts de start.

Configuração de produção.

Não exigir Docker se o deploy nativo do Render for suficiente.

Não adicionar infraestrutura complexa desnecessária.

---

# 18. HEALTH CHECK

Implementar:

GET /api/health

Quando necessário, separar:

- Liveness.
- Readiness.

Não expor informações sensíveis.

Verificar dependências essenciais na readiness.

Evitar consultas excessivas ao banco.

---

# 19. ARMAZENAMENTO DE IMAGENS

Verificar retratos e imagens de campanhas.

Não depender de armazenamento temporário do serviço hospedado.

Preparar armazenamento persistente.

Implementar:

- Validação de formato.
- Limite de tamanho.
- Nomes seguros.
- Controle de acesso.
- Exclusão autorizada.
- Tratamento de erros.

Se o provedor de imagens ainda não estiver definido, documentar a pendência.

Não declarar uploads persistentes prontos sem testes.

---

# 20. BACKUPS

Preparar uma estratégia real de backup.

Definir:

- Frequência.
- Retenção.
- Armazenamento.
- Criptografia.
- Permissões.
- Restauração.

Não presumir que o provedor oferece backups automáticos.

Não armazenar o único backup no mesmo local do banco.

Não incluir dados reais em backups versionados no GitHub.

---

# 21. TESTES DE RESTAURAÇÃO

Preparar procedimento para:

1. Criar backup.
2. Criar banco isolado.
3. Restaurar.
4. Verificar tabelas.
5. Verificar usuários.
6. Verificar personagens.
7. Verificar campanhas.
8. Verificar sessões.
9. Verificar integridade.
10. Registrar resultado.

Nunca testar restauração sobre o banco de produção.

---

# 22. OBSERVABILIDADE E LOGS

Implementar logs estruturados.

Registrar:

- Inicialização.
- Erros de API.
- Falhas de autenticação.
- Falhas de autorização.
- Erros de banco.
- Problemas de sincronização.
- Erros de publicação.

Não registrar senhas ou tokens.

Preparar monitoramento básico.

---

# 23. DESEMPENHO

Avaliar:

- Tempo de carregamento.
- Consultas ao banco.
- Renderização React.
- Tamanho do bundle.
- Imagens.
- Sincronização.
- Uso de memória.
- Conexões ao MySQL.

O grupo inicial será pequeno.

Priorizar simplicidade, eficiência e estabilidade.

Não adicionar arquitetura distribuída desnecessária.

---

# 24. RESPONSIVIDADE

Testar:

320 px.
375 px.
390 px.
430 px.
768 px.
1024 px.
1440 px.

Verificar:

- Login.
- Cadastro.
- Dashboard.
- Ficha.
- Perícias.
- Inventário.
- Condições.
- Rolagens.
- Campanhas.
- Modo Sessão.
- Painel do mestre.
- Administração.
- Central de Ajuda.

Não permitir rolagem horizontal involuntária.

Priorizar botões e controles adequados ao toque.

---

# 25. ACESSIBILIDADE

Implementar:

- Labels.
- Foco visível.
- Navegação por teclado.
- Contraste.
- Mensagens compreensíveis.
- Indicadores que não dependam somente de cor.
- Botões acessíveis.
- Suporte a leitores de tela.

A estética sombria não poderá prejudicar a legibilidade.

---

# 26. TRATAMENTO DE ERROS

Exibir mensagens em pt-BR para:

- Falha de login.
- Conexão perdida.
- Erro ao salvar.
- Banco indisponível.
- Sessão expirada.
- Permissão insuficiente.
- Dados inválidos.
- Conflito de edição.
- Falha no upload.

Não mostrar stack traces ao usuário.

Não exibir sucesso antes da confirmação do servidor.

---

# 27. CENTRAL DE AJUDA

Implementar uma área de ajuda dentro do site.

Nome:

**Central de Ajuda**

Rota sugerida:

/ajuda

Criar três áreas:

- Tutorial do Jogador.
- Tutorial do Mestre.
- Tutorial do Administrador.

O conteúdo deverá estar em português brasileiro.

Os tutoriais deverão corresponder às funcionalidades reais.

Não mostrar informações administrativas sensíveis a usuários comuns.

---

# 28. TUTORIAL DO JOGADOR

Criar tutorial completo, com explicações passo a passo.

Cobrir:

1. Acessar o Origem.
2. Criar conta.
3. Fazer login.
4. Recuperar acesso.
5. Editar perfil.
6. Criar personagem.
7. Preencher identificação.
8. Distribuir atributos.
9. Selecionar perícias.
10. Entender PV, SAN e PE.
11. Utilizar inventário.
12. Salvar a ficha.
13. Confirmar salvamento.
14. Entrar em campanha.
15. Visualizar fichas compartilhadas.
16. Enviar ficha para aprovação.
17. Solicitar alterações.
18. Entrar no Modo Sessão.
19. Realizar rolagens.
20. Interpretar sucesso e falha.
21. Alterar recursos.
22. Consultar condições.
23. Criar anotações.
24. Consultar histórico.
25. Recuperar estado após desconexão.
26. Sair da conta.

Priorizar celular.

Utilizar capturas de tela reais quando disponíveis.

Não inventar imagens de funcionalidades inexistentes.

---

# 29. TUTORIAL DO MESTRE

Criar tutorial para Marcus e futuros mestres.

Cobrir:

1. Acessar a conta.
2. Receber permissão de mestre.
3. Criar campanha.
4. Configurar campanha.
5. Gerar convites.
6. Convidar jogadores.
7. Aceitar participantes.
8. Consultar fichas.
9. Aprovar personagens.
10. Solicitar correções.
11. Editar fichas autorizadas.
12. Controlar recursos.
13. Gerenciar condições.
14. Criar sessão.
15. Iniciar sessão.
16. Consultar participantes.
17. Realizar rolagens secretas.
18. Compartilhar rolagens.
19. Registrar eventos.
20. Criar anotações privadas.
21. Pausar sessão.
22. Retomar sessão.
23. Encerrar sessão.
24. Consultar histórico.
25. Resolver conflitos de edição.
26. Lidar com desconexões.

Priorizar computador.

Manter compatibilidade com celular.

---

# 30. TUTORIAL DO ADMINISTRADOR

Criar tutorial para o proprietário.

Cobrir:

1. Acessar painel ADMIN.
2. Alternar modo jogador e administração.
3. Consultar usuários.
4. Administrar permissões.
5. Autorizar Marcus como mestre.
6. Gerar convites privilegiados.
7. Revogar convites.
8. Consultar campanhas.
9. Desativar contas.
10. Reativar contas.
11. Consultar auditoria.
12. Verificar funcionamento do site.
13. Consultar logs.
14. Configurar variáveis no Render.
15. Conectar MySQL online.
16. Utilizar MySQL Workbench.
17. Aplicar migrações com segurança.
18. Executar backups.
19. Restaurar backups em ambiente isolado.
20. Publicar atualizações.
21. Verificar deploy.
22. Resolver indisponibilidade.
23. Proteger credenciais.
24. Participar como jogador.
25. Evitar spoilers narrativos no modo jogador.

Diferenciar claramente:

Ações dentro do site.

Ações no Render.

Ações no GitHub.

Ações no MySQL Workbench.

---

# 31. TUTORIAIS INTERATIVOS

Quando viável, implementar:

- Destaque de botões.
- Explicação de campos.
- Passos guiados.
- Indicador de progresso.
- Botão para fechar.
- Opção para reabrir.
- Ajuda contextual.

Não bloquear o uso do site obrigando a concluir o tutorial.

Salvar progresso por usuário quando apropriado.

Garantir responsividade.

---

# 32. DOCUMENTAÇÃO DOS MANUAIS

Criar ou atualizar:

/docs/MANUAL_JOGADOR.md

/docs/MANUAL_MESTRE.md

/docs/MANUAL_ADMIN.md

/docs/IDENTIDADE_VISUAL.md

/docs/DEPLOY_RENDER.md

/docs/CONFIGURACAO_MYSQL_ONLINE.md

/docs/REQUISITOS.md

/docs/MATRIZ_RASTREABILIDADE.md

/docs/PROGRESSO.md

Os manuais deverão refletir o funcionamento real.

Não apresentar funcionalidades pendentes como disponíveis.

---

# 33. TESTES UNITÁRIOS

Executar testes de:

- Atributos.
- Recursos.
- Perícias.
- Inventário.
- Fadiga.
- Estado crítico.
- Rolagens.
- Gastos de PE.
- Validações.
- Permissões.
- Visibilidade.

Não remover testes apenas para obter resultados positivos.

---

# 34. TESTES DE INTEGRAÇÃO

Executar fluxo completo:

1. Criar conta.
2. Fazer login.
3. Criar ficha.
4. Salvar.
5. Criar campanha.
6. Convidar jogador.
7. Entrar na campanha.
8. Vincular personagem.
9. Enviar ficha para aprovação.
10. Aprovar ficha.
11. Criar sessão.
12. Iniciar sessão.
13. Realizar rolagem.
14. Alterar PV.
15. Alterar PE.
16. Registrar condição.
17. Criar anotação.
18. Encerrar sessão.
19. Fazer logout.
20. Fazer login novamente.
21. Reabrir ficha.
22. Consultar histórico.
23. Confirmar persistência.

Utilizar banco de teste.

Não utilizar dados reais para testes destrutivos.

---

# 35. TESTES END-TO-END

Utilizar Playwright quando disponível.

Testar:

- Cadastro.
- Login.
- Ficha.
- Campanha.
- Convite.
- Aprovação.
- Modo Sessão.
- Rolagens.
- Recursos.
- Central de Ajuda.
- Logout.

Testar celular e computador.

Não declarar testes executados se o navegador não estiver disponível.

---

# 36. TESTES DE PERMISSÕES

Verificar:

- PLAYER tentando acessar ADMIN.
- PLAYER tentando acessar GM.
- PLAYER tentando editar ficha alheia.
- GM tentando editar campanha alheia.
- Usuário externo tentando entrar em campanha.
- Usuário tentando visualizar notas secretas.
- Usuário tentando manipular rolagens.
- Usuário tentando reutilizar convite revogado.

Todas as operações indevidas deverão ser rejeitadas.

---

# 37. TESTES DE SINCRONIZAÇÃO

Testar:

- Dois celulares conectados.
- Celular e computador.
- Queda de conexão.
- Reconexão.
- Atualização de PV.
- Atualização de SAN.
- Atualização de PE.
- Rolagens compartilhadas.
- Eventos secretos.
- Recuperação do estado.

Não permitir duplicação de operações críticas.

---

# 38. TESTES DE CARGA

Executar testes moderados em ambiente controlado.

Simular:

- Login.
- Abertura de fichas.
- Rolagens.
- Alterações de recursos.
- Atualizações de sessão.

Não executar testes agressivos contra produção sem autorização.

Registrar medições reais.

---

# 39. DEPENDÊNCIAS

Auditar:

- Vulnerabilidades.
- Pacotes desnecessários.
- Versões incompatíveis.
- Dependências abandonadas.
- Erros de build.

Atualizar com cautela.

Executar testes após mudanças.

---

# 40. AMBIENTES

Definir:

DEVELOPMENT.

TEST.

PRODUCTION.

Cada ambiente deverá possuir configurações próprias.

Não compartilhar banco de produção com testes.

Não utilizar credenciais de produção em testes automatizados.

---

# 41. GUIA DE PUBLICAÇÃO NO RENDER

Criar:

/docs/DEPLOY_RENDER.md

Explicar passo a passo:

1. Preparar o repositório GitHub.
2. Criar conta no Render.
3. Conectar repositório.
4. Escolher tipo de serviço.
5. Configurar build.
6. Configurar start.
7. Configurar variáveis de ambiente.
8. Escolher provedor MySQL.
9. Criar banco.
10. Configurar DATABASE_URL.
11. Aplicar migrações.
12. Publicar.
13. Verificar health check.
14. Testar HTTPS.
15. Testar cadastro.
16. Testar login.
17. Testar ficha.
18. Testar campanha.
19. Testar Modo Sessão.
20. Configurar backups.
21. Verificar logs.
22. Publicar atualizações futuras.

Não presumir acesso à conta do proprietário.

Se não houver acesso autorizado, preparar os arquivos e fornecer instruções.

---

# 42. GUIA MYSQL ONLINE

Criar:

/docs/CONFIGURACAO_MYSQL_ONLINE.md

Explicar:

- O que é um servidor MySQL.
- Diferença entre servidor MySQL e Workbench.
- Como avaliar provedores.
- Como verificar compatibilidade.
- Como obter a URL de conexão.
- Como configurar TLS.
- Como conectar ao Render.
- Como executar migrações.
- Como testar conexão.
- Como configurar backups.
- Como conectar pelo Workbench.
- Como trocar de provedor futuramente.

Não inventar preços, planos ou recursos de provedores.

---

# 43. CHECKLIST PRÉ-PUBLICAÇÃO

Criar checklist verificável.

Itens:

- Nome Origem aplicado.
- Interface pt-BR.
- RF revisados.
- RNF revisados.
- RN revisadas.
- Matriz de rastreabilidade atualizada.
- Build concluído.
- TypeScript sem erros.
- Testes críticos aprovados.
- Autenticação segura.
- Permissões verificadas.
- MySQL preparado.
- Migrações testadas.
- Credenciais protegidas.
- CORS configurado.
- HTTPS preparado.
- Armazenamento persistente de imagens, se utilizado.
- Backups preparados.
- Restauração testada.
- Interface mobile validada.
- Modo Sessão validado.
- Central de Ajuda funcionando.
- Tutoriais disponíveis.
- Health check funcionando.

Não marcar itens como concluídos sem evidência.

---

# 44. TESTES PÓS-PUBLICAÇÃO

Quando o site estiver online:

1. Acessar URL pública.
2. Verificar HTTPS.
3. Criar conta de teste.
4. Fazer login.
5. Criar personagem.
6. Salvar.
7. Reabrir.
8. Entrar em campanha.
9. Acessar painel do mestre.
10. Realizar rolagens.
11. Testar sincronização.
12. Testar reconexão.
13. Consultar histórico.
14. Consultar tutoriais.
15. Fazer logout.

Não utilizar personagens reais para testes destrutivos.

---

# 45. DOCUMENTAÇÃO DE INCIDENTES

Criar:

/docs/INCIDENTES.md

Registrar:

- Problema.
- Impacto.
- Data.
- Causa.
- Correção.
- Prevenção.

Preparar procedimentos para:

- Banco indisponível.
- Erro de deploy.
- Falha de autenticação.
- Dados inconsistentes.
- Credenciais comprometidas.
- Perda de conectividade.

---

# 46. MANUTENÇÃO

Criar:

/docs/MANUTENCAO.md

Incluir:

- Atualização de dependências.
- Backups.
- Logs.
- Monitoramento.
- Revisão de permissões.
- Testes periódicos.
- Processo de deploy.
- Recuperação após falhas.

Evitar atualizações diretamente em produção sem testes.

---

# 47. RELATÓRIO FINAL

Ao terminar, apresentar:

## A. Estado geral

- Concluído.
- Parcialmente concluído.
- Bloqueado.

## B. Funcionalidades verificadas

Descrever resultados reais.

## C. Requisitos

Informar:

- Total de RF.
- RF implementados e testados.
- Total de RNF.
- RNF verificados.
- Total de RN.
- RN validadas.
- Pendências.

## D. Testes

Informar:

- Comandos executados.
- Testes aprovados.
- Testes com falha.
- Testes bloqueados.

## E. Segurança

Descrever problemas corrigidos e pendentes.

## F. Banco

Informar estado das migrações e da conexão.

## G. Publicação

Informar URL real, se houver.

Não inventar URL.

## H. Tutoriais

Informar quais estão implementados.

## I. Pendências

Listar decisões e ações que dependem do proprietário.

## J. Próximos passos

Explicar como utilizar a plataforma.

---

# 48. ORDEM OBRIGATÓRIA DE EXECUÇÃO

**ETAPA 0 — AUDITORIA**

Inspecionar as Partes 1, 2, 3 e 4.

**ETAPA A — IDENTIDADE E IDIOMA**

Aplicar nome Origem e padronizar pt-BR.

**ETAPA B — ENGENHARIA DE REQUISITOS**

Revisar RF, RNF e RN.

Criar matriz de rastreabilidade.

**ETAPA C — CORREÇÕES E SEGURANÇA**

Corrigir falhas críticas.

**ETAPA D — TESTES**

Executar testes unitários, integração e E2E.

**ETAPA E — TUTORIAIS**

Criar Central de Ajuda e manuais.

**ETAPA F — BANCO ONLINE**

Preparar integração com MySQL gerenciado sem escolher provedor.

**ETAPA G — RENDER**

Preparar e executar deploy quando houver acesso autorizado.

**ETAPA H — BACKUPS**

Preparar e validar recuperação.

**ETAPA I — VALIDAÇÃO**

Testar a aplicação online quando publicada.

**ETAPA J — DOCUMENTAÇÃO**

Atualizar todos os arquivos e apresentar relatório.

Não ignorar falhas críticas para acelerar a conclusão.

---

# 49. CRITÉRIOS DE ACEITAÇÃO FINAIS

A Parte 5 estará concluída quando:

1. O projeto tiver sido auditado.
2. O nome público Origem estiver aplicado.
3. O nome for facilmente configurável.
4. A interface estiver em pt-BR.
5. Todos os RF estiverem revisados.
6. Todos os RNF estiverem revisados.
7. Todas as RN estiverem revisadas.
8. A matriz de rastreabilidade estiver atualizada.
9. As falhas críticas tiverem sido corrigidas.
10. O build funcionar.
11. Os testes essenciais passarem.
12. As permissões estiverem verificadas.
13. A autenticação estiver segura.
14. O MySQL estiver preparado para hospedagem externa.
15. O deploy estiver preparado para Render.
16. A estratégia de backup estiver documentada.
17. A restauração estiver testada quando houver infraestrutura.
18. O tutorial do jogador funcionar.
19. O tutorial do mestre funcionar.
20. O tutorial do administrador funcionar.
21. A Central de Ajuda estiver acessível.
22. O Modo Sessão funcionar.
23. A sincronização funcionar.
24. O site estiver responsivo.
25. A documentação estiver atualizada.
26. A publicação estiver comprovada quando realizada.
27. As dependências externas pendentes estiverem explicitamente identificadas.

Não declarar o site publicado antes de verificar uma URL real.

Não declarar o banco de produção configurado antes da escolha e configuração do provedor.

Não declarar testes de restauração aprovados sem executá-los.

---

# 50. COMANDO FINAL PARA O CODEX

Continue o repositório existente.

O nome provisório da plataforma agora será:

**ORIGEM**

O sistema de RPG continuará sendo:

**SISTEMA HÍBRIDO 2.6**

Não confunda os dois nomes.

Implemente a mudança de identidade sem comprometer a arquitetura existente.

Padronize toda a interface em português brasileiro.

Reforce os requisitos funcionais, não funcionais e regras de negócio.

Crie uma matriz de rastreabilidade verificável.

Audite e corrija problemas das quatro partes anteriores.

Revise autenticação, permissões, segurança e persistência.

Prepare o site para hospedagem no Render.

Mantenha o banco MySQL compatível com um provedor gerenciado ainda não escolhido.

Crie tutoriais completos para jogadores, mestres e administradores.

Disponibilize uma Central de Ajuda dentro do próprio site.

Garanta que o sistema seja fácil de utilizar em celulares e computadores.

Execute testes reais.

Documente o que foi comprovado e o que permanece pendente.

Não invente resultados.

Não apague funcionalidades aprovadas.

Não altere mecânicas de RPG sem autorização.

Ao terminar, apresente um relatório final detalhado com o estado real do projeto, os requisitos atendidos, os testes executados, as pendências de infraestrutura e os próximos passos para publicação.

**OBJETIVO FINAL: ENTREGAR O ORIGEM COMO UMA PLATAFORMA DIGITAL DE RPG EM PORTUGUÊS BRASILEIRO, SEGURA, RESPONSIVA, DOCUMENTADA, FÁCIL DE UTILIZAR, PREPARADA PARA O RENDER E COMPATÍVEL COM MYSQL ONLINE, COM SUPORTE COMPLETO A JOGADORES, MESTRES E ADMINISTRADORES.**

# FIM DO PROMPT MASTER — PARTE 5 DE 5
# PROJETO: ORIGEM
# SISTEMA INICIAL: SISTEMA HÍBRIDO 2.6
