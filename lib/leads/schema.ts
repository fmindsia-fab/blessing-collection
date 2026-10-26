import { z } from "zod";

// Validação (no servidor) dos contatos do funil. O banco confere de novo (checks e RLS).

const emptyToUndefined = (value: unknown) => (typeof value === "string" && value.trim() === "" ? undefined : value);

export const leadSchema = z.object({
  name: z.string().trim().min(1, "Informe o nome do contato.").max(80, "O nome tem no máximo 80 letras."),
  phone: z.preprocess(emptyToUndefined, z.string().trim().max(30, "O telefone tem no máximo 30 caracteres.").optional()),
  source: z.enum(["whatsapp", "instagram", "referral", "fair", "website", "other"], "Escolha de onde veio o contato."),
  interest: z.preprocess(emptyToUndefined, z.string().trim().max(200, "O interesse tem no máximo 200 letras.").optional()),
  estimatedValue: z.preprocess(
    (value) => (typeof value === "string" ? value.replace(",", ".").trim() || "0" : value),
    z.coerce.number("Informe um valor válido.").min(0, "O valor não pode ser negativo.").max(10_000_000, "Valor grande demais."),
  ),
  nextFollowup: z.preprocess(emptyToUndefined, z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data de retorno inválida.").optional()),
  notes: z.preprocess(emptyToUndefined, z.string().trim().max(1000, "As observações têm no máximo 1000 letras.").optional()),
});

export const stageSchema = z.object({
  stage: z.enum(["new", "talking", "quoted", "won", "lost"], "Etapa inválida."),
  lostReason: z.preprocess(emptyToUndefined, z.string().trim().max(200, "O motivo tem no máximo 200 letras.").optional()),
});
