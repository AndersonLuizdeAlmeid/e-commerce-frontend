import type { Metadata } from "next";
import { CartPage } from "@/features/cart/components/CartPage";

export const metadata: Metadata = {
  title: "Sua sacola",
  robots: { index: false, follow: false },
};

export default function CarrinhoPage() {
  return <CartPage />;
}
