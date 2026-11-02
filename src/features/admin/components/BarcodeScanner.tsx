"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { isValidBarcode } from "../validation";
import { adminButton, adminButtonGhost, cellInput } from "./ui";

interface DetectedBarcode {
  rawValue: string;
}

interface BarcodeDetectorLike {
  detect(source: HTMLVideoElement): Promise<DetectedBarcode[]>;
}

declare global {
  interface Window {
    BarcodeDetector?: new (options: { formats: string[] }) => BarcodeDetectorLike;
  }
}

const FORMATS = ["ean_13", "ean_8", "upc_a", "itf"];
const SCAN_INTERVAL_MS = 250;

/**
 * RF-059: "Ler código de barras". O campo já vem focado para o leitor USB, que funciona como teclado e termina com
 * Enter; a câmera só liga quando pedida, com BarcodeDetector ou, onde ele não existe (iPhone), ZXing.
 */
export function BarcodeScanner({ onCode, onClose }: { onCode: (code: string) => void; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const stopCamera = useRef<(() => void) | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    // A limpeza não fecha o diálogo: o evento "close" avisaria quem abriu, e o componente já está saindo da tela.
    if (dialog.current && !dialog.current.open) {
      dialog.current.showModal();
    }
    return () => stopCamera.current?.();
  }, []);

  function accept(code: string) {
    const value = code.trim();
    if (!isValidBarcode(value)) {
      setMessage("Código inválido: confira os números e leia de novo.");
      return;
    }
    stopCamera.current?.();
    onCode(value);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    accept(String(new FormData(event.currentTarget).get("code") ?? ""));
  }

  async function startCamera() {
    setMessage(null);
    const element = video.current;
    if (!element) {
      return;
    }
    setCameraOn(true);
    try {
      stopCamera.current = window.BarcodeDetector ? await startNative(element, accept) : await startZxing(element, accept);
    } catch {
      setCameraOn(false);
      setMessage("Não foi possível abrir a câmera. Confira a permissão do navegador ou digite o código.");
    }
  }

  return (
    <dialog
      ref={dialog}
      onClose={onClose}
      aria-labelledby="leitor-titulo"
      className="m-auto w-full max-w-md bg-cartela p-5 text-tinta shadow-[0_24px_48px_-16px_rgb(0_0_0/0.5)] backdrop:bg-tinta/50"
    >
      <h2 id="leitor-titulo" className="font-display text-2xl leading-tight">Ler código de barras</h2>
      <p className="mt-1 text-sm text-tinta-suave">Use o leitor USB, a câmera ou digite os números.</p>

      <form onSubmit={submit} className="mt-4 flex items-end gap-2">
        <label className="min-w-0 flex-1 text-xs font-medium uppercase tracking-[0.12em]">
          Código
          <input name="code" autoFocus inputMode="numeric" autoComplete="off" className={`${cellInput} numeros mt-1 text-base`} />
        </label>
        <button type="submit" className={adminButton}>Usar</button>
      </form>

      <video ref={video} muted playsInline className={cameraOn ? "mt-4 aspect-video w-full bg-tinta object-cover" : "hidden"} />

      {message && <p role="alert" className="mt-3 text-sm text-alerta">{message}</p>}

      <div className="mt-4 flex justify-between gap-2">
        {cameraOn ? <span className="self-center text-sm text-tinta-suave">Aponte para o código…</span> : (
          <button type="button" className={adminButtonGhost} onClick={() => void startCamera()}>Usar a câmera</button>
        )}
        <button type="button" className={adminButtonGhost} onClick={() => dialog.current?.close()}>Fechar</button>
      </div>
    </dialog>
  );
}

async function startNative(element: HTMLVideoElement, onRead: (code: string) => void): Promise<() => void> {
  const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
  element.srcObject = stream;
  await element.play();

  const Detector = window.BarcodeDetector;
  if (!Detector) {
    throw new Error("BarcodeDetector indisponível.");
  }
  const detector = new Detector({ formats: FORMATS });
  const timer = window.setInterval(() => {
    detector
      .detect(element)
      .then((codes) => {
        const first = codes[0];
        if (first) {
          onRead(first.rawValue);
        }
      })
      .catch(() => undefined);
  }, SCAN_INTERVAL_MS);

  return () => {
    window.clearInterval(timer);
    stream.getTracks().forEach((track) => track.stop());
    element.srcObject = null;
  };
}

async function startZxing(element: HTMLVideoElement, onRead: (code: string) => void): Promise<() => void> {
  // Só baixa a biblioteca quando precisa (iPhone e navegadores sem BarcodeDetector).
  const { BrowserMultiFormatReader } = await import("@zxing/browser");
  const controls = await new BrowserMultiFormatReader().decodeFromVideoDevice(undefined, element, (result) => {
    if (result) {
      onRead(result.getText());
    }
  });
  return () => controls.stop();
}
