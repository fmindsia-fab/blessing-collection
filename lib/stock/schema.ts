import { z } from "zod";

// Validação (no servidor) do lançamento de uma compra de insumos. Os números chegam como texto do
// formulário; o banco ainda confere tudo de novo (checks e a função create_purchase).

export const purchaseItemSchema = z.object({
  materialId: z.uuid("Escolha o material de cada item."),
  quantity: z.coerce
    .number("Informe a quantidade.")
    .positive("A quantidade de cada item precisa ser maior que zero.")
    .max(1_000_000, "Quantidade grande demais."),
  totalCost: z.coerce
    .number("Informe o valor pago.")
    .min(0, "O valor pago não pode ser negativo.")
    .max(1_000_000, "Valor grande demais."),
  updateCost: z.boolean().default(false),
});

export const purchaseSchema = z.object({
  purchasedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Informe a data da compra."),
  supplier: z.string().trim().max(80, "O nome do fornecedor tem no máximo 80 letras.").optional(),
  freight: z.coerce.number("Informe o frete.").min(0, "O frete não pode ser negativo.").max(1_000_000).default(0),
  notes: z.string().trim().max(500, "As observações têm no máximo 500 letras.").optional(),
  items: z.array(purchaseItemSchema).min(1, "Adicione ao menos um item à compra.").max(50, "No máximo 50 itens por compra."),
});

export type PurchaseInput = z.infer<typeof purchaseSchema>;

export const adjustStockSchema = z.object({
  materialId: z.uuid("Material inválido."),
  quantity: z.coerce.number("Informe a quantidade.").min(0, "A quantidade não pode ser negativa.").max(10_000_000),
  note: z.string().trim().max(300, "A observação tem no máximo 300 letras.").optional(),
});

export const minStockSchema = z.object({
  materialId: z.uuid("Material inválido."),
  minStock: z.coerce.number().min(0, "O mínimo não pode ser negativo.").max(10_000_000).nullable(),
});
