export const GUIDE_KEYS = ["jogador", "mestre", "administrador"] as const;
export const guides = [
  {
    key: "jogador",
    title: "Guia do jogador",
    steps: [
      "Crie sua conta sem e-mail e guarde os códigos de recuperação fora da plataforma. Eles não são mostrados novamente.",
      "Em Visão geral, crie um personagem. Complete identificação, oito pontos em atributos e quatro perícias treinadas antes de enviar para aprovação.",
      "Aguarde a confirmação do servidor ao salvar. Se houver conflito, compare as versões; se perder a conexão, seus dados ainda não estão salvos.",
      "Receba o convite de campanha, solicite ingresso e aguarde o aceite do mestre. Vincule sua própria ficha e escolha o que compartilhar.",
      "Na campanha, abra Sessões de jogo e entre com sua ficha. PV, SAN, PE, inventário e condições seguem os mesmos controles da ficha.",
      "Escolha a visibilidade antes de rolar. O servidor gera os resultados; nos testes de perícia, d20 igual ou inferior ao alvo é sucesso, exceto 20 natural.",
      "Fadiga mostra alvo base e modificado separadamente. A lista inicial é proposta para a campanha, sujeita à revisão de Marcus.",
      "Reconectou? Aguarde a atualização. Não repita uma ação já confirmada sem consultar o histórico. Retratos têm apenas prévia local; exportação de ficha ainda não está disponível.",
    ],
  },
  {
    key: "mestre",
    title: "Guia do mestre",
    steps: [
      "A permissão de criar campanhas depende do administrador. Criar uma campanha concede vínculo de mestre somente nela.",
      "No painel da campanha, crie convites temporários e aprove os pedidos de participação. Revogue convites que não serão usados.",
      "Confira e aprove fichas e solicitações mecânicas. Alterações protegidas exigem justificativa e registram auditoria.",
      "Configure o compartilhamento e a lista de perícias afetadas pela fadiga. Confira o manual e a proposta inicial com Marcus.",
      "Agende, inicie, pause e encerre sessões em Sessões de jogo. Abra o contexto de mestre para acessar as ferramentas correspondentes.",
      "Selecione a visibilidade das rolagens e notas antes de criar. Notas pessoais de outros autores continuam privadas, inclusive para o mestre.",
      "Repetição com PE exige autorização e justificativa. Transferências de itens ficam desativadas até você habilitar a opção da campanha.",
      "Ao encerrar, consulte os registros autorizados e publique o resumo narrativo. Presença online é aproximada e não prova presença física.",
    ],
  },
  {
    key: "administrador",
    title: "Guia do administrador",
    steps: [
      "A primeira conta administrativa é criada exclusivamente pelo comando admin:create em terminal seguro. Não há senha administrativa padrão.",
      "No painel Administração, gerencie contas, convites de mestre e configurações. Ações críticas exigem confirmação recente da senha.",
      "Conceder ADMIN também exige código de recuperação de uso único e confirmação do destinatário. Nunca compartilhe esses códigos.",
      "Ser administrador não revela automaticamente notas ou rolagens de mestre. O acesso narrativo exige o vínculo e o contexto da campanha.",
      "Para recuperar uma conta sem códigos, verifique a pessoa por contato previamente conhecido e use admin:recover em terminal seguro. O código reemitido expira em 24 horas.",
      "Antes de publicar, configure MySQL externo com TLS, faça backup e ensaie restauração. O disco temporário do Render não guarda banco nem retratos.",
      "Consulte os registros sem copiar dados privados para serviços externos. Não habilite telemetria ou contrate serviços sem autorização.",
      "Os tutoriais são opcionais: marcar leitura registra apenas seu progresso. Não concede permissões nem executa ações de administração.",
    ],
  },
] as const;
