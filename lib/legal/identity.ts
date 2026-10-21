// Identificação do responsável pela plataforma (exigida para quem oferece serviço
// online: nome e número de inscrição no CPF ou CNPJ). A plataforma está em fase de
// implantação comercial, ainda sem CNPJ: quando houver, é aqui (e só aqui) que os
// dados mudam, e as páginas /termos e /privacidade passam a mostrá-los.
//
// O endereço residencial NÃO é publicado: só cidade e estado.
export const LEGAL_IDENTITY = {
  productName: "AteliFácil",
  site: "atelifacil.com.br",
  responsibleName: "Fabio Marcelo Barbosa",
  legalNature: "pessoa física",
  taxIdLabel: "CPF",
  taxId: "023.919.669-46",
  city: "Londrina",
  state: "PR",
  contactEmail: "fminds.ia@gmail.com",
} as const;

export const LEGAL_CONTACT_EMAIL = LEGAL_IDENTITY.contactEmail;
