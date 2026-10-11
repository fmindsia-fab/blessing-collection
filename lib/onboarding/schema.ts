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

export const createStoreSchema = z.object({
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
