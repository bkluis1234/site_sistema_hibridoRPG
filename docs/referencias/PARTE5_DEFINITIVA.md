# ORIGEM — PARTE 5 DEFINITIVA
## AUDITORIA INTEGRAL, SEGURANÇA AVANÇADA, HARDENING, QUALIDADE, PREPARAÇÃO PARA PRODUÇÃO E PUBLICAÇÃO

### PAPEL E MISSÃO

Você é o responsável técnico pelo projeto **Origem**, atuando simultaneamente como:

- Arquiteto de software sênior.
- Engenheiro full-stack especializado em React, TypeScript, Node.js e Express.
- Engenheiro de segurança de aplicações (Application Security).
- Especialista em DevSecOps e segurança de supply chain.
- Engenheiro de banco de dados MySQL e Prisma.
- Engenheiro de infraestrutura e implantação em nuvem.
- Especialista em testes automatizados e qualidade de software.
- Auditor de autenticação, autorização e proteção de dados.
- Especialista em sistemas multiplayer e comunicação em tempo real.
- Responsável pela documentação técnica e operacional.

Sua missão é **concluir a Parte 5 do Origem**, trabalhando diretamente no repositório existente, preservando as funcionalidades implementadas nas Partes 1 a 4 e elevando a aplicação ao maior nível de segurança e confiabilidade viável para seu porte e infraestrutura.

Esta não é uma tarefa apenas documental.

Você deve **inspecionar, testar, corrigir, implementar, validar, documentar e registrar** as alterações necessárias.

Não considere o projeto pronto apenas porque compila, porque os testes atuais passam ou porque o GitHub está conectado.

O objetivo é preparar uma aplicação real, utilizada por pessoas reais, com contas, personagens, campanhas e sessões de RPG.

---

# 1. CONTEXTO OFICIAL

## 1.1 Identidade do projeto

**Nome público da plataforma:** Origem.

**Sistema de regras utilizado:** Sistema Híbrido 2.6.

Esses nomes não são intercambiáveis.

Origem é o produto digital. Sistema Híbrido 2.6 é o conjunto de regras do RPG.

Não renomeie automaticamente todas as referências ao sistema de regras.

Toda a interface voltada ao usuário deve utilizar português brasileiro.

## 1.2 Repositório

Repositório GitHub:

https://github.com/bkluis1234/site_sistema_hibridoRPG

Branch principal:

main

Diretório anteriormente utilizado:

/workspace/sistema-hibrido

Último commit confirmado antes desta tarefa:

ce85c372fe1101ae0c19ee64a299c4e189cd20d8

O repositório está público.

O problema anterior de autenticação HTTP 403 foi resolvido, e os cinco commits anteriores foram publicados.

Verifique novamente o estado atual antes de trabalhar.

Não presuma que o último commit continuará sendo o mesmo durante toda a execução.

## 1.3 Tecnologias

A arquitetura anteriormente definida utiliza:

- React.
- TypeScript.
- Vite.
- Tailwind CSS.
- Node.js.
- Express.
- Prisma.
- MySQL 8.
- Git e GitHub.

Inspecione a implementação real antes de tomar decisões.

Não substitua a stack por outra apenas por preferência.

## 1.4 Perfis

A aplicação possui três perfis principais:

**ADMIN:** responsável pela administração da plataforma, podendo também participar como jogador quando permitido.

**MESTRE:** responsável por campanhas, gerenciamento de sessões e ações autorizadas de mestre.

**JOGADOR:** responsável por seus personagens e sua participação nas campanhas.

A autorização deve respeitar tanto o papel global quanto a relação específica do usuário com cada campanha ou recurso.

## 1.5 Infraestrutura pretendida

A publicação inicial deve priorizar custo zero, quando os planos gratuitos estiverem disponíveis e forem tecnicamente adequados:

- GitHub para código-fonte.
- Render Web Service para backend.
- Render Static Site para frontend, se apropriado.
- Aiven Free MySQL como candidato para banco de produção.

Não presuma que os serviços já foram configurados.

Não contrate serviços pagos.

Não execute implantação pública automaticamente sem autorização.

---

# 2. PRINCÍPIOS INEGOCIÁVEIS

1. Preserve o trabalho das Partes 1, 2, 3 e 4.
2. Não reinicie o projeto.
3. Não substitua funcionalidades complexas por versões simplificadas.
4. Não altere regras oficiais do Sistema Híbrido 2.6 sem respaldo na documentação.
5. Não invente requisitos, resultados de testes ou evidências.
6. Não utilize `git push --force`.
7. Não reescreva o histórico Git sem autorização.
8. Não execute migrações destrutivas em produção.
9. Não utilize `prisma migrate reset` em produção.
10. Não exponha credenciais.
11. Não armazene senhas em texto puro.
12. Não confie no frontend como mecanismo de autorização.
13. Não permita que usuários comuns adquiram privilégios administrativos.
14. Não exponha dados privados em endpoints públicos.
15. Não desabilite segurança para fazer testes passarem.
16. Não ignore falhas críticas ou altas sem justificativa.
17. Não declare funcionalidades concluídas sem comprovação.
18. Não publique automaticamente bancos ou serviços na internet.
19. Não utilize credenciais reais em testes.
20. Não registre dados sensíveis em logs.
21. Não faça alterações irreversíveis sem autorização.
22. Não execute testes de ataque contra sistemas externos de terceiros.
23. Limite verificações de segurança ativas ao ambiente local, de teste ou a recursos expressamente autorizados.
24. Não adicione serviços externos de monitoramento, analytics ou telemetria sem avaliar privacidade e obter autorização quando necessário.
25. Não introduza dependências desnecessárias.

Quando houver conflito entre facilidade de implementação e segurança dos usuários, priorize segurança, preservando a funcionalidade legítima.

---

# 3. ETAPA ZERO — DIAGNÓSTICO E PLANEJAMENTO

Antes de modificar o projeto:

1. Leia o README.
2. Inspecione a estrutura de diretórios.
3. Leia os requisitos funcionais.
4. Leia os requisitos não funcionais.
5. Leia as regras de negócio.
6. Leia a documentação do Sistema Híbrido 2.6.
7. Leia os relatórios das Partes 1–4.
8. Leia os documentos existentes da Parte 5.
9. Inspecione os scripts e configurações.
10. Inspecione os testes.
11. Inspecione o schema Prisma.
12. Inspecione o histórico Git.
13. Verifique o estado remoto.

Execute os comandos Git adequados, incluindo:

```bash
git status
git branch -vv
git remote -v
git log --oneline -10
git fetch origin
```

Não altere ou descarte arquivos não commitados.

Identifique quais componentes já estão implementados e quais ainda faltam.

Monte uma matriz de rastreabilidade entre:

- Requisitos funcionais (RF).
- Requisitos não funcionais (RNF).
- Regras de negócio (RN).
- Implementação.
- Testes.
- Evidências.
- Pendências.

Classifique problemas por severidade:

- CRÍTICO.
- ALTO.
- MÉDIO.
- BAIXO.

Priorize problemas que possam comprometer contas, dados, permissões ou integridade do sistema.

---

# 4. SEGURANÇA DO REPOSITÓRIO PÚBLICO

O código do Origem está disponível publicamente.

Considere que qualquer pessoa pode examinar:

- Código-fonte.
- Estrutura de APIs.
- Dependências.
- Histórico Git.
- Configurações.
- Scripts.
- Documentação pública.

A segurança deve permanecer eficaz mesmo quando um atacante conhece a implementação.

## 4.1 Auditoria de segredos

Examine arquivos versionados e histórico Git em busca de:

- Senhas.
- Tokens.
- Chaves de API.
- Chaves privadas.
- Credenciais administrativas.
- Strings de conexão.
- Credenciais MySQL.
- Credenciais de provedores.
- Tokens de sessão.
- Certificados privados.
- Cookies reais.
- Dados pessoais reais.
- Dumps de banco.
- Backups sensíveis.
- Arquivos `.env`.
- Logs contendo segredos.

Utilize Gitleaks ou ferramenta equivalente, se disponível.

Evite imprimir segredos completos nos resultados.

Diferencie:

- Credenciais reais.
- Valores fictícios.
- Placeholders.
- Falsos positivos.

Se encontrar segredo real:

1. Trate-o como potencialmente comprometido.
2. Registre sua localização sem revelar seu conteúdo.
3. Oriente revogação e rotação.
4. Corrija a origem da exposição.
5. Não considere suficiente apenas apagar o arquivo atual.
6. Não reescreva o histórico automaticamente.

## 4.2 Arquivos de ambiente

Revise `.gitignore`.

Garanta que arquivos com segredos estejam ignorados.

Mantenha exemplos seguros, como:

`.env.example`

Os exemplos devem conter apenas valores fictícios.

Não exponha variáveis privadas no frontend.

Lembre que variáveis `VITE_*` podem ser incorporadas ao bundle público.

## 4.3 Segurança de dependências

Inspecione:

- Dependências vulneráveis.
- Dependências abandonadas.
- Dependências não utilizadas.
- Dependências transitivas críticas.
- Scripts de instalação.
- Pacotes de procedência duvidosa.
- Incompatibilidades de versões.
- Integridade do lockfile.

Execute a auditoria compatível com o gerenciador de pacotes real.

Corrija vulnerabilidades relevantes sem quebrar funcionalidades.

Não atualize indiscriminadamente todas as bibliotecas para versões major.

## 4.4 Segurança de GitHub Actions

Se existirem workflows:

- Utilize permissões mínimas.
- Restrinja o `GITHUB_TOKEN`.
- Não exponha segredos em logs.
- Não disponibilize segredos de produção a pull requests não confiáveis.
- Revise gatilhos privilegiados.
- Evite execução de código não confiável com credenciais.
- Utilize ações confiáveis e versões fixadas.
- Separe CI de implantação quando apropriado.

Prepare uma política segura para contribuições externas.

Não confie automaticamente em alterações propostas por terceiros.

---

# 5. SEGURANÇA DOS USUÁRIOS

Esta é uma das prioridades absolutas.

O Origem deve proteger os usuários contra:

- Roubo de contas.
- Vazamento de informações.
- Acesso não autorizado.
- Alteração indevida de personagens.
- Exclusão indevida de campanhas.
- Manipulação de rolagens.
- Abuso de permissões.
- Exposição de sessões privadas.
- Ataques comuns contra aplicações web.

## 5.1 Cadastro

Audite o cadastro de usuários.

Verifique:

- Validação de campos.
- Normalização de identificadores.
- Tratamento de duplicidade.
- Política de senhas.
- Mensagens de erro.
- Proteção contra abuso.
- Atribuição segura do papel inicial.
- Limites de requisições.
- Persistência correta.

O cadastro público nunca deve atribuir ADMIN ou MESTRE automaticamente sem uma autorização apropriada.

Não colete dados pessoais desnecessários.

## 5.2 Senhas

Garanta que:

- Senhas sejam armazenadas com hash apropriado.
- O algoritmo seja adequado, como Argon2id ou bcrypt configurado corretamente.
- Não exista armazenamento reversível.
- Não exista senha padrão compartilhada.
- Não existam senhas reais em seeds.
- Senhas não sejam registradas em logs.
- Senhas não sejam retornadas pela API.
- Comparações utilizem mecanismos seguros.

Avalie a política de senha sem impor regras arbitrárias que prejudiquem a usabilidade.

## 5.3 Login

Verifique:

- Autenticação correta.
- Rate limiting.
- Tratamento de falhas.
- Proteção contra enumeração desnecessária de contas.
- Sessões expiradas.
- Logout.
- Revogação de sessões quando suportada.
- Persistência de login.
- Comportamento em múltiplas abas.
- Comportamento após reinício do servidor.

## 5.4 Cookies e tokens

Identifique o mecanismo real de autenticação.

Se utilizar cookies:

- `HttpOnly`.
- `Secure` em HTTPS.
- `SameSite` adequado.
- Domínio correto.
- Caminho apropriado.
- Expiração.
- Proteção CSRF quando necessária.

Se utilizar tokens:

- Assinatura adequada.
- Expiração.
- Armazenamento seguro.
- Validação no servidor.
- Revogação quando necessária.
- Proteção contra exposição.

Não introduza um segundo mecanismo de autenticação sem necessidade.

## 5.5 Recuperação de conta

Se existir recuperação de senha:

- Tokens devem expirar.
- Tokens devem ser de uso único.
- Não devem ser previsíveis.
- Não devem aparecer em logs.
- O fluxo deve evitar exposição desnecessária de existência de contas.

Se a recuperação não existir, documente a ausência como limitação e avalie sua prioridade.

Não simule envio de e-mail como se estivesse funcional em produção.

---

# 6. AUTORIZAÇÃO E ISOLAMENTO ENTRE USUÁRIOS

Audite todas as rotas, consultas e operações que envolvam recursos pertencentes a usuários ou campanhas.

O controle de acesso deve acontecer no backend.

## 6.1 Jogador

Um jogador não pode:

- Editar personagem de terceiros sem autorização.
- Ler informações privadas de campanhas alheias.
- Modificar resultados de rolagens.
- Alterar seu papel global.
- Excluir campanhas que não controla.
- Executar comandos administrativos.
- Visualizar informações privadas do mestre.
- Acessar sessões às quais não pertence.

## 6.2 Mestre

Um mestre deve possuir apenas as permissões estabelecidas para as campanhas que administra.

Ser mestre de uma campanha não concede automaticamente controle sobre todas as campanhas.

Verifique:

- Propriedade.
- Participação.
- Convites.
- Aprovação.
- Permissões de edição.
- Permissões de exclusão.
- Gerenciamento de personagens.
- Gerenciamento de sessões.
- Rolagens privadas.
- Informações ocultas.

## 6.3 Administrador

Verifique:

- Proteção das rotas administrativas.
- Validação do papel no servidor.
- Auditoria de operações críticas.
- Prevenção de autoelevação de privilégios.
- Proteção contra alteração indevida de papéis.
- Procedimento seguro de criação do primeiro ADMIN.

Não crie contas administrativas com credenciais fixas no repositório.

## 6.4 IDOR e escalonamento de privilégios

Revise todos os endpoints que recebem identificadores.

Exemplos:

- IDs de personagens.
- IDs de campanhas.
- IDs de usuários.
- IDs de sessões.
- IDs de eventos.
- IDs de rolagens.

Conhecer um identificador não deve conceder acesso ao recurso.

Crie testes de autorização horizontal e vertical.

---

# 7. PROTEÇÃO DAS APIS

Audite o backend Express.

Verifique:

- Validação de entradas.
- Tipos e formatos.
- Limites de tamanho.
- Campos inesperados.
- Tratamento de erros.
- Respostas HTTP.
- Autenticação.
- Autorização.
- CORS.
- CSRF quando aplicável.
- Rate limiting.
- Cabeçalhos de segurança.
- Configuração de proxy.
- Injeção SQL.
- XSS.
- Exposição de stack traces.
- Vazamento de dados internos.
- Uso inseguro de arquivos.
- Condições de corrida.
- Abuso de endpoints.

Utilize mecanismos seguros do Prisma.

Revise qualquer uso de SQL bruto.

Não confie em valores do frontend para definir permissões ou resultados de operações críticas.

Não configure CORS como aberto indiscriminadamente com credenciais.

Não exponha erros internos completos aos usuários.

---

# 8. SEGURANÇA DE DADOS E PRIVACIDADE

O Origem deve proteger informações pessoais e conteúdo privado das campanhas.

## 8.1 Minimização de dados

Colete apenas os dados necessários para o funcionamento da plataforma.

Não adicione campos de identificação pessoal desnecessários.

## 8.2 Exposição de informações

Verifique se endpoints públicos retornam apenas campos necessários.

Evite retornar objetos completos do banco quando contiverem informações privadas.

Utilize seleção explícita de campos quando apropriado.

## 8.3 Logs

Não registre:

- Senhas.
- Tokens.
- Cookies.
- Credenciais.
- Strings de conexão.
- Informações privadas desnecessárias.

Defina níveis adequados de log.

## 8.4 Retenção e exclusão

Revise as funcionalidades existentes de exclusão de contas e dados.

Se não houver política de retenção, documente a lacuna.

Não implemente exclusão irreversível de dados sem considerar relacionamentos, integridade e requisitos existentes.

## 8.5 LGPD e menores de idade

Como a plataforma pode ser utilizada por adolescentes, adote minimização de dados, configurações de privacidade adequadas e atenção especial à proteção de menores.

Documente responsabilidades de tratamento de dados e lacunas de conformidade.

Não declare conformidade integral com a LGPD sem avaliação jurídica e operacional apropriada.

Não crie funcionalidades de rastreamento, perfilamento ou coleta de localização desnecessárias.

---

# 9. INTEGRIDADE DO SISTEMA HÍBRIDO 2.6

A aplicação deve respeitar as regras oficiais existentes.

Audite:

- Atributos.
- Perícias.
- Criação de personagens.
- Progressão.
- Recursos.
- Vida.
- Condições.
- Inventário.
- Equipamentos.
- Combate.
- Modificadores.
- Rolagens.
- Campanhas.
- Sessões.
- Histórico de ações.

O modelo de rolagem 1d20 roll-under deve ser preservado onde for previsto pelas regras.

Não substitua por mecânicas de outros sistemas de RPG.

## 9.1 Rolagens seguras

Verifique se:

- O servidor controla a geração dos resultados quando necessário.
- Jogadores não conseguem escolher resultados arbitrários.
- Modificadores são validados.
- Rolagens privadas respeitam permissões.
- Rolagens públicas são compartilhadas corretamente.
- Eventos duplicados são tratados.
- O histórico mantém integridade.
- A origem de cada rolagem pode ser auditada.
- A aplicação não confia em resultados fornecidos pelo cliente sem validação.

Utilize um gerador aleatório adequado para impedir manipulação previsível quando a segurança da rolagem depender disso.

## 9.2 Fichas

Verifique:

- Validação de campos.
- Limites de atributos.
- Recursos.
- Alterações permitidas.
- Integridade de relacionamentos.
- Persistência.
- Atualizações concorrentes.
- Histórico de alterações quando existente.

Não permita valores impossíveis por manipulação direta da API.

---

# 10. CAMPANHAS E SESSÕES AO VIVO

Audite integralmente o modo sessão implementado na Parte 4.

## 10.1 Campanhas

Verifique:

- Criação.
- Convites.
- Participação.
- Saída.
- Remoção.
- Permissões.
- Propriedade.
- Exclusão.
- Privacidade.
- Listagem.
- Gerenciamento pelo mestre.

## 10.2 Server-Sent Events

O sistema utiliza SSE para eventos compartilhados.

Audite:

- Autenticação.
- Autorização.
- Isolamento entre campanhas.
- Reconexão.
- Desconexão.
- Limpeza de conexões.
- Consumo de memória.
- Clientes lentos.
- Duplicidade de eventos.
- Ordem dos eventos.
- Recuperação de estado.
- Persistência.
- Timeouts.
- Compatibilidade com proxies.

Não exponha tokens em URLs.

Não permita que participantes de uma campanha recebam eventos privados de outra.

## 10.3 Hospedagem gratuita

Considere que o Render Free pode suspender instâncias inativas.

A aplicação deve tratar corretamente:

- Perda de conexão.
- Reinicialização.
- Reconexão.
- Atualização de página.
- Recuperação de estado.
- Erros temporários.

Não dependa exclusivamente de estado mantido em memória para informações essenciais.

Não utilize mecanismos artificiais para burlar políticas do provedor.

---

# 11. MYSQL, PRISMA E INTEGRIDADE DOS DADOS

Audite:

- Schema Prisma.
- Migrações.
- Relacionamentos.
- Índices.
- Restrições.
- Tipos.
- Integridade referencial.
- Transações.
- Concorrência.
- Tratamento de erros.
- Pool de conexões.
- Encerramento de conexões.
- Persistência.

## 11.1 Migrações

Valide as migrações em banco de teste.

Prepare o procedimento de produção com `prisma migrate deploy`, se compatível com a implementação.

Não execute migrações destrutivas em produção.

Não utilize reset em produção.

Não descarte dados existentes.

## 11.2 Segurança do banco

O banco de produção deve utilizar:

- Credenciais próprias.
- Variáveis de ambiente.
- TLS conforme exigido pelo provedor.
- Privilégios mínimos viáveis.
- Acesso restrito quando possível.
- Configuração segura de conexões.

Não desative verificação TLS para contornar erros.

Não exponha o banco diretamente ao navegador.

## 11.3 Aiven MySQL

Avalie a compatibilidade com o Aiven Free MySQL.

Prepare instruções para:

- Criar a instância.
- Obter os parâmetros de conexão.
- Configurar TLS.
- Montar a `DATABASE_URL`.
- Configurar Prisma.
- Aplicar migrações.
- Verificar conectividade.
- Testar persistência.
- Preparar backup.

Não solicite ou imprima a senha real do banco.

Não crie o banco sem autorização.

## 11.4 Backups

Documente:

- Estratégia de backup.
- Frequência.
- Restauração.
- Teste de restauração.
- Limitações do provedor.
- Responsabilidade pela retenção.

Backups não devem ficar em repositório público.

---

# 12. PREPARAÇÃO DO BACKEND PARA RENDER

Inspecione os scripts reais do projeto.

Determine:

- Root Directory.
- Build Command.
- Start Command.
- Versão do Node.
- Gerenciador de pacotes.
- Variáveis de ambiente.
- Porta.
- Health check.
- Migrações.
- Encerramento gracioso.
- Dependências de produção.

Não invente comandos.

Garanta que o Express escute a porta definida pelo ambiente e aceite conexões de maneira compatível com o Render.

Não dependa de `localhost` para comunicação externa.

Não utilize ferramentas exclusivas de desenvolvimento como solução de produção sem justificativa.

## 12.1 Configuração exata

Produza uma tabela com:

- Name.
- Language.
- Branch.
- Region.
- Root Directory.
- Build Command.
- Start Command.
- Health Check Path.
- Instance Type.
- Environment Variables.

Prefira o plano Free se disponível e adequado.

Não configure planos pagos.

## 12.2 Health check

Prepare um endpoint seguro de verificação de saúde.

Não exponha:

- Credenciais.
- Informações internas detalhadas.
- Variáveis de ambiente.
- Stack traces.
- Dados privados.

Diferencie, quando apropriado, disponibilidade do processo e prontidão para atender requisições.

---

# 13. PREPARAÇÃO DO FRONTEND

Determine a melhor arquitetura de publicação:

- Render Static Site separado.
- Frontend servido pelo Express.

Baseie a escolha no código existente.

Se utilizar Static Site, determine:

- Root Directory.
- Build Command.
- Publish Directory.
- Variáveis públicas.
- URL da API.
- Regras de reescrita de rotas.
- CORS.
- Autenticação entre origens.
- HTTPS.

Garanta que não existam URLs de desenvolvimento fixadas em produção.

Não inclua segredos em `VITE_*`.

Revise o bundle final para evitar exposição de dados privados.

---

# 14. INTERFACE, UX E ACESSIBILIDADE

Preserve a identidade visual do Origem.

Audite todas as telas existentes:

- Página inicial.
- Cadastro.
- Login.
- Dashboard.
- Personagens.
- Fichas.
- Campanhas.
- Painel do mestre.
- Painel administrativo.
- Sessões ao vivo.
- Rolagens.
- Inventário.
- Histórico.
- Tutoriais.
- Mensagens de erro.

Corrija:

- Botões sem função.
- Links quebrados.
- Navegação inconsistente.
- Erros visuais.
- Layouts que quebram no celular.
- Textos em inglês voltados ao usuário.
- Falhas de feedback.
- Estados vazios confusos.
- Mensagens técnicas excessivas.

Verifique:

- Navegação por teclado.
- Foco visível.
- Labels.
- Contraste.
- Semântica.
- Mensagens acessíveis.
- Responsividade.

Não faça redesign completo sem necessidade.

---

# 15. TESTES DE SEGURANÇA

Crie ou amplie testes automatizados que comprovem os controles implementados.

Inclua cenários negativos, como:

- Usuário sem autenticação acessando rota privada.
- Jogador tentando editar personagem de terceiros.
- Mestre tentando administrar campanha alheia.
- Jogador tentando alterar seu papel para ADMIN.
- Usuário tentando acessar campanha privada por ID.
- Requisição com payload inválido.
- Requisição excessivamente grande.
- Rolagem manipulada pelo cliente.
- Evento SSE acessado por participante não autorizado.
- Token expirado.
- Sessão inválida.
- Operação concorrente inconsistente.
- Tentativa de acesso a campos restritos.

Execute esses testes somente em ambiente local ou de teste autorizado.

Não faça ataques contra serviços externos.

Não exponha payloads sensíveis em logs públicos.

---

# 16. TESTES FUNCIONAIS E DE REGRESSÃO

Execute os testes existentes.

O relatório anterior mencionou 78 testes unitários aprovados.

Confirme a quantidade atual.

Teste:

- Cadastro.
- Login.
- Logout.
- Criação de personagem.
- Edição de personagem.
- Persistência.
- Campanhas.
- Convites.
- Permissões.
- Rolagens.
- Modo sessão.
- SSE.
- Painel administrativo.
- Painel do mestre.
- Regras do RPG.
- Erros.
- Reconexão.

Não declare sucesso sem execução real.

Não altere expectativas de testes apenas para ocultar bugs.

---

# 17. QUALIDADE DE CÓDIGO

Revise:

- Organização.
- Tipagem.
- Duplicações.
- Tratamento de erros.
- Dependências.
- Código morto.
- Acoplamento.
- Separação de responsabilidades.
- Nomenclatura.
- Comentários.
- Scripts.
- Configuração.
- Testabilidade.

Corrija problemas relevantes sem promover refatorações grandes e arriscadas sem necessidade.

Priorize legibilidade e manutenção.

---

# 18. CI/CD SEGURO

Avalie implementar GitHub Actions para:

- Instalação reproduzível.
- Typecheck.
- Lint.
- Testes.
- Build.
- Auditoria de dependências.
- Detecção de segredos.

Use permissões mínimas.

Não disponibilize credenciais de produção em pull requests públicos.

Não execute deploy automático sem autorização.

Documente o processo de revisão e publicação.

---

# 19. DOCUMENTAÇÃO

Atualize a documentação existente.

Não descarte conteúdo útil.

## README.md

Inclua:

- Apresentação.
- Funcionalidades.
- Tecnologias.
- Estrutura.
- Instalação.
- Execução.
- Testes.
- Build.
- Segurança.
- Publicação.
- Limitações.

## docs/SEGURANCA.md

Documente:

- Autenticação.
- Autorização.
- Proteção de dados.
- Repositório público.
- Gestão de segredos.
- Rotação de credenciais.
- Resposta a incidentes.
- Política de divulgação responsável.
- Limitações de segurança conhecidas.

Não publique instruções detalhadas para explorar vulnerabilidades ainda não corrigidas.

## docs/PUBLICACAO.md

Crie um guia passo a passo, em português brasileiro, para uma pessoa iniciante.

Explique:

1. GitHub.
2. Render.
3. Backend.
4. Frontend.
5. MySQL.
6. TLS.
7. Variáveis de ambiente.
8. Migrações.
9. Build.
10. Deploy.
11. Testes pós-deploy.
12. Logs.
13. Atualizações.
14. Backups.
15. Recuperação de falhas.

Os comandos devem ser reais.

Não invente URLs, credenciais ou configurações.

## docs/AUDITORIA_FINAL.md

Registre:

- Escopo.
- Metodologia.
- Evidências.
- Problemas.
- Severidade.
- Correções.
- Testes.
- Riscos.
- Pendências.

## docs/PROGRESSO.md

Atualize o progresso real da Parte 5.

## Tutoriais de usuário

Revise os tutoriais de:

- Jogador.
- Mestre.
- Administrador.

Garanta que correspondam às funcionalidades implementadas.

---

# 20. PREPARAÇÃO PARA PUBLICAÇÃO GRATUITA

O objetivo é utilizar infraestrutura gratuita quando tecnicamente viável.

Avalie:

- Render Free Web Service.
- Render Static Site.
- Aiven Free MySQL.

Não assuma que preços ou limites permanecem constantes.

Se não puder consultar as condições atuais, registre que exigem confirmação.

Considere:

- Memória.
- CPU.
- Armazenamento.
- Tráfego.
- Suspensão por inatividade.
- Inicialização.
- Conexões.
- SSE.
- Backups.
- Persistência.
- Disponibilidade.

Não prometa disponibilidade contínua em planos gratuitos.

Não contrate serviços pagos.

Não execute deploy sem autorização.

---

# 21. EXECUÇÃO OBRIGATÓRIA

Não encerre a tarefa após produzir apenas um plano.

Siga esta ordem:

### Fase A — Inventário
Inspecione o código, requisitos, documentos e testes.

### Fase B — Auditoria
Identifique vulnerabilidades e problemas funcionais.

### Fase C — Correções
Implemente correções de segurança e confiabilidade.

### Fase D — Testes
Execute testes e corrija regressões.

### Fase E — Produção
Prepare backend, frontend e banco.

### Fase F — Documentação
Atualize os guias e relatórios.

### Fase G — Validação final
Execute novamente os testes, builds e verificações.

### Fase H — Git
Revise o diff, confirme ausência de segredos e registre as alterações em commits organizados.

Se o repositório remoto estiver acessível e o push for autorizado e seguro, publique os commits na branch apropriada sem sobrescrever trabalho remoto.

Não faça force push.

### Fase I — Relatório
Apresente os resultados e pendências.

Se houver bloqueio externo, continue o trabalho independente que for seguro executar.

---

# 22. CRITÉRIOS DE ACEITAÇÃO

A Parte 5 somente poderá ser declarada concluída quando houver evidências suficientes de que:

- O projeto preserva as funcionalidades anteriores.
- O código compila.
- Os testes relevantes passam.
- As permissões são aplicadas no backend.
- Os usuários estão protegidos contra acessos indevidos conhecidos.
- Não há credenciais reais conhecidas expostas sem tratamento.
- A autenticação é adequada.
- Os dados privados são protegidos.
- As regras do RPG são preservadas.
- As rolagens não podem ser manipuladas indevidamente.
- As campanhas estão isoladas.
- O SSE respeita permissões.
- O banco possui configuração segura.
- As migrações foram verificadas.
- O backend está preparado para produção.
- O frontend está preparado para produção.
- A documentação corresponde à implementação.
- Os riscos remanescentes estão registrados.

Não confunda testes aprovados com ausência absoluta de vulnerabilidades.

Não confunda pronto para deploy com deploy concluído.

---

# 23. RELATÓRIO FINAL OBRIGATÓRIO

Ao concluir, apresente:

## 1. Estado geral
Resumo do que foi realizado.

## 2. Segurança dos usuários
Proteções verificadas, corrigidas e pendentes.

## 3. Segurança do código
Resultado da auditoria de segredos, dependências e GitHub.

## 4. Vulnerabilidades
Quantidade por severidade e situação de cada uma, sem revelar informações exploráveis sensíveis.

## 5. Funcionalidades
O que foi preservado, corrigido e validado.

## 6. Testes
Tabela com comandos reais, resultados e quantidades.

## 7. Arquivos alterados
Principais mudanças e justificativas.

## 8. Backend Render
Valores exatos para configuração do Web Service.

## 9. Frontend Render
Valores exatos para configuração do Static Site, se aplicável.

## 10. MySQL Aiven
Procedimento de criação e configuração segura.

## 11. Custos e limitações
Planos gratuitos, limites e pontos que exigem confirmação.

## 12. Pendências do usuário
Ações externas necessárias.

## 13. Git
Branch, commits, sincronização e arquivos pendentes.

## 14. Classificação final
Escolha uma:

- PRONTO PARA PUBLICAÇÃO.
- PRONTO COM RESSALVAS.
- BLOQUEADO PARA PUBLICAÇÃO.

Justifique com evidências.

---

# 24. INSTRUÇÃO FINAL

Execute esta tarefa como uma auditoria e finalização real de engenharia de software.

Não se limite a recomendações genéricas.

Não declare sucesso sem evidências.

Não altere as regras do RPG sem autorização.

Não comprometa dados ou histórico.

Não introduza custos.

Não publique a aplicação automaticamente.

Priorize, nesta ordem:

1. Segurança das contas e dos usuários.
2. Segurança dos dados privados.
3. Autenticação e autorização.
4. Segurança do repositório público e da cadeia de dependências.
5. Integridade das fichas, campanhas e rolagens.
6. Confiabilidade das sessões ao vivo.
7. Integridade do banco de dados.
8. Correção de bugs e regressões.
9. Preparação para produção.
10. Qualidade de interface e acessibilidade.
11. Documentação.
12. Entrega final verificável.

**O resultado esperado é o Origem preservado, funcional, mais seguro, testado, documentado e preparado para publicação, sem perder o trabalho já realizado.**

Comece inspecionando o repositório e executando a auditoria. Depois implemente as correções necessárias, valide os resultados e apresente o relatório final.