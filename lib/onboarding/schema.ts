import { z } from "zod";
import { RESERVED_SLUGS } from "@/lib/store/reserved-slugs";
import { slugify as slugifyGeneric } from "@/lib/utils";

// Mesma forma de um subdomínio DNS válido: minúsculas, dígitos, hífen (nunca
// nas pontas), 3 a 63 caracteres — o limite técnico de um label de host.
const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{1,61}[a-z0-9])?$/;

export const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "Use pelo menos 3 caracteres")
  .max(63, "Use no máximo 63 caracteres")
  .regex(SLUG_PATTERN, "Use apenas letras minúsculas, números e hífen (não no início/fim)")
  .refine((slug) => !RESERVED_SLUGS.has(slug), "Este nome é reservado, escolha outro");

export const signupSchema = z.object({
  email: z.string().email("Informe um e-mail válido"),
  password: z.string().min(8, "A senha precisa ter pelo menos 8 caracteres"),
});

// Valida CPF pelos dois dígitos verificadores (rejeita também sequências
// repetidas como 111.111.111-11, que passam na conta mas não existem).
export function isValidCpf(digits: string): boolean {
  if (!/^\d{11}$/.test(digits) || /^(\d)\1{10}$/.test(digits)) return false;
  const check = (len: number) => {
    let sum = 0;
    for (let i = 0; i < len; i++) sum += Number(digits[i]) * (len + 1 - i);
    const rest = (sum * 10) % 11;
    return rest === 10 ? 0 : rest;
  };
  return check(9) === Number(digits[9]) && check(10) === Number(digits[10]);
}

export const createStoreSchema = z.object({
  ownerName: z.string().trim().min(3, "Informe seu nome completo"),
  ownerCpf: z
    .string()
    .trim()
    .transform((v) => v.replace(/\D/g, ""))
    .refine(isValidCpf, "Informe um CPF válido"),
  name: z.string().trim().min(2, "Informe o nome da loja"),
  slug: slugSchema,
  whatsappNumber: z
    .string()
    .trim()
    .transform((v) => v.replace(/\D/g, ""))
    .refine((v) => v.length >= 10, "Informe um número de WhatsApp válido"),
});

export type CreateStoreInput = z.infer<typeof createStoreSchema>;

// A sugestão inicial do slug, a partir do nome digitado — o usuário ainda
// pode editar livremente antes de confirmar. slugify() genérico não limita
// tamanho (serve para produtos); aqui truncamos no limite de um subdomínio.
export function slugify(name: string): string {
  return slugifyGeneric(name).slice(0, 63);
}
