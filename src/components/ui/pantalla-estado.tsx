import type { ReactNode } from "react";
import { Cargando, Estado, Icono } from "./estado";

// Estados de pantalla completa de UX/UI: alumnos, docentes, usuarios y escuelas.

export const BOTON_NARANJA = "rounded-full bg-accent px-8 py-2.5 font-medium text-white";

export const BOTON_ACCION =
  "inline-flex items-center justify-center gap-2 rounded-xl px-6 py-2.5 font-medium text-white disabled:opacity-50";

// Tarjeta de los estados, con los cuartos de círculo de las esquinas.
export function Marco({ arriba, abajo, children }: { arriba: string; abajo: string; children: ReactNode }) {
  return (
    <div className="relative overflow-hidden rounded-2xl">
      {children}
      <span aria-hidden className={`absolute -right-12 -top-12 h-28 w-28 rounded-full ${arriba}`} />
      <span aria-hidden className={`absolute -bottom-14 -left-14 h-32 w-32 rounded-full ${abajo}`} />
    </div>
  );
}

export function Circulo({ fondo, children }: { fondo: string; children: ReactNode }) {
  return <span className={`flex h-28 w-28 items-center justify-center rounded-full ${fondo}`}>{children}</span>;
}

export function IconoReintentar() {
  return (
    <Icono className="h-5 w-5">
      <path d="M20 12a8 8 0 1 1-2.4-5.7M20 3v5h-5" />
    </Icono>
  );
}

export function PantallaCargando({ titulo }: { titulo: string }) {
  return (
    <Marco arriba="bg-accent/30" abajo="bg-accent/30">
      <Estado ilustracion={<Cargando bicolor />} titulo={titulo} texto="Por favor, esperá un momento." />
    </Marco>
  );
}

// `children` son los botones: cada pantalla pone el suyo.
export function PantallaVacia({
  titulo,
  texto,
  icono,
  fondoIcono = "bg-blue/10",
  colorIcono = "text-blue",
  children,
}: {
  titulo: string;
  texto: string;
  icono: ReactNode;
  fondoIcono?: string;
  colorIcono?: string;
  children?: ReactNode;
}) {
  return (
    <Marco arriba="bg-accent/30" abajo="bg-blue/20">
      <Estado
        ilustracion={
          <Circulo fondo={fondoIcono}>
            <Icono className={`h-14 w-14 ${colorIcono}`}>{icono}</Icono>
          </Circulo>
        }
        titulo={titulo}
        texto={texto}
      >
        <div className="relative z-10 mt-1">{children}</div>
      </Estado>
    </Marco>
  );
}

export function PantallaError({
  titulo,
  texto = "Ocurrió un problema al obtener la información. Por favor, intentá nuevamente.",
  claseBoton = BOTON_NARANJA,
  tono = "rojo",
  onReintentar,
}: {
  titulo: string;
  texto?: string;
  claseBoton?: string;
  tono?: "rojo" | "naranja";
  onReintentar: () => void;
}) {
  return (
    <div role="alert">
      <Marco arriba="bg-blue/20" abajo="bg-accent/30">
        <Estado
          ilustracion={
            <Circulo fondo={tono === "rojo" ? "bg-red-50" : "bg-accent/15"}>
              <Icono className={`h-14 w-14 ${tono === "rojo" ? "text-red-600" : "text-accent"}`}>
                <path d="M12 3 22.5 21h-21zM12 10v5M12 18v.5" />
              </Icono>
            </Circulo>
          }
          titulo={titulo}
          texto={texto}
        >
          <button type="button" onClick={onReintentar} className={`relative z-10 mt-1 ${claseBoton}`}>
            {claseBoton !== BOTON_NARANJA && <IconoReintentar />}
            Reintentar
          </button>
        </Estado>
      </Marco>
    </div>
  );
}

// El botón de después lo pone cada pantalla: la lista navega, la ficha recarga.
export function PantallaGuardada({
  texto = "La información se actualizó correctamente.",
  children,
}: {
  texto?: string;
  children: ReactNode;
}) {
  return (
    <Marco arriba="bg-accent/30" abajo="bg-blue/20">
      <Estado
        ilustracion={
          <Circulo fondo="bg-green/10">
            <Icono className="h-16 w-16 text-green">
              <circle cx="12" cy="12" r="9.5" />
              <path d="m8 12.5 2.5 2.5 5.5-5.5" />
            </Icono>
          </Circulo>
        }
        titulo="¡Cambios guardados!"
        texto={texto}
      >
        <div className="relative z-10 mt-1">{children}</div>
      </Estado>
    </Marco>
  );
}

// Confirmación que queda arriba de la lista hasta que se cierra.
export function Aviso({ texto, onCerrar }: { texto: string; onCerrar: () => void }) {
  return (
    <div
      role="status"
      className="flex items-center gap-3 rounded-xl border border-green/20 bg-green/10 px-4 py-3 text-sm font-medium text-green"
    >
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green text-white">
        <Icono className="h-4 w-4">
          <path d="m6 12.5 4 4 8-8.5" />
        </Icono>
      </span>
      <span className="min-w-0 flex-1">{texto}</span>
      <button type="button" aria-label="Cerrar aviso" onClick={onCerrar} className="shrink-0">
        <Icono className="h-5 w-5">
          <path d="M6 6l12 12M18 6 6 18" />
        </Icono>
      </button>
    </div>
  );
}

export function Avatar({ iniciales, grande, mediano }: { iniciales: string; grande?: boolean; mediano?: boolean }) {
  const medida = grande
    ? "h-20 w-20 text-2xl sm:h-24 sm:w-24 sm:text-3xl"
    : mediano
      ? "h-14 w-14 text-lg md:h-10 md:w-10 md:text-sm"
      : "h-14 w-14 text-lg";

  return (
    <span
      aria-hidden
      className={`flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-ink to-blue font-semibold text-white ${medida}`}
    >
      {iniciales}
    </span>
  );
}

// "Laura Gómez" -> "LG"
export function inicialesDe(nombre: string | null): string {
  return (nombre ?? "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((palabra) => palabra[0].toUpperCase())
    .join("");
}
