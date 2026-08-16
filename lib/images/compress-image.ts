/**
 * Reduz a foto no navegador antes de enviá-la para a Server Action.
 *
 * Fotos de câmera de celular chegam a 8-12MB e estouram o `bodySizeLimit` das
 * Server Actions — quando isso acontece o Next aborta a requisição e a tela
 * fica sem resposta nenhuma. Comprimir aqui evita o estouro e ainda converte
 * HEIC/HEIF do iPhone para JPEG (o canvas sempre exporta um formato que o
 * navegador exibe), formato que o servidor recusaria.
 *
 * É best-effort: qualquer falha devolve o arquivo original e deixa a validação
 * do servidor decidir.
 */

const MAX_DIMENSION = 2000;
const QUALITY = 0.85;

export async function compressImage(file: File): Promise<File> {
  if (typeof document === "undefined") return file;
  if (!file.type.startsWith("image/") && !/\.hei[cf]$/i.test(file.name)) return file;

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    if (!context) return file;
    context.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", QUALITY),
    );
    if (!blob) return file;

    // Um arquivo já otimizado (PNG pequeno, WebP) pode crescer ao virar JPEG.
    if (blob.size >= file.size && file.type !== "image/heic" && file.type !== "image/heif") {
      return file;
    }

    const name = file.name.replace(/\.[^.]+$/, "") || "foto";
    return new File([blob], `${name}.jpg`, { type: "image/jpeg", lastModified: Date.now() });
  } catch {
    return file;
  }
}
