import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  output: "standalone",
  images: {
    // SEO-09: next/image converte para AVIF/WebP e gera tamanhos responsivos.
    formats: ["image/avif", "image/webp"],
    // placehold.co: fotos dos dados de exemplo. O domínio do CDN de produção entra quando a D06 (upload) for decidida.
    remotePatterns: [{ protocol: "https", hostname: "placehold.co" }],
  },
};

export default nextConfig;
