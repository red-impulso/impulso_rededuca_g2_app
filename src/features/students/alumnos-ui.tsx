import Link from "next/link";
import type { ReactNode } from "react";
import { Cargando, Estado, Icono } from "../../components/ui/estado";

export const BOTON_NARANJA = "rounded-full bg-accent px-8 py-2.5 font-medium text-white";

// Título de pantalla: con flecha si hay adónde volver, si no con el ícono de alumnos.
export function TituloAlumnos({
  titulo,
  volver,
}: {
  titulo: string;
  volver?: { href: string; nombre: string };
}) {
  return (
    <div className="flex items-center gap-3 text-ink">
      {volver ? (
        <Link href={volver.href} aria-label={volver.nombre}>
          <Icono className="h-7 w-7">
            <path d="M20 12H4M11 5l-7 7 7 7" />
          </Icono>
        </Link>
      ) : (
        <Icono className="h-8 w-8">
          <circle cx="9" cy="8" r="3.5" />
          <path d="M2.5 20c0-4 3-6.5 6.5-6.5s6.5 2.5 6.5 6.5M16 5a3.5 3.5 0 0 1 0 6.5M18 14c2 .8 3.5 3 3.5 6" />
        </Icono>
      )}
      <h1 className="text-2xl font-semibold">{titulo}</h1>
    </div>
  );
}

// Tarjeta de los estados, con los cuartos de círculo de las esquinas.
function Marco({ arriba, abajo, children }: { arriba: string; abajo: string; children: ReactNode }) {
  return (
    <div className="relative overflow-hidden rounded-2xl">
      {children}
      <span aria-hidden className={`absolute -right-12 -top-12 h-28 w-28 rounded-full ${arriba}`} />
      <span aria-hidden className={`absolute -bottom-14 -left-14 h-32 w-32 rounded-full ${abajo}`} />
    </div>
  );
}

function Circulo({ fondo, children }: { fondo: string; children: ReactNode }) {
  return <span className={`flex h-28 w-28 items-center justify-center rounded-full ${fondo}`}>{children}</span>;
}

export function AlumnosCargando({ titulo }: { titulo: string }) {
  return (
    <Marco arriba="bg-accent/30" abajo="bg-accent/30">
      <Estado ilustracion={<Cargando bicolor />} titulo={titulo} texto="Por favor, esperá un momento." />
    </Marco>
  );
}

export function AlumnosVacio({ onNuevo }: { onNuevo: () => void }) {
  return (
    <Marco arriba="bg-accent/30" abajo="bg-blue/20">
      <Estado
        ilustracion={
          <Circulo fondo="bg-accent/10">
            <Icono className="h-14 w-14 text-ink">
              <path d="M3 19V6a1 1 0 0 1 1-1h5l2 2h8a1 1 0 0 1 1 1v2M3 19l3-8h16l-3 8z" />
            </Icono>
          </Circulo>
        }
        titulo="No hay alumnos registrados"
        texto="Podés agregar el primer alumno haciendo clic en el botón “Nuevo alumno”."
      >
        <button type="button" onClick={onNuevo} className={`relative z-10 mt-1 ${BOTON_NARANJA}`}>
          Nuevo alumno
        </button>
      </Estado>
    </Marco>
  );
}

export function AlumnosError({
  titulo,
  texto = "Ocurrió un problema al obtener la información. Por favor, intentá nuevamente.",
  onReintentar,
}: {
  titulo: string;
  texto?: string;
  onReintentar: () => void;
}) {
  return (
    <div role="alert">
      <Marco arriba="bg-blue/20" abajo="bg-accent/30">
        <Estado
          ilustracion={
            <Circulo fondo="bg-red-50">
              <Icono className="h-14 w-14 text-red-600">
                <path d="M12 3 22.5 21h-21zM12 10v5M12 18v.5" />
              </Icono>
            </Circulo>
          }
          titulo={titulo}
          texto={texto}
        >
          <button type="button" onClick={onReintentar} className={`relative z-10 mt-1 ${BOTON_NARANJA}`}>
            Reintentar
          </button>
        </Estado>
      </Marco>
    </div>
  );
}

// El botón "Ver alumno" lo pone cada pantalla: la lista navega, la ficha recarga.
export function AlumnoGuardado({ children }: { children: ReactNode }) {
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
        texto="La información se actualizó correctamente."
      >
        <div className="relative z-10 mt-1">{children}</div>
      </Estado>
    </Marco>
  );
}

export function Avatar({ iniciales, grande }: { iniciales: string; grande?: boolean }) {
  return (
    <span
      aria-hidden
      className={`flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-ink to-blue font-semibold text-white ${
        grande ? "h-20 w-20 text-2xl sm:h-24 sm:w-24 sm:text-3xl" : "h-14 w-14 text-lg"
      }`}
    >
      {iniciales}
    </span>
  );
}
