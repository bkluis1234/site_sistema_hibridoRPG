# Progresso — Sistema Híbrido 2.6

Atualizado em 30/10/2026. Versão da aplicação: 0.2.0. Fundação preservada e núcleo da ficha da Parte 2 implementado. Referências: imagem oficial e texto explícito da Parte 2; Manual completo ainda pendente. Sem publicação em produção ou repositório remoto configurado.

## Arquitetura adotada

Monorepositório npm: React/TypeScript/Vite em apps/web, Express/TypeScript em apps/api, contratos Zod em packages/shared e regras 2.6 em packages/rpg-rules. MySQL 8.4 é a fonte oficial; Prisma 7 e migrações SQL versionadas. Sessão segura e CSRF da Parte 1 mantidos. Produção planejada: aplicação Render na mesma origem e MySQL gerenciado externo com TLS.

Ficha usa versões independentes para identificação, atributos, treinamentos e registros de recursos/itens/condições/ferimentos/rolagens. Transação ordena operações por ficha; operationId evita efeitos duplicados. Auditoria tem ator/data/ação/antes/depois. Sem dados simulados ou arquivos JSON como banco.

## Funcionalidades implementadas

- Parte 1: contas sem e-mail, login/logout, Argon2id, cookies seguros, recuperação por códigos, primeiro ADMIN por CLI, convites temporários de mestre e dashboard.
- Identificação completa: nome/apelido/idade/altura/peso/profissão e narrativas; autosave 850 ms, validação RHF/Zod, estado de salvamento, falha/repetição e reconciliação explícita de conflito.
- Rascunho textual em memória por conta/ficha, preservado ao navegar internamente; aviso ao fechar/recarregar com edição pendente. Sem fila offline persistente.
- Atributos AGI/FOR/INT/PRE/VIG com distribuição inicial e validação de oito pontos; quatro treinamentos; 21 perícias com alvo calculado e filtros/pesquisa.
- PV/SAN/PE derivados, controles rápidos e quantidade personalizada, confirmação no servidor e eventos de dano explícitos. Máximo aumentado não cura; reduzido limita atual e audita.
- Inventário com CRUD, quantidade/espaços e alerta de carga; armas/equipamentos como projeção do mesmo objeto, sem dupla contagem ou dano automático.
- Ferimentos ativos/tratados/resolvidos, sangramento sem temporizador, fadiga 0..3 e acompanhamento crítico com três sucessos/falhas, sem cura ou testes automáticos.
- Fadiga inicial em Atletismo, Acrobacia, Furtividade, Luta e Reflexos, conforme instrução adicional do proprietário. Alvo base/penalidade/final separados. Lista substituível pelo GM vinculado e override contextual autorizado por teste. Proposta sujeita à revisão de Marcus.
- Dados d4/d6/d8/d10/d12/d20/d100, múltiplos dados, resultado/soma no servidor e rolagens persistentes. Teste d20 <= alvo e 20 natural falha.
- Opções de PE: aceitar, bônus 1 PE ou pedir repetição 2 PE; repetição exige GM ativo da campanha, categoria/justificativa e nova conferência do vínculo ao gastar. Transação e idempotência impedem gasto duplo.
- Submit valida e passa a PENDING_APPROVAL; reabrir pedido devolve DRAFT. Fichas APPROVED protegem mecânica e ARCHIVED são somente leitura, inclusive pela rota legada.
- Histórico paginado com projeções autorizadas, antes/depois e preservação de snapshots das rolagens.
- Layout baseado na ficha oficial, com campos claros/painéis pretos/cabeçalhos vermelhos, PV vermelho, SAN roxo, PE azul e fadiga âmbar. Mobile por abas e recursos de acesso rápido.
- Prévia/seleção/substituição/remoção local de retrato, tipos e tamanho configurável. API declara storage não configurado e contrato PortraitStorage foi preparado.

## Migrações executadas

- 202610300001_foundation: fundação da Parte 1, reparada em teste conforme histórico em VALIDACAO.md.
- 202610300002_interactive_sheet: aplicada com sucesso no MySQL local hibrido_test; completa narrativas, versões, dados estruturados de condições, rolagens, idempotência, espaços/equipamentos e auditoria. Preenche fichas anteriores e remove máximo redundante dos recursos. Status atualizado e migrate diff sem diferenças.

Nenhuma migração executada em produção. Ensaio de instalação inteiramente limpa e de restauração continua necessário em staging antes de publicar.

## Dependências e comandos

Não foram acrescentadas dependências runtime nesta etapa. Mantidas versões do lockfile: Node 24, React 19.3.1, Vite 8.3.5, TypeScript 5.9.3, Express 5.3.0, Prisma 7.10.1, Zod 4.6.7, Tailwind 4.3.3, Vitest 4.1.12, Supertest 7.3.1, Playwright 1.64.1 e demais bibliotecas aprovadas. Formatação realizada por Prettier temporário, sem dependência nova no projeto.

```sh
npm ci
# Criar .env pelo exemplo, com MySQL e segredos próprios.
npm run db:generate
npm run db:deploy
npm run dev
```

Testes: criar .env.test por .env.test.example e usar banco dedicado terminado _test. Executar `npm run db:test:deploy`, `npm test`, `npm run test:integration`. Instalar Chromium e executar `npm run test:e2e`. O runner E2E executa desktop/mobile com processos distintos para não somar tentativas de perfis simulados no mesmo limite por IP. A proteção real da API não foi desativada. Relatórios por perfil ficam ignorados em test-results e playwright-report.

Neste cloud, o Chromium headless está em /workspace/.cache/ms-playwright; foi usado PLAYWRIGHT_BROWSERS_PATH nesse caminho. No PC, instalar normalmente pelo Playwright. Comandos completos no README. ADMIN de produção não existe; credenciais criadas aqui são exclusivamente sintéticas do banco de teste.

## Validação

Regras, sessões/CSRF e contratos têm 51 testes unitários. 39 casos de integração MySQL aprovados (38 na suíte completa e um adicional de precisão), cobrindo persistência, concorrência, isolamento, carga, crítico, fadiga configurável e decisões PE; relatório em VALIDACAO.md. Playwright executou cinco cenários em desktop e cinco em celular, todos aprovados, incluindo fluxo completo e inicialização CSRF compartilhada por autosave/recurso simultâneos. Build, TypeScript e schema Prisma passaram.

## Pendências e limitações

1. Storage externo persistente de retrato: UI é prévia local; não salva imagem no banco ou no disco temporário do Render. Configurar provedor e validação real de imagem no backend antes de habilitar upload.
2. Aprovação definitiva e painel completo de campanhas/membros/GM na Parte 3. API atual já autoriza GM legítimo em ficha vinculada, mas não cria vínculos/campanhas fictícios nem concede acesso universal. Compartilhamento entre colegas e transferências de itens ainda pendentes.
3. Conferir manual completo e exemplos com Marcus, especialmente fadiga proposta, dano de armas, exceções, reentrada em crítico, deslocamento e recuperação incompleta de PE.
4. Repositório privado remoto ainda não criado. O proprietário informou que não existe URL; o commit/bundle local não se sincroniza automaticamente com o PC.
5. Produção: Render, MySQL gerenciado, TLS real, backups/restauração, monitoramento, carga e política de retenção/anonimização não provisionados/verificados.
6. Sem fila offline persistente, push em tempo real ou merge automático de texto. Fechar/recarregar ignorando o aviso pode perder rascunho ainda não confirmado; o MySQL continua fonte oficial.
7. Rate limit permanece em memória por processo: store compartilhado antes de escala horizontal. Rotina agendada de limpeza de sessões/operações e política de retenção precisam ser definidas.
8. Listagens de fichas/rolagens/convites ainda têm limites; histórico já tem cursor. Histórico com narrativas muito longas e chunk JS ~500,5 kB (~151,6 kB gzip) pedem medição/otimização em staging. O build avisou sobre chunk >500 kB; não é falha de compilação nem prova de meta de latência.
9. Navegadores físicos, Firefox/WebKit, leitor de tela, auditoria WCAG/contraste completa e testes de carga permanecem pendentes.
10. Exportação, transferências e modo sessão avançado seguem em entregas posteriores.

## Continuidade Git

Histórico da Parte 1 preservado e novas alterações registradas em commit da Parte 2. Pacote ZIP inclui código versionado, histórico completo em historico.git.bundle e instruções CONTINUAR_NO_PC.md; não inclui .env, node_modules, dados MySQL, credenciais ou traces. O commit exato consta em ENTREGA.json no pacote.

Extraia o ZIP e execute `git clone historico.git.bundle sistema-hibrido` para recuperar o histórico. Depois de criar remoto privado, `git remote set-url origin <URL>` e `git push -u origin main`. No outro dispositivo, clone esse remoto. O repositório remoto, quando criado, será a referência de continuidade.
