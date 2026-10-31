# ORIGEM — RETOMADA DA PARTE 5 DEFINITIVA
## Continuação da auditoria de segurança, testes, otimização e preparação para produção

Quero retomar o desenvolvimento do **Origem**, continuando exatamente de onde paramos na Parte 5 definitiva.

**ATENÇÃO: esta é uma continuação, não um novo projeto.**

Não reinicie a aplicação, não reescreva funcionalidades existentes e não repita trabalhos já concluídos sem necessidade.

## 1. Repositório e recuperação do progresso

Projeto: Origem  
Sistema de regras: Sistema Híbrido 2.6  
Repositório: https://github.com/bkluis1234/site_sistema_hibridoRPG  
Branch principal: `main`  
Workspace anterior: `/workspace/sistema-hibrido`

Antes de alterar qualquer arquivo:

1. Verifique o diretório atual e o repositório Git.
2. Execute `git status`, `git log -10 --oneline`, `git branch -vv` e `git fetch origin`.
3. Confirme o último commit local e remoto.
4. Identifique se o checkpoint solicitado anteriormente foi criado e publicado.
5. Verifique alterações não commitadas, incluindo arquivos novos.
6. Preserve todas as alterações existentes.
7. Leia os relatórios e documentos da Parte 5.
8. Reconstrua o estado real dos testes e das pendências.

Se o checkpoint não existir, preserve as alterações locais antes de prosseguir. Não execute reset, clean, checkout destrutivo ou force push.

Se houver divergência entre o estado local e o GitHub, investigue antes de sincronizar.

## 2. Trabalho realizado anteriormente

Na execução anterior, foram relatados os seguintes resultados:

- 87 testes unitários aprovados.
- 95 testes de integração aprovados.
- 20 execuções de navegador aprovadas.
- `npm audit` com zero vulnerabilidades conhecidas.
- Verificação de padrões de segredos sem credenciais reais conhecidas.
- Reconferência da conta dentro da transação de login.
- Política de TLS compartilhada entre API e Prisma CLI.
- Limites de conexões SSE por conta e por processo.
- Cinco migrações aplicadas desde um banco vazio com TLS.
- Rejeição de certificados CA incompatíveis.
- Backup cifrado restaurado em outro banco de teste.
- Dados de personagens e tutoriais preservados após restauração.
- Matriz documental com 147 requisitos e regras.
- Frontend com carregamento de páginas sob demanda.
- Bundle JavaScript inicial reduzido de 560 kB para 471 kB.
- Teste de carga com 20 participantes, 6.000 leituras sem erros e 400/400 sinais SSE.
- p95 REST de 262 ms em uma das rodadas.
- p95 SSE próximo de 2 segundos.
- Arquitetura proposta de frontend e API no mesmo Render Web Service.

Esses são resultados relatados anteriormente. Verifique quais permanecem válidos no estado atual. Não assuma que estão todos preservados sem inspecionar o repositório.

## 3. Pendência prioritária — medição de SSE

Na última execução, o backend compilado chegou a aproximadamente 320 MiB de memória, mas o medidor registrou somente 399 de 400 sinais SSE.

Foi identificada uma possível condição de corrida no próprio medidor: sinais recebidos antes do registro do ID retornado pela API poderiam ser descartados da contagem.

A correção estava em andamento quando interrompemos o trabalho.

Sua prioridade é:

1. Localizar o medidor de carga compilado.
2. Verificar se a correção da condição de corrida foi salva.
3. Identificar se já existem testes para esse caso.
4. Corrigir o medidor sem mascarar falhas reais de entrega.
5. Garantir que sinais antecipados sejam contabilizados corretamente.
6. Preservar a verificação individual por cliente.
7. Evitar duplicação artificial de eventos.
8. Executar testes de regressão específicos.
9. Repetir o ensaio de carga quando o medidor estiver confiável.
10. Exigir 400/400 sinais entregues, sem reduzir o critério de aceitação.

Se houver perda real de eventos, investigue e corrija o sistema, não apenas o teste.

## 4. Pendência prioritária — memória e Render Free

Foi criado ou proposto o script:

`start:render`

Com execução semelhante a:

`node --max-old-space-size=192 apps/api/dist/apps/api/src/server.js`

Verifique se esse comando continua correto para o build atual.

O limite de heap não representa o consumo total de memória do processo.

Faça uma medição adequada do backend compilado, separado dos clientes de teste.

Registre:

- Memória RSS.
- Heap utilizado.
- Heap máximo observado.
- Memória externa.
- Pico durante o teste.
- Consumo após desconexões.
- Consumo após encerramento.
- Quantidade de conexões SSE.
- Falhas ou reinicializações.
- Eventuais sinais de vazamento.

Compare os resultados com os limites reais do plano gratuito pretendido.

Não afirme que o Render Free é suficiente sem evidências.

Se houver problema, proponha e implemente otimizações seguras, sem remover funcionalidades essenciais.

Não diminua artificialmente a carga ou a exigência de entrega para aprovar o teste.

## 5. Validação final de segurança

Continue a auditoria da Parte 5 definitiva.

Verifique especialmente:

- Autenticação.
- Autorização.
- Proteção de senhas.
- Sessões e cookies.
- CSRF.
- CORS.
- Controle de papéis ADMIN, MESTRE e JOGADOR.
- Isolamento entre campanhas.
- Proteção das fichas.
- Segurança das rolagens.
- Segurança SSE.
- Validação de entradas.
- Rate limiting.
- TLS MySQL.
- Migrações Prisma.
- Integridade de dados.
- Credenciais e variáveis de ambiente.
- Segurança do repositório público.
- Dependências.
- GitHub Actions, se existirem.

Corrija problemas reais encontrados.

Não exponha segredos e não declare ausência absoluta de vulnerabilidades.

## 6. Testes finais

Depois das correções:

1. Execute os testes unitários.
2. Execute os testes de integração.
3. Execute os testes de navegador.
4. Execute o typecheck.
5. Execute o lint, se configurado.
6. Execute o build de produção.
7. Execute a auditoria de dependências.
8. Verifique o início do backend compilado.
9. Valide o health check.
10. Repita o teste de carga corrigido.
11. Confirme a integridade do MySQL e das migrações.

Registre os comandos e resultados reais.

Não modifique testes apenas para ocultar problemas.

## 7. Interface e documentação

Finalize as melhorias de interface e documentação que estavam em andamento.

Preserve:

- Nome Origem.
- Regras do Sistema Híbrido 2.6.
- Funcionalidades de personagens.
- Campanhas.
- Sessões ao vivo.
- Painéis de jogadores, mestres e administradores.
- Tutoriais.
- Responsividade.
- Acessibilidade.

Atualize a documentação de segurança, publicação, auditoria e progresso.

## 8. Preparação para publicação

Confirme as configurações reais de:

- Render Web Service.
- Build e Start Command.
- Porta e health check.
- Variáveis de ambiente.
- Cookies e CSRF.
- MySQL.
- TLS.
- Migrações.
- Backup.
- Limites de memória.
- Inicialização após suspensão.
- SSE após reconexão.

Não contrate planos pagos.

Não crie serviços externos automaticamente.

Não execute deploy público sem minha autorização.

## 9. GitHub e preservação do progresso

Ao finalizar:

1. Revise todas as alterações.
2. Verifique ausência de segredos.
3. Confirme que nenhum arquivo importante foi perdido.
4. Registre as correções em commits organizados.
5. Sincronize com o GitHub de maneira segura.
6. Não utilize force push.
7. Não sobrescreva alterações remotas.
8. Informe o hash do último commit publicado.

Se encontrar bloqueios externos, documente-os e preserve o progresso.

## 10. Relatório final

Apresente um relatório em português brasileiro contendo:

- Estado da Parte 5.
- Segurança implementada.
- Vulnerabilidades encontradas e corrigidas.
- Testes aprovados e falhos.
- Resultado final dos 400 sinais SSE.
- Memória real do backend compilado.
- Viabilidade do Render Free.
- Estado do MySQL.
- Resultado da auditoria de segredos.
- Configurações de publicação.
- Arquivos alterados.
- Commits publicados.
- Pendências.
- Próximas ações necessárias.

Classifique o projeto como:

**PRONTO PARA PUBLICAÇÃO**, **PRONTO COM RESSALVAS** ou **BLOQUEADO PARA PUBLICAÇÃO**.

Justifique a classificação com evidências.

## INSTRUÇÃO FINAL

Retome a Parte 5 a partir do último estado preservado.

Priorize primeiro a correção e validação do medidor SSE, a medição de memória e a inicialização do backend em modo de produção.

Depois conclua as verificações restantes.

Não refaça desnecessariamente o que já foi aprovado, não perca o trabalho anterior e não encerre apenas com recomendações.

Quero o Origem seguro, funcional, testado, documentado e preparado para publicação gratuita.

**Pode começar a execução.**