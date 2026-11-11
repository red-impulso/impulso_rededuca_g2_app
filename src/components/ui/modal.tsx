"use client";

import { useEffect, type ReactNode } from "react";
import { Icono } from "./estado";

// Ventana modal de la identidad: fondo oscurecido, panel blanco redondeado.
// Se cierra con Escape o tocando el fondo; `onCerrar` decide la lógica.
export function Modal({
  abierto,
  onCerrar,
  titulo,
  children,
  ancho = "max-w-lg",
}: {
  abierto: boolean;
  onCerrar: () => void;
  titulo: string;
  children: ReactNode;
  ancho?: string;
}) {
  useEffect(() => {
    if (!abierto) return;
    function alTeclear(event: KeyboardEvent) {
      if (event.key === "Escape") onCerrar();
    }
    window.addEventListener("keydown", alTeclear);
    return () => window.removeEventListener("keydown", alTeclear);
  }, [abierto, onCerrar]);

  if (!abierto) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4 backdrop-blur-sm"
      onClick={onCerrar}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        className={`w-full ${ancho} max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold">{titulo}</h2>
          <button
            type="button"
            aria-label="Cerrar"
            onClick={onCerrar}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-gray-500 transition hover:bg-gray-100 hover:text-ink"
          >
            <Icono className="h-5 w-5">
              <path d="M6 6l12 12M18 6 6 18" />
            </Icono>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
