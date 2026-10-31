# Auditoria inicial da Parte 5 — Origem (em andamento)

Data: 31/10/2026, referência America/Sao_Paulo. Base: e955852 (0.4.0). Identidade solicitada: Origem; regras permanecem Sistema Híbrido 2.6. Os dois anexos da Parte 5 foram lidos; a versão mais recente define a identidade e preserva as demais exigências compatíveis.

O nome do arquivo foi preservado para continuidade, mas este documento ainda não é um relatório final. As referências em `referencias/PARTE5_INICIAL.md` e `referencias/PARTE5_ORIGEM.md` são solicitações de trabalho, não comprovantes de funcionalidades entregues. Nenhuma correção funcional da Parte 5 foi implementada nesta etapa.

## Auditoria de entrada, antes de alterar funcionalidades

Estrutura, dependências/lockfile, TypeScript, componentes, rotas/serviços/middlewares, autenticação, permissões, schema/quatro migrações, ficha/campanhas/sala/SSE, scripts e documentação RF/RNF/RN/API/privacidade/regras/relatórios anteriores foram inspecionados. Nenhuma recriação ou troca de banco.

- TypeScript e build passaram; bundle principal 560,09 kB / gzip 165,21 kB, aviso acima de 500 kB.
- 78 unitários, 90 integrações MySQL e 18 E2E desktop/celular passaram: 186 casos distintos.
- MySQL 8.4 local real: quatro migrações atualizadas, sem reset. Não é MySQL gerenciado de produção.
- npm audit: zero vulnerabilidades conhecidas reportadas na execução inicial; não constitui garantia de ausência de falhas.
- Persistência após reinício: `scripts/audit-persistence.ts prepare` passou com 17 etapas e acesso do segundo cliente negado; após reiniciar MySQL e criar nova instância da API, `verify` confirmou identificação, atributos, treinamentos, recursos, inventário e condições. Limpeza dos registros sintéticos passou. Ensaio exclusivamente local, sem evidência de produção.

## Achados e classificação

| ID | Severidade | Achado | Tratamento |
|---|---|---|---|
| A-001 | HIGH | Login verifica hash fora da transação e não reconfere versão/hash da conta antes de criar sessão; recuperação concorrente pode invalidar o contexto verificado | Bloquear usuário e reconferir hash/versão/estado; teste de concorrência obrigatório |
| A-002 | HIGH (produção) | Migrações Prisma usam DATABASE_URL diretamente; DATABASE_SSL/CA do adaptador da API não asseguram sozinhos TLS verificado no mecanismo CLI | Unificar configuração segura para API/migração e testar parâmetros; produção continua pendente |
| A-003 | MEDIUM | Não há Central de Ajuda/tutoriais internos nem progresso persistente | Implementar conteúdo e autorização no backend, interface guiada e manuais coerentes |
| A-004 | MEDIUM | Identidade pública antiga, rótulos de máquina e validações padrão em inglês; fuso não é explícito | Origem configurável; tradução/formatadores e testes por rota |
| A-005 | MEDIUM | Bundle principal >500 kB | Carregar páginas por demanda e medir build |
| A-006 | HIGH (publicação bloqueada) | Render não configurado, MySQL gerenciado/provedor/TLS externo/backup operacional não definidos | Preparar arquivos/guias e ensaios locais, sem escolher provedor ou declarar deploy |
| A-007 | MEDIUM | Não há evidência atual de restauração real nem carga moderada | Executar ensaios isolados com dados sintéticos; registrar métricas e limites |
| A-008 | MEDIUM | Requisitos estão em tabelas resumidas, sem todos os campos e sem matriz completa | Formalizar catálogo/matriz preservando IDs e estados honestos |
| A-009 | MEDIUM | Larguras 320/375/390/430/768/1024/1440 e acessibilidade automática não verificadas integralmente | Exercitar principais telas e corrigir resultados encontrados |
| A-010 | BLOQUEIO EXTERNO | Repositório privado GitHub informado e origin configurado, mas acesso remoto recusado (Git HTTP 403; API HTTP 404). Provedores MySQL/imagens e acesso Render não configurados | Habilitar acesso da integração ao repositório; publicação/banco online/armazenamento permanecem pendentes. Não solicitar segredos no chat |

CRITICAL: nenhum achado confirmado na auditoria inicial; isso não equivale a auditoria independente exaustiva. A-001 é uma hipótese identificada por revisão estática, ainda sem reprodução concorrente. HIGH precisa ser corrigido ou permanecer como bloqueio explícito antes de disponibilizar a aplicação em produção. Versionar o código no GitHub não resolve esses achados. Resultados finais e evidências serão acrescentados após implementar e testar as correções.
