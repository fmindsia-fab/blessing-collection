import { z } from "zod";

// Validação (no servidor) dos lançamentos financeiros. Os números chegam como texto do formulário;
// o banco confere tudo de novo (checks e funções).

const isoDate = (message: string) => z.string().regex(/^\d{4}-\d{2}-\d{2}$/, message);

const money = (required: string) =>
  z.coerce.number(required).positive("O valor precisa ser maior que zero.").max(10_000_000, "Valor grande demais.");

export const payableSchema = z.object({
  description: z.string().trim().min(1, "Diga o que é esta conta.").max(120, "A descrição tem no máximo 120 letras."),
  category: z.enum(["supplies", "packaging", "shipping", "fees", "marketing", "other"], "Escolha o tipo da conta."),
  supplier: z.string().trim().max(80, "O nome do fornecedor tem no máximo 80 letras.").optional(),
  dueDate: isoDate("Informe quando vence."),
  amount: money("Informe o valor."),
  recurrence: z.enum(["none", "monthly"]).default("none"),
});

export const cashIncomeSchema = z.object({
  description: z.string().trim().min(1, "Diga de onde veio o dinheiro.").max(120, "A descrição tem no máximo 120 letras."),
  amount: money("Informe o valor."),
  receivedAt: isoDate("Informe a data em que recebeu."),
});

export const cashOpeningSchema = z.object({
  amount: z.coerce.number("Informe o saldo.").min(-10_000_000).max(10_000_000),
  date: isoDate("Informe a data desse saldo."),
});

export const paymentDateSchema = isoDate("Data inválida.");

export const purchasePaymentSchema = z
  .object({
    mode: z.enum(["paid", "later"]).default("paid"),
    firstDue: isoDate("Informe quando vence a primeira parcela.").optional(),
    installments: z.coerce.number().int("Número de parcelas inválido.").min(1).max(24, "No máximo 24 parcelas.").default(1),
  })
  .refine((value) => value.mode === "paid" || value.firstDue, {
    message: "Informe quando vence a primeira parcela.",
    path: ["firstDue"],
  });
