"use client";

import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import Image from "next/image";
import { CameraIcon, ImagePlusIcon, Loader2Icon } from "lucide-react";
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
  const cameraRef = useRef<HTMLInputElement>(null);
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

  // `cancel` dispara quando o seletor fecha sem escolha. Sem ele, "abriu e não
  // selecionou" e "nem abriu" são indistinguíveis no diagnóstico. Vai por
  // addEventListener porque o React não tipa `onCancel` em <input>.
  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    const onCancel = () => log("seletor fechado sem escolher arquivo");
    input.addEventListener("cancel", onCancel);
    return () => input.removeEventListener("cancel", onCancel);
  }, []);

  // Caminho único de envio: o seletor de arquivos, a câmera, o colar e o
  // arrastar chamam esta função. Assim uma origem que falhe num aparelho não
  // impede as outras de funcionarem.
  async function submitFile(file: File, origin: string) {
    if (isBusy) return;
    log(`${origin}: ${file.name || "sem nome"} · ${(file.size / 1024 / 1024).toFixed(1)}MB · ${file.type || "sem tipo"}`);

    setIsCompressing(true);
    let payload = file;
    try {
      payload = await compressImage(file);
      log(`comprimida: ${(payload.size / 1024 / 1024).toFixed(1)}MB · ${payload.type}`);
    } catch (error) {
      log(`erro ao comprimir: ${error instanceof Error ? error.message : String(error)}`);
    }
    setIsCompressing(false);

    const data = new FormData();
    data.set("file", payload);
    log("enviando para o servidor…");
    startTransition(() => formAction(data));
  }

  // Colar (Ctrl+V ou "colar" do teclado Android) é um caminho que não passa
  // pelo seletor de arquivos — funciona mesmo quando o intent do sistema falha.
  // O handler vai numa ref para o listener ser registrado uma vez só, já que
  // `submitFile` é recriada a cada render.
  const submitFileRef = useRef(submitFile);
  useEffect(() => {
    submitFileRef.current = submitFile;
  });

  useEffect(() => {
    const onPaste = (event: ClipboardEvent) => {
      const file = Array.from(event.clipboardData?.files ?? [])[0];
      if (file) void submitFileRef.current(file, "colado");
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, []);

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
          {/* O input aparece na tela como um controle de arquivo comum, sem
              nenhum truque de CSS. Cada tentativa de escondê-lo — `size-0`,
              `opacity: 0`, `font-size: 0`, posicionar fora da viewport, delegar
              o toque a um `<label>` ou a um `.click()` programático — resultou
              no Chrome Android abrir o seletor e aborta-lo na sequência (o
              diagnóstico mostrava o toque seguido de `cancel` imediato).

              É menos elegante que a área tracejada, mas é o controle nativo que
              o navegador sabe abrir. Só voltar a escondê-lo depois de confirmar
              num aparelho real que o seletor continua funcionando. */}
          <div className="flex flex-col items-center gap-3 rounded-[var(--radius)] border border-dashed border-input px-6 py-6 text-center">
            <span className="flex size-11 items-center justify-center rounded-full bg-secondary text-foreground">
              {isBusy ? (
                <Loader2Icon className="size-5 animate-spin" />
              ) : (
                <ImagePlusIcon className="size-5" />
              )}
            </span>
            <span className="text-sm font-medium">
              {isCompressing ? "Preparando foto…" : isUploading ? "Enviando…" : "Escolha uma foto do produto"}
            </span>
            <input
              ref={inputRef}
              id="product-image-input"
              type="file"
              name="file"
              // `accept="image/*"` é necessário: sem ele o Chrome Android abre o
              // seletor de documentos genérico, que não lista as fotos da
              // galeria — a tela abre vazia e fechar devolve `cancel`.
              accept="image/*"
              // Sem `disabled` aqui: um input de arquivo desabilitado não abre o
              // seletor, e se `isBusy` travar (um envio que nunca completa) o
              // botão morre de vez. O onChange já ignora toques durante o envio.
              onClick={() => log("toque recebido no input")}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) {
                  log("change disparou sem arquivo");
                  return;
                }
                void submitFile(file, "selecionado");
              }}
              aria-label="Adicionar uma foto do produto"
              className="max-w-full text-sm"
            />
            <span className="text-xs text-muted-foreground">
              {images.length}/8 · JPEG, PNG ou WebP, até 10MB
            </span>
          </div>

          {/* Caminho alternativo: `capture` pede a câmera diretamente, por um
              intent diferente do seletor de galeria. Se um dos dois falhar no
              aparelho, o outro ainda resolve. */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            <input
              ref={cameraRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void submitFile(file, "foto da câmera");
                e.target.value = "";
              }}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              size="xs"
              disabled={isBusy}
              onClick={() => cameraRef.current?.click()}
            >
              <CameraIcon className="size-3.5" />
              Tirar foto agora
            </Button>
            <span className="text-xs text-muted-foreground">
              ou cole uma imagem copiada
            </span>
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
