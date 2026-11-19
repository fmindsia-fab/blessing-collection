import QRCode from "qrcode";

/**
 * QR Code como imagem SVG embutida (data URI): nítida em qualquer tamanho na impressão e
 * sem depender de arquivo ou rede. Correção de erro "M" lê bem mesmo com a folha um pouco
 * amassada ou com a tinta falhada.
 */
export async function qrSvgDataUri(text: string): Promise<string> {
  const svg = await QRCode.toString(text, { type: "svg", errorCorrectionLevel: "M", margin: 1 });
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
