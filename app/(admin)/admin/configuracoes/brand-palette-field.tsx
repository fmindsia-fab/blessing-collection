"use client";

import { useState } from "react";
import { MAX_BRAND_COLORS, isValidHexColor, normalizeHexInput } from "@/lib/store/branding";

// Sugestões alinhadas à direção visual do catálogo (nude/argila/dourado).
const SUGGESTED = ["#1C1917", "#FAF8F5", "#C9A227", "#B08D57", "#D9C5B2", "#8A6F5C", "#EFE6DA"];

export function BrandPaletteField({ initialColors }: { initialColors: string[] }) {
  const [colors, setColors] = useState<string[]>(
    initialColors.length > 0 ? initialColors : ["#1C1917", "#FAF8F5", "#C9A227"],
  );

  function updateColor(index: number, value: string) {
    setColors((current) => current.map((c, i) => (i === index ? value : c)));
  }

  function addColor() {
    if (colors.length >= MAX_BRAND_COLORS) return;
    setColors((current) => [...current, "#D9C5B2"]);
  }

  function removeColor(index: number) {
    // A primeira cor é a primária: a paleta nunca fica vazia.
    if (colors.length <= 1) return;
    setColors((current) => current.filter((_, i) => i !== index));
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium">Paleta da marca</span>
        <span className="text-xs text-muted-foreground">
          Até {MAX_BRAND_COLORS} cores. A 1ª é a primária, a 2ª o fundo e a 3ª o destaque. Escolha no seletor
          ou cole o código hexadecimal.
        </span>
      </div>

      {/* Serializa a paleta num campo só — o form envia uma string separada por vírgula. */}
      <input type="hidden" name="brandColors" value={colors.join(",")} />

      <div className="flex flex-col gap-2.5">
        {colors.map((color, index) => {
          const valid = isValidHexColor(color);
          const role = ["Primária", "Fundo", "Destaque", "Apoio", "Apoio"][index] ?? "Apoio";

          return (
            <div key={index} className="flex items-center gap-3">
              <span className="w-16 shrink-0 text-[0.6875rem] uppercase tracking-wider text-muted-foreground">
                {role}
              </span>

              <input
                type="color"
                aria-label={`Seletor visual da cor ${index + 1}`}
                value={valid ? color : "#000000"}
                onChange={(e) => updateColor(index, e.target.value.toUpperCase())}
                className="size-10 shrink-0 cursor-pointer border border-border bg-transparent p-1"
              />

              <input
                type="text"
                aria-label={`Código hexadecimal da cor ${index + 1}`}
                value={color}
                onChange={(e) => updateColor(index, normalizeHexInput(e.target.value))}
                placeholder="#C9A227"
                spellCheck={false}
                className={`h-10 w-32 border bg-transparent px-3 font-mono text-sm uppercase outline-none transition-colors ${
                  valid ? "border-border focus:border-foreground" : "border-destructive"
                }`}
              />

              {!valid ? <span className="text-xs text-destructive">Use #RRGGBB</span> : null}

              {colors.length > 1 ? (
                <button
                  type="button"
                  onClick={() => removeColor(index)}
                  className="ml-auto text-xs uppercase tracking-wider text-muted-foreground transition-colors hover:text-destructive"
                >
                  Remover
                </button>
              ) : null}
            </div>
          );
        })}
      </div>

      {colors.length < MAX_BRAND_COLORS ? (
        <button
          type="button"
          onClick={addColor}
          className="w-fit border border-border px-4 py-2 text-xs uppercase tracking-wider transition-colors hover:border-foreground"
        >
          Adicionar cor
        </button>
      ) : null}

      <div className="flex flex-col gap-2 pt-1">
        <span className="text-[0.6875rem] uppercase tracking-wider text-muted-foreground">Sugestões</span>
        <div className="flex flex-wrap gap-1.5">
          {SUGGESTED.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              title={suggestion}
              aria-label={`Adicionar a cor ${suggestion}`}
              disabled={colors.length >= MAX_BRAND_COLORS}
              onClick={() => setColors((current) => [...current, suggestion])}
              className="size-7 border border-border transition-transform hover:scale-110 disabled:cursor-not-allowed disabled:opacity-40"
              style={{ backgroundColor: suggestion }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
