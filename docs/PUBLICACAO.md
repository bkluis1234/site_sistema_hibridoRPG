# Publicar Origem no Render com MySQL Aiven

Guia de preparação para uma pessoa iniciante. **Nenhum serviço foi criado e nenhum deploy foi executado nesta etapa.** GitHub guarda o código, Render executa a aplicação e Aiven é o candidato a guardar o MySQL persistente. São serviços diferentes; Render não é tratado como fornecedor nativo de MySQL.

## 1. Confira código e acesso

No computador, instale Git e Node 24 LTS. Clone o repositório público:

```sh
git clone https://github.com/bkluis1234/site_sistema_hibridoRPG.git
cd site_sistema_hibridoRPG
git status
npm ci --include=dev
npm run db:generate
npm test
npm run typecheck
npm run build
```

O arquivo render.yaml é um modelo para importação manual. Não dispara publicação por esta conversa. Não remova os cinco commits anteriores nem use force push. Revise o commit que será implantado e consulte AUDITORIA_FINAL.md.

## 2. Confirme os planos antes de criar

Condições oficiais consultadas em 31/10/2026; podem mudar. [Render Free](https://render.com/docs/free) tem 0,1 CPU e 512 MB ([planos de computação](https://render.com/docs/compute-plans)), suspensão após 15 minutos sem tráfego de entrada, cold start, disco efêmero e 750 horas mensais por workspace. Não oferece shell, jobs avulsos ou disco persistente no plano gratuito. Tráfego e minutos de build têm cotas próprias; excedentes/regras de cobrança precisam ser conferidos no painel. A documentação do fornecedor não recomenda Free como infraestrutura de produção. Não adicionar plano pago nem cartão para contornar limites sem autorização. Não há garantia de disponibilidade contínua ou custo total zero.

[Aiven Free MySQL](https://aiven.io/docs/products/mysql/concepts/mysql-free-tier) informa nó único, 1 CPU, 1 GB RAM, 1 GB disco, backups e até 76 conexões; não há SLA nem VPC. A [página de preços](https://aiven.io/pricing/mysql) indica que a região/nuvem do Free não é escolhida pelo usuário. Confirmar disponibilidade, retenção/recuperação dos backups e política de inatividade no cadastro; não selecionar trial pago por engano.

**Conferência na retomada de 31/10/2026:** Render Free/compute plans foram acessíveis e os limites acima reconfirmados. As páginas Aiven consultadas retornaram HTTP 403 neste ambiente; a oferta Free e seus limites anteriores não puderam ser reconfirmados nesta rodada. O proprietário deve conferi-los no painel antes de criar o banco; não presumir disponibilidade, retenção ou gratuidade.

## 3. Crie o MySQL — ação manual do proprietário

1. Entre no Aiven Console com sua conta e escolha criar **MySQL**, plano explicitamente **Free**. Pare se só aparecer plano pago.
2. Aguarde Running. Anote host, porta, nome do banco e usuários mostrados em Overview/Connection information. Não envie senha nesta conversa.
3. Baixe o certificado CA do projeto. É certificado público de confiança, não a chave privada. Guarde fora do Git.
4. Crie banco `origem` e separe usuário runtime do usuário de migração. Em Users, prefira o método moderno caching_sha2_password, suportado pelas bibliotecas atuais. Use Workbench para revisar privilégios; a criação por Console pode conceder permissões amplas que precisam ser reduzidas.
5. Runtime: CRUD nas tabelas de domínio/sessões/progresso; logs requerem SELECT/INSERT e não UPDATE/DELETE. Não conceder DROP/ALTER. Migração: privilégios DDL necessários no banco selecionado, usados só na operação controlada. Restrições efetivas variam por provedor; se não puder aplicar essa separação, registre a limitação e resolva antes de dados reais.
6. Restrinja origem das conexões quando o plano permitir, conforme as faixas de saída oficiais do serviço. Não abrir acesso arbitrário apenas para resolver erro. Sem IP estático/VPC no Free, avalie a restrição viável e mantenha TLS verificado.

No [MySQL Workbench](https://aiven.io/docs/products/mysql/howto/connect-from-mysql-workbench), preencha os parâmetros do painel e configure SSL com a CA e **Verify Identity**. Use o hostname do certificado, não substitua por IP aleatório. A [documentação de TLS](https://aiven.io/docs/platform/concepts/tls-ssl-certificates) explica a CA de projeto necessária para verificação no MySQL.

## 4. Prepare variáveis sem publicá-las

Copie .env.example para .env no computador. No PowerShell:

```powershell
Copy-Item .env.example .env
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

O último comando gera um segredo CSRF próprio; coloque-o somente no arquivo privado ou no painel do provedor. Não compartilhe a saída.

| Variável | Valor a configurar |
|---|---|
| NODE_ENV | `production` |
| DATABASE_URL | `mysql://USUARIO:SUBSTITUA_SENHA_CODIFICADA@HOST:PORTA/origem` com os dados reais somente no ambiente privado |
| DATABASE_SSL | `true` |
| DATABASE_CA_PATH | Caminho absoluto do certificado CA; no Render `/etc/secrets/mysql-ca.pem` |
| APP_ORIGIN | Origem HTTPS exata atribuída pelo Render, sem barra final/caminho |
| CSRF_SECRET | Segredo aleatório próprio de pelo menos 32 caracteres |
| TRUST_PROXY | `1` somente após confirmar a topologia com um proxy confiável |
| PORTRAIT_MAX_BYTES | `5242880` para prévia local; não habilita upload |
| PORT | Fornecida pelo Render; não fixar para um serviço externo |

Caracteres especiais no usuário/senha precisam de percent-encoding em cada componente da URL (por exemplo @ e :). Faça isso localmente, sem colar senhas em chats, ferramentas públicas de URL ou argumentos de comando. Nunca crie VITE_DATABASE_URL ou VITE_CSRF_SECRET: o bundle web é público. Não coloque secrets em render.yaml.

A política compartilhada em database-policy.ts aplica `sslaccept=strict` e a CA (`sslcert`) também ao Prisma CLI, com caminho normalizado. O adaptador da API usa rejectUnauthorized=true. Modos que aceitam certificado inválido são recusados. Os [parâmetros MySQL do Prisma](https://www.prisma.io/docs/orm/v7/core-concepts/supported-databases/mysql) são diferentes dos de PostgreSQL; não use sslmode para tentar resolver um erro. Se a CA/hostname falhar, corrija a configuração e nunca desligue a verificação.

## 5. Valide o banco e migre antes do primeiro start

No ambiente de operação autorizado, com TLS e credencial de migração privada, aplique as migrações antes do primeiro start. Esses comandos Prisma precisam apenas das variáveis de banco/TLS; a origem web e o segredo CSRF podem ser completados quando o painel Render informar o endereço. Confira primeiro a conexão TLS no Workbench:

```sh
npm run db:deploy
npm exec -- prisma migrate status
```

Quando todas as variáveis da API estiverem preenchidas, execute `npm run db:check`, que precisa confirmar `tls:true`. `db:deploy` usa **prisma migrate deploy**, não cria migrações de desenvolvimento e não reseta o banco. Existem cinco migrações versionadas. A primeira instalação cria as tabelas; as seguintes acrescentam funcionalidades preservando dados. Faça backup verificado antes de atualizar banco com dados. Se falhar, pare e consulte o erro de forma privada; não use migrate reset, db push --force-reset ou marque migrações como aplicadas sem conferir o SQL.

Depois da seção 6, com APP_ORIGIN real e CSRF_SECRET preenchidos, troque para a credencial runtime e execute `npm run db:check`. Teste a recusa de conexão com CA inválida em staging autorizado, sem alterar a produção. Certifique-se de que o servidor exige transporte seguro.

## 6. Configure o Render Web Service

No Render Dashboard, **New → Web Service**, conecte sua conta GitHub e selecione bkluis1234/site_sistema_hibridoRPG. Outra opção é importar manualmente render.yaml e revisar todos os campos. O repositório público não concede à integração permissão automática para administrar serviços.

| Campo | Configuração proposta |
|---|---|
| Name | `origem-rpg` (ajustar se indisponível; hostname final é o exibido no painel) |
| Language / Runtime | Node |
| Branch | `main`, no commit revisado |
| Region | Virginia como valor inicial do modelo; revisar proximidade com a região efetivamente atribuída pelo Aiven Free |
| Root Directory | `.` — raiz do monorepositório (ou campo vazio para a raiz no formulário) |
| Build Command | `npm ci --include=dev && npm run db:generate && npm run build` |
| Start Command | `npm run start:render` |
| Health Check Path | `/api/ready` |
| Instance Type | Free, somente se o proprietário aceitar os limites e o painel ainda oferecer esse plano |
| Auto Deploy | Desativado; publicação manual após revisão |
| Environment Variables | Tabela da seção 4; segredos definidos no painel |
| Secret File | `mysql-ca.pem`, conteúdo do certificado CA obtido no Aiven |

A API escuta `0.0.0.0` e PORT do ambiente. `/api/health` confirma processo; `/api/ready` executa consulta MySQL e retorna apenas ready/unavailable. O shutdown fecha streams SSE e o pool. Build inclui devDependencies para TypeScript/Prisma, sem executar vite dev ou tsx watch em produção. `start:render` usa Node compilado com old space de 192 MiB para reservar margem a Argon2 e memória nativa; esse valor não limita o RSS total nem substitui medir o plano real. O comando `npm start` continua disponível sem essa opção para execução genérica.

**Free não oferece shell/pre-deploy job:** execute migrações e o CLI administrativo do seu computador autorizado, com acesso TLS ao banco, antes de liberar o serviço. Não adicione criação de ADMIN ou reset ao start. Não separe um arquivo .env no repositório para esse fim.

## 7. Frontend na mesma origem

**Não criar Static Site nesta arquitetura.** O build gera apps/web/dist e o Express entrega esses arquivos com fallback do React Router. Chamadas usam `/api`, sessões e CSRF ficam na mesma origem HTTPS, sem variável pública de URL de API ou cookies entre domínios. Não há comando de Static Site aplicável nesta entrega. Separar frontend/backend exigiria revisar CORS, cookies, CSP, CSRF e testar novamente; não foi feito.

## 8. Primeiro administrador

No computador de operação com o ambiente privado correto, credencial runtime autorizada e Node 24:

```sh
npm run admin:create
```

Use terminal interativo seguro; senha tem entrada oculta. Guarde os códigos de recuperação fora da plataforma. A conta administrativa inicial é única; não há chave permanente no React. ADMIN emite convite de mestre no painel, Marcus usa no cadastro ou é habilitado pelo fluxo administrativo com reautenticação. Ser ADMIN não impede ter fichas próprias.

## 9. Autorize e faça o primeiro deploy manual

Somente depois de revisar ambiente, custos, backup, migrações e administração, o proprietário deve autorizar/criar a implantação pelo painel. Aguarde build e readiness. Não foi criada uma URL fictícia de produção neste guia: use o endereço efetivamente informado pelo Render para APP_ORIGIN e testes.

Confira redirecionamento HTTPS, certificado, cookie Secure/HttpOnly/SameSite e ausência de Domain no __Host; recusa CSRF de outra origem; logout/recuperação; impedimento de editar ficha alheia; convites e contexto GM; rolagens privadas; duas abas com conflito; reinício sem perda de ficha; SSE sem buffering e fallback após desconexão; acesso por teclado/celular. Uma página temporária de cold start não é confirmação de salvamento.

Teste com contas sintéticas em staging e só depois convide pessoas reais. Confirme RSS/CPU sob Argon2, pool, latência e o p95 com 20 usuários por cinco minutos. O ensaio local compilado com old space 192 MiB passou com 20 fichas/streams, 6.000 leituras, 400/400 sinais e RSS pico 318,83 MiB. HeapUsed pico 110,41 MiB e zero streams após desconexões; método/limites em DESEMPENHO.md. Isso não comprova desempenho do Render Free ou a disponibilidade do Aiven, especialmente sob logins concorrentes e cold start. SSE não dispensa reconciliação de estado e não deve ser usado como keep-alive artificial para burlar o plano.

## 10. Atualizações, logs e recuperação

Atualização: revisar PR/CI, confirmar backup e compatibilidade, fazer push normal, aplicar migração controlada, executar deploy manual e repetir smoke tests. Não alterar a aplicação antiga para ler dados novos sem revisar os filtros de privacidade do Modo Sessão. Rollback de código não desfaz migração nem restaura banco automaticamente.

Logs da aplicação contêm requestId/categoria; não imprimir corpo, cookies, URL de banco ou segredos. Definir alertas e responsáveis sem ativar analytics/telemetria externos sem autorização. O modelo utiliza autoDeployTrigger=off conforme a referência atual do Render; imports/criação de serviço continuam ações manuais. A CI preparada não é evidência de execução remota até existir um workflow concluído no GitHub.

Backup/restauração, metas RPO/RTO, retenção e recuperação administrativa estão em OPERACAO.md. Verifique a recuperação oferecida pelo plano Aiven e mantenha cópia independente cifrada e restrita fora do Git/Render. Confirme restauração real em staging antes da abertura. Diante de indisponibilidade, verificar health/ready, status dos fornecedores e configuração privada; não trocar para SQLite nem desativar TLS. Se o plano gratuito não satisfizer os limites, interrompa a abertura e apresente opções ao proprietário, sem contratar automaticamente.
