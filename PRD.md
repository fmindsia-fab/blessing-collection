# PROJECT ARCHITECTURE: Blessing Collection

> Fonte oficial dos requisitos. O `PLAN.md` traduz este documento em decisões
> técnicas e referencia suas seções pelo número — não renumerar seções.

## 1. CONTEXTO E PROBLEMA

A Blessing Collection precisa de uma forma profissional, visual e organizada de apresentar suas bolsas e acessórios.

Atualmente, os produtos ficam dispersos entre fotos, publicações nas redes sociais e conversas no WhatsApp. Isso dificulta a consulta de modelos, cores, tamanhos, preços e disponibilidade.

A falta de um catálogo centralizado gera perguntas repetitivas, aumenta o trabalho manual no atendimento e pode causar perda de vendas. A cliente precisa visualizar os produtos com facilidade, acessar várias fotos, consultar suas características e entrar em contato diretamente com a loja pelo WhatsApp.

A proprietária também precisa cadastrar, editar, organizar, destacar, arquivar e desativar produtos sem depender de alterações no código.

Além disso, atualmente não existe uma forma objetiva de identificar:

- Quais produtos recebem mais visualizações.
- Quais bolsas despertam mais interesse.
- Quais produtos geram mais contatos pelo WhatsApp.
- Quais categorias e coleções são mais acessadas.
- Quais produtos recebem visitas, mas poucos contatos.

A solução começará atendendo à Blessing Collection, mas será estruturada desde o início para futuramente atender outras artesãs e pequenas marcas.

Cada loja terá apenas um usuário proprietário responsável pelo gerenciamento do catálogo. Não haverá colaboradores, múltiplos usuários por loja ou permissões por função no MVP.

---

## 2. SOLUÇÃO PROPOSTA

A Blessing Collection será um catálogo digital responsivo para apresentação e divulgação de bolsas e acessórios artesanais.

A plataforma terá uma página pública com identidade visual personalizada, produtos organizados por categorias, coleções e modelos, recursos de busca e filtros e páginas individuais com várias fotos, descrição, preço, medidas, materiais, cores, variações e disponibilidade.

Cada produto terá um botão que direcionará a cliente para o WhatsApp da loja com uma mensagem automática contendo o nome, a variação selecionada e o link do produto.

A primeira versão não terá carrinho de compras, pagamento online ou cálculo de frete. A negociação, personalização e conclusão do pedido serão realizadas diretamente pelo WhatsApp.

A plataforma terá uma área administrativa protegida por login. A proprietária poderá cadastrar, editar, organizar, destacar, arquivar e desativar produtos, categorias, coleções, variações e imagens sem alterar o código.

O painel também terá uma área simples de analytics para apresentar:

- Total de visualizações dos produtos.
- Total de cliques no WhatsApp.
- Ranking dos produtos mais acessados.
- Ranking dos produtos com mais contatos.
- Categorias e coleções mais acessadas.
- Taxa de interesse por produto.
- Filtros por período.

Embora a Blessing Collection seja a única loja utilizada no MVP, a arquitetura e o banco de dados serão multiempresa desde o início.

Cada loja terá um único usuário proprietário e seus dados permanecerão isolados das demais lojas.

---

## 3. REQUISITOS FUNCIONAIS

### 3.1 Funcionalidades gerais

- Catálogo público.
- Landing page da loja.
- Login e autenticação do proprietário.
- Um único usuário por loja.
- Estrutura multiempresa.
- Isolamento de dados entre lojas.
- Upload e gerenciamento de imagens.
- Busca e filtros.
- Painel administrativo.
- Personalização da identidade visual.
- Contato pelo WhatsApp.
- Analytics simples de produtos.
- Ranking de produtos.
- Filtros de período nos indicadores.

### 3.2 Catálogo público

O catálogo público deverá possuir:

- Layout responsivo e mobile-first.
- Página inicial com apresentação da marca.
- Banner principal.
- Categorias em destaque.
- Coleções em destaque.
- Lançamentos.
- Produtos em destaque.
- Listagem de produtos.
- Busca por nome.
- Filtros por categoria, coleção, modelo, cor e disponibilidade.
- Página individual para cada produto.
- Galeria com várias fotos.
- Nome do produto.
- Descrição.
- Preço.
- Materiais.
- Medidas.
- Cores.
- Tamanhos.
- Variações.
- Disponibilidade.
- Botão de contato pelo WhatsApp.
- Links para as redes sociais.
- Metadados para SEO e compartilhamento.

### 3.3 Status dos produtos

Cada produto deverá possuir um dos seguintes status:

#### Disponível

- Deve aparecer normalmente no catálogo.
- Deve permitir a seleção das variações disponíveis.
- Botão: "Quero esta bolsa".
- A mensagem do WhatsApp deverá demonstrar interesse na compra.

#### Sob encomenda

- Deve aparecer com identificação clara.
- Botão: "Encomendar esta bolsa".
- A mensagem deverá solicitar informações sobre prazo, produção e personalização.

#### Esgotado

- Pode permanecer visível.
- Deve possuir identificação de indisponibilidade.
- Botão: "Consultar disponibilidade".
- A mensagem deverá perguntar sobre reposição ou possibilidade de encomenda.

#### Inativo ou arquivado

- Não deve aparecer no catálogo público.
- Não deve ser indexado.
- Deve permanecer acessível somente no painel administrativo.

### 3.4 Página individual do produto

A página deverá apresentar:

- Nome do produto.
- Galeria de imagens.
- Imagem principal.
- Descrição.
- Preço base.
- Materiais.
- Medidas.
- Status.
- Categoria.
- Coleção.
- Cores disponíveis.
- Tamanhos disponíveis.
- Outras variações.
- Botão do WhatsApp.
- Produtos relacionados, quando aplicável.

### 3.5 Preços e variações

Cada produto terá um preço base.

Uma variação poderá possuir um preço específico opcional.

Regras:

- Sem preço próprio, a variação utiliza o preço base.
- Com preço próprio, o valor substitui o preço base.
- Não utilizar acréscimos ou cálculos de diferença no MVP.
- Quando existirem preços diferentes, o card poderá exibir "A partir de R$ XX,XX".
- O preço deverá ser atualizado ao selecionar a variação.
- Variações esgotadas deverão aparecer desabilitadas.

### 3.6 Integração com WhatsApp

O botão deverá utilizar um link com mensagem predefinida.

A mensagem deverá incluir:

- Nome da loja.
- Nome do produto.
- Variação selecionada.
- Link da página do produto.
- Texto adequado ao status.

Exemplo:

"Olá! Tenho interesse na Bolsa Florence, cor Topázio. Vi o produto no catálogo da Blessing Collection: [link]"

Não utilizar API oficial ou serviço externo de WhatsApp no MVP.

### 3.7 Painel administrativo

O painel deverá permitir que a proprietária:

- Realize login.
- Visualize os produtos da própria loja.
- Cadastre produtos.
- Edite produtos.
- Destaque produtos.
- Defina lançamentos.
- Altere a ordem de exibição.
- Arquive produtos.
- Restaure produtos arquivados.
- Desative produtos.
- Gerencie categorias.
- Gerencie coleções.
- Gerencie modelos.
- Gerencie variações.
- Envie imagens.
- Defina a imagem principal.
- Reordene imagens.
- Configure o nome da loja.
- Configure a descrição da marca.
- Envie o logotipo.
- Configure as cores.
- Configure o WhatsApp.
- Configure as redes sociais.
- Consulte indicadores de acesso.
- Consulte rankings de produtos.
- Filtre indicadores por período.

Não haverá exclusão definitiva de produtos, categorias, coleções ou da loja pelo painel no MVP.

### 3.8 Estrutura multiempresa

- Cada loja terá um identificador próprio.
- Cada loja terá um slug único.
- Cada loja terá exatamente um usuário proprietário.
- Cada usuário poderá administrar somente a própria loja.
- Todos os dados deverão estar vinculados a uma loja.
- Os dados de uma loja não poderão ser acessados por outra.
- O isolamento deverá ser garantido por Row Level Security.
- Os eventos de analytics também deverão ser isolados por loja.
- Não implementar colaboradores.
- Não implementar convites.
- Não implementar múltiplos usuários por loja.
- Não implementar permissões granulares.
- Não implementar RBAC.
- Não implementar painel geral da plataforma no MVP.

---

## 4. TIPOS DE USUÁRIOS

### 4.1 Visitante/Cliente

Pessoa que acessa o catálogo público sem criar uma conta.

Pode:

- Visualizar produtos.
- Navegar pelas categorias e coleções.
- Pesquisar produtos.
- Aplicar filtros.
- Consultar fotos, preços, medidas, materiais e variações.
- Verificar a disponibilidade.
- Compartilhar o link de um produto.
- Entrar em contato pelo WhatsApp.

Não possui acesso ao painel administrativo ou aos relatórios.

### 4.2 Proprietária da Loja

Única usuária administrativa da loja.

Pode:

- Realizar login.
- Acessar o painel.
- Configurar a identidade visual.
- Alterar logotipo, descrição e cores.
- Configurar WhatsApp e redes sociais.
- Cadastrar e editar produtos.
- Destacar e ordenar produtos.
- Arquivar e restaurar produtos.
- Gerenciar categorias, coleções, modelos e variações.
- Enviar e organizar imagens.
- Consultar analytics e rankings da própria loja.

Cada loja poderá possuir somente uma proprietária no MVP.

### 4.3 Administrador da Plataforma — Futuro

O futuro SaaS poderá possuir um administrador geral responsável por lojas, planos e configurações globais.

Esse perfil não será implementado no MVP.

Não criar agora:

- Painel geral da plataforma.
- Rotas administrativas globais.
- Gerenciamento de planos.
- Comparação de métricas entre lojas.
- Acesso aos analytics de outras lojas.
- Cadastro público de novas lojas.

---

## 5. ESCOPO DO MVP

### 5.1 Incluído no MVP

- Catálogo público da Blessing Collection.
- Página inicial.
- Apresentação da marca.
- Categorias e coleções.
- Produtos em destaque.
- Lançamentos.
- Listagem de produtos.
- Página individual do produto.
- Busca e filtros.
- Galeria de imagens.
- Variações.
- Status e disponibilidade.
- Contato pelo WhatsApp.
- Login da proprietária.
- Painel administrativo.
- Cadastro e edição de produtos.
- Upload e organização de imagens.
- Configuração da identidade visual.
- Configuração do WhatsApp e redes sociais.
- Estrutura multiempresa.
- Um único proprietário por loja.
- Row Level Security.
- SEO básico.
- Layout responsivo.
- Registro anônimo de visualizações.
- Registro de cliques no WhatsApp.
- Dashboard simples de analytics.
- Ranking de produtos.
- Ranking de categorias e coleções.
- Filtros por período.
- Taxa de interesse por produto.

### 5.2 Fora do MVP

- Colaboradores.
- Múltiplos usuários por loja.
- Convites por e-mail.
- Permissões granulares.
- RBAC.
- Gerenciamento de usuários.
- Carrinho de compras.
- Pagamento online.
- Cálculo de frete.
- Controle financeiro.
- Controle avançado de estoque.
- Chat interno.
- Notificações automáticas.
- Cadastro público de novas lojas.
- Onboarding automático.
- Planos e assinaturas.
- Stripe.
- Painel completo do administrador da plataforma.
- Aplicativo móvel nativo.
- API oficial do WhatsApp.
- Integrações com marketplaces.
- Google Analytics.
- Mapas de calor.
- Identificação pessoal dos visitantes.
- Rastreamento de IP.
- Funil completo de vendas.
- Rastreamento de vendas concluídas.
- Relatórios personalizados.
- Exportação para PDF ou Excel.
- Comparação de resultados entre lojas.
- Inteligência artificial para analisar métricas.

---

## 6. ANALYTICS E RELATÓRIO SIMPLES

### 6.1 Objetivo

Registrar dados básicos e anônimos para ajudar a proprietária a entender quais produtos despertam mais atenção e geram mais contatos.

As métricas representam interesse, não confirmação de venda.

### 6.2 Eventos registrados

- Visualização da página de um produto.
- Clique no botão do WhatsApp.
- Visualização de uma categoria.
- Visualização de uma coleção.

Tipos iniciais:

- `product_view`
- `whatsapp_click`
- `category_view`
- `collection_view`

### 6.3 Indicadores do painel

O dashboard deverá exibir:

- Total de visualizações de produtos.
- Total de cliques no WhatsApp.
- Taxa geral de interesse.
- Produto mais visualizado.
- Produto com mais cliques no WhatsApp.
- Categoria mais acessada.
- Coleção mais acessada.

### 6.4 Rankings

Criar rankings de:

- Produtos mais visualizados.
- Produtos com mais cliques no WhatsApp.
- Produtos com maior taxa de interesse.
- Categorias mais acessadas.
- Coleções mais acessadas.
- Lançamentos mais visualizados.

Cada ranking deverá apresentar:

- Posição.
- Nome.
- Imagem, quando aplicável.
- Número de visualizações.
- Número de cliques.
- Taxa de interesse.

### 6.5 Filtros de período

Períodos disponíveis:

- Últimos 7 dias.
- Últimos 30 dias.
- Últimos 90 dias.
- Período total.

Não implementar seleção de intervalo personalizado no MVP.

### 6.6 Taxa de interesse

A taxa deverá ser calculada por:

`cliques no WhatsApp ÷ visualizações do produto × 100`

Regras:

- Quando não houver visualizações, a taxa deverá ser 0%.
- A taxa não representa venda concluída.
- A interface deverá deixar claro que se trata de interesse.

### 6.7 Privacidade

- Não armazenar nome do visitante.
- Não armazenar telefone.
- Não armazenar e-mail.
- Não armazenar endereço IP.
- Não tentar identificar individualmente a cliente.
- Utilizar identificador anônimo de sessão apenas quando necessário para reduzir duplicidades.
- Não compartilhar dados entre lojas.
- Respeitar os princípios da LGPD.
- O registro de analytics não poderá impedir a navegação.
- Se o registro falhar, a página deverá continuar funcionando normalmente.

### 6.8 Limites

O relatório simples não terá:

- Exportação para PDF.
- Exportação para Excel.
- Identificação de visitantes.
- Histórico individual de navegação.
- Funil de vendas.
- Confirmação de venda.
- Valor faturado.
- Mapas de calor.
- Comparação entre lojas.
- Integração com Google Analytics.
- IA para análise dos indicadores.

---

## 7. STACK TECNOLÓGICA

### 7.1 Tecnologias principais

- Next.js.
- React.
- TypeScript.
- Node.js.
- Tailwind CSS.
- shadcn/ui.
- Supabase.
- PostgreSQL.
- Git.
- GitHub.
- Vercel.
- Claude Code.

### 7.2 Frontend

- Next.js com App Router.
- React Server Components quando apropriado.
- Client Components quando houver interatividade.
- TypeScript em modo estrito.
- Tailwind CSS.
- shadcn/ui.
- React Hook Form.
- Zod.
- Interface mobile-first.
- Componentes acessíveis.
- `next/image` para imagens.

### 7.3 Backend e banco

- Supabase PostgreSQL.
- Supabase Auth.
- Supabase Storage.
- Supabase JS.
- Row Level Security.
- Migrations SQL versionadas.
- Validações no servidor.
- Consultas agregadas para analytics.
- Índices adequados para os eventos.

Não utilizar Prisma ou outro ORM sem justificativa aprovada.

### 7.4 Hospedagem

- GitHub para versionamento.
- Branch principal `main`.
- Vercel para hospedagem.
- Deploy automático conectado ao GitHub.
- Ambientes separados de desenvolvimento e produção.
- Variáveis de ambiente separadas.
- Credenciais privadas fora do GitHub.

---

## 8. LINGUAGEM VISUAL

### 8.1 Direção visual

O catálogo deverá transmitir:

- Elegância.
- Exclusividade.
- Cuidado artesanal.
- Qualidade.
- Proximidade.
- Desejo de compra.

A aparência deverá ser premium e feminina, com espaço em branco, fotografias grandes e poucos elementos competindo com os produtos.

### 8.2 Referências

- Arezzo e Schutz: apresentação sofisticada e fotografias em destaque.
- Zara Home: composição editorial e espaços vazios.
- Marcas artesanais autorais: autenticidade e valorização dos materiais.
- Pinterest e editoriais de moda: inspiração para fotografia e coleções.

Não copiar layouts, textos, imagens ou identidade visual.

### 8.3 Aplicação visual

- Layout mobile-first.
- Interface limpa.
- Paleta baseada nas cores da Blessing Collection.
- Tons neutros.
- Tipografia elegante e legível.
- Fotografias grandes.
- Cards minimalistas.
- Botões do WhatsApp visíveis.
- Animações discretas.
- Sombras sutis.
- Navegação simples.
- Painel administrativo funcional.
- Dashboard de analytics simples e legível.
- Gráficos somente quando melhorarem a interpretação.
- Rankings apresentados preferencialmente em listas ou tabelas.

### 8.4 Evitar

- Template genérico.
- Excesso de cores.
- Fundos escuros.
- Aparência tecnológica.
- Efeitos exagerados.
- Gráficos desnecessários.
- Dashboard visualmente poluído.
- Carrosséis automáticos rápidos.
- Excesso de textos sobre imagens.

---

## 9. ROTAS DA APLICAÇÃO

### 9.1 Rotas públicas

- `/`
- `/produtos`
- `/produtos/[productSlug]`
- `/categorias/[categorySlug]`
- `/colecoes/[collectionSlug]`

A tabela de lojas terá um slug único, mas o slug não aparecerá na URL pública do MVP.

A loja ativa será identificada por configuração segura do ambiente.

### 9.2 Rotas administrativas

- `/login`
- `/admin`
- `/admin/produtos`
- `/admin/produtos/novo`
- `/admin/produtos/[id]/editar`
- `/admin/categorias`
- `/admin/colecoes`
- `/admin/analytics`
- `/admin/configuracoes`

Todas as rotas administrativas deverão exigir autenticação.

---

## 10. FLUXOS PRINCIPAIS

### 10.1 Fluxo da cliente

1. Acessa o catálogo.
2. Visualiza destaques ou escolhe uma categoria.
3. Pesquisa ou aplica filtros.
4. Abre um produto.
5. Visualiza fotos, preço, descrição e disponibilidade.
6. Seleciona uma variação.
7. Clica no botão do WhatsApp.
8. É direcionada para uma conversa com mensagem preenchida.
9. Continua o atendimento com a loja.

### 10.2 Fluxo da proprietária

1. Acessa `/login`.
2. Informa suas credenciais.
3. Entra no painel.
4. Visualiza os produtos da própria loja.
5. Cadastra ou edita um produto.
6. Preenche as informações.
7. Define status e variações.
8. Envia imagens.
9. Define a imagem principal.
10. Salva e publica.
11. Confere o catálogo público.

### 10.3 Fluxo de analytics

1. A proprietária acessa `/admin/analytics`.
2. Seleciona um período.
3. Visualiza os indicadores gerais.
4. Consulta os produtos mais visualizados.
5. Consulta os produtos com mais cliques.
6. Compara visualizações e taxa de interesse.
7. Identifica categorias e coleções mais acessadas.

---

## 11. MODELO INICIAL DE DADOS

### 11.1 `profiles`

- `id`, relacionado a `auth.users.id`.
- Nome.
- Foto opcional.
- Datas de criação e atualização.

### 11.2 `stores`

- Identificador.
- `owner_user_id`, relacionado a `auth.users.id`.
- Nome.
- Slug único.
- Descrição.
- Logotipo.
- Cor principal.
- Cor secundária.
- WhatsApp.
- Instagram.
- Outras redes sociais.
- Status.
- Datas de criação e atualização.

Regras:

- Cada loja terá exatamente um proprietário.
- Cada usuário terá somente uma loja no MVP.
- Não criar `store_members`.

### 11.3 `categories`

- Identificador.
- Loja.
- Nome.
- Slug.
- Descrição.
- Imagem opcional.
- Ordem.
- Status.
- Datas de criação e atualização.

### 11.4 `collections`

- Identificador.
- Loja.
- Nome.
- Slug.
- Descrição.
- Imagem opcional.
- Ordem.
- Status.
- Datas de criação e atualização.

### 11.5 `products`

- Identificador.
- Loja.
- Categoria.
- Coleção opcional.
- Nome.
- Slug.
- Descrição em texto simples.
- Preço base.
- Materiais.
- Medidas.
- Status.
- Produto em destaque.
- Lançamento.
- Ordem.
- Título de SEO.
- Descrição de SEO.
- Data de arquivamento.
- Datas de criação e atualização.

### 11.6 `product_images`

- Identificador.
- Produto.
- Caminho no Storage.
- Texto alternativo.
- Ordem.
- Indicação de imagem principal.
- Datas de criação e atualização.

### 11.7 `product_variants`

- Identificador.
- Produto.
- Nome.
- Cor.
- Tamanho.
- Código interno opcional.
- Preço específico opcional.
- Status.
- Ordem.
- Datas de criação e atualização.

### 11.8 `analytics_events`

- Identificador.
- Loja.
- Produto opcional.
- Categoria opcional.
- Coleção opcional.
- Tipo do evento.
- Identificador anônimo da sessão opcional.
- Data e horário.

Índices necessários:

- Loja e data.
- Loja e tipo do evento.
- Produto e data.
- Categoria e data.
- Coleção e data.

A estratégia definitiva de consulta e agregação deverá evitar consultas caras e complexidade prematura.

---

## 12. AUTENTICAÇÃO E SEGURANÇA

### 12.1 Autenticação

- Utilizar Supabase Auth.
- Somente a proprietária terá login.
- Visitantes não precisam de conta.
- Não implementar cadastro público de lojas.
- A conta inicial poderá ser criada durante a configuração.

### 12.2 Row Level Security

A tabela `stores` deverá permitir operações administrativas somente quando:

`auth.uid() = owner_user_id`

As tabelas relacionadas deverão verificar se o usuário autenticado é proprietário da loja correspondente.

Regras:

- A proprietária acessa somente a própria loja.
- Visitantes consultam somente conteúdos públicos e ativos.
- Eventos e relatórios ficam isolados por loja.
- Visitantes podem registrar somente eventos válidos e com campos limitados.
- Visitantes não podem consultar a tabela bruta de eventos.
- O dashboard de analytics exige autenticação.
- A segurança não pode depender apenas do frontend.
- RLS não pode ser desativada.

### 12.3 Credenciais

- Chaves privadas não podem ir para o navegador.
- Chaves privadas não podem ser armazenadas no GitHub.
- `service_role_key` não pode ser usada no frontend.
- Variáveis sensíveis permanecem no servidor.
- Erros não podem expor informações sensíveis.

### 12.4 Privacidade do analytics

- Não registrar IP.
- Não registrar dados pessoais.
- Não utilizar fingerprinting.
- Não utilizar identificadores permanentes.
- Não registrar conteúdo de mensagens do WhatsApp.
- Não registrar número de telefone da cliente.
- Não tentar identificar quem realizou o clique.
- Definir política de retenção dos eventos antes da produção.

---

## 13. REGRAS PARA IMAGENS

### 13.1 Produtos

- Máximo de 8 imagens por produto.
- Máximo de 5 MB por imagem.
- Formatos:
  - JPEG.
  - PNG.
  - WebP.
- Permitir imagem principal.
- Permitir reordenação.
- Utilizar lazy loading.
- Utilizar `next/image`.
- Não utilizar transformações pagas do Supabase.
- Não aceitar SVG ou GIF.

### 13.2 Logotipo

- Máximo de 2 MB.
- Formatos:
  - JPEG.
  - PNG.
  - WebP.
- Não aceitar SVG no MVP.

---

## 14. PAGINAÇÃO E CARREGAMENTO

- Consultas ao Supabase devem ser paginadas.
- Não carregar todos os produtos.
- Exibir inicialmente 12 produtos.
- Utilizar botão "Carregar mais".
- Manter busca e filtros.
- Exibir carregamento.
- Exibir estado vazio.
- Evitar consultas desnecessárias.

Os rankings do dashboard poderão exibir inicialmente os 10 primeiros resultados.

---

## 15. REQUISITOS NÃO FUNCIONAIS

- Interface mobile-first.
- Compatibilidade com navegadores modernos.
- Navegação por teclado.
- Contraste adequado.
- Imagens com texto alternativo.
- Formulários com rótulos.
- Validações claras.
- Carregamento otimizado.
- Páginas indexáveis.
- SEO.
- URLs amigáveis.
- TypeScript estrito.
- Componentes reutilizáveis.
- Tratamento de erros.
- Analytics não pode bloquear a navegação.
- Falha no registro de evento não pode impedir o acesso ao produto.
- Consultas do relatório devem ser eficientes.
- Nenhuma funcionalidade fora do MVP sem aprovação.

---

## 16. CRITÉRIOS DE ACEITE

- O catálogo funciona em celular, tablet e desktop.
- Visitantes acessam sem conta.
- A busca e os filtros funcionam.
- Cada produto possui URL própria.
- Produtos aceitam várias imagens.
- Produtos inativos não aparecem.
- Produtos esgotados possuem identificação.
- O botão do WhatsApp abre a mensagem correta.
- A proprietária consegue realizar login.
- A proprietária consegue administrar o catálogo.
- Usuários não autenticados não acessam o painel.
- Uma loja não acessa dados de outra.
- RLS bloqueia acessos indevidos.
- Credenciais privadas não aparecem no frontend.
- Visualizações de produtos são registradas.
- Cliques no WhatsApp são registrados.
- O dashboard apresenta totais corretos.
- Rankings respeitam o período selecionado.
- A taxa de interesse é calculada corretamente.
- O relatório não exibe dados pessoais.
- Falhas no analytics não bloqueiam o catálogo.
- Não existem erros críticos no build.

---

## 17. TESTES

### 17.1 Ferramentas

- Vitest.
- React Testing Library.
- Playwright.

### 17.2 Testes mínimos

1. Visitante acessa o catálogo.
2. Visitante abre um produto.
3. Visualização é registrada.
4. Clique no WhatsApp é registrado.
5. O WhatsApp abre corretamente.
6. Proprietária realiza login.
7. Proprietária cadastra um produto.
8. Produto inativo não aparece.
9. Usuário não autenticado não acessa o painel.
10. Uma loja não acessa dados de outra.
11. O dashboard exige autenticação.
12. Rankings respeitam o período.
13. Taxa de interesse é calculada corretamente.
14. Evento inválido é rejeitado.
15. Falha no registro de evento não quebra a página.

Não exigir percentual fixo de cobertura no MVP.

---

## 18. MILESTONES DE DESENVOLVIMENTO

### Milestone 1 — Planejamento

- Analisar o PRD.
- Identificar dúvidas e riscos.
- Criar proposta de `PLAN.md`.
- Propor arquitetura.
- Propor modelo de dados.
- Propor políticas RLS.
- Definir rotas.
- Aguardar aprovação.

### Milestone 2 — Base do projeto

- Configurar Next.js.
- Configurar TypeScript.
- Configurar Tailwind CSS.
- Configurar shadcn/ui.
- Criar layouts.
- Configurar variáveis de ambiente.
- Garantir o build.

### Milestone 3 — Supabase e segurança

- Criar migrations.
- Criar tabelas.
- Configurar autenticação.
- Configurar RLS.
- Configurar Storage.
- Criar loja e proprietária iniciais.
- Testar isolamento.

### Milestone 4 — Catálogo público

- Criar página inicial.
- Criar categorias e coleções.
- Criar listagem.
- Criar busca e filtros.
- Criar página do produto.
- Criar galeria.
- Criar variações.
- Criar botão do WhatsApp.
- Implementar SEO e responsividade.

### Milestone 5 — Painel administrativo

- Criar login.
- Proteger rotas.
- Criar painel.
- Criar cadastro e edição de produtos.
- Criar categorias e coleções.
- Criar variações.
- Criar upload de imagens.
- Criar configurações da loja.

### Milestone 6 — Analytics simples

- Criar registro anônimo de eventos.
- Registrar visualizações.
- Registrar cliques no WhatsApp.
- Registrar acessos de categorias e coleções.
- Criar indicadores gerais.
- Criar rankings.
- Criar taxa de interesse.
- Criar filtros de período.
- Aplicar isolamento por loja.
- Testar privacidade.
- Garantir que falhas não bloqueiem o catálogo.

### Milestone 7 — Qualidade e publicação

- Revisar segurança.
- Revisar código.
- Executar testes.
- Testar responsividade.
- Testar acessibilidade.
- Corrigir erros.
- Configurar Vercel.
- Publicar.
- Validar produção.

Cada milestone deverá gerar uma entrega funcional. Não avançar com erros críticos.

---

## 19. REGRAS PARA O CLAUDE CODE

- Ler integralmente este documento.
- Não implementar tudo de uma vez.
- Criar e manter `PLAN.md`.
- Explicar decisões importantes.
- Solicitar aprovação para mudanças de escopo.
- Não adicionar bibliotecas sem necessidade.
- Não implementar recursos fora do MVP.
- Utilizar migrations.
- Nunca expor credenciais.
- Não desativar RLS.
- Testar cada milestone.
- Documentar decisões.
- Fazer commits pequenos.
- Não implementar colaboradores.
- Não implementar múltiplos usuários.
- Não implementar permissões granulares.
- Não implementar relatórios avançados.
- Não armazenar dados pessoais nos eventos.
- Não transformar o analytics simples em uma plataforma completa de BI.
- Não iniciar o desenvolvimento antes da aprovação do planejamento.

---

## 20. INSTRUÇÃO INICIAL PARA O CLAUDE CODE

Leia integralmente este PRD e trate-o como a fonte oficial dos requisitos.

Neste primeiro momento:

- Não escreva código.
- Não instale dependências.
- Não configure o Supabase.
- Não altere arquivos do repositório.

Sua tarefa é:

1. Resumir o produto e o MVP.
2. Identificar contradições e lacunas.
3. Apontar riscos técnicos e de segurança.
4. Propor a arquitetura.
5. Propor o modelo inicial do banco.
6. Propor as políticas de Row Level Security.
7. Definir as rotas.
8. Propor a estratégia de analytics sem dados pessoais.
9. Dividir o desenvolvimento em milestones.
10. Informar quais Skills serão utilizadas.
11. Apresentar a proposta do `PLAN.md`.

Não crie ou altere arquivos antes da minha aprovação.

Após apresentar o planejamento, pare e aguarde minhas instruções.

---

> PRD da Blessing Collection preparado para desenvolvimento assistido pelo Claude Code.
