"use client";

import { useState } from "react";
import {
  FONT_CATALOG,
  FONT_GROUP_LABEL,
  fontFamilyPreview,
  type FontGroup,
} from "@/lib/store/font-catalog";

type BrandFontFieldProps = {
  fontFamily: string;
  customFontName: string | null;
  hasCustomFont: boolean;
};

const GROUPS: FontGroup[] = ["serif", "sans"];

export function BrandFontField({ fontFamily, customFontName, hasCustomFont }: BrandFontFieldProps) {
  const [selected, setSelected] = useState(fontFamily);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium">Fonte da marca</span>
        <span className="text-xs text-muted-foreground">
          {hasCustomFont
            ? `Usando a fonte enviada "${customFontName}". Ela tem precedência sobre a lista abaixo.`
            : "Escolha uma das fontes curadas ou envie a sua no bloco abaixo."}
        </span>
      </div>

      <div className="flex flex-col gap-4">
        {GROUPS.map((group) => (
          <div key={group} className="flex flex-col gap-2">
            <span className="text-[0.625rem] uppercase tracking-[0.16em] text-muted-foreground">
              {FONT_GROUP_LABEL[group]}
            </span>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {FONT_CATALOG.filter((option) => option.group === group).map((option) => {
                const active = selected === option.value;
                return (
                  <label
                    key={option.value}
                    className={`flex cursor-pointer flex-col gap-1 border px-3 py-2.5 transition-colors ${
                      active
                        ? "border-foreground bg-secondary"
                        : "border-border hover:border-foreground/40"
                    } ${hasCustomFont ? "opacity-50" : ""}`}
                  >
                    <input
                      type="radio"
                      name="fontFamily"
                      value={option.value}
                      checked={active}
                      onChange={() => setSelected(option.value)}
                      className="sr-only"
                    />
                    {/* Prévia na própria fonte quando o sistema/navegador já a
                        tiver; senão cai na serifada padrão. next/font é
                        server-only, então não dá para carregá-la aqui. */}
                    <span
                      className="text-base leading-tight"
                      style={{ fontFamily: fontFamilyPreview(option.label) }}
                    >
                      {option.label}
                    </span>
                    <span className="text-[0.625rem] uppercase tracking-wider text-muted-foreground">
                      {active ? "Selecionada" : "Aa Bb Cc"}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
