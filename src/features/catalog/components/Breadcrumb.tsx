import Link from "next/link";

/** Trilha de navegação (a JSON-LD da trilha continua na página). Herda a cor do fundo onde está. */
export function Breadcrumb({ items }: { items: { name: string; href?: string }[] }) {
  return (
    <nav aria-label="Trilha de navegação" className="text-xs uppercase tracking-[0.16em]">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {items.map((item, index) => (
          <li key={item.name} className="flex items-center gap-2">
            {index > 0 && (
              <span aria-hidden="true" className="opacity-60">
                /
              </span>
            )}
            {item.href ? (
              <Link href={item.href} className="inline-flex min-h-8 items-center opacity-80 hover:underline hover:opacity-100">
                {item.name}
              </Link>
            ) : (
              <span aria-current="page">{item.name}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
