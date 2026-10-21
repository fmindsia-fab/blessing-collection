// Estrutura simples dos documentos legais: facilita manter o texto num lugar só,
// renderizar com títulos/âncoras acessíveis e testar o conteúdo.
export type LegalBlock = { type: "p"; text: string } | { type: "ul"; items: string[] };

export type LegalSection = {
  id: string;
  title: string;
  blocks: LegalBlock[];
};
