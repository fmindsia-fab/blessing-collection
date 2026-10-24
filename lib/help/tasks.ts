// Roteiros da Ajuda do painel: cada tarefa tem um passo a passo com os nomes EXATOS dos
// botões e campos da tela. `target` é um seletor CSS do elemento que a Ajuda destaca;
// `href` leva a pessoa até a tela quando ela ainda não está nela.
//
// Atenção ao mudar um rótulo ou id no painel: atualize o roteiro correspondente aqui.

export type HelpStep = {
  text: string;
  href?: string;
  target?: string;
};

export type HelpTask = {
  id: string;
  title: string;
  /** Frases e palavras que a pessoa pode digitar para chegar nesta tarefa. */
  keywords: string[];
  steps: HelpStep[];
};

const nav = (href: string) => `[data-help="nav:${href}"]`;

export const HELP_TASKS: HelpTask[] = [
  {
    id: "cadastrar-peca",
    title: "Cadastrar uma peça nova",
    keywords: ["cadastrar produto", "nova peca", "novo produto", "adicionar peca", "adicionar produto", "criar produto", "incluir peca", "cadastrar bolsa", "colocar peca no catalogo"],
    steps: [
      { text: 'Abra "Produtos" no menu.', href: "/admin/produtos", target: nav("/admin/produtos") },
      { text: 'Clique no botão "Nova peça".', href: "/admin/produtos", target: '[data-help="new-product"]' },
      { text: "Escreva o nome da peça.", href: "/admin/produtos/novo", target: "#name" },
      { text: "Conte como ela é: material, tamanho, acabamento.", target: "#description" },
      { text: "Informe o preço que você cobra.", target: "#price" },
      { text: 'Clique em "Criar produto". Depois de salvar, você poderá enviar as fotos.', target: '[data-help="save"]' },
    ],
  },
  {
    id: "mudar-preco",
    title: "Mudar o preço de uma peça",
    keywords: ["mudar preco", "alterar preco", "trocar preco", "editar preco", "preco da peca", "reajustar preco", "aumentar preco", "valor da peca", "mudar valor"],
    steps: [
      { text: 'Abra "Produtos" no menu.', href: "/admin/produtos", target: nav("/admin/produtos") },
      { text: "Se quiser, procure a peça pelo nome na busca.", target: '[aria-label="Buscar peça pelo nome"]' },
      { text: 'Clique em "Editar" na peça que você quer mudar.', target: '[data-help="product-edit"]' },
      { text: 'Mude o campo "Preço base (R$)".', target: "#price" },
      { text: 'Clique em "Salvar alterações".', target: '[data-help="save"]' },
    ],
  },
  {
    id: "calcular-preco",
    title: "Descobrir quanto cobrar por uma peça",
    keywords: ["calcular preco", "precificar", "precificacao", "quanto cobrar", "formacao de preco", "margem de lucro", "custo da peca", "hora de trabalho", "sugestao de preco"],
    steps: [
      { text: 'Abra "Precificação" no menu e informe o valor da sua hora de trabalho e seus custos. Faça isso uma vez só.', href: "/admin/precificacao", target: nav("/admin/precificacao") },
      { text: 'Clique em "Salvar configurações".', target: '[data-help="save"]' },
      { text: 'Depois, abra uma peça em "Produtos" > "Editar" e vá até "Formação de preço" para ver o preço sugerido.', href: "/admin/produtos", target: nav("/admin/produtos") },
    ],
  },
  {
    id: "fotos",
    title: "Colocar fotos numa peça",
    keywords: ["foto", "fotos", "imagem", "imagens", "colocar foto", "enviar foto", "adicionar foto", "trocar foto", "foto principal", "capa", "tirar foto"],
    steps: [
      { text: 'Abra "Produtos" no menu.', href: "/admin/produtos", target: nav("/admin/produtos") },
      { text: 'Clique em "Editar" na peça.', target: '[data-help="product-edit"]' },
      { text: 'Na parte "Imagens", toque em "Toque para adicionar uma foto" (até 8 fotos) ou use "Tirar foto agora".', target: "#fotos" },
      { text: 'Para escolher a foto principal, use "Definir capa" na foto desejada.', target: "#fotos" },
    ],
  },
  {
    id: "variacoes",
    title: "Adicionar cores ou opções (variações) a uma peça",
    keywords: ["variacao", "variacoes", "cor", "cores da peca", "alca", "tamanho", "opcoes da peca", "adicionar cor", "escolher cor"],
    steps: [
      { text: 'Abra "Produtos" no menu.', href: "/admin/produtos", target: nav("/admin/produtos") },
      { text: 'Clique em "Editar" na peça.', target: '[data-help="product-edit"]' },
      { text: 'Vá até a parte "Variações", escolha a variação (Cor, Alça…) e dê um nome à opção. Se escolher "Alça", dá para escolher um material cadastrado e o preço dele é somado ao da peça.', target: "#variacoes" },
      { text: 'Clique em "Adicionar variação".', target: "#variacoes" },
    ],
  },
  {
    id: "duplicar-peca",
    title: "Duplicar uma peça parecida com outra",
    keywords: ["duplicar", "duplicar peca", "copiar peca", "copiar produto", "peca parecida", "clonar", "cadastrar parecido", "fazer copia", "outra cor parecida"],
    steps: [
      { text: 'Abra "Produtos" no menu.', href: "/admin/produtos", target: nav("/admin/produtos") },
      { text: "Clique no ícone de duas folhinhas (Duplicar) na peça que é parecida com a nova.", target: '[data-help="product-duplicate"]' },
      { text: 'A cópia abre para edição, inativa e sem fotos. Mude o nome e o que for diferente, envie as fotos e troque o Status para Disponível. Depois clique em "Salvar alterações".', target: '[data-help="save"]' },
    ],
  },
  {
    id: "esconder-peca",
    title: "Tirar uma peça do catálogo (sem apagar)",
    keywords: ["esconder peca", "tirar do catalogo", "desativar", "desativar peca", "ocultar", "pausar peca", "peca esgotada", "excluir produto", "apagar peca", "remover peca", "reativar"],
    steps: [
      { text: 'Abra "Produtos" no menu.', href: "/admin/produtos", target: nav("/admin/produtos") },
      { text: 'Clique em "Desativar" na peça. Ela some do catálogo, mas continua guardada. Para voltar, clique em "Reativar".', target: '[data-help="product-toggle"]' },
    ],
  },
  {
    id: "ordenar-pecas",
    title: "Mudar a ordem das peças no catálogo",
    keywords: ["ordem das pecas", "reordenar", "ordenar", "mudar ordem", "mover peca", "colocar peca primeiro", "arrastar"],
    steps: [
      { text: 'Abra "Produtos" no menu.', href: "/admin/produtos", target: nav("/admin/produtos") },
      { text: "Use as setinhas ao lado da peça para subir ou descer, ou arraste a peça pelos pontinhos. A ordem vale dentro de cada categoria." },
    ],
  },
  {
    id: "categorias",
    title: "Criar uma categoria (ex.: Bolsas, Acessórios)",
    keywords: ["categoria", "categorias", "criar categoria", "organizar pecas", "agrupar pecas", "nova categoria"],
    steps: [
      { text: 'Abra "Organizar catálogo" e clique em "Categorias".', href: "/admin/categorias", target: nav("/admin/categorias") },
      { text: 'Escreva o nome e clique em "Adicionar categoria". Depois escolha a categoria ao cadastrar cada peça.' },
    ],
  },
  {
    id: "colecoes",
    title: "Criar uma coleção (ex.: Festa, Verão)",
    keywords: ["colecao", "colecoes", "criar colecao", "nova colecao", "linha de pecas"],
    steps: [
      { text: 'Abra "Organizar catálogo" e clique em "Coleções".', href: "/admin/colecoes", target: nav("/admin/colecoes") },
      { text: 'Escreva o nome e clique em "Adicionar coleção".' },
    ],
  },
  {
    id: "materiais",
    title: "Cadastrar materiais (fio, fecho, etiqueta…)",
    keywords: ["material", "materiais", "cadastrar material", "fio", "fecho", "custo do material", "preco do material", "insumo", "insumos"],
    steps: [
      { text: 'Abra "Organizar catálogo" e clique em "Materiais".', href: "/admin/materiais", target: nav("/admin/materiais") },
      { text: 'Escreva o nome, a unidade e o preço e clique em "Adicionar". Para mudar um preço depois, clique nele, digite e saia do campo: salva sozinho.', target: "#mat-name" },
    ],
  },
  {
    id: "cadastrar-cliente",
    title: "Cadastrar uma cliente",
    keywords: ["cliente", "clientes", "cadastrar cliente", "nova cliente", "adicionar cliente", "telefone da cliente"],
    steps: [
      { text: 'Abra "Clientes" no menu.', href: "/admin/clientes", target: nav("/admin/clientes") },
      { text: 'Escreva o nome e o telefone e clique em "Adicionar".', target: "#cust-name" },
    ],
  },
  {
    id: "novo-pedido",
    title: "Registrar um pedido ou encomenda",
    keywords: ["pedido", "novo pedido", "registrar pedido", "encomenda", "criar pedido", "fazer orcamento", "orcamento", "anotar encomenda"],
    steps: [
      { text: 'Abra "Pedidos" no menu.', href: "/admin/pedidos", target: nav("/admin/pedidos") },
      { text: 'Clique em "Novo pedido".', target: '[data-help="new-order"]' },
      { text: "Escolha a cliente (se ainda não existir, cadastre na hora), a data e a previsão de entrega.", href: "/admin/pedidos/novo", target: "#customerId" },
      { text: 'Adicione as peças com "Adicionar item" e clique em "Criar pedido".', target: '[data-help="save"]' },
    ],
  },
  {
    id: "situacao-pedido",
    title: "Mudar a situação de um pedido (em produção, pronto, entregue)",
    keywords: ["situacao do pedido", "status do pedido", "mudar status", "pedido pronto", "pedido entregue", "em producao", "confirmar pedido", "andamento do pedido"],
    steps: [
      { text: 'Abra "Pedidos" no menu.', href: "/admin/pedidos", target: nav("/admin/pedidos") },
      { text: "Arraste o cartão do pedido para a coluna da nova situação. Ou abra o pedido e clique na situação desejada." },
    ],
  },
  {
    id: "cancelar-pedido",
    title: "Cancelar um pedido",
    keywords: ["cancelar pedido", "cancelar encomenda", "desistiu do pedido", "reabrir pedido", "excluir pedido", "apagar pedido"],
    steps: [
      { text: 'Abra "Pedidos" no menu e clique no pedido.', href: "/admin/pedidos", target: nav("/admin/pedidos") },
      { text: 'Na tela do pedido, clique em "Cancelar pedido" e confirme. O histórico fica guardado e dá para reabrir depois.' },
    ],
  },
  {
    id: "calendario",
    title: "Ver as entregas no calendário",
    keywords: ["calendario", "entregas", "prazo de entrega", "data de entrega", "agenda", "proximas entregas"],
    steps: [
      { text: 'Abra "Pedidos" no menu.', href: "/admin/pedidos", target: nav("/admin/pedidos") },
      { text: 'Clique em "Calendário".', target: '[data-help="orders-calendar"]' },
    ],
  },
  {
    id: "logo",
    title: "Colocar ou trocar o logo da loja",
    keywords: ["logo", "logotipo", "trocar logo", "colocar logo", "marca da loja", "imagem da loja"],
    steps: [
      { text: 'Abra "Configurações" no menu.', href: "/admin/configuracoes", target: nav("/admin/configuracoes") },
      { text: 'Na parte "Logo da loja", escolha o arquivo e clique em "Enviar logo".', target: "#logo" },
    ],
  },
  {
    id: "cores-da-loja",
    title: "Mudar as cores e a fonte do catálogo",
    keywords: ["cores da loja", "paleta", "identidade visual", "fonte da loja", "mudar cores", "visual do catalogo", "tipo de letra"],
    steps: [
      { text: 'Abra "Configurações" no menu.', href: "/admin/configuracoes", target: nav("/admin/configuracoes") },
      { text: 'Na parte "Identidade visual", escolha as cores e a fonte.', target: "#dados" },
      { text: 'Clique em "Salvar".', target: '[data-help="save"]' },
    ],
  },
  {
    id: "whatsapp",
    title: "Mudar o WhatsApp da loja",
    keywords: ["whatsapp", "zap", "numero da loja", "telefone da loja", "mudar numero", "instagram", "chave pix", "pix", "nome da loja"],
    steps: [
      { text: 'Abra "Configurações" no menu.', href: "/admin/configuracoes", target: nav("/admin/configuracoes") },
      { text: 'Mude o campo "WhatsApp" (ou o nome da loja, Instagram e chave PIX).', target: "#whatsappNumber" },
      { text: 'Clique em "Salvar".', target: '[data-help="save"]' },
    ],
  },
  {
    id: "compartilhar",
    title: "Compartilhar o link da loja",
    keywords: ["compartilhar", "link da loja", "divulgar", "mandar link", "enviar link", "endereco da loja", "site da loja"],
    steps: [
      { text: 'Clique em "Compartilhar" no alto da tela e escolha o WhatsApp ou o Instagram.', target: '[data-help="share"]' },
    ],
  },
  {
    id: "ver-catalogo",
    title: "Ver como o catálogo aparece para as clientes",
    keywords: ["ver catalogo", "ver loja", "como ficou", "ver minha loja", "catalogo publico", "abrir loja"],
    steps: [{ text: 'Clique em "Ver loja" no alto da tela. O catálogo abre em outra aba.', target: '[data-help="view-store"]' }],
  },
  {
    id: "assinatura",
    title: "Ver ou cancelar a assinatura",
    keywords: ["assinatura", "plano", "cancelar assinatura", "pagamento da assinatura", "dias de teste", "teste gratis", "cartao", "mensalidade", "trocar cartao"],
    steps: [
      { text: 'Abra "Configurações" no menu.', href: "/admin/configuracoes", target: nav("/admin/configuracoes") },
      { text: 'Na parte "Assinatura", veja a situação e use o botão de gerenciar o pagamento.', target: "#assinatura" },
    ],
  },
  {
    id: "desempenho",
    title: "Ver quantas pessoas olharam minhas peças",
    keywords: ["visualizacoes", "visitas", "estatisticas", "analytics", "desempenho", "quantas pessoas", "mais vistas", "ranking", "cliques no whatsapp"],
    steps: [
      { text: 'O "Dashboard" mostra as visualizações, os cliques no WhatsApp, a evolução por dia nos gráficos e as peças mais vistas. Troque o período nos botões do alto.', href: "/admin", target: nav("/admin") },
      { text: 'Para ver mais detalhes, abra "Analytics" no menu.', href: "/admin/analytics", target: nav("/admin/analytics") },
    ],
  },
  {
    id: "texto-maior",
    title: "Aumentar o tamanho das letras",
    keywords: ["letra pequena", "letras maiores", "aumentar letra", "aumentar texto", "tamanho do texto", "nao enxergo", "difícil de ler", "fonte maior", "ler melhor"],
    steps: [
      { text: 'Clique no botão "A" no alto da tela. A cada clique o texto cresce: Normal, Grande, Muito grande.', target: '[data-help="text-size"]' },
    ],
  },
  {
    id: "modo-escuro",
    title: "Mudar para o modo escuro (ou claro)",
    keywords: ["modo escuro", "tema escuro", "fundo escuro", "fundo preto", "modo claro", "mudar tema", "luz"],
    steps: [{ text: "Clique no botão com a lua (ou o sol) no alto da tela.", target: '[data-help="theme"]' }],
  },
];
