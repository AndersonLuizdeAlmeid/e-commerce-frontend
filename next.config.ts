import type { NextConfig } from "next";
import { securityHeaders } from "./src/shared/lib/security-headers";

// Fotos enviadas pelo painel (RF-061): RustFS local em dev; em produção, o domínio público do R2.
const imagesUrl = new URL(process.env.NEXT_PUBLIC_IMAGES_URL ?? "http://localhost:9000/mo-images");

const nextConfig: NextConfig = {
  poweredByHeader: false,
  output: "standalone",
  // CSP e demais headers de segurança (arquivo 17 §2, entrega 6 §3 P5). CSP_MODE=enforce bloqueia; vazio só reporta.
  async headers() {
    return securityHeaders({
      apiUrl: process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5001",
      siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
      imagesUrl: process.env.NEXT_PUBLIC_IMAGES_URL,
      cspMode: process.env.CSP_MODE,
      development: process.env.NODE_ENV !== "production",
    });
  },
  images: {
    // SEO-09: next/image converte para AVIF/WebP e gera tamanhos responsivos.
    formats: ["image/avif", "image/webp"],
    // placehold.co: fotos dos dados de exemplo.
    remotePatterns: [
      { protocol: "https", hostname: "placehold.co" },
      // Fotos de teste do ambiente local (scripts/ci-api-stub.mjs com STUB_PHOTOS=1); nunca em produção.
      ...(process.env.NODE_ENV !== "production" ? [{ protocol: "https" as const, hostname: "images.unsplash.com" }] : []),
      {
        protocol: imagesUrl.protocol === "https:" ? "https" : "http",
        hostname: imagesUrl.hostname,
        port: imagesUrl.port,
        pathname: `${imagesUrl.pathname.replace(/\/$/, "")}/**`,
      },
    ],
    // O next/image recusa IP local por segurança; só o bucket de desenvolvimento precisa disso. O ambiente de dev da VM
    // também, porque lá o bucket só existe na rede interna do Compose (IMAGES_ALLOW_LOCAL_IP, lida no build da imagem).
    dangerouslyAllowLocalIP: process.env.NODE_ENV !== "production" || process.env.IMAGES_ALLOW_LOCAL_IP === "true",
  },
};

export default nextConfig;
