import type { Metadata } from "next";
import { LegalDocument } from "@/components/legal/legal-document";
import { TERMS_INTRO, TERMS_SECTIONS } from "@/lib/legal/terms-content";
import { TERMS_VERSION } from "@/lib/legal/versions";

export const metadata: Metadata = {
  title: "Termos de Uso | AteliFácil",
  description: "Regras de uso do AteliFácil: teste gratuito, assinatura, cancelamento e responsabilidades.",
};

export default function TermsPage() {
  return (
    <LegalDocument
      title="Termos de Uso"
      version={TERMS_VERSION}
      intro={TERMS_INTRO}
      sections={TERMS_SECTIONS}
      otherDocument={{ href: "/privacidade", label: "Política de Privacidade" }}
    />
  );
}
