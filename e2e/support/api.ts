import { ADMIN, API_URL, CUSTOMER_PASSWORD, MAILPIT_URL, PIECE } from "./env";

// Atalhos pela API, para os testes que não são sobre aquela parte do caminho (o fluxo 4 começa com um pedido pago).

const INTERNAL_KEY = { "X-Internal-Key": "dev-internal-key" };

export async function api<T = unknown>(method: string, path: string, options: { token?: string; body?: unknown; headers?: Record<string, string> } = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      ...INTERNAL_KEY,
      ...(options.body === undefined ? {} : { "Content-Type": "application/json" }),
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      ...options.headers,
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`${method} ${path} → ${response.status}: ${text}`);
  }
  return (text ? JSON.parse(text) : undefined) as T;
}

export async function adminToken(): Promise<string> {
  return (await api<{ accessToken: string }>("POST", "/api/v1/auth/login", { body: ADMIN })).accessToken;
}

/** Variação da peça usada pelos fluxos, lida da vitrine. */
export async function pieceVariantId(): Promise<string> {
  const product = await api<{ variants: { id: string }[] }>("GET", `/api/v1/catalog/products/${PIECE.slug}`);
  const variant = product.variants[0];
  if (!variant) {
    throw new Error(`A peça ${PIECE.slug} não tem variação no seed.`);
  }
  return variant.id;
}

/** Último e-mail para o endereço com o assunto pedido, esperando o Outbox entregar. */
export async function waitForEmail(to: string, subjectContains: string, timeoutMs = 30_000): Promise<{ subject: string; text: string }> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const search = await (await fetch(`${MAILPIT_URL}/api/v1/search?query=${encodeURIComponent(`to:"${to}"`)}`)).json();
    const found = (search.messages as { ID: string; Subject: string }[] | undefined)?.find((message) => message.Subject.includes(subjectContains));
    if (found) {
      const message = await (await fetch(`${MAILPIT_URL}/api/v1/message/${found.ID}`)).json();
      return { subject: found.Subject, text: message.Text as string };
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`Nenhum e-mail "${subjectContains}" para ${to} em ${timeoutMs / 1000} s.`);
}

/** Link de confirmação de e-mail do EM-01, como a cliente clica. */
export async function confirmationLink(email: string): Promise<string> {
  const { text } = await waitForEmail(email, "Confirme seu e-mail");
  const link = text.match(/https?:\/\/\S*confirmar-email\?token=[^\s)>\]]+/)?.[0];
  if (!link) {
    throw new Error(`E-mail de confirmação sem link:\n${text}`);
  }
  return link;
}

/** Cliente cadastrada pela API, com e-mail confirmado pelo link do Mailpit e um endereço guardado. */
export async function confirmedCustomer(email: string): Promise<{ token: string; addressId: string }> {
  const session = await api<{ accessToken: string }>("POST", "/api/v1/auth/register", {
    body: { fullName: "Cliente E2E", email, password: CUSTOMER_PASSWORD, phone: "(11) 98765-4321" },
  });
  const confirmToken = new URL(await confirmationLink(email)).searchParams.get("token");
  await api("POST", "/api/v1/auth/confirm-email", { body: { token: confirmToken } });
  const address = await api<{ id: string }>("POST", "/api/v1/me/addresses", {
    token: session.accessToken,
    body: { recipient: "Cliente E2E", postalCode: "20040-020", street: "Rua da Assembleia", number: "10", district: "Centro", city: "Rio de Janeiro", state: "RJ" },
  });
  return { token: session.accessToken, addressId: address.id };
}

/**
 * Cliente com um pedido da peça pago no cartão de teste: o ponto de partida do fluxo do painel, que não é sobre a
 * compra.
 */
export async function paidOrder(email: string): Promise<{ orderId: string; number: string }> {
  const { token, addressId } = await confirmedCustomer(email);
  await api("POST", "/api/v1/cart/items", { token, body: { variantId: await pieceVariantId(), quantity: 1 } });
  const order = await api<{ id: string; number: string }>("POST", "/api/v1/orders", {
    token,
    headers: { "Idempotency-Key": crypto.randomUUID() },
    body: { addressId, shippingServiceCode: "PAC" },
  });
  await api("POST", `/api/v1/orders/${order.id}/payments`, {
    token,
    body: { method: "CreditCard", cardToken: "fake-approved", paymentMethodId: "visa" },
  });
  return { orderId: order.id, number: order.number };
}
