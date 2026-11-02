/** Regras do envio de fotos no painel (RF-061), iguais às da API. Funções puras, testadas. */

export const MAX_FILE_BYTES = 15 * 1024 * 1024;
export const MAX_FILES_AT_ONCE = 10;
export const PARALLEL_UPLOADS = 3;

/** Abaixo disso a foto é aceita, mas perde qualidade na loja (RF-061 CA3, arquivo 26 §7.2). */
export const RECOMMENDED_LONG_SIDE = 1600;

const ACCEPTED_EXTENSIONS = ["jpg", "jpeg", "png", "webp", "heic", "heif"];

/** Para o seletor de arquivos. HEIC muitas vezes chega sem tipo no Windows, então as extensões vão junto. */
export const ACCEPT_ATTRIBUTE = "image/jpeg,image/png,image/webp,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.heic,.heif";

/** Motivo para recusar o arquivo antes de enviar, ou null. Quem confere de verdade o conteúdo é a API. */
export function fileProblem(file: { name: string; size: number }): string | null {
  const extension = file.name.split(".").at(-1)?.toLowerCase() ?? "";
  if (!ACCEPTED_EXTENSIONS.includes(extension)) {
    return "Formato não aceito. Envie JPEG, PNG, WebP ou HEIC.";
  }
  if (file.size === 0) {
    return "O arquivo está vazio.";
  }
  if (file.size > MAX_FILE_BYTES) {
    return "A foto passa de 15 MB.";
  }
  return null;
}

/** "Anel Solitário — Dourado": a sugestão de texto alternativo (RF-061). A API limita a 200 caracteres. */
export function suggestAlt(productName: string, colorName?: string | null): string {
  return (colorName ? `${productName} — ${colorName}` : productName).slice(0, 200);
}

export function isLowResolution(width: number | null, height: number | null): boolean {
  return width !== null && height !== null && Math.max(width, height) < RECOMMENDED_LONG_SIDE;
}

/** Move um item da lista, para a reordenação da galeria. */
export function moveItem<T>(items: readonly T[], from: number, to: number): T[] {
  const next = [...items];
  const [item] = next.splice(from, 1);
  if (item !== undefined) {
    next.splice(to, 0, item);
  }
  return next;
}

/** Roda as tarefas com no máximo `limit` ao mesmo tempo; uma falha não para as outras (RF-061 CA1). */
export async function runWithLimit<T>(items: readonly T[], limit: number, task: (item: T) => Promise<void>): Promise<void> {
  let next = 0;
  async function worker(): Promise<void> {
    while (next < items.length) {
      const item = items[next++] as T;
      await task(item).catch(() => undefined);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
}
