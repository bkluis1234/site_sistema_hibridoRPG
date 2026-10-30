# Validação da primeira entrega

Data: 30/10/2026. Ambiente cloud Linux, Node 24.19.0, npm 11.9.0, MySQL 8.4 em contêiner local de teste. Nenhum serviço de produção foi provisionado.

| Verificação executada | Resultado | Limite |
|---|---|---|
| `npm run typecheck` | Passou | TypeScript não prova correção em runtime |
| `npm test` | 19/19 passaram | Hash, CSRF, contratos, configuração e bloqueio de mecânicas sem manual |
| `npm run test:integration` | 19/19 passaram | MySQL real local; autorização, sessões, recuperação, convites, persistência, auditoria e concorrência |
| Integração após ajuste de carregamento do .env | Caso de cadastro transacional passou (18 outros não repetidos nessa execução) | Suíte completa já havia passado; alteração final foi apenas localização de configuração |
| `npm run test:e2e` | 4/4 passaram | Fluxo completo e falha de rede, desktop e Pixel 7 em Chromium |
| E2E adicional `--grep conflito` | 2/2 passaram | Conflito, preservação local e recarga explícita, desktop e Pixel 7 |
| `npm run build` | Passou após alteração final da configuração | Frontend ~453 kB JS / ~139 kB gzip; não é benchmark de desempenho |
| `npm run db:generate` / `db:validate` | Passaram, Prisma Client 7.10.1 | Depende de npm ci e geração em outro computador |
| Prisma migrate status | Atualizado | Migração inicial reparada no banco de teste, detalhes abaixo |
| Prisma migrate diff banco → schema | Sem diferenças | CHECKs adicionais são SQL manual versionado, não representados como campos Prisma |
| `npm run db:test:deploy` | Sem migrações pendentes | Guarda exige arquivo .env.test, NODE_ENV=test e nome terminado _test |
| `npm audit --omit=dev --audit-level=high` | 0 vulnerabilidades reportadas | Registro consultado nessa data; não é auditoria independente nem análise de dependências dev |
| CLI admin:create em TTY | Criou ADMIN sintético; segunda execução recusou | Somente banco descartável; senha não apareceu no eco do terminal |
| CLI admin:recover em TTY | Emissão única e auditoria concluídas no ensaio | Identidade fictícia de teste; não valida o processo humano real de verificação |
| Servidor compilado em modo production | /api/health 200, /login e rota SPA 200, API inexistente 404 JSON | Smoke HTTP local de build/roteamento; não prova TLS/DB/infraestrutura de produção |
| `npm run dev -w @hibrido/api` lendo .env da raiz | Porta de teste 3001; /api/health e /api/ready 200 | Testado de dentro do workspace via npm, banco local |
| Revisão visual | Login desktop e dashboard mobile inspecionados | Sem ficha oficial para comparar; sem auditoria WCAG completa |

## Migração e limitações do ambiente

A primeira tentativa encontrou erro MySQL 1101: valor padrão direto em coluna TEXT. O schema e o código foram corrigidos: conceito vazio é informado pela aplicação. A tentativa de reset foi bloqueada pela proteção do Prisma e não foi executada. Uma instância vazia adicional foi tentada, mas seu bootstrap esgotou o disco. O contêiner que falhou antes de servir dados foi descartado; o primeiro foi preservado.

A recuperação do banco de teste aplicou somente as 46 instruções SQL restantes, preservou as 8 tabelas já existentes (incluindo _prisma_migrations), e só então marcou a migração inicial como aplicada. O status e a comparação de schema confirmaram o estado esperado. Não houve reset nem exclusão de dados de jogadores. Esse reparo específico de desenvolvimento não deve ser copiado cegamente para produção. Uma aplicação limpa da migração completa em staging ainda precisa ser ensaiada antes de publicar.

O cache npm temporário e o Chrome completo adicional foram removidos para liberar espaço. Chromium headless foi mantido para os testes. O acesso de rede e Docker exigiu permissões do ambiente. Não houve troca de MySQL por outro banco.

## Cobertura e pendências

Integração: cadastro opcional com ficha/códigos; login e logout em agentes diferentes; credencial inválida e conta desabilitada; escalada de papel rejeitada; login duplicado; CSRF e Origin; expiração absoluta/ociosa; limite por conta; flags de cookie de produção; recuperação simultânea com um vencedor; código inválido; convite simultâneo com um vencedor; revogação/expiração; rollback do consumo em cadastro duplicado; persistência entre dispositivos; conflito atômico e auditoria; isolamento inclusive para ADMIN sem vínculo; rejeição de edição mecânica e ausência de segredos nas projeções.

Os seis cenários E2E passaram em duas execuções (quatro iniciais + dois adicionais), e não em uma execução única posterior. Os relatórios/traces ficam ignorados no Git porque podem conter credenciais sintéticas. A checagem final de instalação cobriu o ajuste do .env sem repetir desnecessariamente todos os cenários de negócio.

Não testados: Firefox/WebKit, aparelho físico, leitor de tela, auditoria de contraste completa, carga com 20 usuários, HTTPS/certificados reais, TLS do provedor MySQL, Render, backups/restauração e continuidade por clone remoto. Fórmulas mecânicas não implementadas; campanhas e gestão administrativa completa pendentes. Não declarar RNFs integralmente cumpridos com base apenas nesses testes locais.
