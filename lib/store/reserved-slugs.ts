// Subdomínios que nunca podem ser o slug de uma loja — reservados para a
// própria plataforma (marketing, admin, assets, etc.). Compartilhado entre
// proxy.ts (resolução de tenant) e a validação de slug no onboarding.
export const RESERVED_SLUGS = new Set([
  "www",
  "admin",
  "app",
  "api",
  "static",
  "mail",
  "suporte",
  "blog",
  // Registros DNS do Resend (envio de e-mails): send / rsend / resend._domainkey.
  "send",
  "rsend",
  "resend",
]);
