# Plano: compras e estoque de insumos, contas a pagar, fluxo de caixa e funil de vendas

Status: **aprovado em 24/10/2026** com as recomendações da seção 9. Em implementação por fases (milestones M18 a M22 no `PLAN.md`).

Escrito para: a dona do produto (decisão de escopo) e para quem for implementar.

## 1. O sistema está preparado?

**Sim, a base está boa**, com três cuidados que viram trabalho da fase 2 (seção 7).

O que já existe e será reaproveitado:

| Já existe | Para quê vai servir |
|---|---|
| Catálogo de materiais (`materials`: nome, unidade, custo) | É o cadastro dos insumos controlados (fios, fechos, alças…) |
| Receita por peça (`product_materials`, ligada ao catálogo) | Diz quanto de cada insumo a peça consome. A migration 0019 já vinculou ao catálogo os materiais antigos |
| Lista de produção do pedido (`calculateProductionList`) | Já soma o que cada pedido consome, por material. É a base exata da baixa de estoque |
| "Materiais a comprar" no resumo de pedidos | Passa a descontar o que já está em estoque |
| Pedidos com status (orçamento → entregue), sinal e saldo com data de pagamento | Origem das **entradas** do fluxo de caixa e dos gatilhos do estoque |
| Clientes, formas de pagamento, painel financeiro de pedidos | Reaproveitados no caixa e no funil |
| RLS "só a dona", `store_id` em tudo, componentes do painel (`FormFooter`, `ConfirmDialog`, `PageSection`, `EmptyState`), Ajuda e menu em grupos | Padrão pronto para as telas novas |

## 2. Decisão de escopo (registrar)

O PRD (seção 5.2) deixou **fora do MVP** o controle financeiro e o controle de estoque. A migration 0025 (pedidos) já registrou isso como extensão aprovada e disse que não havia contas a pagar, fluxo de caixa nem baixa de insumo. Este plano é uma **nova extensão de escopo**, pedida em 24/10/2026. Aprovado e registrado no `PLAN.md` como milestones **M18 a M22**.

## 3. Módulos e telas

**A. Compras (histórico de compras de insumos)**
- Lançar compra: data, fornecedor (texto com sugestões das compras anteriores), itens (material, quantidade, valor pago), frete, forma de pagamento (à vista, a prazo, parcelado).
- Lista de compras com filtro por período, fornecedor e material.
- Por material: histórico de preços pagos (evolução do custo) e fornecedores.

**B. Estoque básico**
- Lista de materiais com: saldo, unidade, custo atual, estoque mínimo, alerta de "acabando".
- Contagem/ajuste manual (estoque inicial, inventário, perdas).
- Extrato por material (compras, baixas por pedido, ajustes).
- Controle **gradual**: só materiais marcados "controlar estoque" entram na baixa automática.

**C. Contas a pagar e fluxo de caixa**
- Contas a pagar: descrição, categoria (insumos, embalagem, frete, taxas, divulgação, outras), vencimento, valor, pago em, repetir todo mês. Vencidas, de hoje e a vencer em destaque.
- Compra a prazo ou parcelada gera as contas a pagar sozinha.
- Fluxo de caixa mensal: entradas (sinais e saldos de pedidos recebidos, mais outras entradas avulsas), saídas (contas pagas), saldo; e projeção de 30/60/90 dias com o que falta receber e pagar.

**D. Funil de vendas (básico)**
- Contatos (leads) lançados à mão: nome, telefone, origem (WhatsApp, Instagram, indicação, feira…), peça de interesse, valor estimado, próximo retorno, observações.
- Quadro por etapa: Novo contato → Conversando → Orçamento enviado → Fechado / Perdido (com motivo).
- Botão **"Virar pedido"**: cria a cliente (se for nova) e um pedido em orçamento já ligado ao contato.
- Resumo: contatos por etapa, taxa de fechamento, valor em negociação, motivos de perda, retornos de hoje e atrasados.
- Nota de privacidade: o catálogo continua sem identificar visitantes; os contatos só nascem do que a artesã lança.

## 4. Modelo de dados (novas tabelas, todas com `store_id` e RLS só da dona)

- `purchases` (data, fornecedor, frete, total, observações) e `purchase_items` (material, quantidade, valor pago; custo unitário = valor ÷ quantidade).
- `stock_movements` (livro-razão: material, tipo `compra | baixa | devolução | ajuste`, quantidade com sinal, custo unitário **no momento**, pedido/compra de origem). Saldo = soma dos movimentos.
- Em `materials`: `track_stock` (controlar estoque) e `min_stock` (alerta).
- Em `orders`: `stock_consumed_at` (marca se a baixa já foi feita; garante que não baixa duas vezes).
- `payables` (descrição, categoria, fornecedor, vencimento, valor, pago em, repetição, compra de origem) e `cash_incomes` (outras entradas avulsas). Saldo inicial do caixa em `store_private`.
- `leads` (contato, origem, interesse, etapa, valor estimado, retorno, motivo de perda, pedido gerado) e `lead_events` (histórico de mudança de etapa, para medir tempo e conversão).

Tudo é tabela nova: **nenhum dado existente é alterado ou apagado**. Cada fase tem sua migration (a partir da 0044, em ordem).

## 5. Regras de negócio

1. **Baixa de estoque:** ao mover o pedido para **Em produção**, desconta, de cada material controlado, a quantidade da lista de produção (receita × quantidade pedida). Isso é feito **dentro do banco, em uma única operação** junto com a troca de status, para nunca ficar pela metade.
2. **Voltar** o pedido para Orçamento ou Confirmado devolve os insumos (uma vez só). **Cancelar** um pedido já em produção **pergunta** se os insumos voltam (pode ter sido usado de fato).
3. **Estoque negativo é permitido**, com aviso ("faltam 200 g de fio X"): a produção nunca é bloqueada por erro de cadastro. Ao iniciar a produção, o painel avisa o que falta.
4. **Custo real do pedido:** cada baixa guarda o custo do insumo naquele dia, então o pedido mostra o **custo de insumos usados e a margem real**, mesmo que o preço do fio mude depois.
5. **Custo do material ao comprar:** ao lançar a compra, a tela mostra a diferença para o custo cadastrado e pergunta se atualiza o custo do material (isso muda a sugestão de preço das peças que usam o material, por isso é uma pergunta explícita, nunca automática).
6. **Material avulso** (digitado à mão na peça, sem ligação ao catálogo) **não baixa estoque**: a tela avisa isso na peça.
7. **Caixa por data de pagamento** (regime de caixa): conta como entrada o que foi **recebido** (data do sinal/saldo) e como saída o que foi **pago**. Valores brutos; a taxa da maquininha fica para depois.
8. Excluir = arquivar (regra do projeto); compras e baixas erradas se corrigem por **ajuste**, nunca apagando o histórico.

## 6. Fases (cada uma vai ao ar e é validada antes da próxima)

| Fase | Entrega | Banco | Esforço |
|---|---|---|---|
| **F1** | Compras + estoque (lançar compra, saldo, extrato, estoque mínimo, ajuste, histórico de preços) | migrations de compras e movimentos | médio |
| **F2** | Baixa automática por pedido em produção, aviso de falta, custo e margem do pedido, "Materiais a comprar" descontando o estoque | função `set_order_status` (atômica) + coluna em `orders` | médio (a mais delicada) |
| **F3** | Contas a pagar + fluxo de caixa + projeção; compra a prazo gera contas | `payables`, `cash_incomes` | médio |
| **F4** | Funil de vendas (quadro, resumo, virar pedido) | `leads`, `lead_events` | pequeno a médio |
| **F5** | Acabamento: cartões no Dashboard (a pagar hoje, estoque baixo, retornos de hoje), roteiros da Ajuda, menu | nenhum | pequeno |

Menu novo (grupos): **Estoque e compras** (Estoque, Compras), **Financeiro** (Contas a pagar, Fluxo de caixa), **Vendas** (Funil).

Qualidade por fase: testes dos cálculos puros (baixa, saldo, caixa, funil), 1 a 3 testes críticos por fase (como manda o CLAUDE.md), `tsc`, lint, build, e a **auditoria de segurança do Supabase** depois de cada migration (tabelas novas = RLS obrigatória). Você aplica cada migration no Supabase antes de eu subir o código que depende dela.

## 7. Os três cuidados da base

1. **Atomicidade:** hoje a troca de status é uma gravação simples. A baixa precisa ser feita por uma função no banco (uma transação), senão uma falha no meio deixaria status e estoque desencontrados.
2. **Unidades:** a receita da peça e o estoque precisam estar na **mesma unidade** (ex.: fio em gramas). Quem compra "1 novelo de 200 g" precisa de uma ajuda na tela de compra (calculadora de embalagem). Sem conversão automática de unidades na v1.
3. **Receitas incompletas:** a baixa só é tão boa quanto a receita (`product_materials`). Peças sem receita não baixam nada; vou mostrar na lista "peças sem materiais cadastrados" para facilitar a limpeza.

## 8. Fora da v1 (de propósito)

Notas fiscais e contabilidade, conciliação bancária, múltiplos caixas/contas, taxa de maquininha no caixa, conversão automática de unidades, fornecedores como cadastro completo, importação de extrato, automação de contatos por WhatsApp, e vários usuários (regra do projeto: um usuário por loja).

## 9. Decisões que preciso de você

Marque ok para as recomendações ou diga o que muda:

1. **Quando baixar:** ao ir para *Em produção* (recomendado), ou ao *Confirmar* o pedido?
2. **Cancelar pedido em produção:** perguntar se devolve os insumos (recomendado) ou nunca devolver?
3. **Estoque negativo:** permitir com aviso (recomendado) ou bloquear a produção?
4. **Custo ao comprar:** perguntar a cada compra se atualiza o custo do material (recomendado).
5. **Controle gradual** por material, ligado por você (recomendado), ou todos de uma vez?
6. **Fornecedor** como texto com sugestões (recomendado) ou já como cadastro?
7. **Caixa** pelo que foi pago/recebido, em valor bruto (recomendado).
8. **Funil:** etapas Novo contato, Conversando, Orçamento enviado, Fechado, Perdido (recomendado), com contatos lançados à mão.
9. **Quem tem acesso:** todas as lojas com assinatura ativa (recomendado) ou só um plano específico?
10. **Ordem das fases:** F1 → F2 → F3 → F4 → F5 (recomendado), ou o funil primeiro?
