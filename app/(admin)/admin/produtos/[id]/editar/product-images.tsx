"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import Image from "next/image";
import { ImagePlusIcon, Loader2Icon } from "lucide-react";
import {
  uploadProductImage,
  setCoverImage,
  deleteProductImage,
  updateImageAltText,
  moveProductImage,
  type ImageUploadState,
} from "@/lib/products/image-actions";
import { Button } from "@/components/ui/button";
import { ReorderButtons } from "@/components/admin/reorder-buttons";
import { compressImage } from "@/lib/images/compress-image";

type ProductImagesProps = {
  productId: string;
  images: { id: string; url: string; alt_text: string | null; is_cover: boolean }[];
};

const initialState: ImageUploadState = {};

export function ProductImages({ productId, images }: ProductImagesProps) {
  const uploadAction = uploadProductImage.bind(null, productId);
  const [state, formAction, isUploading] = useActionState(uploadAction, initialState);
  const [isPending, startTransition] = useTransition();
  // A compressão acontece antes do `formAction`, então `isUploading` ainda é
  // falso enquanto ela roda — sem este estado o botão fica mudo nesse intervalo,
  // que é justamente o mais longo no celular.
  const [isCompressing, setIsCompressing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const isBusy = isCompressing || isUploading;

  // Diagnóstico temporário: o upload falha em Chrome Android sem erro visível e
  // sem acesso ao console do aparelho. Mostra na tela em que ponto o fluxo para.
  // Remover assim que a causa estiver identificada.
  const [debug, setDebug] = useState<string[]>([]);
  const log = (message: string) =>
    setDebug((entries) => [...entries, `${new Date().toLocaleTimeString()} · ${message}`]);

  // Limpa o input ao terminar o envio: sem isso o arquivo continua selecionado
  // e escolher a mesma foto de novo não dispara `change`. Só age depois de um
  // envio de verdade — mexer no input na montagem é desnecessário e, em alguns
  // navegadores, atrapalha a abertura do seletor.
  const wasUploading = useRef(false);
  useEffect(() => {
    if (isUploading) {
      wasUploading.current = true;
      return;
    }
    if (wasUploading.current && inputRef.current) {
      inputRef.current.value = "";
      wasUploading.current = false;
    }
  }, [isUploading]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-sm font-medium">Imagens ({images.length}/8)</h2>
        <p className="text-xs text-muted-foreground">
          Marque a imagem principal e descreva cada foto para leitores de tela.
        </p>
      </div>

      {images.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {images.map((image, index) => (
            <div key={image.id} className="flex flex-col gap-2">
              <div className="relative aspect-square overflow-hidden rounded-[var(--radius)] bg-secondary shadow-sm">
                <Image
                  src={image.url}
                  alt={image.alt_text ?? "Foto do produto"}
                  fill
                  className="object-cover"
                  sizes="150px"
                />
                {image.is_cover ? (
                  <span className="absolute left-2 top-2 rounded-full bg-background/92 px-2.5 py-1 text-[0.625rem] uppercase tracking-wider shadow-sm backdrop-blur-sm">
                    Capa
                  </span>
                ) : null}

                {/* Ordem das fotos na galeria pública (PRD 3.7). */}
                {images.length > 1 ? (
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-background/92 p-1 shadow-sm backdrop-blur-sm">
                    <ReorderButtons
                      orientation="horizontal"
                      label={`imagem ${index + 1}`}
                      isFirst={index === 0}
                      isLast={index === images.length - 1}
                      disabled={isPending}
                      onMove={(direction) =>
                        startTransition(() => moveProductImage(productId, image.id, direction))
                      }
                    />
                  </div>
                ) : null}
              </div>

              {/* Salva ao sair do campo: evita um botão por imagem. */}
              <input
                type="text"
                defaultValue={image.alt_text ?? ""}
                placeholder="Descreva a foto…"
                maxLength={200}
                aria-label="Texto alternativo da imagem"
                onBlur={(e) => {
                  if (e.target.value.trim() === (image.alt_text ?? "").trim()) return;
                  startTransition(() => updateImageAltText(productId, image.id, e.target.value));
                }}
                className="w-full rounded-[var(--radius)] border border-input bg-background px-2.5 py-1.5 text-xs outline-none transition-colors placeholder:text-muted-foreground/70 focus-visible:border-foreground/40 focus-visible:ring-2 focus-visible:ring-[var(--gold)]/40"
              />

              <div className="flex flex-wrap gap-1">
                {!image.is_cover ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="xs"
                    disabled={isPending}
                    onClick={() => startTransition(() => setCoverImage(productId, image.id))}
                  >
                    Definir capa
                  </Button>
                ) : null}
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  disabled={isPending}
                  onClick={() => startTransition(() => deleteProductImage(productId, image.id, image.url))}
                >
                  Remover
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {images.length < 8 ? (
        <form action={formAction} className="flex flex-col gap-2">
          {/* `relative` fica neste wrapper, não no <form>: o input é
              `inset-0` e cobriria a mensagem de erro logo abaixo. */}
          <div className="relative">
          {/* O input cobre toda a área do bloco e recebe o toque diretamente,
              em vez de ficar escondido atrás de um label ou ser acionado por
              `.click()`. No Chrome Android um input de arquivo sem área de
              renderização (`size-0`, `opacity: 0`, fora da viewport) não abre o
              seletor de forma confiável, seja por clique programático ou por
              encaminhamento do label — no desktop os mesmos truques funcionam,
              o que faz o bug parecer exclusivo do celular.

              Aqui ele é um alvo de toque real: ocupa a mesma caixa do visual,
              fica por cima (`z-10`) e só o texto é transparente. O conteúdo
              exibido vive numa camada `pointer-events-none` embaixo.

              Sem `required`: o navegador tentaria exibir "Preencha este campo"
              apontando para um controle sem texto visível. O servidor já
              recusa envio sem arquivo. */}
            <input
              ref={inputRef}
              id="product-image-input"
              type="file"
              name="file"
              // `image/*` em vez da lista de MIMEs: alguns Androids escondem a
              // câmera e filtram demais a galeria quando o accept é restrito.
              // O servidor rejeita formato inválido de qualquer forma.
              accept="image/*"
              // Sem `disabled` aqui: um input de arquivo desabilitado não abre o
              // seletor, e se `isBusy` travar (um envio que nunca completa) o
              // botão morre de vez. O onChange já ignora toques durante o envio.
              onClick={() => log("toque recebido no input")}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                log(`change: ${file ? `${file.name} · ${(file.size / 1024 / 1024).toFixed(1)}MB · ${file.type || "sem tipo"}` : "sem arquivo"}`);
                if (!file || isBusy) return;
                // Envia o arquivo comprimido em vez de deixar o form serializar
                // o original: foto de celular passa de 10MB e a Server Action
                // seria abortada sem mensagem nenhuma na tela.
                setIsCompressing(true);
                let compressed = file;
                try {
                  compressed = await compressImage(file);
                  log(`comprimida: ${(compressed.size / 1024 / 1024).toFixed(1)}MB · ${compressed.type}`);
                } catch (error) {
                  log(`erro ao comprimir: ${error instanceof Error ? error.message : String(error)}`);
                }
                setIsCompressing(false);
                const data = new FormData();
                data.set("file", compressed);
                log("enviando para o servidor…");
                startTransition(() => formAction(data));
              }}
              aria-label="Adicionar uma foto do produto"
              // Invisível por cor, não por `opacity: 0` nem `size-0`: o elemento
              // continua com área e pintura reais, que é o que o Chrome Android
              // exige para abrir o seletor.
              className="peer absolute inset-0 z-10 size-full cursor-pointer bg-transparent text-[0px] text-transparent file:hidden"
            />
            <div
              aria-hidden="true"
              // O input está por cima, então hover/foco são espelhados dele
              // via `peer-*` — sem isso o bloco não daria retorno visual.
              className="pointer-events-none flex min-h-32 w-full flex-col items-center justify-center gap-2 rounded-[var(--radius)] border border-dashed border-input px-6 py-8 text-center transition-colors peer-hover:border-foreground/40 peer-hover:bg-secondary/50 peer-focus-visible:border-foreground/40 peer-focus-visible:ring-2 peer-focus-visible:ring-[var(--gold)]/40"
            >
              <span className="flex size-11 items-center justify-center rounded-full bg-secondary text-foreground">
                {isBusy ? (
                  <Loader2Icon className="size-5 animate-spin" />
                ) : (
                  <ImagePlusIcon className="size-5" />
                )}
              </span>
              <span className="text-sm font-medium">
                {isCompressing ? "Preparando foto…" : isUploading ? "Enviando…" : "Toque para adicionar uma foto"}
              </span>
              <span className="text-xs text-muted-foreground">
                {images.length}/8 · JPEG, PNG ou WebP, até 10MB
              </span>
            </div>
          </div>
          {state.error ? <p className="text-sm text-destructive">{state.error}</p> : null}

          {/* Diagnóstico temporário — remover quando o bug estiver resolvido. */}
          {debug.length > 0 ? (
            <div className="flex flex-col gap-1 rounded-[var(--radius)] bg-secondary p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium">Diagnóstico</span>
                <button
                  type="button"
                  onClick={() => setDebug([])}
                  className="text-xs text-muted-foreground underline"
                >
                  limpar
                </button>
              </div>
              {debug.map((entry, i) => (
                <p key={i} className="break-all font-mono text-[0.6875rem] leading-relaxed">
                  {entry}
                </p>
              ))}
            </div>
          ) : null}
        </form>
      ) : null}
    </div>
  );
}
