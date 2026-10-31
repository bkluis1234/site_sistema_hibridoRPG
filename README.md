# Sistema Híbrido 2.6

Plataforma real de fichas da campanha de Marcus. Versão 0.4.0: fundação, fichas e campanhas preservadas; Modo Sessão com rolagens compartilhadas, sobrevivência, diário, presença aproximada, SSE/reconexão e histórico MySQL. Auditoria obrigatória das Partes 1/2/3 executada antes da ampliação (docs/AUDITORIA_PARTE_4.md).

A imagem oficial e as regras explícitas da Parte 2 foram utilizadas. O manual completo continua pendente de conferência. **Upload persistente de imagens e publicação ainda não estão concluídos.** O seletor de imagem mostra apenas prévia local até configurar storage externo.

## Tecnologias e organização

Node.js 24 LTS, React 19, TypeScript, Vite, React Router, Tailwind CSS, TanStack Query, React Hook Form, Zod, Lucide, Express 5, Prisma 7 e MySQL 8.4 LTS. Versões exatas em `package-lock.json`.

```text
apps/web             React e componentes reutilizáveis
apps/api             API REST, segurança e comandos de servidor
packages/shared      Contratos Zod e DTOs públicos
packages/rpg-rules   Regras 2.6 compartilhadas, fornecidas na Parte 2
prisma               Modelos e migrações SQL versionadas
tests                Unitários, integração MySQL e E2E
docs                 Requisitos, decisões, operação e progresso
```

## Instalar e executar

1. Instale Git, Node 24 e MySQL 8.4 (ou Docker Compose para desenvolvimento).
2. Com acesso autorizado, clone `https://github.com/bkluis1234/site_sistema_hibridoRPG.git` após a publicação do histórico, ou extraia o pacote de transferência. Entre na pasta do projeto.
3. Execute `npm ci` e `cp .env.example .env` (no PowerShell: `Copy-Item .env.example .env`). Preencha segredos locais, a URL MySQL e a origem web. Use senha de banco dedicada, diferente da senha dos usuários da aplicação.
4. Gere `CSRF_SECRET`: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` e coloque o resultado somente no `.env`.
5. Se usar Compose, preencha também `MYSQL_PASSWORD` e `MYSQL_ROOT_PASSWORD`; execute `docker compose -f compose.dev.yml up -d`. Faça a senha em DATABASE_URL coincidir com MYSQL_PASSWORD. A URL exige codificação de caracteres especiais.
6. Execute `npm run db:generate` e `npm run db:deploy`. A migração inicial já está versionada; `db:migrate` é para desenvolver migrações novas e pode precisar de banco sombra separado.
7. Execute `npm run dev`. Frontend: http://localhost:5173. API: http://localhost:3000/api/health. Vite encaminha `/api` para o Express. Abra sempre pelo frontend.
8. Para a primeira conta administrativa, execute `npm run admin:create` num terminal interativo seguro do servidor. A senha tem entrada oculta; códigos de recuperação aparecem apenas ao concluir. Não informe senhas por argumento de comando.

O diretório de trabalho deve ser a raiz do monorepositório. O cadastro normal já funciona sem administrador. Para habilitar Marcus como mestre, o ADMIN gera um convite no painel e Marcus o utiliza no cadastro. Isso habilita a criação de campanhas; não concede poder global nem acesso a fichas alheias. Para Marcus já cadastrado, ADMIN pode habilitar a criação em Usuários, com reautenticação. O criador torna-se GM da campanha criada. O painel também administra usuários, papéis, configurações e auditoria; conceder ADMIN exige senha e código de recuperação de uso único. Consulte docs/ADMINISTRACAO.md.

## Comandos

| Comando | Uso |
|---|---|
| `npm run dev` | API e frontend em desenvolvimento |
| `npm run typecheck` | Verificação de tipos |
| `npm test` | Testes unitários sem banco |
| `npm run test:integration` | Testes reais com banco MySQL de teste dedicado |
| `npm run test:e2e` | Fluxos Chromium desktop e celular |
| `npm run build` | Frontend e API compilados |
| `npm start` | Servidor compilado; NODE_ENV=production serve também o frontend |
| `npm run db:generate` | Gerar cliente Prisma |
| `npm run db:validate` | Validar schema Prisma |
| `npm run db:deploy` | Aplicar migrações versionadas |
| `npm run db:test:deploy` | Aplicar migrações somente no banco de teste configurado |
| `npm run db:migrate -- --name descricao` | Criar migração em desenvolvimento |
| `npm run admin:create` | Criar somente o primeiro ADMIN no servidor |
| `npm run admin:recover` | Emitir código após verificação de identidade documentada |

## Testar com MySQL

Copie `.env.test.example` para `.env.test` e preencha com `NODE_ENV=test`, DATABASE_URL apontando para um banco **dedicado** cujo nome termine em `_test`, APP_ORIGIN=http://localhost:5173 e CSRF_SECRET aleatório. Nunca use banco de jogadores nos testes. Os testes de integração apagam somente seus registros `it_*`; os testes novos de campanha/sessão também removem seus registros sintéticos `c3_*`/`e3_*`/`g4_*`/`e4_*`; os E2E anteriores deixam registros `e2e_*` no banco descartável. A guarda impede rodar em nomes sem `_test`, mas não substitui conferir host e credenciais.

Aplique primeiro a migração no banco de teste com `npm run db:test:deploy`, que carrega `.env.test` e valida a guarda de ambiente antes de chamar o Prisma. Não copie credenciais de produção. `npm exec -- playwright install chromium` instala o navegador necessário (sistemas Linux podem precisar das dependências nativas do Playwright). Em seguida execute integração e E2E. O runner executa cada arquivo e perfil (desktop/mobile) com servidores novos, isolando o limite real de tentativas por IP entre dispositivos simulados. Não desativa a proteção da API. Os relatórios ficam em subpastas por arquivo/perfil de test-results e playwright-report. Resultados efetivamente executados e limites da versão atual estão em docs/VALIDACAO.md; a auditoria de entrada da Parte 4 repetiu os 125 cenários anteriores com sucesso. A regressão final tem 186 testes aprovados (78 unitários, 90 integrações MySQL e 18 E2E).

## Usar o Modo Sessão

Na campanha, abra Sessões de jogo. GM pode agendar/iniciar/pausar/retomar/encerrar; jogadores aceitos entram com ficha própria vinculada. Sala em /campaigns/:campaignId/sessions/:sessionId. Desktop com três colunas; celular com abas e recursos rápidos. Rolagens oficiais reutilizam o motor existente; resultados secretos são filtrados no servidor, inclusive nas rotas legadas. ADMIN global continua jogador sem acesso GM automático.

SSE usa a mesma origem/cookies, sem token na URL ou biblioteca nova. Se a conexão falhar, polling e refetch recuperam o estado do MySQL. Nenhuma variável obrigatória nova: tempos/limites e configuração do proxy estão em docs/SINCRONIZACAO.md. Transferências estão desativadas por padrão; só GM habilita após aprovar o fluxo da campanha. Nenhuma campanha real foi habilitada nos testes.

## Continuidade e publicação

- [Modo Sessão](docs/MODO_SESSAO.md)
- [Rolagens e PE](docs/ROLAGENS.md)
- [Sincronização e reconexão](docs/SINCRONIZACAO.md)
- [Auditoria de entrada da Parte 4](docs/AUDITORIA_PARTE_4.md)
- [Campanhas e fluxo do grupo](docs/CAMPANHAS.md)
- [Permissões e privacidade](docs/PERMISSOES.md)
- [Administração reforçada](docs/ADMINISTRACAO.md)
- [Auditoria obrigatória das Partes 1/2](docs/AUDITORIA_PARTES_1_2.md)
- [Progresso e próximos passos](docs/PROGRESSO.md)
- [Requisitos RF, RNF e RN](docs/REQUISITOS.md)
- [Arquitetura e limites de segurança](docs/ARQUITETURA.md)
- [Regras implementadas e conferências](docs/REGRAS_RPG.md)
- [Uso e estrutura da ficha digital](docs/FICHA_DIGITAL.md)
- [Contrato da API](docs/API.md)
- [Publicação no Render](docs/PUBLICACAO.md)
- [Backup e recuperação](docs/OPERACAO.md)
- [Informações pendentes do manual](docs/PENDENCIAS_MANUAL.md)
- [Resultados de validação](docs/VALIDACAO.md)

O proprietário criou o repositório privado [bkluis1234/site_sistema_hibridoRPG](https://github.com/bkluis1234/site_sistema_hibridoRPG). O remote `origin` foi configurado nesta cópia, na branch `main`, preservando os quatro commits anteriores. Em 31/10/2026, a leitura remota e o fetch retornaram HTTP 403; a API retornou 404 para o repositório privado. A sessão GitHub está autenticada, mas o acesso efetivo a este repositório não está disponível. **Push não realizado; divergência remota não verificável.**

Habilite o acesso ao novo repositório privado nas permissões da integração GitHub usada pelo Codex. Depois, execute `git fetch origin` e compare os históricos antes de `git push -u origin main`: se `origin/main` existir, `git merge-base --is-ancestor origin/main main` deve confirmar avanço direto, ou será necessário conciliar as alterações preservando ambos os históricos. Nunca use force push. Só após confirmar o envio, clone no PC e conecte a branch `main` ao Render, seguindo [o guia de publicação](docs/PUBLICACAO.md). Um commit local não se sincroniza automaticamente. Nunca envie `.env`, dumps, códigos de recuperação ou arquivos de relatório com credenciais.

A Parte 5 está em andamento: [auditoria inicial e pendências](docs/AUDITORIA_FINAL.md). Seus textos de referência foram preservados, sem declarar implementadas as funcionalidades solicitadas. Render e MySQL gerenciado ainda não foram provisionados.
