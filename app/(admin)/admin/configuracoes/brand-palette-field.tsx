"use client";

import { useState } from "react";
import { WandSparklesIcon } from "lucide-react";
import { MAX_BRAND_COLORS, isValidHexColor, normalizeHexInput } from "@/lib/store/branding";
import { generateHarmoniousPalette } from "@/lib/store/color-harmony";
import { isLight } from "@/lib/store/theme";

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

  // Recalcula fundo/destaque/apoio a partir da primária — substitui as 4
  // posições seguintes por completo (pedido do usuário), preservando só a
  // primária que a proprietária escolheu.
  function generateFromPrimary() {
    const primary = colors[0];
    if (!isValidHexColor(primary)) return;
    setColors(generateHarmoniousPalette(primary).slice(0, Math.max(colors.length, 3)));
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <span className="text-sm font-medium">Paleta da marca</span>
        <span className="text-xs text-muted-foreground">
          Até {MAX_BRAND_COLORS} cores. A 1ª é a primária, a 2ª o fundo e a 3ª o destaque. Escolha no seletor
          ou cole o código hexadecimal — ou gere as demais automaticamente a partir da primária.
        </span>
      </div>

      {/* Serializa a paleta num campo só — o form envia uma string separada por vírgula. */}
      <input type="hidden" name="brandColors" value={colors.join(",")} />

      <div className="flex flex-col gap-2.5">
        {colors.map((color, index) => {
          const valid = isValidHexColor(color);
          const role = ["Primária", "Fundo", "Destaque", "Apoio", "Apoio"][index] ?? "Apoio";
          // A 2ª cor sempre vira o fundo real do catálogo (buildStoreTheme, em
          // lib/store/theme.ts) — mas se for escura demais para o texto
          // continuar legível por cima, é clareada automaticamente antes de
          // aplicar. Avisa aqui pra proprietária não estranhar o fundo sair
          // mais claro do que a cor que ela escolheu.
          const backgroundWillLighten = index === 1 && valid && !isLight(color);

          return (
            <div key={index} className="flex flex-col gap-1">
              <div className="flex items-center gap-3">
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

                <div className="ml-auto flex items-center gap-3">
                  {index === 0 ? (
                    <button
                      type="button"
                      onClick={generateFromPrimary}
                      disabled={!isValidHexColor(colors[0])}
                      className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <WandSparklesIcon className="size-3.5" />
                      Gerar paleta a partir desta cor
                    </button>
                  ) : null}

                  {colors.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => removeColor(index)}
                      className="text-xs uppercase tracking-wider text-muted-foreground transition-colors hover:text-destructive"
                    >
                      Remover
                    </button>
                  ) : null}
                </div>
              </div>

              {backgroundWillLighten ? (
                <p className="pl-[4.75rem] text-xs text-[var(--gold)]">
                  Essa cor é escura para servir de fundo — o catálogo vai usar uma versão mais clara dela,
                  pra manter o texto legível por cima.
                </p>
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
