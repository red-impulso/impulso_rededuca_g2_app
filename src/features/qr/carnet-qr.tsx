"use client";

import { LogoAnimado } from "../../components/brand/logo-animado";
import { codigoAlumno } from "./codigo-alumno";
import { QrSvg } from "./qr-svg";

// Carnet digital del alumno: el docente escanea el QR para dar el presente.
// Se puede mostrar en el celular o imprimir (globals.css: .carnet-imprimible).
export function CarnetQr({
  studentId,
  nombre,
  curso,
  escuela,
}: {
  studentId: string;
  nombre: string;
  curso: string;
  escuela?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-3">
      <section
        aria-label={`Carnet de ${nombre}`}
        className="carnet-imprimible w-full max-w-xs overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-[0_12px_40px_rgba(20,24,90,0.15)]"
      >
        <div className="flex items-center gap-2 bg-ink px-4 py-3 text-white">
          <LogoAnimado size={36} />
          <div className="min-w-0 leading-tight">
            <p className="font-bold">RedEduca</p>
            <p className="truncate text-xs text-white/80">{escuela || "Carnet digital"}</p>
          </div>
        </div>
        <div className="h-1.5 bg-accent" />
        <div className="flex flex-col items-center gap-1 px-5 pb-5 pt-4 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">Carnet de alumno</p>
          <p className="text-xl font-bold text-ink">{nombre}</p>
          <p className="text-sm text-gray-600">{curso}</p>
          <QrSvg
            texto={codigoAlumno(studentId)}
            etiqueta={`Código QR de asistencia de ${nombre}`}
            className="mt-3 h-52 w-52"
          />
          <p className="mt-2 text-xs text-gray-500">Mostralo al docente para dar el presente.</p>
        </div>
      </section>
      <button
        type="button"
        onClick={() => window.print()}
        className="rounded-full border border-ink px-4 py-2 text-sm font-semibold text-ink transition hover:bg-ink hover:text-white print:hidden"
      >
        Imprimir carnet
      </button>
    </div>
  );
}
