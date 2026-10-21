import type { Metadata } from "next";
import { LegalDocument } from "@/components/legal/legal-document";
import { PRIVACY_INTRO, PRIVACY_SECTIONS } from "@/lib/legal/privacy-content";
import { PRIVACY_VERSION } from "@/lib/legal/versions";

export const metadata: Metadata = {
  title: "Política de Privacidade | AteliFácil",
  description: "Como o AteliFácil trata dados pessoais, em conformidade com a LGPD, e como exercer seus direitos.",
};

export default function PrivacyPage() {
  return (
    <LegalDocument
      title="Política de Privacidade"
      version={PRIVACY_VERSION}
      intro={PRIVACY_INTRO}
      sections={PRIVACY_SECTIONS}
      otherDocument={{ href: "/termos", label: "Termos de Uso" }}
    />
  );
}
