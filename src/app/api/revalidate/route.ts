import { timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";

/**
 * Revalidação sob demanda (arquivo 16 §3, entrega 2B §3.2): a API chama esta rota pelo Outbox depois de cada
 * escrita do admin, com as mesmas tags do cache dela. Só tags conhecidas; o segredo vem de `REVALIDATE_SECRET`.
 */
const ALLOWED_TAGS = new Set(["categories", "products", "collections", "showcase"]);
const SECRET_HEADER = "x-revalidate-secret";

export async function POST(request: Request): Promise<Response> {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret || !matches(request.headers.get(SECRET_HEADER), secret)) {
    return new Response(null, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { tags?: unknown } | null;
  const tags = Array.isArray(body?.tags) ? body.tags.filter((tag): tag is string => typeof tag === "string" && ALLOWED_TAGS.has(tag)) : [];
  if (tags.length === 0) {
    return Response.json({ revalidated: [] }, { status: 400 });
  }

  // expire: 0 = a próxima visita já busca da API, em vez de servir a versão antiga enquanto revalida.
  tags.forEach((tag) => revalidateTag(tag, { expire: 0 }));
  return Response.json({ revalidated: tags });
}

function matches(received: string | null, expected: string): boolean {
  if (received === null) {
    return false;
  }
  const a = Buffer.from(received);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
