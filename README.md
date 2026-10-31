# Sistema Híbrido 2.6

Plataforma real de fichas da campanha de Marcus. Versão 0.3.0: fundação e ficha digital preservadas; campanhas, convites de jogadores, painel do mestre, aprovação mecânica, compartilhamento filtrado e administração integrados com persistência MySQL e controle de conflitos. A auditoria das Partes 1/2 foi executada antes da ampliação (docs/AUDITORIA_PARTES_1_2.md).

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
2. Clone o repositório quando houver uma URL remota, ou extraia o pacote de transferência. Entre na pasta do projeto.
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

Copie `.env.test.example` para `.env.test` e preencha com `NODE_ENV=test`, DATABASE_URL apontando para um banco **dedicado** cujo nome termine em `_test`, APP_ORIGIN=http://localhost:5173 e CSRF_SECRET aleatório. Nunca use banco de jogadores nos testes. Os testes de integração apagam somente seus registros `it_*`; os testes novos de campanha também removem seus registros sintéticos `c3_*`/`e3_*`; os E2E anteriores deixam registros `e2e_*` no banco descartável. A guarda impede rodar em nomes sem `_test`, mas não substitui conferir host e credenciais.

Aplique primeiro a migração no banco de teste com `npm run db:test:deploy`, que carrega `.env.test` e valida a guarda de ambiente antes de chamar o Prisma. Não copie credenciais de produção. `npm exec -- playwright install chromium` instala o navegador necessário (sistemas Linux podem precisar das dependências nativas do Playwright). Em seguida execute integração e E2E. O runner executa cada arquivo e perfil (desktop/mobile) com servidores novos, isolando o limite real de tentativas por IP entre dispositivos simulados. Não desativa a proteção da API. Os relatórios ficam em subpastas por arquivo/perfil de test-results e playwright-report. A regressão registrada da versão 0.3.0 tem 51 testes unitários, 60 de integração e 14 E2E aprovados; detalhes e limites em docs/VALIDACAO.md.

## Continuidade e publicação

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

Ainda não existe repositório remoto fornecido pelo proprietário. Um commit local e o pacote de transferência não se sincronizam automaticamente com o PC. Após criar um repositório vazio privado, execute `git remote add origin <URL>` (ou `git remote set-url origin <URL>` se clonou o bundle) e `git push -u origin main`; no PC, clone essa URL. Nunca envie `.env`, dumps, códigos de recuperação ou arquivos de relatório com credenciais.
