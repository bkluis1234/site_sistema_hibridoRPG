# Progresso — Sistema Híbrido 2.6

Atualizado em 30/10/2026. Entrega 1: fundação implementada e verificada nos limites de VALIDACAO.md. Entregas posteriores continuam pendentes. Não publicado em produção.

## Arquitetura adotada

Monorepositório npm workspaces: apps/web React/Vite/TypeScript e apps/api Express/TypeScript; packages/shared com contratos Zod; packages/rpg-rules isolado e bloqueado até receber manual. API mesma origem, sessão opaca persistida no MySQL 8.4, Prisma 7 e migrações versionadas. Produção prevista: Render para aplicação e MySQL gerenciado externo com TLS e armazenamento persistente próprio.

## Implementado

- Estrutura de repositório, configuração TypeScript, scripts, lockfile, exemplos de ambiente e Compose local com volume.
- 17 entidades solicitadas + privilege_invites, PKs/FKs/índices/uniquidade, datas, versão e exclusões restritas nas entidades de domínio.
- Cadastro com login único sem e-mail, confirmação de senha, personagem opcional e transação atômica.
- Argon2id; sessões HttpOnly com expiração absoluta/ociosa; logout no servidor; CSRF assinado + validação de Origin; limites de tentativas por IP e conta.
- Oito códigos de recuperação de uso único; troca de senha revoga sessões; procedimento CLI de recuperação verificada e auditada.
- Primeiro ADMIN somente via CLI interativo com senha oculta e proteção contra criação duplicada.
- Convites temporários de mestre gerados/revogados por ADMIN; hash, expiração, uso único atômico e escopo separado de privilégios administrativos.
- Login, cadastro, recuperação, exibição/baixa única de códigos, dashboard, perfil, painel inicial de convites, criação de rascunhos e ficha por seções.
- Nome/conceito de ficha realmente persistidos; consultas entre dispositivos; proteção por proprietário; conflito 409 com preservação local e recarga explícita.
- Componentes HorrorPanel, SectionHeader, ResourceBar, AttributeCard, SkillRow, InventoryTable, ConditionTracker, CharacterCard, CampaignCard e SaveStatus. Componentes de mecânica prontos para receber dados futuros, sem valores ou fórmulas presumidos.
- Auditoria transacional das ações disponíveis; projeções de resposta sem hashes/códigos internos.
- Requisitos RF/RNF/RN, arquitetura, API, instalação, Render, backups/restauração e pendências do manual documentados.
- Testes: 19 unitários, 19 integração MySQL, 6 cenários E2E desktop/mobile; compilação e ensaios CLI. Detalhes e ressalvas em VALIDACAO.md.

## Dependências instaladas

Node 24.19.0, npm 11.9.0. React/React DOM 19.3.1; Vite 8.3.5 e plugin React 6.1.2; TypeScript 5.9.3; React Router 7.18.5; Tailwind 4.3.3; TanStack Query 5.105.0; React Hook Form 7.91.0; Zod 4.6.7; Lucide 0.562.0; Express 5.3.0; Prisma/client/adaptador 7.10.1; Argon2 0.44.0; Vitest 4.1.12; Supertest 7.3.1; Playwright 1.64.1. Versões exatas e transitivas em package-lock.json. Usar npm ci no PC.

## Migrações executadas

`202610300001_foundation`: schema inicial MySQL e CHECKs de versão/quantidade. Executada/reparada somente no banco local descartável hibrido_test, com status atualizado e migrate diff sem diferenças. Erro inicial de TEXT/default resolvido. A migração limpa completa ainda deve ser ensaiada em staging. Nenhuma migração/banco de produção foi criado. Não usar reset em produção.

## Comandos para continuar

```sh
npm ci
# Criar .env a partir de .env.example e configurar seu próprio MySQL/segredos.
npm run db:generate
npm run db:deploy
npm run dev
```

Para testes: criar .env.test a partir do exemplo, configurar banco dedicado terminado _test, executar `npm run db:test:deploy`, `npm test`, `npm run test:integration`. Instalar Chromium com `npm exec -- playwright install chromium` e executar `npm run test:e2e`. No ambiente desta entrega, o navegador foi instalado em /workspace/.cache/ms-playwright; foi usado PLAYWRIGHT_BROWSERS_PATH apontando para esse diretório. Essa configuração local não é exigida no PC.

ADMIN: `npm run admin:create` em terminal seguro do servidor. Não há conta administrativa de produção ou senha padrão. Somente contas sintéticas foram criadas no banco de teste.

## Pendências

1. Criar repositório remoto privado e enviar main; clonar no PC. O proprietário informou que ainda não há URL.
2. Receber ficha oficial e Manual Híbrido 2.6; conferir PENDENCIAS_MANUAL.md e exemplos com Marcus.
3. Etapa 2: regras versionadas, validação de finalização, atributos/recursos/perícias, inventário, equipamentos, condições e ferimentos persistidos.
4. Etapa 3: criação/convites de campanhas, vínculos GM/PLAYER, compartilhamento autorizado, painel de mestre e aprovações de mecânica. Gestão completa de contas/campanhas/logs/configurações ADMIN também permanece pendente.
5. Etapa 4: rolador, modo sessão, exportação e histórico detalhado.
6. Etapa 5: matriz completa de browsers/acessibilidade/carga, deploy Render, MySQL gerenciado, backup restaurado e monitoramento.

## Erros conhecidos e limites

- Sem manual ou imagem anexada; visual inspirado somente na descrição e sem fórmulas inventadas.
- Rotas de campanhas de escrita e edição mecânica não estão habilitadas. A consulta lista vínculos existentes, sem dados simulados.
- Sem bloqueio de navegação interna com texto não salvo; existe aviso ao fechar/recarregar. Sem autosave/fila offline; texto permanece apenas enquanto o formulário fica montado.
- Confirmação de cadastro pode se perder após transação se a rede cair; códigos não são reexibidos. Recuperação administrativa cobre esse caso após verificar identidade.
- Listagens limitadas (100 fichas/50 convites); paginação futura. Limitação de tentativas em memória: adotar store compartilhado antes de múltiplas instâncias.
- Rotina agendada de remoção de sessões expiradas e políticas de retenção/anonimização pendentes; sessões expiradas já são rejeitadas.
- Nenhum HTTPS/TLS real, plano Render, banco gerenciado, backup/restauro, carga de produção ou repositório remoto verificado.
- Ambiente teve limite de disco no ensaio Docker; recuperado removendo somente cache/artefatos da tarefa e contêiner cuja inicialização falhou. Banco local de teste foi preservado, sem reset.

## Continuidade Git

Arquivos e documentação registrados em commit local na branch main, junto de pacote ZIP com fonte e bundle do histórico Git. O ZIP não contém .env, node_modules, dados MySQL, credenciais ou traces. O commit exato fica em ENTREGA.json no pacote de transferência.

Para recuperar o histórico no PC: extraia o ZIP, execute `git clone historico.git.bundle sistema-hibrido` em uma pasta vazia e entre na pasta clonada. Depois crie o remoto privado, `git remote set-url origin <URL>` e `git push -u origin main`. Uma vez remoto, essa URL será a referência entre celular/PC. Arquivos locais deste ambiente não aparecem automaticamente no seu computador.
