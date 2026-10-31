# Validação — Parte 2 / aplicação 0.2.0

Data: 30/10/2026. Cloud Linux, Node 24.19.0, npm 11.9.0, MySQL 8.4 local de teste e Chromium headless via Playwright 1.64.1. Nenhuma conta ou infraestrutura de produção foi criada. Histórico da fundação em [VALIDACAO_PARTE1.md](VALIDACAO_PARTE1.md).

## Resultados executados

| Verificação | Resultado | Limite |
|---|---|---|
| `npm run typecheck` | Passou | Tipos não substituem testes de runtime |
| `npm test` | 51/51 passaram | Contratos, segurança e regras explícitas da Parte 2; não substitui homologação do manual |
| `npm run test:integration` | 38/38 passaram na suíte completa | MySQL real local, incluindo fundação preservada e ficha completa |
| Integração adicional de precisão | 1/1 passou, demais casos não repetidos nessa execução | Impede corrupção de leitura por soma fora de Number.MAX_SAFE_INTEGER e confirma rollback |
| `npm run test:e2e` | 5/5 desktop e 5/5 mobile passaram | Runner executa dois processos para isolar limites reais por IP, sem afrouxar proteção da API |
| `npm run build` | Passou | JS ~500,5 kB minificado / ~151,6 kB gzip; Vite avisou sobre chunk >500 kB. Code splitting/medição em staging pendentes |
| Prisma generate/validate | Passaram | Cliente 7.10.1 e schema MySQL validado |
| Migração 202610300002_interactive_sheet | Aplicada com sucesso | Banco local hibrido_test, com fichas preexistentes; sem reset |
| Prisma migrate status | Atualizado | Duas migrações versionadas |
| Prisma migrate diff banco → schema | Sem diferenças | CHECKs adicionais constam no SQL e não como campos Prisma |
| Revisão visual | Desktop e mobile inspecionados | Cabeçalhos/painéis/campos/recursos baseados na imagem oficial; não é auditoria completa de acessibilidade |

Total de cenários distintos aprovados nesta etapa: **100** (51 unitários + 39 de integração, sendo um caso adicional executado separadamente + 10 E2E). Repetições de testes não são contadas como casos novos. Relatórios de Playwright ficam separados por perfil e ignorados no Git; podem conter dados/credenciais sintéticos de teste.

## Cobertura

- Atributos válidos/incompletos/negativos/acima do limite e distribuição com zero; recursos para atributo 0..3 e validação de intervalos.
- Treinamento, alvos da tabela oficial fornecida, cap 19, natural 20, fadiga por perícia e preservação de base.
- Persistência da identificação, nulos opcionais, atributos/máximos sem cura automática e ajuste de atuais ao reduzir máximo.
- CRUD e versões de inventário, contagem única de equipamentos, isolamento de IDs entre fichas, exclusão idempotente e precisão numérica agregada.
- Ferimentos, sangramento/fadiga sem dano automático, alerta de ataque único, incapacitação, estabilização e morte sem recuperação automática.
- Submit/reopen e bloqueio de mecânica aprovada; ficha arquivada somente leitura inclusive pela rota legada.
- Domínios independentes concorrentes, conflito de mesmo recurso, reuso de UUID, ausência de gasto/log duplicado.
- Dados oficiais de todas as faces suportadas; cliente não pode enviar results; bônus e repetição PE, natural 20, saldo insuficiente e fechamento de decisão anterior.
- Política de fadiga só por GM vinculado; override contextual de GM; jogador não autoriza sua repetição; vínculo removido invalida autorização antes do gasto.
- Fundação: cadastro/login/logout, CSRF, cookies seguros, recuperação simultânea, convites e negação de acesso universal de ADMIN.
- E2E por perfil: conta/recuperação/ficha/logout; rede abortada; conflito com cópia local; sessão completa da ficha; autosave e recurso simultâneos compartilhando CSRF.

## Problemas encontrados e corrigidos

Campos numéricos opcionais inicialmente convertiam null em zero no frontend, bloqueando a validação e o autosave; corrigido para preservar nulos. Checkbox de sangramento passou a mostrar estado local pendente com rollback no erro, em vez de piscar para o valor antigo antes da confirmação. Rota de configuração de fadiga foi ligada corretamente e confirmada por integração. Inicialização CSRF simultânea passou a usar uma promessa compartilhada para evitar cookies concorrentes.

O teste de recuperação foi ajustado para esperar a nova tela antes de preencher, evitando escrever no campo da tela anterior durante a transição de rota. Desktop/mobile agora iniciam processos distintos porque simulam vários usuários no mesmo loopback; a limitação real por IP não foi removida nem aumentada. As últimas execuções completas passaram.

## Limites de verificação

Manual completo não anexado; regras implementadas são as explicitamente fornecidas na Parte 2 e na instrução posterior de fadiga. A proposta de fadiga ainda depende da revisão de Marcus. Não testar fórmulas ausentes como se fossem homologadas.

Storage externo de retrato não configurado: somente seletor/prévia local e contrato estão prontos. Não há teste de upload persistente porque não existe endpoint ativo. Aprovação definitiva e telas de campanhas/membros/GM pertencem à Parte 3.

Sem deploy Render, HTTPS/TLS reais do provedor MySQL, teste de backup/restauração, carga de 20 usuários, Firefox/WebKit, aparelho físico ou leitor de tela. RPO/RTO/latência/WCAG continuam metas, não requisitos integralmente comprovados. Nenhuma instalação global foi presumida; versões e bibliotecas estão no lockfile herdado. Auditoria npm de produção sem vulnerabilidades pertence ao registro da Parte 1; não foi tratada como uma nova auditoria independente nesta etapa.

Servidores de QA e MySQL de teste foram utilizados localmente; o banco não integra o pacote de transferência. Históricos e limites anteriores permanecem na validação da Parte 1. Antes de produção, ensaiar as duas migrações desde uma instância vazia, backups e restauração.
