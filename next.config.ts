import type { NextConfig } from "next";

// Fotos enviadas pelo painel (RF-061): RustFS local em dev; em produção, o domínio público do R2.
const imagesUrl = new URL(process.env.NEXT_PUBLIC_IMAGES_URL ?? "http://localhost:9000/mo-images");

const nextConfig: NextConfig = {
  poweredByHeader: false,
  output: "standalone",
  images: {
    // SEO-09: next/image converte para AVIF/WebP e gera tamanhos responsivos.
    formats: ["image/avif", "image/webp"],
    // placehold.co: fotos dos dados de exemplo.
    remotePatterns: [
      { protocol: "https", hostname: "placehold.co" },
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
