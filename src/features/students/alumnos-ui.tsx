import Link from "next/link";
import { Icono } from "../../components/ui/estado";
import { BOTON_NARANJA, PantallaVacia } from "../../components/ui/pantalla-estado";

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

export function AlumnosVacio({ onNuevo }: { onNuevo: () => void }) {
  return (
    <PantallaVacia
      titulo="No hay alumnos registrados"
      texto="Podés agregar el primer alumno haciendo clic en el botón “Nuevo alumno”."
      icono={<path d="M3 19V6a1 1 0 0 1 1-1h5l2 2h8a1 1 0 0 1 1 1v2M3 19l3-8h16l-3 8z" />}
      fondoIcono="bg-accent/10"
      colorIcono="text-ink"
    >
      <button type="button" onClick={onNuevo} className={BOTON_NARANJA}>
        Nuevo alumno
      </button>
    </PantallaVacia>
  );
}
