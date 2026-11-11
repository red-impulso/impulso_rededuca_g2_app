import type { ReactNode } from "react";
import { Icono } from "./estado";

// Avisos de la identidad: éxito verde, aviso naranja, error rojo, info celeste.
// `Alerta` va en línea dentro de la página; `Toast` flota sobre la pantalla
// (por ejemplo, la confirmación "¡Listo!" después de guardar).
const ESTILOS = {
  exito: {
    caja: "border-verde/30 bg-verde/10 text-verde-fuerte",
    icono: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="m8.5 12.5 2.5 2.5 5-5.5" />
      </>
    ),
  },
  aviso: {
    caja: "border-naranja/50 bg-naranja/15 text-naranja-fuerte",
    icono: (
      <>
        <path d="M12 3 22.5 21h-21z" />
        <path d="M12 10v5M12 18v.5" />
      </>
    ),
  },
  error: {
    caja: "border-rojo/30 bg-rojo/10 text-rojo",
    icono: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="m9 9 6 6M15 9l-6 6" />
      </>
    ),
  },
  info: {
    caja: "border-celeste/50 bg-celeste/15 text-celeste-fuerte",
    icono: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 11v5M12 8v.5" />
      </>
    ),
  },
} as const;

export type TipoAlerta = keyof typeof ESTILOS;

export function Alerta({
  tipo = "info",
  children,
  className = "",
}: {
  tipo?: TipoAlerta;
  children: ReactNode;
  className?: string;
}) {
  const estilo = ESTILOS[tipo];
  return (
    <div
      role={tipo === "error" ? "alert" : "status"}
      className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm font-medium ${estilo.caja} ${className}`}
    >
      <Icono className="mt-0.5 h-5 w-5 shrink-0">{estilo.icono}</Icono>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

// Notificación flotante abajo a la derecha; `onCerrar` es opcional.
export function Toast({
  tipo = "exito",
  children,
  onCerrar,
}: {
  tipo?: TipoAlerta;
  children: ReactNode;
  onCerrar?: () => void;
}) {
  const estilo = ESTILOS[tipo];
  return (
    <div
      role="status"
      className={`fixed bottom-20 right-4 z-50 flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium shadow-lg md:bottom-6 ${estilo.caja} bg-white`}
    >
      <Icono className="h-5 w-5 shrink-0">{estilo.icono}</Icono>
      <span>{children}</span>
      {onCerrar && (
        <button type="button" aria-label="Cerrar aviso" onClick={onCerrar} className="shrink-0">
          <Icono className="h-4 w-4">
            <path d="M6 6l12 12M18 6 6 18" />
          </Icono>
        </button>
      )}
    </div>
  );
}
