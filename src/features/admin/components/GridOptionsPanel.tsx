"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { errorMessage } from "@/shared/api/problem";
import { FormAlert } from "@/shared/ui/form";
import { adminApi, adminKeys, type AdminColor, type AdminSize } from "../api";
import { PageHeader, SectionTitle, adminButton, adminLink, cellInput } from "./ui";

/** RF-057: os dois eixos da grade. Cada linha salva sozinha; o que está em uso não pode ser removido. */
export function GridOptionsPanel() {
  return (
    <>
      <PageHeader
        title="Acabamentos e tamanhos"
        description="Os valores que você escolhe ao montar a grade de um produto. O nome aparece escrito na loja; a cor só pinta a amostra."
      />
      <div className="grid items-start gap-10 xl:grid-cols-2">
        <ColorsSection />
        <SizesSection />
      </div>
    </>
  );
}

function ColorsSection() {
  const client = useQueryClient();
  const colors = useQuery({ queryKey: adminKeys.colors, queryFn: adminApi.colors });
  const [error, setError] = useState<string | null>(null);
  const refresh = () => client.invalidateQueries({ queryKey: adminKeys.colors });

  const create = useMutation({
    mutationFn: ({ name, hex }: { name: string; hex: string }) => adminApi.createColor(name, hex),
    onSuccess: refresh,
    onError: (e) => setError(errorMessage(e)),
  });

  function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setError(null);
    create.mutate(
      { name: String(data.get("name") ?? ""), hex: String(data.get("hex") ?? "") },
      { onSuccess: () => form.reset() },
    );
  }

  return (
    <section aria-labelledby="titulo-cores">
      <h2 id="titulo-cores" className="font-display text-xl leading-tight">Acabamentos e cores</h2>
      {error && <div className="mt-3"><FormAlert kind="error">{error}</FormAlert></div>}
      {colors.isError && <div className="mt-3"><FormAlert kind="error">{errorMessage(colors.error)}</FormAlert></div>}

      <ul className="mt-3 border-t border-tinta/30">
        {colors.data?.map((color) => <ColorRow key={`${color.id}-${color.name}-${color.hex}`} color={color} onError={setError} onChanged={refresh} />)}
      </ul>

      <form onSubmit={add} className="mt-4 flex flex-wrap items-end gap-3">
        <label className="min-w-40 flex-1 text-xs font-medium uppercase tracking-[0.12em]">
          Novo acabamento ou cor
          <input name="name" required maxLength={60} autoComplete="off" className={`${cellInput} mt-1 normal-case tracking-normal`} />
        </label>
        <label className="text-xs font-medium uppercase tracking-[0.12em]">
          Amostra
          <input name="hex" type="color" defaultValue="#c9a55c" className="mt-1 block h-9 w-14 cursor-pointer bg-transparent" />
        </label>
        <button type="submit" className={adminButton} disabled={create.isPending}>Adicionar</button>
      </form>
    </section>
  );
}

function ColorRow({ color, onError, onChanged }: { color: AdminColor; onError: (message: string | null) => void; onChanged: () => void }) {
  const [name, setName] = useState(color.name);
  const [hex, setHex] = useState(color.hex);
  const dirty = name !== color.name || hex.toLowerCase() !== color.hex.toLowerCase();

  const save = useMutation({
    mutationFn: () => adminApi.updateColor(color.id, name, hex),
    onSuccess: onChanged,
    onError: (e) => onError(errorMessage(e)),
  });
  const remove = useMutation({
    mutationFn: () => adminApi.deleteColor(color.id),
    onSuccess: onChanged,
    onError: (e) => onError(errorMessage(e)),
  });

  return (
    <li className="flex items-center gap-3 border-b border-linha py-1.5">
      <input
        type="color"
        value={hex}
        aria-label={`Amostra de ${color.name}`}
        onChange={(event) => setHex(event.target.value)}
        className="h-8 w-10 shrink-0 cursor-pointer bg-transparent"
      />
      <input value={name} aria-label="Nome" maxLength={60} onChange={(event) => setName(event.target.value)} className={`${cellInput} min-w-0 flex-1`} />
      <span className="numeros shrink-0 text-xs text-tinta-suave">{color.variantCount} var.</span>
      {dirty ? (
        <button type="button" className={adminLink} disabled={save.isPending} onClick={() => { onError(null); save.mutate(); }}>Salvar</button>
      ) : (
        <button
          type="button"
          className={adminLink}
          disabled={color.variantCount > 0 || remove.isPending}
          title={color.variantCount > 0 ? "Em uso em produtos" : undefined}
          onClick={() => { onError(null); remove.mutate(); }}
        >
          Remover
        </button>
      )}
    </li>
  );
}

function SizesSection() {
  const client = useQueryClient();
  const sizes = useQuery({ queryKey: adminKeys.sizes, queryFn: adminApi.sizes });
  const [error, setError] = useState<string | null>(null);
  const refresh = () => client.invalidateQueries({ queryKey: adminKeys.sizes });

  const create = useMutation({
    mutationFn: ({ name, sortOrder }: { name: string; sortOrder: number }) => adminApi.createSize(name, sortOrder),
    onSuccess: refresh,
    onError: (e) => setError(errorMessage(e)),
  });

  function add(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setError(null);
    const last = sizes.data?.at(-1)?.sortOrder ?? 0;
    create.mutate({ name: String(data.get("name") ?? ""), sortOrder: last + 10 }, { onSuccess: () => form.reset() });
  }

  return (
    <section aria-labelledby="titulo-tamanhos">
      <SectionTitleWithId />
      {error && <div className="mt-3"><FormAlert kind="error">{error}</FormAlert></div>}
      {sizes.isError && <div className="mt-3"><FormAlert kind="error">{errorMessage(sizes.error)}</FormAlert></div>}

      <ul className="mt-3 border-t border-tinta/30">
        {sizes.data?.map((size) => <SizeRow key={`${size.id}-${size.name}-${size.sortOrder}`} size={size} onError={setError} onChanged={refresh} />)}
      </ul>

      <form onSubmit={add} className="mt-4 flex flex-wrap items-end gap-3">
        <label className="min-w-40 flex-1 text-xs font-medium uppercase tracking-[0.12em]">
          Novo tamanho
          <input name="name" required maxLength={30} autoComplete="off" placeholder="16, 45 cm, M…" className={`${cellInput} mt-1 normal-case tracking-normal placeholder:text-tinta-suave`} />
        </label>
        <button type="submit" className={adminButton} disabled={create.isPending}>Adicionar</button>
      </form>
    </section>
  );
}

function SectionTitleWithId() {
  return (
    <div id="titulo-tamanhos">
      <SectionTitle>Aros, comprimentos e tamanhos</SectionTitle>
      <p className="mt-1 text-xs text-tinta-suave">A ordem define a sequência na loja: números menores vêm primeiro.</p>
    </div>
  );
}

function SizeRow({ size, onError, onChanged }: { size: AdminSize; onError: (message: string | null) => void; onChanged: () => void }) {
  const [name, setName] = useState(size.name);
  const [order, setOrder] = useState(String(size.sortOrder));
  const dirty = name !== size.name || order !== String(size.sortOrder);

  const save = useMutation({
    mutationFn: () => adminApi.updateSize(size.id, name, Number(order) || 0),
    onSuccess: onChanged,
    onError: (e) => onError(errorMessage(e)),
  });
  const remove = useMutation({
    mutationFn: () => adminApi.deleteSize(size.id),
    onSuccess: onChanged,
    onError: (e) => onError(errorMessage(e)),
  });

  return (
    <li className="flex items-center gap-3 border-b border-linha py-1.5">
      <input value={name} aria-label="Nome" maxLength={30} onChange={(event) => setName(event.target.value)} className={`${cellInput} numeros min-w-0 flex-1`} />
      <div className="w-16 shrink-0">
        <input
          value={order}
          aria-label={`Ordem de ${size.name}`}
          inputMode="numeric"
          onChange={(event) => setOrder(event.target.value.replace(/\D/g, ""))}
          className={`${cellInput} numeros text-right`}
        />
      </div>
      <span className="numeros shrink-0 text-xs text-tinta-suave">{size.variantCount} var.</span>
      {dirty ? (
        <button type="button" className={adminLink} disabled={save.isPending} onClick={() => { onError(null); save.mutate(); }}>Salvar</button>
      ) : (
        <button
          type="button"
          className={adminLink}
          disabled={size.variantCount > 0 || remove.isPending}
          title={size.variantCount > 0 ? "Em uso em produtos" : undefined}
          onClick={() => { onError(null); remove.mutate(); }}
        >
          Remover
        </button>
      )}
    </li>
  );
}
