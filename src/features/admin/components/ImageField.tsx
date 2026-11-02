"use client";

import { useMutation } from "@tanstack/react-query";
import Image from "next/image";
import { useState, type ChangeEvent } from "react";
import { errorMessage } from "@/shared/api/problem";
import { ACCEPT_ATTRIBUTE, fileProblem } from "../photos";
import { adminButtonGhost, adminLink } from "./ui";

interface ImageFieldProps {
  label: string;
  imageUrl: string | null;
  onUpload: (file: File) => Promise<unknown>;
  onRemove: () => Promise<unknown>;
  onChanged: () => void;
}

/** Imagem única de coleção ou ocasião (RF-061): as mesmas regras e o mesmo tratamento das fotos de produto, na API. */
export function ImageField({ label, imageUrl, onUpload, onRemove, onChanged }: ImageFieldProps) {
  const [error, setError] = useState<string | null>(null);
  const upload = useMutation({ mutationFn: onUpload, onSuccess: onChanged, onError: (e) => setError(errorMessage(e)) });
  const remove = useMutation({ mutationFn: onRemove, onSuccess: onChanged, onError: (e) => setError(errorMessage(e)) });
  const busy = upload.isPending || remove.isPending;

  function onPick(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = ""; // para poder escolher o mesmo arquivo de novo
    if (!file) {
      return;
    }
    const problem = fileProblem(file);
    setError(problem);
    if (!problem) {
      upload.mutate(file);
    }
  }

  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-[0.16em]">{label}</p>
      {imageUrl && (
        <div className="relative mt-2 aspect-[3/1] overflow-hidden bg-linha/60">
          <Image src={imageUrl} alt="" fill sizes="384px" className="object-cover" />
        </div>
      )}
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <label className={`${adminButtonGhost} cursor-pointer has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-tinta ${busy ? "pointer-events-none opacity-60" : ""}`}>
          {upload.isPending ? "Enviando…" : imageUrl ? "Trocar imagem" : "Escolher imagem"}
          <input type="file" accept={ACCEPT_ATTRIBUTE} disabled={busy} onChange={onPick} className="sr-only" />
        </label>
        {imageUrl && (
          <button
            type="button"
            className={adminLink}
            disabled={busy}
            onClick={() => {
              setError(null);
              remove.mutate();
            }}
          >
            Remover imagem
          </button>
        )}
      </div>
      <p className="mt-1.5 text-xs text-tinta-suave">Opcional. JPEG, PNG, WebP ou HEIC, até 15 MB.</p>
      {error && <p role="alert" className="mt-1.5 text-sm text-alerta">{error}</p>}
    </div>
  );
}
