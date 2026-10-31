# Operação, backup e recuperação

## Backup

Metas iniciais: RPO ≤24h, RTO ≤4h. Confirmar custos e retenção com o proprietário antes de assumir essas metas como garantidas. Habilitar snapshots automáticos diários no provedor e, quando disponível, PITR por binlog. Reter 7 diários e 4 semanais como ponto de partida; definir política de privacidade/retenção formal.

Além do snapshot, exportar cópia independente cifrada em armazenamento de acesso restrito fora do Render. Usar cliente MySQL compatível, TLS com verificação de identidade e arquivo de configuração restrito (permissão 0600), contendo credencial de backup fora do Git. Não colocar senha na linha de comando. Exemplo operacional após configurar esse arquivo:

```sh
mysqldump --defaults-extra-file=/caminho/seguro/mysql-backup.cnf --single-transaction --routines --triggers --events --set-gtid-purged=OFF NOME_DO_BANCO > backup.sql
```

Cifrar o arquivo, calcular checksum e transferir ao armazenamento de backup. Remover a cópia temporária somente após verificar o objeto cifrado. Dumps contêm hashes de senha, sessões e dados pessoais; nunca compartilhar ou adicionar ao Git. A aplicação usa InnoDB e migrações DDL devem ser coordenadas fora da janela de dump. Nunca presumir que disco persistente do web service é backup do MySQL.

## Restauração de ensaio

1. Criar instância MySQL isolada compatível, sem usuários reais ou acesso público.
2. Selecionar snapshot/dump cifrado, conferir data/checksum e registrar horário de início.
3. Decifrar em local temporário restrito e importar com `mysql --defaults-extra-file=/caminho/seguro/mysql-restore.cnf BANCO_ISOLADO < backup.sql`.
4. Conferir tabelas, contagens, FKs, histórico `_prisma_migrations` e integridade de amostras. Conectar aplicação de staging ao banco restaurado e testar leitura, gravação e login de conta de teste controlada. Não enviar convites nem mensagens a usuários reais.
5. Invalidar sessões restauradas antes de qualquer retorno de produção; coordenar troca de credenciais do banco/CSRF se houve incidente. Procedimento sobre sessões exige revisão explícita da operação real.
6. Registrar duração e ponto recuperado, comparar com RPO/RTO, corrigir lacunas e descartar o ensaio conforme retenção.

Ensaio antes da abertura aos jogadores e trimestralmente. Nenhum backup/restauro de produção foi executado nesta sessão.

## Recuperação administrativa de conta

Verificar a pessoa presencialmente ou por voz usando um contato conhecido antes da solicitação. Não aceitar apenas conhecimento de login/nome de personagem, capturas de tela ou contato recém-informado. Com confirmação, operador autorizado executa `npm run admin:recover` em terminal interativo seguro, informa ADMIN responsável, login alvo e referência sucinta da verificação, e confirma VERIFICADO.

O comando invalida sessões e códigos anteriores e emite um novo código de uso único. Entregar por canal privado à pessoa verificada. O usuário usa a tela Recuperar acesso para escolher nova senha; o operador não escolhe nem conhece essa senha. A emissão gera auditoria, sem armazenar o código em claro. A operação CLI foi ensaiada com conta sintética; a verificação de identidade real ainda precisa ser ensaiada com operador antes de produção.

## Manutenção

Sessões expiradas não autenticam, mas a remoção periódica física ainda deve ser agendada com política de retenção; convites/logs são mantidos para auditoria. Monitorar crescimento e capacidade do banco. Logs HTTP registram somente categoria e requestId; não habilitar body/cookie debug em produção. Traces de Playwright contêm credenciais sintéticas e ficam ignorados no Git.

Antes de migração: backup verificado, revisão do SQL e staging. Se uma migração falhar, investigar e seguir o procedimento de reparo do Prisma; não resetar banco de produção nem marcar migração aplicada sem executar/conferir o SQL correspondente.

## Sessões e compatibilidade da Parte 4

O backup completo agora inclui as 33 tabelas, também rolagens/eventos/notas/presença e transferências; conteúdo narrativo privado exige a mesma proteção dos demais dados. Testar restauração consistente em staging antes de produção; nenhuma restauração de produção foi executada aqui.

Depois de criar rolagens de sessão com visibilidade reservada, não executar a API 0.3 contra esse banco: consultas legadas daquela versão ainda não conhecem o filtro de sala. Uma reversão precisa de estratégia compatível de aplicação/dados; não basta trocar o código e manter novos dados secretos acessíveis a consultas antigas. Na publicação, encerrar instâncias antigas e conferir a versão nova antes de liberar o grupo no Modo Sessão. Ensaiar esse procedimento na Parte 5, sem excluir histórico para contornar o problema.
