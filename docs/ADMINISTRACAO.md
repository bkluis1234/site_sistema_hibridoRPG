# Administração da plataforma

O primeiro ADMIN é criado exclusivamente no servidor por npm run admin:create. Não há bootstrap público, e-mail artificial, senha padrão ou chave permanente no React. O administrador também possui fichas normais; Voltar ao modo jogador abre seus personagens e campanhas sem carregar segredos narrativos administrativos.

## Painel

- Usuários: pesquisa por login, desativação/reativação e habilitação de criação de campanhas para contas existentes.
- Campanhas: nome, criador, status e contagens; alterar estado com confirmação. Não inclui descrição narrativa, notas GM ou conteúdo de fichas.
- Papéis: ADMIN/PLAYER global e GM/PLAYER em campanha, separadamente. Para tornar alguém GM de campanha, exigir vínculo aceito e habilitação de criação (ou ADMIN). A última função GM ativa não pode ser removida por essa operação.
- Convites privilegiados: códigos aleatórios temporários, uso único no cadastro, hash no banco, revogáveis; habilitam criação sem conceder ADMIN.
- Auditoria: ator, ação, destino, data e justificativa; sem senhas/códigos/tokens.
- Configurações: abertura de cadastro e criação de campanhas, com versão. Segredos de infraestrutura são configurados no ambiente do servidor.

## Reautenticação

Alterar conta, habilitação, estado/papel de campanha ou configurações exige senha atual e justificativa. /admin/reauth emite autorização aleatória válida por cinco minutos, vinculada à conta e sessão, de uso único, representada por hash no banco. O cliente mantém o valor só em memória e envia X-Admin-Authorization. A API consome a autorização na transação da operação; erro de versão não conclui a mudança. Limite de dez reautenticações por IP a cada 15 minutos.

Conceder/remover ADMIN e alterar conta já administrativa exigem também um código de recuperação não usado. Para troca de papel global, confirmar o login exato do destino. O código é consumido ao emitir a autorização reforçada: se desistir ou deixar expirar, ele continua gasto. Não é MFA independente de dispositivo, mas acrescenta uma credencial de uso único à sessão e senha. Guardar os códigos fora do navegador e usar o procedimento de recuperação do servidor quando necessário.

A própria desativação ou perda de ADMIN é recusada; manter ao menos um ADMIN ativo. Desativar conta ou mudar papel global revoga sessões do destino; reativar não restaura sessões antigas, exige novo login. Fichas e logs permanecem no MySQL. Permissões são reconsultadas no servidor; editar React/localStorage/cabeçalhos não promove contas.

O painel administrativo comum não concede acesso automático a narrativas. Para exercer função de mestre é preciso vínculo GM explícito e contexto separado. Operadores com acesso SQL/backups continuam dentro da fronteira de confiança da infraestrutura.

## Operação

Não há exclusão física pelo painel. Definir retenção/anonimização antes de abrir esse recurso. Rate limits ainda são locais ao processo; adotar store compartilhado antes de múltiplas instâncias. Agendar expurgo de sessões, autorizações expiradas, notificações e operações idempotentes somente depois de definir retenção e preservar auditoria necessária.

Backup/restauração e verificação administrativa de identidade: OPERACAO.md. Publicação Render com MySQL externo: PUBLICACAO.md. Nenhuma conta de produção de Marcus/ADMIN foi criada nesta entrega e nenhuma credencial de teste deve ser reutilizada.

Cobertura automatizada: campaigns.test.ts verifica negação de escalada, prova expirada/usada ou ausente, promoção reforçada, preservação de fichas, revogação de sessão e ausência de segredos; management.spec.ts exercita o fluxo administrativo e retorno à ficha própria. Limites e resultados exatos em VALIDACAO.md.
