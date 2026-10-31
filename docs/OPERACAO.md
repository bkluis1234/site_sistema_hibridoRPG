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

O comando invalida sessões e códigos anteriores, incrementa a versão da conta e emite um novo código de uso único com validade de 24 horas. Os códigos offline originais do cadastro não recebem expiração retroativa. Entregar por canal privado à pessoa verificada. O usuário usa a tela Recuperar acesso para escolher nova senha; o operador não escolhe nem conhece essa senha. A emissão gera auditoria, sem armazenar o código em claro. A operação CLI foi ensaiada com conta sintética; a verificação de identidade real ainda precisa ser ensaiada com operador antes de produção.

## Manutenção

Sessões expiradas não autenticam, mas a remoção periódica física ainda deve ser agendada com política de retenção; convites/logs são mantidos para auditoria. Monitorar crescimento e capacidade do banco. Logs HTTP registram somente categoria e requestId; não habilitar body/cookie debug em produção. Traces de Playwright contêm credenciais sintéticas e ficam ignorados no Git.

Antes de migração: backup verificado, revisão do SQL e staging. Se uma migração falhar, investigar e seguir o procedimento de reparo do Prisma; não resetar banco de produção nem marcar migração aplicada sem executar/conferir o SQL correspondente.

## Sessões e compatibilidade da Parte 4

O backup da Parte 4 incluía 33 tabelas; a Parte 5 acrescenta tutorial_progress, totalizando 34. O backup completo inclui também rolagens/eventos/notas/presença e transferências; conteúdo narrativo privado exige a mesma proteção dos demais dados. Testar restauração consistente em staging antes de produção; nenhuma restauração de produção foi executada aqui.

Depois de criar rolagens de sessão com visibilidade reservada, não executar a API 0.3 contra esse banco: consultas legadas daquela versão ainda não conhecem o filtro de sala. Uma reversão precisa de estratégia compatível de aplicação/dados; não basta trocar o código e manter novos dados secretos acessíveis a consultas antigas. Na publicação, encerrar instâncias antigas e conferir a versão nova antes de liberar o grupo no Modo Sessão. Ensaiar esse procedimento na Parte 5, sem excluir histórico para contornar o problema.


## Ensaio local da Parte 5

`npm run audit:database` cria um contêiner MySQL 8.4 isolado, porta somente 127.0.0.1:3308, CA/certificado/chaves efêmeros e senha sintética aleatória. Não toca no contêiner hibrido-mysql-test existente nem conecta a produção. Aplica as cinco migrações com Prisma deploy desde vazio, consulta TLS, cria ficha pelo backend, reinicia MySQL/API, exporta as tabelas com mysqldump, cifra AES-256-GCM e confere checksum/autenticidade antes de restaurar em outro banco do contêiner. Reconsulta ledger Prisma e dados pela API. Testa também CA incompatível. Contêiner/volume/certificados/dump sintéticos são removidos ao finalizar. É ensaio funcional; não é uma rotina de backup de produção nem recupera dados reais do provedor.

Metas RPO ≤24h e RTO ≤4h continuam objetivos operacionais. O ensaio local não inclui tempo de resposta humana, provisionamento Aiven/Render, tráfego ou a restauração oferecida pelo plano. Confirmar agenda/retenção, responsável e capacidade antes de uso real.

## Operação inicial no Windows

Instale MySQL Workbench/cliente MySQL 8 compatível e uma ferramenta de cifragem local aprovada. Guarde a configuração privada fora do repositório, restrita ao seu usuário do Windows, com host/porta/usuário/senha próprios e `ssl-mode=VERIFY_IDENTITY`, apontando `ssl-ca` para o certificado do projeto. Use `--defaults-extra-file` antes dos outros argumentos, sem senha na linha de comando.

Exporte com `mysqldump --defaults-extra-file=C:/seguro/mysql-backup.cnf --single-transaction --no-tablespaces --set-gtid-purged=OFF origem > C:/seguro/backup.sql` a partir de um terminal que preserve a codificação do arquivo. No PowerShell antigo, prefira o mecanismo de exportação do Workbench ou execute a redireção pelo cmd, pois a codificação padrão da redireção pode mudar conforme a versão. Rotinas/eventos externos à aplicação exigem estratégia e privilégios próprios.

Cifre antes de copiar ao armazenamento restrito: por exemplo, 7-Zip instalado localmente, formato 7z com AES-256 e nomes cifrados, senha forte solicitada interativamente (`7z a -t7z -mhe=on -p C:/seguro/backup.7z C:/seguro/backup.sql`). Não coloque a senha no argumento -p. Confira listagem e extração em pasta temporária privada, calcule `Get-FileHash C:/seguro/backup.7z -Algorithm SHA256`, teste importação em banco isolado com cliente MySQL e só então remova o plaintext temporário de forma coordenada. Defina como guardar a chave/senha separadamente e recuperar acesso se o operador estiver ausente. Nenhum armazenamento externo foi contratado ou acessado por esta tarefa.

O plano Free do Render não oferece shell ou cron de operação. Agendamento de backup precisa de computador/infraestrutura sob responsabilidade do proprietário e não pode depender da instância suspensa do web service. Não prometer backup diário se esse agendamento ainda não existe.

## Carga e desligamento na retomada

O ensaio compilado passou com 400/400 sinais, RSS pico 318,83 MiB e liberação dos 20 streams. A instrumentação é exclusiva de teste/IPC, sem endpoint operacional. Após desconexões o RSS pode continuar alocado: isso não significa memória de um processo já encerrado nem prova ausência de vazamento. Método e limites em DESEMPENHO.md. O comando de produção permanece start:render; migrações/administração não são executadas automaticamente no start.
