"use client";

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, rectSortingStrategy, sortableKeyboardCoordinates, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { useState, type ChangeEvent } from "react";
import { errorMessage } from "@/shared/api/problem";
import { FormAlert } from "@/shared/ui/form";
import { adminApi, adminKeys, type AdminProduct, type AdminProductImage } from "../api";
import { ACCEPT_ATTRIBUTE, MAX_FILES_AT_ONCE, PARALLEL_UPLOADS, RECOMMENDED_LONG_SIDE, fileProblem, isLowResolution, moveItem, runWithLimit, suggestAlt } from "../photos";
import { SectionTitle, adminButton, adminButtonGhost, adminLink, cellInput } from "./ui";

type QueueStatus = "waiting" | "sending" | "done" | "error";

interface QueueItem {
  id: number;
  name: string;
  status: QueueStatus;
  message?: string;
}

const STATUS_LABEL: Record<QueueStatus, string> = {
  waiting: "Na fila",
  sending: "Enviando…",
  done: "Enviada",
  error: "Não enviada",
};

let nextQueueId = 1;

/** RF-061: envio com fila, galeria por acabamento e capa. Tudo mora na API; aqui só a fila é estado local. */
export function ProductPhotos({ product, onChanged }: { product: AdminProduct; onChanged: () => void }) {
  const colors = useQuery({ queryKey: adminKeys.colors, queryFn: adminApi.colors });
  const [colorId, setColorId] = useState("");
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const colorOptions = colors.data ?? [];
  const colorName = (id: string | null) => colorOptions.find((color) => color.id === id)?.name ?? null;
  const productColorIds = [...new Set(product.variants.map((variant) => variant.colorId).filter((id): id is string => id !== null))];
  const galleries = galleryIds(product, productColorIds);

  const patchItem = (id: number, patch: Partial<QueueItem>) =>
    setQueue((items) => items.map((item) => (item.id === id ? { ...item, ...patch } : item)));

  async function send(files: File[]) {
    setError(null);
    if (files.length > MAX_FILES_AT_ONCE) {
      setError(`Escolha até ${MAX_FILES_AT_ONCE} fotos de uma vez. As primeiras ${MAX_FILES_AT_ONCE} foram para a fila.`);
    }

    const accepted: { file: File; item: QueueItem }[] = [];
    const items = files.slice(0, MAX_FILES_AT_ONCE).map((file) => {
      const problem = fileProblem(file);
      const item: QueueItem = { id: nextQueueId++, name: file.name, status: problem ? "error" : "waiting", message: problem ?? undefined };
      if (!problem) {
        accepted.push({ file, item });
      }
      return item;
    });
    setQueue((current) => [...current.filter((item) => item.status !== "done"), ...items]);

    const targetColor = colorId || null;
    const alt = suggestAlt(product.name, colorName(targetColor));

    // Uma requisição por foto (limite de 100 MB do Cloudflare). A falha de uma não impede as outras.
    await runWithLimit(accepted, PARALLEL_UPLOADS, async ({ file, item }) => {
      patchItem(item.id, { status: "sending" });
      try {
        const uploaded = await adminApi.uploadImage(product.id, file, alt, targetColor);
        patchItem(item.id, {
          status: "done",
          message: isLowResolution(uploaded.width, uploaded.height)
            ? `Tem ${Math.max(uploaded.width, uploaded.height)} px no lado maior; o ideal é ${RECOMMENDED_LONG_SIDE} px ou mais.`
            : undefined,
        });
      } catch (e) {
        patchItem(item.id, { status: "error", message: errorMessage(e) });
      }
    });
    onChanged();
  }

  function onPick(event: ChangeEvent<HTMLInputElement>) {
    const files = [...(event.target.files ?? [])];
    event.target.value = ""; // para poder escolher o mesmo arquivo de novo
    if (files.length > 0) {
      void send(files);
    }
  }

  const busy = queue.some((item) => item.status === "waiting" || item.status === "sending");

  return (
    <div className="mt-3 space-y-6">
      {error && <FormAlert kind="info">{error}</FormAlert>}

      <div className="flex flex-wrap items-end gap-3">
        <label className="min-w-52 text-xs font-medium uppercase tracking-[0.16em]">
          Estas fotos são de
          <select
            value={colorId}
            onChange={(event) => setColorId(event.target.value)}
            className="mt-1 block min-h-10 w-full cursor-pointer border-b border-tinta/40 bg-transparent text-sm normal-case tracking-normal"
          >
            <option value="">Todos os acabamentos</option>
            {colorOptions
              .filter((color) => productColorIds.includes(color.id))
              .map((color) => (
                <option key={color.id} value={color.id}>{color.name}</option>
              ))}
          </select>
        </label>
        <label className={`${adminButton} cursor-pointer has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-tinta`}>
          Escolher fotos
          <input type="file" multiple accept={ACCEPT_ATTRIBUTE} onChange={onPick} className="sr-only" />
        </label>
        {/* A câmera abre direto no celular; no computador o atributo não faz diferença, então o botão some. */}
        <label className={`${adminButtonGhost} cursor-pointer has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-tinta sm:hidden`}>
          Tirar foto
          <input type="file" accept="image/*" capture="environment" onChange={onPick} className="sr-only" />
        </label>
      </div>
      <p className="text-xs text-tinta-suave">
        JPEG, PNG, WebP ou HEIC (iPhone), até 15 MB cada e {MAX_FILES_AT_ONCE} de uma vez. A localização gravada na foto é removida.
      </p>

      {queue.length > 0 && (
        <div>
          <ul aria-live="polite" className="border-t border-linha text-sm">
            {queue.map((item) => (
              <li key={item.id} className="flex flex-wrap items-baseline justify-between gap-x-4 border-b border-linha py-1.5">
                <span className="min-w-0 truncate">{item.name}</span>
                <span className={item.status === "error" ? "text-alerta" : "text-tinta-suave"}>
                  {STATUS_LABEL[item.status]}
                  {item.message ? `. ${item.message}` : ""}
                </span>
              </li>
            ))}
          </ul>
          {!busy && (
            <button type="button" className={`${adminLink} mt-2`} onClick={() => setQueue([])}>Limpar a lista</button>
          )}
        </div>
      )}

      {product.images.length === 0 ? (
        <p className="border border-dashed border-tinta/30 p-6 text-sm text-tinta-suave">
          Nenhuma foto ainda. A peça só pode entrar na loja com ao menos uma foto.
        </p>
      ) : (
        galleries.map((gallery) => (
          <Gallery
            key={gallery ?? "todas"}
            product={product}
            colorId={gallery}
            title={gallery ? (colorName(gallery) ?? "Acabamento") : "Todos os acabamentos"}
            colorOptions={colorOptions.filter((color) => productColorIds.includes(color.id) || color.id === gallery)}
            onChanged={onChanged}
          />
        ))
      )}
    </div>
  );
}

/** Galerias com foto: primeiro a de todos os acabamentos, depois as da grade, e por fim fotos de acabamentos que saíram dela. */
function galleryIds(product: AdminProduct, productColorIds: string[]): (string | null)[] {
  const withPhotos = new Set(product.images.map((image) => image.colorId));
  const known = [null, ...productColorIds].filter((id) => withPhotos.has(id));
  const others = [...withPhotos].filter((id) => !known.includes(id));
  return [...known, ...others];
}

interface GalleryProps {
  product: AdminProduct;
  colorId: string | null;
  title: string;
  colorOptions: { id: string; name: string }[];
  onChanged: () => void;
}

function Gallery({ product, colorId, title, colorOptions, onChanged }: GalleryProps) {
  const client = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const images = product.images.filter((image) => image.colorId === colorId).toSorted((a, b) => a.position - b.position);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const reorder = useMutation({
    mutationFn: (ids: string[]) => adminApi.reorderImages(product.id, colorId, ids),
    onMutate: (ids) => {
      // Mostra a nova ordem na hora; se a API recusar, o onSettled traz de volta a ordem real.
      client.setQueryData<AdminProduct>(adminKeys.product(product.id), (current) =>
        current && {
          ...current,
          images: current.images.map((image) => {
            const position = ids.indexOf(image.id);
            return position === -1 ? image : { ...image, position };
          }),
        },
      );
    },
    onError: (e) => setError(errorMessage(e)),
    onSettled: onChanged,
  });

  function onDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) {
      return;
    }
    const ids = images.map((image) => image.id);
    setError(null);
    reorder.mutate(moveItem(ids, ids.indexOf(String(active.id)), ids.indexOf(String(over.id))));
  }

  return (
    <section aria-label={`Fotos: ${title}`}>
      <SectionTitle>{title}</SectionTitle>
      {error && <div className="mt-2"><FormAlert kind="error">{error}</FormAlert></div>}
      <DndContext id={`galeria-${colorId ?? "todas"}`} sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={images.map((image) => image.id)} strategy={rectSortingStrategy}>
          <ul className="mt-3 grid grid-cols-[repeat(auto-fill,minmax(9rem,1fr))] gap-3 sm:grid-cols-[repeat(auto-fill,minmax(10.5rem,1fr))] sm:gap-4">
            {images.map((image, index) => (
              <PhotoCard
                key={image.id}
                product={product}
                image={image}
                isCover={index === 0}
                colorOptions={colorOptions}
                onChanged={onChanged}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>
    </section>
  );
}

interface PhotoCardProps {
  product: AdminProduct;
  image: AdminProductImage;
  isCover: boolean;
  colorOptions: { id: string; name: string }[];
  onChanged: () => void;
}

function PhotoCard({ product, image, isCover, colorOptions, onChanged }: PhotoCardProps) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id: image.id });
  const [alt, setAlt] = useState(image.alt);
  const [error, setError] = useState<string | null>(null);

  const update = useMutation({
    mutationFn: (changes: { alt: string; colorId: string | null }) => adminApi.updateImage(product.id, image.id, changes.alt, changes.colorId),
    onSuccess: onChanged,
    onError: (e) => setError(errorMessage(e)),
  });
  const remove = useMutation({
    mutationFn: () => adminApi.deleteImage(product.id, image.id),
    onSuccess: onChanged,
    onError: (e) => setError(errorMessage(e)),
  });

  function saveAlt() {
    const trimmed = alt.trim();
    if (!trimmed) {
      setAlt(image.alt);
      setError("Descreva a foto: quem não enxerga depende deste texto.");
    } else if (trimmed !== image.alt) {
      setError(null);
      update.mutate({ alt: trimmed, colorId: image.colorId });
    }
  }

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`border border-linha bg-cartela ${isDragging ? "relative z-10 shadow-[0_14px_26px_-16px_rgb(74_40_44/0.6)]" : ""}`}
    >
      <button
        ref={setActivatorNodeRef}
        type="button"
        {...attributes}
        {...listeners}
        aria-label={`Mover a foto ${image.alt}. Use espaço para pegar e as setas para mover.`}
        className="relative block aspect-[4/5] w-full cursor-grab touch-none overflow-hidden bg-linha/60 active:cursor-grabbing"
      >
        <Image src={image.url} alt="" fill sizes="(min-width: 640px) 240px, 50vw" className="pointer-events-none object-cover" />
        {isCover && (
          <span className="absolute left-0 top-0 bg-tinta px-2 py-0.5 text-xs font-medium text-cartela">Capa</span>
        )}
      </button>
      <div className="space-y-2 p-2">
        <label className="block text-xs text-tinta-suave">
          Descrição da foto
          <input value={alt} maxLength={200} onChange={(event) => setAlt(event.target.value)} onBlur={saveAlt} className={`${cellInput} text-tinta`} />
        </label>
        <label className="block text-xs text-tinta-suave">
          Acabamento
          <select
            value={image.colorId ?? ""}
            disabled={update.isPending}
            onChange={(event) => {
              setError(null);
              update.mutate({ alt: alt.trim() || image.alt, colorId: event.target.value || null });
            }}
            className="mt-0.5 block min-h-9 w-full cursor-pointer border-b border-tinta/30 bg-transparent text-sm text-tinta"
          >
            <option value="">Todos</option>
            {colorOptions.map((color) => (
              <option key={color.id} value={color.id}>{color.name}</option>
            ))}
          </select>
        </label>
        {isLowResolution(image.width, image.height) && (
          <p className="text-xs text-tinta-suave">Foto pequena: {Math.max(image.width ?? 0, image.height ?? 0)} px no lado maior.</p>
        )}
        {error && <p role="alert" className="text-xs text-alerta">{error}</p>}
        <button
          type="button"
          className={adminLink}
          disabled={remove.isPending}
          onClick={() => {
            setError(null);
            if (window.confirm("Remover esta foto?")) {
              remove.mutate();
            }
          }}
        >
          Remover
        </button>
      </div>
    </li>
  );
}
