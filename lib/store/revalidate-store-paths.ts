import { revalidatePath } from "next/cache";

/**
 * Revalida a home e a listagem públicas de uma loja após uma mudança que
 * afeta o catálogo (produto, cor, modelo, categoria em uso, etc).
 *
 * Antes das rotas ganharem o prefixo /loja/[storeSlug], "/produtos" e "/"
 * eram caminhos fixos; agora dependem do slug da loja que fez a mudança.
 */
export function revalidateStorePaths(storeSlug: string): void {
  revalidatePath(`/loja/${storeSlug}`);
  revalidatePath(`/loja/${storeSlug}/produtos`);
}
