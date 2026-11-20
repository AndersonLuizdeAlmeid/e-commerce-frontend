import { isStaging } from "@/shared/lib/environment";

/** Faixa do ambiente de testes (NEXT_PUBLIC_ENV=staging): ninguém confunde um pedido de teste com uma compra real. */
export function TestEnvironmentBanner() {
  if (!isStaging()) {
    return null;
  }
  return (
    <div className="bg-grafite px-4 py-2 text-center text-xs tracking-wide text-cartela">
      <strong className="font-medium uppercase">Ambiente de testes</strong>
      <span aria-hidden="true"> · </span>
      Pedidos e pagamentos aqui não são reais, e os dados serão apagados ao fim dos testes.
    </div>
  );
}
