# Segurança do Origem

Escopo auditado: aplicação local derivada de ce85c37, sem usuários reais, sem testes ativos contra GitHub/Render/Aiven e sem declaração de ausência absoluta de vulnerabilidades. Sistema de regras: Híbrido 2.6. As decisões de jogo continuam documentadas em REGRAS_RPG.md.

## Contas e sessões

Cadastro sem e-mail, login único normalizado e senha de 12 a 128 caracteres, sem regra arbitrária de composição. Argon2id usa sal por hash, 64 MiB, três iterações e paralelismo um. Dois trabalhos de senha simultâneos por processo e fila de oito; excesso retorna 503 sem reduzir o custo criptográfico. A vaga só é devolvida quando o trabalho acaba, inclusive após desconexão. Esse limite reduz risco de esgotar memória; não substitui medir CPU/RAM no plano escolhido.

Login verifica a senha e reconfere hash, versão e estado da conta sob bloqueio de linha antes de criar sessão. Recuperação usa a mesma ordem de bloqueio, altera a versão e revoga sessões na transação. Cookies são enviados somente após commit. Primeiro ADMIN é criado por CLI interativa, sem senha padrão; convites de mestre têm hash, uso único, expiração e revogação no backend.

O navegador recebe cookie de sessão HttpOnly, SameSite=Lax, Path=/, Secure e prefixo __Host em produção; não há token de autenticação em localStorage. O MySQL armazena hash do segredo aleatório de 256 bits. Prazo absoluto de sete dias e inatividade de 12 horas; a renovação do prazo ocioso é gravada no máximo a cada cinco minutos. Autorização consulta a sessão a cada requisição. Logout revoga o registro, sem recriá-lo.

Os oito códigos offline originais são duradouros até uso/reemissão; não são links temporários de e-mail. O código reemitido pelo operador expira em 24 horas. Só hashes são persistidos. Verificação presencial/voz por contato conhecido é uma obrigação operacional, não uma prova técnica de identidade. Reautenticação administrativa produz prova vinculada à sessão, de uso único e cinco minutos; promover ADMIN exige recuperação adicional. Não copie códigos para logs, tickets públicos ou ferramentas de analytics.

## Autorização e dados privados

ADMIN global, capacidade de criar campanhas e vínculo GM são controles diferentes. O dono edita sua ficha nos estados permitidos; GM precisa do vínculo ativo na campanha; conhecer UUID não concede acesso. Rascunhos, aprovações, versões e justificativas são validados no servidor. Notas pessoais não passam a ser do mestre. Projeções de ficha, rolagens, diário, eventos, cursores e contadores filtram escopo/visibilidade antes de responder. Os tutoriais são informação estática; marcar leitura grava somente progresso da conta autenticada e não concede papel algum.

As rotas administrativas verificam papel e contexto no servidor e registram ações críticas. Desativação/alteração de papel revoga sessões conforme fluxo existente. Exclusão física de contas/campanhas não foi disponibilizada. Dados essenciais são MySQL; operações idempotentes e versões evitam gasto duplo e sobrescrita silenciosa. Rolagens oficiais usam crypto.randomInt, contratos estritos e snapshots; resultados enviados pelo cliente são recusados.

## Transporte e API

Frontend e API são servidos na mesma origem pelo Express. Não há CORS irrestrito com credenciais. Mutações exigem Origin exata e token CSRF assinado igual ao cookie, inclusive logout. Helmet define CSP, proteção contra enquadramento e demais cabeçalhos. `blob:` em imagens permite somente a prévia local de retrato; script externo não é permitido. Não usamos dangerouslySetInnerHTML nem avaliação de expressões do usuário. JSON tem limite de 128 KiB, contratos Zod recusam campos extras e erros públicos não incluem stack/URL/valores internos. Validações exibem português brasileiro.

Rate limits por IP, conta e usuário autenticado preservam o uso legítimo em Wi-Fi compartilhado. Stores são locais ao processo: múltiplas réplicas exigem store compartilhado antes de escalar. HTTP usa limite de cabeçalhos, prazo de recebimento de 30 s e shutdown de dez segundos; esse prazo não corta a resposta SSE longa após receber o GET.

SSE exige sessão e vínculo atuais, revalidados a cada dois segundos; só transporta ID/tipo autorizado. Limites de quatro conexões por conta e cem por processo, liberação idempotente, encerramento de cliente lento quando write indica backpressure, rotação em 30 minutos e fechamento no shutdown. Cada reconexão reconcilia o MySQL; polling permanece disponível. Não há tokens em URL. O tempo de revogação de um stream aberto tem a janela de revalidação; não é instantâneo. A política entre processos/proxies precisa de verificação em staging.

## Banco e operação

database-policy.ts é usado pela API e Prisma CLI: MySQL obrigatório, TLS estrito, CA normalizada e rejeição de modos inseguros. Runtime rejeita certificado inválido; URL de migração recebe sslcert/sslaccept=strict. Pool runtime de cinco, padrão CLI de dois; o orçamento total inclui Workbench, operador e migrações. O ensaio isolado usa servidor com transporte seguro obrigatório, migrações desde vazio e backup/restauração. Isso não configura privilégios, firewall ou certificados de um provedor real.

Use usuário runtime com DML mínimo e usuário de migração separado, guardados fora do Git. Segredos ficam no painel/secret files do Render ou arquivo local privado; variáveis VITE_* são públicas. Retrato persistente continua desabilitado até haver storage externo autorizado. Não há telemetria externa adicionada. Logs de requisição mostram somente categoria/requestId; não habilite debug de corpos/cookies. Os scripts de teste usam dados e credenciais sintéticos, nunca contas reais.

## Repositório público e supply chain

`npm run security:secrets` examina arquivos de trabalho e blobs alcançáveis no histórico, sem imprimir valores. Detecta formatos conhecidos de tokens/chaves, arquivos sensíveis e URLs com senha literal; exemplos e fixtures foram revisados. Não detecta qualquer segredo arbitrário nem PII por semântica; não substitui revisão humana ou scanner especializado. Gitleaks não está instalado nesta sessão. Arquivos `.env`, certificados/chaves, configurações MySQL, dumps, bundles, ZIPs e traces ficam ignorados; apenas exemplos fictícios e SQL de migração são versionados.

Dependências são reproduzidas por npm ci/lockfile. Não houve troca de majors para encobrir alertas. Os scripts de instalação e bibliotecas centrais foram inspecionados, sem certificação forense de todos os pacotes transitivos. CI usa ações oficiais por SHA, token contents:read, checkout sem credencial persistida, PR comum sem pull_request_target e MySQL efêmero com credencial sintética. Não usa segredos de produção e não executa deploy. Revisar manifestos/lockfile/workflows de contribuições antes de aprovar execução; nunca liberar secrets para código externo não revisado.

## Incidentes e divulgação

Se um segredo real aparecer, trate-o como comprometido: registrar somente localização, conter acesso, revogar/rotacionar no provedor e substituir a configuração; invalidar sessões quando pertinente e preservar evidências privadas. Remover o arquivo atual não remove o histórico público. Reescrita de histórico exige autorização e coordenação; não é executada automaticamente. Verifique restauração e acesso legítimo depois da resposta.

Relatos seguem SECURITY.md. Habilitar divulgação privada do GitHub, designar responsáveis e definir prazos continuam ações do proprietário. Não publicar passos de exploração de falhas abertas.

## Privacidade e limites restantes

Login, senha protegida e conteúdo de jogo são os dados necessários; e-mail, localização, tracking e perfilamento não foram acrescentados. Compartilhamento começa restrito conforme configuração da campanha/ficha. O proprietário deve definir finalidade, controlador/operadores, aviso de privacidade, canal para titulares, retenção e atendimento envolvendo menores antes de uso com dados reais. Nenhuma conformidade integral com LGPD é afirmada. Não se fixaram prazos de exclusão irreversível sem aprovação; monitorar crescimento e coordenar limpeza/anonimização com integridade e auditoria.

Validação jurídica/operacional, aparelhos físicos/leitores de tela, produção HTTPS/proxy, TLS Aiven, backup operacional, capacidade Render e revisão do manual com Marcus continuam externos ao ensaio local. Veja AUDITORIA_FINAL.md e MATRIZ_RASTREABILIDADE.md para evidências e pendências.
