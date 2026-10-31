# SISTEMA HÍBRIDO 2.6
## PLATAFORMA DIGITAL DE RPG
### PROMPT MASTER — PARTE 5 DE 5
### FINALIZAÇÃO, QUALIDADE, SEGURANÇA, REQUISITOS, PORTUGUÊS BRASILEIRO, TUTORIAIS, MYSQL ONLINE E PUBLICAÇÃO NO RENDER

---

# 0. MISSÃO GERAL

Você atuará como engenheiro de software full-stack sênior, arquiteto de software, especialista em segurança, DevOps, bancos de dados, testes automatizados, acessibilidade e experiência do usuário.

Sua missão é concluir o desenvolvimento inicial da plataforma digital de RPG **Sistema Híbrido 2.6**.

As Partes 1, 2, 3 e 4 foram desenvolvidas anteriormente.

O proprietário informou que essas etapas foram concluídas, mas você deverá verificar tecnicamente o estado real do projeto.

O objetivo desta quinta etapa não é recriar a aplicação.

É transformar o projeto existente em uma plataforma:

- Funcional.
- Segura.
- Estável.
- Responsiva.
- Persistente.
- Documentada.
- Fácil de utilizar.
- Inteiramente em português brasileiro.
- Preparada para publicação no Render.
- Compatível com um servidor MySQL online.
- Utilizável por jogadores, mestres e administradores.

**REGRA ABSOLUTA: Não declare o sistema pronto sem evidências reais de funcionamento.**

Não invente testes aprovados.

Não invente URLs de produção.

Não simule persistência como se fosse um banco real.

Não substitua funcionalidades existentes por páginas estáticas.

Não elimine requisitos anteriores.

---

# 1. CONTEXTO DO PROJETO

A plataforma será utilizada inicialmente por um grupo privado de RPG presencial.

O sistema de regras é o **Sistema Híbrido 2.6**, utilizado pelo mestre Marcus.

Existem três perfis principais:

**ADMINISTRADOR**

O proprietário do site.

Possui controle técnico e administrativo da plataforma.

Também participa como jogador.

**MESTRE**

Inicialmente Marcus.

Administra sua campanha, aprova fichas, acompanha personagens e controla sessões.

**JOGADOR**

Cria personagens, edita fichas autorizadas, participa de campanhas e utiliza ferramentas durante as sessões.

Os jogadores utilizarão principalmente celulares.

O mestre poderá utilizar computador ou celular.

O administrador utilizará principalmente computador para manutenção e também poderá jogar pelo celular.

O sistema deverá estar preparado para futuras campanhas e novos mestres autorizados.

---

# 2. DECISÕES DEFINITIVAS DO PROPRIETÁRIO

Considere estas decisões obrigatórias:

1. O site será hospedado no **Render**.
2. O banco de dados será **MySQL**.
3. O provedor do MySQL online ainda não foi escolhido.
4. O proprietário conhece MySQL Workbench.
5. A interface deverá estar integralmente em **português brasileiro (pt-BR)**.
6. Os requisitos RF, RNF e RN deverão ser rigorosamente documentados.
7. O site deverá possuir tutoriais para jogador, mestre e administrador.
8. Os tutoriais deverão estar disponíveis dentro da própria plataforma.
9. O administrador também poderá participar como jogador.
10. As regras mecânicas do RPG deverão seguir o Sistema Híbrido 2.6, sem substituição por outros sistemas.

Não altere essas decisões sem autorização.

---

# 3. TECNOLOGIAS

Preserve a arquitetura existente.

Frontend:

- React.
- TypeScript.
- Vite.
- React Router.
- Tailwind CSS.
- TanStack Query.
- React Hook Form.
- Zod.
- Lucide React.

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
- Playwright, quando disponível.

Infraestrutura:

- GitHub para versionamento.
- Render para hospedagem.
- MySQL gerenciado em provedor a definir.

Não recrie o projeto.

Não substitua MySQL por PostgreSQL, SQLite ou outro banco.

Não introduza serviços desnecessários.

---

# 4. ETAPA ZERO — AUDITORIA COMPLETA

Antes de desenvolver novas funcionalidades, inspecione o projeto inteiro.

Leia:

- README.md.
- /docs/PROGRESSO.md.
- /docs/REQUISITOS.md.
- /docs/API.md.
- Relatórios de auditoria anteriores.
- Documentação das regras.
- Configurações de infraestrutura.

Examine:

- Estrutura do repositório.
- Dependências.
- Configurações TypeScript.
- Componentes React.
- Rotas Express.
- Middlewares.
- Autenticação.
- Autorização.
- Prisma.
- Migrações.
- Banco de dados.
- Serviços.
- Testes.
- Build.
- Sincronização.
- Modo Sessão.

Crie:

/docs/AUDITORIA_FINAL.md

Classifique problemas:

CRITICAL — impede uso seguro ou compromete dados.

HIGH — prejudica funcionalidades essenciais.

MEDIUM — problema relevante, mas contornável.

LOW — melhoria ou problema secundário.

Corrija problemas críticos e de alta severidade antes de considerar a publicação.

---

# 5. AUDITORIA DA PARTE 1

Verifique:

- Cadastro.
- Login.
- Logout.
- Sessões autenticadas.
- Senhas protegidas.
- Criação do administrador inicial.
- Convites privilegiados.
- Papéis globais.
- Proteção das rotas.
- Conexão MySQL.
- Persistência de usuários.
- Dashboard.

Teste os fluxos reais.

Não considerar autenticação funcional apenas porque existe uma tela de login.

---

# 6. AUDITORIA DA PARTE 2

Verifique:

- Criação de personagem.
- Identificação.
- Atributos.
- Perícias.
- Recursos.
- Inventário.
- Equipamentos.
- Condições.
- Rolagens.
- Salvamento.
- Edição.
- Recuperação de dados.
- Proteção de propriedade da ficha.

Confirme que os dados persistem após logout, reinicialização e novo login.

---

# 7. AUDITORIA DA PARTE 3

Verifique:

- Campanhas.
- Participantes.
- Convites.
- Papéis de campanha.
- Painel do mestre.
- Painel administrativo.
- Fichas compartilhadas.
- Aprovação de personagens.
- Solicitações de alteração.
- Auditoria.
- Privacidade.
- Administrador como jogador.

Teste isolamento entre campanhas.

Teste tentativas de acesso indevido.

---

# 8. AUDITORIA DA PARTE 4

Verifique:

- Criação de sessões.
- Início de sessões.
- Pausa.
- Retomada.
- Encerramento.
- Rolagens públicas.
- Rolagens privadas.
- Rolagens do mestre.
- Histórico.
- Diário.
- Recursos.
- Condições.
- Inventário.
- Sincronização.
- Reconexão.
- Controle de presença.

Teste com dois usuários simultâneos quando possível.

---

# 9. IDIOMA OBRIGATÓRIO — PORTUGUÊS BRASILEIRO

**TODA A INTERFACE DO SITE DEVERÁ ESTAR EM PORTUGUÊS BRASILEIRO.**

Não utilizar inglês em textos visíveis ao usuário, exceto nomes próprios, termos consagrados ou expressões que o projeto tenha aprovado.

Traduzir:

- Menus.
- Botões.
- Títulos.
- Subtítulos.
- Formulários.
- Placeholders.
- Tooltips.
- Modais.
- Mensagens de erro.
- Mensagens de sucesso.
- Notificações.
- Avisos.
- Estados vazios.
- Telas de carregamento.
- Painéis.
- Tutoriais.
- Central de Ajuda.
- Mensagens de validação.

Exemplos:

Login → Entrar.

Sign Up → Criar conta.

Dashboard → Painel inicial.

Character Sheet → Ficha de personagem.

Save → Salvar.

Delete → Excluir.

Game Master → Mestre.

Campaign → Campanha.

Session → Sessão.

Inventory → Inventário.

Roll Dice → Rolar dados.

Health Points → Pontos de Vida.

Não traduzir nomes técnicos internos do código obrigatoriamente.

Variáveis, classes, endpoints e nomes de tabelas poderão permanecer em inglês.

---

# 10. PADRÕES BRASILEIROS

Utilizar:

- Locale pt-BR.
- Datas DD/MM/AAAA.
- Horários em formato 24 horas.
- Números formatados adequadamente.
- Mensagens claras e naturais.

Armazenar timestamps de maneira consistente, preferencialmente em UTC.

Exibir horários conforme o fuso configurado.

Evitar datas ambíguas.

Utilizar Intl.DateTimeFormat e Intl.NumberFormat quando apropriado.

Configurar idioma do documento HTML como pt-BR.

---

# 11. PADRONIZAÇÃO DE TEXTOS

Centralizar textos da interface quando isso melhorar a manutenção.

Evitar strings duplicadas e traduções inconsistentes.

Revisar todas as telas.

Criar testes para identificar textos em inglês esquecidos nas principais rotas.

Não traduzir mecanicamente termos específicos do Sistema Híbrido 2.6 que já possuam nomenclatura aprovada.

---

# 12. ENGENHARIA DE REQUISITOS — OBRIGATÓRIA

O projeto deverá possuir documentação profissional de requisitos.

Existem três categorias:

**RF — REQUISITOS FUNCIONAIS**

Descrevem o que o sistema faz.

**RNF — REQUISITOS NÃO FUNCIONAIS**

Descrevem qualidades e restrições técnicas do sistema.

**RN — REGRAS DE NEGÓCIO**

Descrevem regras que governam o comportamento da plataforma e as mecânicas do RPG.

Não misture as três categorias.

Não elimine requisitos existentes.

Não renumere identificadores sem necessidade.

---

# 13. REQUISITOS FUNCIONAIS — RF

Revise todos os RF das Partes 1 a 5.

Cada RF deverá conter:

- ID.
- Nome.
- Descrição.
- Ator.
- Prioridade.
- Pré-condições.
- Fluxo principal.
- Fluxos alternativos.
- Resultado esperado.
- Critérios de aceitação.
- Referências de implementação.
- Testes relacionados.
- Estado atual.

Abranger:

- Contas.
- Autenticação.
- Fichas.
- Atributos.
- Perícias.
- Recursos.
- Inventário.
- Condições.
- Rolagens.
- Campanhas.
- Convites.
- Aprovações.
- Painel do mestre.
- Painel administrativo.
- Modo Sessão.
- Sincronização.
- Diário.
- Histórico.
- Notificações.
- Tutoriais.
- Central de Ajuda.

Adicionar RF específicos para:

- Acessar tutorial do jogador.
- Acessar tutorial do mestre.
- Acessar tutorial do administrador.
- Consultar ajuda contextual.
- Retomar tutorial.
- Consultar documentação de utilização.

---

# 14. REQUISITOS NÃO FUNCIONAIS — RNF

Revise todos os RNF.

Abranger:

- Segurança.
- Desempenho.
- Responsividade.
- Disponibilidade.
- Integridade.
- Persistência.
- Recuperação.
- Acessibilidade.
- Privacidade.
- Manutenibilidade.
- Observabilidade.
- Compatibilidade.
- Implantação.
- Backup.
- Restauração.
- Localização pt-BR.

Cada RNF deverá possuir critério de verificação.

Exemplos:

**RNF — Idioma**

Todas as interfaces principais deverão estar em português brasileiro.

**RNF — Responsividade**

O sistema deverá funcionar em telas pequenas sem rolagem horizontal involuntária.

**RNF — Segurança**

Ações administrativas deverão exigir autorização validada pelo servidor.

**RNF — Persistência**

Dados confirmados pelo servidor deverão permanecer disponíveis após novo login.

**RNF — Recuperação**

A aplicação deverá recuperar o estado persistido após perda de conexão.

Definir metas realistas.

Não afirmar que metas foram atingidas sem medições.

---

# 15. REGRAS DE NEGÓCIO — RN

Revise todas as RN.

Documentar:

- ADMIN possui privilégios globais autorizados.
- GM administra apenas campanhas autorizadas.
- PLAYER edita apenas fichas próprias permitidas.
- Jogadores visualizam informações compartilhadas.
- Dados privados respeitam permissões.
- Dados GM_ONLY permanecem restritos.
- Fichas aprovadas possuem campos protegidos.
- Alterações bloqueadas exigem aprovação.
- Convites possuem validade e limites.
- Rolagens oficiais são geradas pelo servidor.
- Gastos de PE são transacionais.
- Recursos respeitam limites mecânicos.
- Inventário respeita capacidade.
- Histórico registra alterações relevantes.
- Administrador pode participar como jogador.
- Modo jogador não revela automaticamente segredos narrativos.

Documentar também todas as regras mecânicas aprovadas do Sistema Híbrido 2.6.

Não inventar regras para preencher lacunas.

---

# 16. MATRIZ DE RASTREABILIDADE

Criar:

/docs/MATRIZ_RASTREABILIDADE.md

Relacionar:

RF → código → endpoint/componente → teste → resultado.

RNF → critério → método de verificação → evidência.

RN → implementação → teste → resultado.

Estados:

IMPLEMENTADO_E_TESTADO.

IMPLEMENTADO_SEM_TESTE.

PARCIAL.

PENDENTE.

BLOQUEADO.

Não marcar requisitos como concluídos apenas porque possuem documentação.

---

# 17. REVISÃO DAS REGRAS DO SISTEMA HÍBRIDO 2.6

Verificar:

Atributos:

- AGI.
- FOR.
- INT.
- PRE.
- VIG.

Criação:

- Atributos começam em 1.
- Três pontos adicionais para distribuir.
- Possibilidade de reduzir atributo para 0 conforme regra aprovada.
- Máximo inicial de 3.
- Quatro perícias treinadas inicialmente.

Recursos:

PV = 10 + 2 × VIG.

SAN = 10 + 2 × PRE.

PE = 3 + PRE.

Perícias:

Alvo = 8 + 3 × atributo + 2 se treinada.

Alvo máximo = 19.

Rolagem:

d20 igual ou inferior ao alvo.

20 natural sempre falha.

Inventário:

FOR × 5 espaços.

FOR 0 = 2 espaços.

Fadiga:

0: sem penalidade.

1: −2.

2: −4.

3: −6.

Utilizar a lista de perícias afetadas realmente configurada e aprovada.

Consultar a documentação do projeto para as demais regras.

Não substituir o sistema por mecânicas de Tormenta20 ou Ordem Paranormal.

---

# 18. SEGURANÇA DE AUTENTICAÇÃO

Auditar:

- Cadastro.
- Login.
- Logout.
- Hash de senhas.
- Sessões.
- Cookies.
- Expiração.
- Revogação.
- Proteção contra força bruta.
- Recuperação de acesso.

Utilizar hash seguro, como Argon2id, conforme a arquitetura existente.

Não armazenar senhas em texto puro.

Configurar cookies adequadamente.

Implementar proteção CSRF quando necessária.

Não expor credenciais.

---

# 19. SEGURANÇA DE AUTORIZAÇÃO

Verificar:

- Papéis globais.
- Papéis de campanha.
- Propriedade de personagens.
- Acesso às fichas.
- Acesso ao painel do mestre.
- Acesso ao painel administrativo.
- Acesso às rolagens secretas.
- Acesso às anotações privadas.

Todas as permissões deverão ser validadas no backend.

Não confiar em papéis enviados pelo frontend.

Testar manipulação de IDs.

---

# 20. SEGURANÇA DA APLICAÇÃO

Auditar:

- SQL Injection.
- XSS.
- CSRF.
- Controle de acesso.
- Rate limiting.
- CORS.
- Upload de arquivos.
- Exposição de informações.
- Dependências vulneráveis.
- Headers HTTP.
- Configurações de produção.

Não utilizar CORS irrestrito com credenciais.

Não construir SQL por concatenação insegura.

Não exibir stack traces aos usuários finais.

---

# 21. PROTEÇÃO DE DADOS

Aplicar princípio do menor privilégio.

Minimizar coleta de informações pessoais.

Proteger:

- Contas.
- Personagens.
- Campanhas.
- Sessões.
- Anotações.
- Histórico.
- Segredos narrativos.
- Logs.

Não registrar senhas ou tokens em logs.

Não enviar dados privados ao navegador de usuários não autorizados.

---

# 22. INTEGRIDADE DO MYSQL

Verificar:

- Chaves primárias.
- Chaves estrangeiras.
- Índices.
- Restrições.
- Transações.
- Concorrência.
- Migrações.
- Integridade referencial.

Evitar:

- Duplicação de itens.
- Gastos duplicados.
- Aprovações duplicadas.
- Convites reutilizados indevidamente.
- Sobrescrita silenciosa.
- Exclusões acidentais.

---

# 23. MYSQL ONLINE — PROVEDOR INDEFINIDO

**O banco será MySQL, mas o proprietário ainda não escolheu onde hospedá-lo.**

Não escolher um provedor definitivo sem autorização.

Não trocar MySQL por outro banco.

Preparar a aplicação para serviços MySQL compatíveis.

Documentar:

- Versões suportadas.
- DATABASE_URL.
- TLS.
- Restrições de rede.
- Conexão Prisma.
- Migrações.
- Backups.
- Restauração.
- Custos a verificar.
- Procedimento de mudança de provedor.

Criar:

/docs/CONFIGURACAO_MYSQL_ONLINE.md

Explicar como conectar um banco MySQL gerenciado ao Render.

Não presumir que MySQL Workbench é um servidor.

O Workbench é uma ferramenta de administração.

---

# 24. PREPARAÇÃO DO PRISMA

Verificar:

- Schema.
- Migrations.
- Prisma Client.
- DATABASE_URL.
- Pool de conexões.
- Compatibilidade com MySQL.

Utilizar migrações seguras em produção.

Não executar:

prisma migrate reset em produção.

Comandos destrutivos de sincronização em produção.

Seeds que apaguem dados reais.

Testar migrações antes da publicação.

---

# 25. VARIÁVEIS DE AMBIENTE

Criar ou atualizar:

.env.example

Documentar:

DATABASE_URL.

NODE_ENV.

PORT.

FRONTEND_URL.

CORS_ORIGIN.

SESSION_SECRET, quando aplicável.

COOKIE_DOMAIN, quando aplicável.

Variáveis de storage, quando necessárias.

Não incluir valores reais.

Não enviar segredos ao GitHub.

Validar configurações obrigatórias na inicialização.

---

# 26. HOSPEDAGEM DEFINIDA — RENDER

**O site será hospedado no Render.**

Não trocar automaticamente por outro serviço.

Avaliar:

- Frontend estático + API separada.
- Aplicação integrada.

Escolher a estrutura mais apropriada ao projeto existente.

Documentar a decisão.

Preparar:

- Build.
- Start.
- Health check.
- HTTPS.
- CORS.
- Cookies.
- Variáveis de ambiente.
- Logs.
- Domínio.
- Redirecionamentos.
- Deploy automático quando apropriado.

Não presumir que o plano escolhido oferece recursos ilimitados.

---

# 27. CONFIGURAÇÃO DE DEPLOY

Criar ou adaptar:

render.yaml, quando adequado.

Dockerfile, se necessário.

.dockerignore, se necessário.

Scripts de build.

Scripts de inicialização.

Garantir build reproduzível.

Não exigir Docker se o deploy nativo do Render for suficiente.

---

# 28. HEALTH CHECK

Implementar:

GET /api/health

Distinguir, quando apropriado:

- Liveness.
- Readiness.

Não expor credenciais.

Não revelar detalhes internos sensíveis.

Verificar dependências essenciais sem consultas excessivas.

---

# 29. ARMAZENAMENTO DE IMAGENS

Verificar retratos de personagens e capas de campanhas.

Não depender de arquivos temporários do serviço web.

Utilizar armazenamento persistente compatível.

Validar:

- Formato.
- Tamanho.
- Permissões.
- Nome de arquivo.
- Exclusão.
- Erros.

Documentar configurações pendentes.

---

# 30. BACKUPS

Criar estratégia de backup para o MySQL.

Definir:

- Frequência.
- Retenção.
- Armazenamento.
- Criptografia.
- Controle de acesso.
- Procedimento de restauração.

Não presumir backups automáticos sem verificar o provedor escolhido.

Não guardar o único backup no mesmo local do banco.

Não versionar backups com dados reais.

---

# 31. TESTE DE RESTAURAÇÃO

Preparar procedimento:

1. Gerar backup.
2. Criar ambiente isolado.
3. Restaurar dados.
4. Verificar tabelas.
5. Verificar contas.
6. Verificar fichas.
7. Verificar campanhas.
8. Verificar sessões.
9. Verificar integridade.
10. Registrar resultado.

Nunca restaurar um backup de teste sobre o banco de produção.

---

# 32. LOGS E MONITORAMENTO

Implementar logs estruturados.

Registrar:

- Inicialização.
- Erros.
- Falhas de autenticação.
- Falhas de autorização.
- Erros de banco.
- Falhas de sincronização.
- Erros de API.

Não registrar segredos.

Preparar monitoramento básico de disponibilidade.

---

# 33. DESEMPENHO

Verificar:

- Carregamento de páginas.
- Consultas MySQL.
- Renderização React.
- Tamanho de bundles.
- Imagens.
- Modo Sessão.
- Uso de memória.
- Conexões simultâneas.

Priorizar simplicidade e eficiência para um grupo pequeno.

Não criar infraestrutura distribuída sem necessidade.

---

# 34. RESPONSIVIDADE

Testar larguras representativas:

320 px.

375 px.

390 px.

430 px.

768 px.

1024 px.

1440 px.

Verificar todas as telas.

Evitar rolagem horizontal involuntária.

Garantir botões acessíveis por toque.

---

# 35. ACESSIBILIDADE

Implementar:

- Labels.
- Foco visível.
- Navegação por teclado.
- Contraste.
- Mensagens claras.
- Indicadores que não dependam apenas de cor.
- Controles acessíveis.
- Semântica adequada.

A estética de terror não deverá prejudicar a leitura.

---

# 36. CENTRAL DE AJUDA DENTRO DO SITE

**REQUISITO OBRIGATÓRIO.**

Criar uma área chamada:

CENTRAL DE AJUDA

Rota sugerida:

/ajuda

Disponibilizar acesso pelo menu.

A Central de Ajuda deverá oferecer:

- Tutorial do Jogador.
- Tutorial do Mestre.
- Tutorial do Administrador.
- Perguntas frequentes.
- Explicações de mecânicas.
- Solução de problemas comuns.

O conteúdo deverá ser apresentado conforme o papel do usuário.

Não expor instruções administrativas sensíveis a jogadores comuns.

---

# 37. TUTORIAL COMPLETO DO JOGADOR

Criar tutorial em português brasileiro.

Explicar:

1. Como acessar o site.
2. Como criar conta.
3. Como fazer login.
4. Como recuperar acesso, conforme a funcionalidade existente.
5. Como editar perfil.
6. Como criar personagem.
7. Como preencher identificação.
8. Como distribuir atributos.
9. Como escolher perícias.
10. Como interpretar PV, SAN e PE.
11. Como utilizar inventário.
12. Como salvar a ficha.
13. Como verificar salvamento.
14. Como entrar em campanha.
15. Como visualizar fichas compartilhadas.
16. Como solicitar aprovação.
17. Como solicitar alterações.
18. Como entrar no Modo Sessão.
19. Como rolar dados.
20. Como interpretar resultados.
21. Como utilizar PE.
22. Como alterar recursos.
23. Como consultar condições.
24. Como criar anotações.
25. Como consultar histórico.
26. Como agir após desconexão.
27. Como sair da conta.

Priorizar instruções para celular.

Utilizar capturas reais da aplicação quando disponíveis.

---

# 38. TUTORIAL COMPLETO DO MESTRE

Criar tutorial para Marcus e futuros mestres.

Explicar:

1. Como acessar conta.
2. Como receber permissão de mestre.
3. Como criar campanha.
4. Como configurar campanha.
5. Como gerar convites.
6. Como convidar jogadores.
7. Como aceitar participantes.
8. Como consultar fichas.
9. Como aprovar personagens.
10. Como rejeitar fichas.
11. Como editar personagens.
12. Como controlar recursos.
13. Como administrar condições.
14. Como criar sessão.
15. Como iniciar sessão.
16. Como acompanhar participantes.
17. Como realizar rolagens secretas.
18. Como compartilhar resultados.
19. Como registrar eventos.
20. Como criar notas privadas.
21. Como pausar sessão.
22. Como retomar sessão.
23. Como encerrar sessão.
24. Como consultar histórico.
25. Como resolver conflitos.
26. Como agir após desconexão.

Priorizar uso no computador, sem excluir celulares.

---

# 39. TUTORIAL COMPLETO DO ADMINISTRADOR

Criar tutorial para o proprietário.

Explicar:

1. Como acessar painel ADMIN.
2. Como alternar entre administração e modo jogador.
3. Como consultar usuários.
4. Como administrar permissões.
5. Como autorizar Marcus como mestre.
6. Como gerar convites privilegiados.
7. Como revogar convites.
8. Como consultar campanhas.
9. Como desativar contas.
10. Como reativar contas.
11. Como consultar auditoria.
12. Como verificar saúde da aplicação.
13. Como consultar logs.
14. Como configurar Render.
15. Como configurar MySQL online.
16. Como utilizar MySQL Workbench.
17. Como aplicar migrações.
18. Como realizar backups.
19. Como testar restauração.
20. Como publicar atualizações.
21. Como verificar deploy.
22. Como lidar com indisponibilidade.
23. Como proteger credenciais.
24. Como utilizar sua própria ficha como jogador.
25. Como evitar spoilers narrativos no painel comum.

Diferenciar ações internas do site e ações externas no Render, GitHub ou Workbench.

Não expor credenciais nos exemplos.

---

# 40. TUTORIAIS INTERATIVOS

Além dos manuais, implementar quando viável:

- Orientações de primeira utilização.
- Destaques em botões.
- Explicação de campos.
- Indicador de progresso.
- Opção de pular.
- Opção de reabrir tutorial.
- Ajuda contextual.

Não bloquear o usuário obrigando a concluir tutoriais.

Salvar progresso quando apropriado.

Garantir funcionamento em celular e computador.

---

# 41. DOCUMENTAÇÃO DOS TUTORIAIS

Criar:

/docs/MANUAL_JOGADOR.md

/docs/MANUAL_MESTRE.md

/docs/MANUAL_ADMIN.md

Os manuais deverão refletir a aplicação real.

Não documentar funcionalidades pendentes como se estivessem disponíveis.

---

# 42. GUIA DE PUBLICAÇÃO NO RENDER

Criar:

/docs/DEPLOY_RENDER.md

Incluir:

1. Pré-requisitos.
2. GitHub.
3. Estrutura do projeto.
4. Escolha da arquitetura de deploy.
5. Configuração do MySQL.
6. DATABASE_URL.
7. Configuração do Prisma.
8. Variáveis de ambiente.
9. Configuração do Render.
10. Build.
11. Start.
12. Health check.
13. HTTPS.
14. CORS.
15. Cookies.
16. Migrações.
17. Testes pós-publicação.
18. Backups.
19. Atualizações.
20. Solução de problemas.

Utilizar linguagem compreensível para estudante de Desenvolvimento de Sistemas.

Não presumir acesso às contas externas.

---

# 43. GUIA DO MYSQL ONLINE

Criar:

/docs/CONFIGURACAO_MYSQL_ONLINE.md

Explicar:

- Diferença entre MySQL Server e MySQL Workbench.
- Como escolher um provedor.
- Como criar banco.
- Como obter credenciais.
- Como configurar TLS.
- Como configurar acesso de rede.
- Como conectar Prisma.
- Como conectar Render.
- Como aplicar migrações.
- Como testar conexão.
- Como consultar dados pelo Workbench.
- Como configurar backups.
- Como trocar de provedor futuramente.

Não escolher definitivamente o serviço.

---

# 44. TRATAMENTO DE ERROS

Criar mensagens claras em pt-BR para:

- Login incorreto.
- Sessão expirada.
- Falha de conexão.
- Erro ao salvar.
- Permissão insuficiente.
- Banco indisponível.
- Dados inválidos.
- Conflito de edição.
- Erro de upload.
- Sessão encerrada.

Não mostrar stack traces ao usuário.

Não confirmar salvamento antes da resposta do servidor.

---

# 45. TESTES UNITÁRIOS

Executar testes para:

- Atributos.
- Recursos.
- Perícias.
- Inventário.
- Fadiga.
- Estado crítico.
- Rolagens.
- Gastos de PE.
- Visibilidade.
- Validações.
- Permissões.
- Estados de sessão.

Não remover testes para esconder falhas.

---

# 46. TESTES DE INTEGRAÇÃO

Executar fluxo completo:

1. Criar conta.
2. Fazer login.
3. Criar ficha.
4. Salvar.
5. Criar campanha com usuário autorizado.
6. Convidar jogador.
7. Entrar em campanha.
8. Vincular personagem.
9. Enviar ficha.
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
23. Verificar persistência.

Utilizar banco de testes.

Não utilizar dados reais em testes destrutivos.

---

# 47. TESTES END-TO-END

Utilizar Playwright quando disponível.

Testar:

- Cadastro.
- Login.
- Fichas.
- Campanhas.
- Convites.
- Aprovações.
- Modo Sessão.
- Rolagens.
- Recursos.
- Tutoriais.
- Central de Ajuda.
- Logout.

Executar em viewport mobile e desktop.

Registrar resultados reais.

---

# 48. TESTES DE PERMISSÕES

Testar:

- PLAYER tentando acessar ADMIN.
- PLAYER tentando acessar GM.
- PLAYER editando ficha alheia.
- GM acessando campanha alheia.
- Usuário externo acessando sessão.
- Usuário tentando consultar notas secretas.
- Usuário tentando manipular rolagens.
- Usuário tentando utilizar convite revogado.

Todas as ações indevidas deverão ser rejeitadas.

---

# 49. TESTES DE LOCALIZAÇÃO PT-BR

Verificar:

- Telas principais em português.
- Botões traduzidos.
- Mensagens de erro traduzidas.
- Datas formatadas.
- Horários formatados.
- Tutoriais em português.
- Central de Ajuda em português.
- Ausência de textos ingleses acidentais.
- Terminologia consistente.

---

# 50. TESTES DOS TUTORIAIS

Verificar:

- Jogador acessa tutorial do jogador.
- Mestre acessa tutorial do mestre.
- Administrador acessa tutorial administrativo.
- Links internos funcionam.
- Conteúdo corresponde às telas reais.
- Tutoriais funcionam no celular.
- Tutoriais funcionam no computador.
- Conteúdo restrito não é exposto indevidamente.
- Ajuda contextual funciona quando implementada.

---

# 51. TESTES DE SINCRONIZAÇÃO

Testar:

- Dois jogadores conectados.
- Jogador e mestre conectados.
- Alteração de PV.
- Alteração de PE.
- Rolagem pública.
- Rolagem privada.
- Reconexão.
- Recuperação de estado.
- Eventos duplicados.
- Conflitos de edição.

Não inventar resultados.

---

# 52. TESTES DE CARGA

Realizar testes moderados em ambiente de teste.

Simular um grupo pequeno de jogadores.

Medir:

- Tempo de resposta.
- Erros.
- Uso de memória.
- Conexões.
- Sincronização.

Não executar testes agressivos em produção sem autorização.

---

# 53. AUDITORIA DE DEPENDÊNCIAS

Verificar:

- Vulnerabilidades.
- Pacotes obsoletos.
- Dependências desnecessárias.
- Compatibilidade.
- Build.

Atualizar de forma controlada.

Executar testes após mudanças.

---

# 54. ESTRATÉGIA DE MIGRAÇÃO

Antes de alterar schema:

1. Inspecionar.
2. Avaliar impacto.
3. Gerar migração.
4. Testar.
5. Verificar preservação de dados.
6. Preparar recuperação.
7. Documentar.

Não apagar dados de produção para resolver problemas.

---

# 55. AMBIENTES

Separar:

DEVELOPMENT.

TEST.

PRODUCTION.

Cada ambiente deverá utilizar banco e configuração apropriados.

Não utilizar banco de produção em testes automatizados.

---

# 56. CHECKLIST DE PRÉ-PUBLICAÇÃO

Criar checklist verificável.

Incluir:

- Build funcionando.
- TypeScript sem erros.
- Testes críticos aprovados.
- Interface pt-BR.
- RF revisados.
- RNF revisados.
- RN revisadas.
- Matriz de rastreabilidade.
- Tutoriais.
- Central de Ajuda.
- Segurança.
- Permissões.
- Banco preparado.
- Migrações testadas.
- Segredos protegidos.
- Render configurado.
- CORS.
- Cookies.
- HTTPS.
- Backups.
- Restauração.
- Responsividade.
- Modo Sessão.
- Sincronização.
- Logs.

Não marcar como concluído sem evidência.

---

# 57. TESTES PÓS-PUBLICAÇÃO

Após publicação real, verificar:

1. URL acessível.
2. HTTPS ativo.
3. Cadastro.
4. Login.
5. Criação de ficha.
6. Salvamento.
7. Reabertura.
8. Campanha.
9. Convites.
10. Painel do mestre.
11. Painel administrativo.
12. Rolagens.
13. Sincronização.
14. Reconexão.
15. Central de Ajuda.
16. Tutoriais.
17. Logout.

Não inventar URL pública.

---

# 58. DOCUMENTAÇÃO DE INCIDENTES

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
- Falha de deploy.
- Erro de autenticação.
- Dados inconsistentes.
- Credenciais comprometidas.
- Perda de conexão.

---

# 59. MANUTENÇÃO

Criar:

/docs/MANUTENCAO.md

Documentar:

- Atualização de dependências.
- Backups.
- Monitoramento.
- Logs.
- Permissões.
- Testes periódicos.
- Processo de deploy.
- Recuperação.

---

# 60. RELATÓRIO FINAL

Ao terminar, apresente:

**A. Estado do projeto**

Concluído, parcialmente concluído ou bloqueado.

**B. Funcionalidades**

O que foi realmente implementado e verificado.

**C. Requisitos**

Quantidade de RF, RNF e RN.

Quantidade implementada, testada e pendente.

**D. Testes**

Comandos executados, testes aprovados, falhas e bloqueios.

**E. Segurança**

Problemas encontrados e corrigidos.

**F. Idioma**

Resultado da revisão pt-BR.

**G. Tutoriais**

Quais tutoriais estão disponíveis e como acessá-los.

**H. Banco**

Estado das migrações e conexão.

**I. Render**

Estado da preparação e da publicação.

**J. Pendências externas**

Ações que dependem do proprietário.

Não inventar resultados.

---

# 61. CRITÉRIOS DE ACEITAÇÃO FINAIS

A Parte 5 somente poderá ser considerada integralmente concluída quando:

1. O projeto estiver auditado.
2. Falhas críticas estiverem corrigidas.
3. Build funcionar.
4. Testes essenciais passarem.
5. Interface estiver em pt-BR.
6. RF estiverem documentados.
7. RNF estiverem documentados.
8. RN estiverem documentadas.
9. Matriz de rastreabilidade estiver atualizada.
10. Autenticação estiver protegida.
11. Permissões estiverem validadas.
12. Persistência estiver comprovada.
13. MySQL de produção estiver configurado.
14. Migrações estiverem aplicadas.
15. Backups estiverem operacionais.
16. Restauração estiver testada.
17. Render estiver configurado.
18. Site estiver publicado, caso o acesso autorizado tenha sido disponibilizado.
19. HTTPS estiver ativo.
20. Cadastro e login funcionarem online.
21. Fichas funcionarem online.
22. Campanhas funcionarem online.
23. Modo Sessão funcionar online.
24. Sincronização funcionar.
25. Tutorial do jogador estiver disponível.
26. Tutorial do mestre estiver disponível.
27. Tutorial do administrador estiver disponível.
28. Central de Ajuda funcionar.
29. Responsividade estiver validada.
30. Documentação estiver atualizada.

Se o provedor MySQL ainda não tiver sido escolhido, classifique a configuração de produção como pendente.

Se o acesso ao Render ainda não estiver disponível, classifique a publicação como pendente.

Não confundir código pronto para implantação com aplicação publicada.

---

# 62. ORDEM OBRIGATÓRIA DE EXECUÇÃO

**ETAPA 0 — AUDITORIA**

Inspecionar as quatro partes anteriores.

**ETAPA A — CORREÇÕES**

Resolver problemas críticos e de alta severidade.

**ETAPA B — PORTUGUÊS BRASILEIRO**

Revisar toda a interface.

**ETAPA C — REQUISITOS**

Revisar RF, RNF e RN.

Criar matriz de rastreabilidade.

**ETAPA D — SEGURANÇA**

Revisar autenticação, autorização e proteção de dados.

**ETAPA E — TUTORIAIS**

Criar os três manuais e a Central de Ajuda.

**ETAPA F — TESTES**

Executar testes unitários, integração, E2E e permissões.

**ETAPA G — INFRAESTRUTURA**

Preparar Render e conexão MySQL independente do provedor.

**ETAPA H — BACKUPS**

Preparar backup e restauração.

**ETAPA I — PUBLICAÇÃO**

Publicar quando houver serviços e acessos autorizados.

**ETAPA J — VALIDAÇÃO FINAL**

Testar a aplicação online.

**ETAPA K — DOCUMENTAÇÃO**

Atualizar manuais, requisitos, auditoria e progresso.

---

# 63. COMANDO FINAL DEFINITIVO

Continue o repositório existente do Sistema Híbrido 2.6.

Não recrie o projeto.

Não elimine funcionalidades das Partes 1, 2, 3 ou 4.

Realize auditoria completa.

Corrija falhas críticas.

Garanta segurança e integridade.

Revise toda a interface para português brasileiro.

Documente rigorosamente RF, RNF e RN.

Crie matriz de rastreabilidade.

Implemente uma Central de Ajuda dentro do site.

Crie tutoriais completos para jogador, mestre e administrador.

Prepare o projeto para hospedagem no Render.

Mantenha MySQL como banco de dados.

Não escolha definitivamente o provedor do MySQL sem autorização.

Prepare variáveis de ambiente, Prisma, migrações, backups e restauração.

Execute testes reais.

Garanta responsividade para celular e computador.

Preserve as regras aprovadas do Sistema Híbrido 2.6.

Preserve a estética visual de terror e sobrevivência.

Não exponha informações secretas do mestre a jogadores.

Permita que o administrador participe como jogador.

Não solicite credenciais reais diretamente no chat.

Não invente testes, URLs, serviços contratados ou funcionalidades concluídas.

Ao finalizar, apresente um relatório detalhado e objetivo do estado real da aplicação.

**OBJETIVO FINAL: ENTREGAR O SISTEMA HÍBRIDO 2.6 COMO UMA PLATAFORMA DIGITAL DE RPG EM PORTUGUÊS BRASILEIRO, SEGURA, ESTÁVEL, DOCUMENTADA, FÁCIL DE UTILIZAR, COM TUTORIAIS PARA TODOS OS PERFIS E PREPARADA PARA PUBLICAÇÃO NO RENDER COM MYSQL ONLINE.**

# FIM DO PROMPT MASTER — PARTE 5 DE 5.
