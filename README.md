# Origem — Plataforma de RPG

Plataforma da campanha de Marcus, utilizando as regras do **Sistema Híbrido 2.6**. Versão 0.5.0, retomada da Parte 5: contas, fichas, campanhas e Modo Sessão preservados; autenticação/TLS/SSE reforçados, interface Origem em português brasileiro e Central de Ajuda com progresso persistente. Frontend e API usam a mesma origem. O estado atual e as ressalvas ficam em [docs/PROGRESSO.md](docs/PROGRESSO.md) e [docs/AUDITORIA_FINAL.md](docs/AUDITORIA_FINAL.md). O [checkpoint anterior](docs/CHECKPOINT_PARTE5.md) permanece como histórico.

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
2. Com acesso autorizado, clone `https://github.com/bkluis1234/site_sistema_hibridoRPG.git` e confira a branch main sincronizada. Entre na pasta do projeto.
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
| `npm run start:render` | Servidor compilado com orçamento de heap para instância pequena |
| `npm run db:generate` | Gerar cliente Prisma |
| `npm run db:validate` | Validar schema Prisma |
| `npm run db:check` | Confirmar conexão e TLS sem exibir credenciais |
| `npm run security:secrets` | Verificar padrões conhecidos de segredos e arquivos sensíveis |
| `npm run db:deploy` | Aplicar migrações versionadas |
| `npm run db:test:deploy` | Aplicar migrações somente no banco de teste configurado |
| `npm run db:migrate -- --name descricao` | Criar migração em desenvolvimento |
| `npm run admin:create` | Criar somente o primeiro ADMIN no servidor |
| `npm run admin:recover` | Emitir código após verificação de identidade documentada |

## Testar com MySQL

Copie `.env.test.example` para `.env.test` e preencha com `NODE_ENV=test`, DATABASE_URL apontando para um banco **dedicado** cujo nome termine em `_test`, APP_ORIGIN=http://localhost:5173 e CSRF_SECRET aleatório. Nunca use banco de jogadores nos testes. Os testes de integração apagam somente seus registros `it_*`; os testes novos de campanha/sessão também removem seus registros sintéticos `c3_*`/`e3_*`/`g4_*`/`e4_*`; os E2E anteriores deixam registros `e2e_*` no banco descartável. A guarda impede rodar em nomes sem `_test`, mas não substitui conferir host e credenciais.

Aplique primeiro a migração no banco de teste com `npm run db:test:deploy`, que carrega `.env.test` e valida a guarda de ambiente antes de chamar o Prisma. Não copie credenciais de produção. `npm exec -- playwright install chromium` instala o navegador necessário (sistemas Linux podem precisar das dependências nativas do Playwright). Em seguida execute integração e E2E. O runner executa cada arquivo e perfil (desktop/mobile) com servidores novos, isolando o limite real de tentativas por IP entre dispositivos simulados. Não desativa a proteção da API. Os relatórios ficam em subpastas por arquivo/perfil de test-results e playwright-report. Resultados efetivamente executados e limites da versão atual estão em docs/VALIDACAO.md; a auditoria de entrada da Parte 4 repetiu os 125 cenários anteriores com sucesso. A regressão da Parte 4 tinha 186 testes aprovados. As quantidades e os resultados atualizados da Parte 5 ficam em docs/AUDITORIA_FINAL.md.

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
- [Medição SSE e memória](docs/DESEMPENHO.md)

O histórico está no [repositório público GitHub](https://github.com/bkluis1234/site_sistema_hibridoRPG), branch main. Os cinco commits originais, incluindo ce85c37, foram publicados e preservados. O problema antigo de acesso foi resolvido; commits e sincronização da Parte 5 devem ser conferidos no relatório Git da entrega. Nunca use force push, envie .env/dumps/traces ou confunda commit publicado com aplicação implantada.

## Segurança, ajuda e produção

- [Segurança e limites](docs/SEGURANCA.md) e [divulgação responsável](SECURITY.md).
- [Matriz RF/RNF/RN](docs/MATRIZ_RASTREABILIDADE.md).
- Central de Ajuda em `/help`, com tutoriais opcionais e leitura persistente por conta. Manual textual em [docs/TUTORIAIS.md](docs/TUTORIAIS.md).
- [Publicação passo a passo](docs/PUBLICACAO.md): Web Service Node no Render, frontend servido pelo Express e MySQL gerenciado externo com TLS; Aiven Free é candidato sujeito à confirmação dos limites. Modelo em render.yaml, auto deploy desativado.
- `npm run security:secrets` verifica padrões conhecidos em arquivos/histórico; `npm run db:check` confirma conexão/TLS; `npm run audit:database` ensaia migrações, reinício e backup/restauração em MySQL local isolado; `npm run audit:load -- 300` mede 20 usuários por cinco minutos em banco de teste. `npm run audit:load:compiled -- 300` separa o backend compilado dos clientes para medir sua memória em Linux.

A CI preparada executa verificações em MySQL efêmero, sem credenciais reais ou implantação. Não se presume resultado remoto sem workflow concluído. npm ci usa o lockfile; nenhuma dependência runtime foi adicionada nesta etapa. Os exemplos de ambiente contêm somente placeholders.

**Ainda sem deploy público.** O proprietário precisa configurar e autorizar Render/Aiven e validar HTTPS, proxy, memória, desempenho, privilégios e backup no ambiente real. Retrato persistente, exportação de fichas e confirmação do manual completo continuam pendentes. Dados essenciais nunca dependem do disco temporário do Render; não há coleta de localização, analytics ou telemetria externa adicionada.

A carga local compilada da retomada passou com 20 usuários, 6.000 leituras e 400/400 sinais, RSS pico isolado 318,83 MiB e liberação dos streams. Essa medição não garante capacidade/latência no Render Free; homologação de CPU, rede, logins concorrentes, HTTPS, banco e cold start permanece necessária. Nenhum serviço externo ou deploy foi criado.

**Parte 5: validação local concluída, PRONTO COM RESSALVAS.** A [CI remota desta retomada](https://github.com/bkluis1234/site_sistema_hibridoRPG/actions/runs/41211653751) também passou. Configuração/homologação Render/Aiven, manual e pendências explicitadas no relatório continuam necessárias; código publicado não significa aplicação implantada.
