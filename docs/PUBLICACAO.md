# Publicação no Render com MySQL externo

Este documento prepara a publicação; não houve deploy nem contratação de provedor nesta entrega.

1. Crie um repositório privado, publique o commit local e conecte-o ao Render.
2. Provisione MySQL 8.4 gerenciado compatível (por exemplo, serviço dedicado com backups e TLS). **Render não é presumido como provedor nativo de MySQL.** Não armazene o banco em arquivo, em disco temporário da aplicação ou em SQLite.
3. Coloque aplicação e MySQL em regiões próximas. Restrinja conexões do banco conforme suporte do provedor; habilite TLS obrigatório também no servidor MySQL. Use uma credencial de migração separada da credencial runtime.
4. Crie Web Service Node no Render, raiz do repositório. Node 24 (engines e .node-version). Build: `npm ci --include=dev && npm run db:generate && npm run build`. Start: `npm start`. Health check: `/api/ready`.
5. Configure segredos pelo painel/secret files do Render: NODE_ENV=production, APP_ORIGIN=https://SEU-SERVICO.onrender.com sem barra final, DATABASE_URL, CSRF_SECRET aleatório e DATABASE_SSL=true. TRUST_PROXY=1 somente após validar que há um único proxy confiável. PORT é fornecida pelo Render. DATABASE_CA_PATH aponta para secret file CA se o provedor exigir. Nunca desabilite validação do certificado.
6. O adaptador runtime usa TLS com rejectUnauthorized=true. O Prisma CLI usa DATABASE_URL; configure os parâmetros TLS suportados pelo Prisma/provedor (incluindo CA quando necessário) **também na URL de migração**. DATABASE_SSL é configuração do adaptador da aplicação, não uma opção do CLI. O servidor MySQL deve rejeitar conexões sem TLS; confirme com o provedor e teste uma consulta autenticada via TLS antes de aplicar migrações.
7. Com credencial de migração e banco previamente verificado, execute `npm run db:deploy` como pre-deploy job/terminal controlado. Se o plano não oferecer pre-deploy, execute em ambiente seguro antes de iniciar a versão. Nunca execute `migrate reset`/`db push --force-reset` em produção. Não misture criação de migrações com start.
8. Rode `npm run admin:create` no terminal seguro do serviço com acesso ao banco runtime. Guarde os códigos fora do Render. Caso o plano não tenha shell, execute esse CLI num computador de operação autorizado com acesso TLS restrito ao banco, usando variáveis de produção fora do Git.
9. Execute smoke tests em staging: cadastro, recuperação, cookie Secure/HttpOnly/SameSite e prefixo __Host, CSRF, logout, acesso negado a terceiros, persistência após reiniciar serviço, conflitos, conexão MySQL com certificado válido e recuperação de backup.
10. Configure alertas de 5xx/latência e política de backup; meça as metas RNF-016 em staging com 20 usuários concorrentes por 5 minutos. Free tier com cold start não garante experiência de sessão adequada. Escala horizontal exige rate limit compartilhado.

O build compila o React em apps/web/dist e o Express serve esses arquivos na mesma origem. Não configure um serviço estático separado sem revisar cookies, CORS e CSRF. Não habilite cache em `/api`.

O usuário runtime necessita operações no domínio, INSERT/SELECT nos logs e CRUD em sessões/códigos. Não deve ter DROP/ALTER nem UPDATE/DELETE de logs. Migrações usam outra credencial. A segregação deve ser configurada e verificada no provedor; não foi provisionada automaticamente.

Inspeção: MySQL Workbench conecta ao mesmo host, porta, usuário autorizado e TLS (modo de verificar identidade/CA conforme provedor). Use usuário read-only para inspeção e nunca copie credenciais para a documentação. Schema e tabelas têm nomes mapeados para snake_case.
