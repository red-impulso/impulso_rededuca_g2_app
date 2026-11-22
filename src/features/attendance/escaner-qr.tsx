"use client";

import { useEffect, useRef, useState } from "react";

type Estado = { tipo: "iniciando" } | { tipo: "listo" } | { tipo: "error"; mensaje: string };

function mensajeDeError(error: unknown): string {
  const nombre = (error as { name?: string } | null)?.name;
  if (nombre === "NotAllowedError" || nombre === "SecurityError") {
    return "No diste permiso para usar la cámara. Habilitalo en el navegador (el candado al lado de la dirección) y volvé a abrir el escáner.";
  }
  if (nombre === "NotFoundError" || nombre === "OverconstrainedError") {
    return "No encontramos una cámara en este dispositivo.";
  }
  return "No se pudo prender la cámara. Probá de nuevo.";
}

// Ventana con la cámara: cada QR que lee lo pasa a onCodigo (puede repetirse:
// el que lo usa decide qué hacer). Al cerrarse apaga la cámara.
export function EscanerQr({
  onCodigo,
  onCerrar,
  mensaje,
}: {
  onCodigo: (texto: string) => void;
  onCerrar: () => void;
  mensaje?: string;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const onCodigoRef = useRef(onCodigo);
  const [estado, setEstado] = useState<Estado>({ tipo: "iniciando" });

  useEffect(() => {
    onCodigoRef.current = onCodigo;
  }, [onCodigo]);

  useEffect(() => {
    let cancelado = false;
    let stream: MediaStream | null = null;
    let cuadro = 0;

    const camaras = typeof navigator === "undefined" ? undefined : navigator.mediaDevices;
    if (!camaras?.getUserMedia) {
      // Asincrónico, como si la cámara hubiera contestado.
      queueMicrotask(() => {
        if (!cancelado) setEstado({ tipo: "error", mensaje: "No encontramos una cámara en este dispositivo." });
      });
      return () => {
        cancelado = true;
      };
    }

    camaras
      .getUserMedia({ video: { facingMode: "environment" }, audio: false })
      .then(async (s) => {
        if (cancelado) {
          s.getTracks().forEach((t) => t.stop());
          return;
        }
        stream = s;
        const video = videoRef.current;
        if (!video) return;
        video.srcObject = s;
        await video.play().catch(() => {});
        if (cancelado) return;
        setEstado({ tipo: "listo" });

        const { default: jsQR } = await import("jsqr");
        const lienzo = document.createElement("canvas");
        let contexto: CanvasRenderingContext2D | null = null;
        try {
          contexto = lienzo.getContext("2d", { willReadFrequently: true });
        } catch {
          contexto = null;
        }
        let ultimaLectura = 0;

        const leer = (ms: number) => {
          if (cancelado) return;
          // ~8 lecturas por segundo alcanzan y no calientan el celular.
          if (contexto && ms - ultimaLectura > 120 && video.readyState >= 2) {
            ultimaLectura = ms;
            const ancho = video.videoWidth;
            const alto = video.videoHeight;
            if (ancho && alto) {
              lienzo.width = ancho;
              lienzo.height = alto;
              contexto.drawImage(video, 0, 0, ancho, alto);
              const imagen = contexto.getImageData(0, 0, ancho, alto);
              const codigo = jsQR(imagen.data, ancho, alto, { inversionAttempts: "dontInvert" });
              if (codigo?.data) onCodigoRef.current(codigo.data);
            }
          }
          cuadro = requestAnimationFrame(leer);
        };
        cuadro = requestAnimationFrame(leer);
      })
      .catch((error) => {
        if (!cancelado) setEstado({ tipo: "error", mensaje: mensajeDeError(error) });
      });

    return () => {
      cancelado = true;
      cancelAnimationFrame(cuadro);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="escaner-titulo"
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 p-4"
    >
      <div className="flex w-full max-w-md flex-col gap-3 rounded-3xl bg-white p-4 shadow-2xl">
        <h2 id="escaner-titulo" className="text-lg font-semibold text-ink">
          Escanear carnets
        </h2>

        <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-ink">
          <video ref={videoRef} muted playsInline className="h-full w-full object-cover" />
          {estado.tipo === "listo" && (
            <span
              aria-hidden
              className="pointer-events-none absolute inset-[18%] rounded-2xl border-4 border-accent shadow-[0_0_0_999px_rgba(20,24,90,0.35)]"
            />
          )}
        </div>

        {estado.tipo === "iniciando" && <p className="text-sm text-gray-600">Prendiendo la cámara...</p>}
        {estado.tipo === "listo" && <p className="text-sm text-gray-600">Apuntá la cámara al QR del carnet.</p>}
        {estado.tipo === "error" && (
          <p role="alert" className="text-sm text-rojo">
            {estado.mensaje}
          </p>
        )}

        {mensaje && <p className="rounded-xl bg-green/15 px-3 py-2 text-center font-semibold text-ink">{mensaje}</p>}

        <button
          type="button"
          onClick={onCerrar}
          className="rounded-full bg-accent px-6 py-3 font-semibold text-ink transition hover:brightness-95"
        >
          Listo
        </button>
      </div>
    </div>
  );
}
