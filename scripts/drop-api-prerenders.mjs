// Usado no Dockerfile: o build da imagem pré-renderiza com a API falsa do CI. Apaga do servidor standalone as páginas
// com ISR (as que buscam dados da API), para que nenhum visitante veja os dados falsos: sem o arquivo, o Next.js gera a
// página com a API de verdade no primeiro acesso e a guarda em cache como sempre.
import { existsSync, readFileSync, rmSync } from "node:fs";
import { join } from "node:path";

const appDir = ".next/standalone/.next/server/app";
const manifest = JSON.parse(readFileSync(".next/prerender-manifest.json", "utf8"));

const isrRoutes = Object.entries(manifest.routes).filter(([, route]) => typeof route.initialRevalidateSeconds === "number");
if (isrRoutes.length === 0) {
  throw new Error("Nenhuma página com ISR no prerender-manifest: o formato do Next.js mudou?");
}

for (const [path] of isrRoutes) {
  const base = join(appDir, path === "/" ? "index" : path.slice(1));
  const files = [".html", ".rsc", ".meta", ".body", ".segments"].map((suffix) => base + suffix).filter((file) => existsSync(file));
  files.forEach((file) => rmSync(file, { recursive: true }));
  console.log(`${path}: ${files.length} arquivo(s) removido(s)`);
}
