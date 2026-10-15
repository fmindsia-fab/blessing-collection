import { z } from "zod";

// Perfil do ateliê para o futuro marketplace de divulgação: cidade, UF e tipo
// de artesanato. Dados públicos da loja (ficam em stores, não em profiles —
// CPF/CNPJ continua restrito ao dono). A lista de tipos cresce sem migration:
// a validação de valor conhecido é feita aqui, como nas fontes (ver 0010).

export const CRAFT_TYPES = [
  { value: "crochet", label: "Crochê" },
  { value: "knitting", label: "Tricô" },
  { value: "sewing", label: "Confecção e costura" },
  { value: "jewelry", label: "Semijoias e bijuterias" },
  { value: "embroidery", label: "Bordado" },
  { value: "macrame", label: "Macramê" },
  { value: "ceramics", label: "Cerâmica e porcelana" },
  { value: "candles", label: "Velas e aromas" },
  { value: "biscuit", label: "Biscuit" },
  { value: "stationery", label: "Papelaria personalizada" },
  { value: "woodwork", label: "Madeira e MDF" },
  { value: "resin", label: "Resina" },
  { value: "leather", label: "Couro" },
  { value: "painting", label: "Pintura e arte" },
  { value: "natural_cosmetics", label: "Sabonetes e cosméticos naturais" },
  { value: "natural_fibers", label: "Cestaria e fibras naturais" },
  { value: "other", label: "Outro" },
] as const;

export type CraftTypeValue = (typeof CRAFT_TYPES)[number]["value"];

const CRAFT_VALUES = CRAFT_TYPES.map((c) => c.value) as [CraftTypeValue, ...CraftTypeValue[]];

export const CRAFT_LABEL: Record<string, string> = Object.fromEntries(
  CRAFT_TYPES.map((c) => [c.value, c.label]),
);

export const BR_STATES = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA",
  "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
] as const;

export type BrState = (typeof BR_STATES)[number];

const MAX_CRAFT_TYPES = 8;

// Regra compartilhada: marcar "Outro" exige descrever qual.
export function requireOtherDescription(
  value: { craftTypes: string[]; craftOther?: string | null },
  ctx: z.RefinementCtx,
) {
  if (value.craftTypes.includes("other") && !value.craftOther?.trim()) {
    ctx.addIssue({
      code: "custom",
      path: ["craftOther"],
      message: "Conte qual é o seu tipo de artesanato",
    });
  }
}

// Cadastro: tudo obrigatório. Exportado como shape para ser composto no
// schema do cadastro (que aplica requireOtherDescription no objeto final).
export const craftProfileShape = {
  city: z.string().trim().min(2, "Informe a cidade").max(80, "Use no máximo 80 caracteres"),
  state: z.enum(BR_STATES, { message: "Selecione o estado" }),
  craftTypes: z
    .array(z.enum(CRAFT_VALUES))
    .min(1, "Selecione ao menos um tipo de artesanato")
    .max(MAX_CRAFT_TYPES, `Selecione no máximo ${MAX_CRAFT_TYPES} tipos`),
  craftOther: z.string().trim().max(60, "Use no máximo 60 caracteres").optional(),
};

// Configurações: lojas antigas não têm esses dados, então "tudo vazio" é
// aceito (não trava salvar cores/WhatsApp); preenchido pela metade não é.
export const craftProfileSettingsShape = {
  city: z.string().trim().max(80, "Use no máximo 80 caracteres"),
  state: z.union([z.enum(BR_STATES), z.literal("")]),
  craftTypes: z.array(z.enum(CRAFT_VALUES)).max(MAX_CRAFT_TYPES, `Selecione no máximo ${MAX_CRAFT_TYPES} tipos`),
  craftOther: z.string().trim().max(60, "Use no máximo 60 caracteres").optional(),
};

export function requireCompleteOrEmpty(
  value: { city: string; state: string; craftTypes: string[] },
  ctx: z.RefinementCtx,
) {
  const filled = [value.city !== "", value.state !== "", value.craftTypes.length > 0];
  if (filled.some(Boolean) && !filled.every(Boolean)) {
    ctx.addIssue({
      code: "custom",
      path: ["city"],
      message: "Preencha cidade, estado e tipo de artesanato (ou deixe os três em branco)",
    });
  }
}

// Normaliza o que vai para o banco: sem descrição de "Outro" quando a opção
// não está marcada, e sem lixo vazio.
export function toCraftProfileColumns(profile: {
  city: string;
  state: string;
  craftTypes: string[];
  craftOther?: string | null;
}) {
  const hasOther = profile.craftTypes.includes("other");
  return {
    city: profile.city || null,
    state: profile.state || null,
    craft_types: profile.craftTypes,
    craft_other: hasOther ? profile.craftOther?.trim() || null : null,
  };
}

// ---------- Extras do marketplace (migration 0035) ----------

export const YEARS_ACTIVE = [
  { value: "lt1", label: "Menos de 1 ano" },
  { value: "1to3", label: "1 a 3 anos" },
  { value: "3to5", label: "3 a 5 anos" },
  { value: "5to10", label: "5 a 10 anos" },
  { value: "gt10", label: "Mais de 10 anos" },
] as const;

export const YEARS_ACTIVE_LABEL: Record<string, string> = Object.fromEntries(
  YEARS_ACTIVE.map((y) => [y.value, y.label]),
);

const YEARS_VALUES = YEARS_ACTIVE.map((y) => y.value) as [
  (typeof YEARS_ACTIVE)[number]["value"],
  ...(typeof YEARS_ACTIVE)[number]["value"][],
];

// "yes" | "no" | "" (não informado) -> true | false | null.
const triState = z
  .union([z.enum(["yes", "no"]), z.literal("")])
  .optional()
  .transform((v) => (v === undefined || v === "" ? null : v === "yes"));

// Opcionais por design: pedir demais no cadastro derruba a conversão.
export const marketplaceExtrasShape = {
  acceptsCustomOrders: triState,
  shipsNationwide: triState,
  yearsActive: z
    .union([z.enum(YEARS_VALUES), z.literal("")])
    .optional()
    .transform((v) => v || null),
  marketplaceOptIn: z
    .boolean()
    .optional()
    .transform((v) => v ?? false),
};

// Aceita "@usuario", "instagram.com/usuario" ou a URL completa.
export function normalizeInstagramUrl(input: string): string | null {
  const value = input.trim();
  if (!value) return null;

  if (/^https?:\/\//i.test(value)) {
    try {
      const url = new URL(value);
      return /(^|\.)instagram\.com$/i.test(url.hostname) ? url.toString() : null;
    } catch {
      return null;
    }
  }

  const handle = value
    .replace(/^@/, "")
    .replace(/^(www\.)?instagram\.com\//i, "")
    .replace(/\/+$/, "");
  return /^[A-Za-z0-9._]{1,30}$/.test(handle) ? `https://instagram.com/${handle}` : null;
}

// O instante do consentimento só muda quando o consentimento muda — salvar
// outras configurações não pode "renovar" a data.
export function marketplaceExtrasColumns(
  extras: {
    acceptsCustomOrders: boolean | null;
    shipsNationwide: boolean | null;
    yearsActive: string | null;
    marketplaceOptIn: boolean;
  },
  current?: { marketplace_opt_in: boolean; marketplace_opt_in_at: string | null },
) {
  const unchanged = current?.marketplace_opt_in === extras.marketplaceOptIn;
  const optInAt = extras.marketplaceOptIn
    ? unchanged && current?.marketplace_opt_in_at
      ? current.marketplace_opt_in_at
      : new Date().toISOString()
    : null;

  return {
    accepts_custom_orders: extras.acceptsCustomOrders,
    ships_nationwide: extras.shipsNationwide,
    years_active: extras.yearsActive,
    marketplace_opt_in: extras.marketplaceOptIn,
    marketplace_opt_in_at: optInAt,
  };
}
