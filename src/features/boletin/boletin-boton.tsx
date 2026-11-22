"use client";

import { useContext, useState } from "react";
import { ApiError, apiFetch } from "../../lib/api";
import { SessionContext } from "../session/session-provider";
import type { NotaAlumno, ResumenAsistencia } from "./boletin";

// Lo que devuelve GET /me/students (hijos del tutor).
interface Hijo {
  id: string;
  firstName: string | null;
  lastName: string | null;
  course: { year: number; division: string } | null;
}

function fechaDeHoy(): string {
  const hoy = new Date();
  const dos = (n: number) => String(n).padStart(2, "0");
  return `${dos(hoy.getDate())}/${dos(hoy.getMonth() + 1)}/${hoy.getFullYear()}`;
}

// Botón "Descargar boletín (PDF)". Si no se le pasa el alumno (página del
// tutor), busca nombre y curso entre los hijos del tutor.
export function BoletinBoton({
  institutionId,
  studentId,
  alumno,
}: {
  institutionId: string;
  studentId: string;
  alumno?: { nombre: string; curso: string };
}) {
  // Sin sesión (por ejemplo en tests) el boletín sale sin el nombre de la escuela.
  const session = useContext(SessionContext);
  const [generando, setGenerando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function buscarAlumno(): Promise<{ nombre: string; curso: string }> {
    if (alumno) return alumno;
    const hijos = await apiFetch<Hijo[]>("/me/students", { institutionId });
    const hijo = hijos.find((h) => h.id === studentId);
    return {
      nombre: hijo ? `${hijo.lastName ?? ""}, ${hijo.firstName ?? ""}` : "Alumno",
      curso: hijo?.course ? `${hijo.course.year}° Año ${hijo.course.division}` : "—",
    };
  }

  async function descargar() {
    setGenerando(true);
    setError(null);
    try {
      const [notas, asistencia, datosAlumno, boletin] = await Promise.all([
        apiFetch<NotaAlumno[]>(`/students/${studentId}/grades`, { institutionId }),
        apiFetch<{ summary: ResumenAsistencia }>(`/students/${studentId}/attendance`, { institutionId }),
        buscarAlumno(),
        // jsPDF pesa: se carga recién cuando hace falta.
        import("./boletin"),
      ]);
      boletin.descargarBoletin({
        escuela: session?.status === "ready" ? (session.activeMembership?.institutionName ?? "") : "",
        alumno: datosAlumno.nombre,
        curso: datosAlumno.curso,
        emitido: fechaDeHoy(),
        filas: boletin.filasBoletin(notas),
        asistencia: asistencia.summary,
      });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "No se pudo armar el boletín. Probá de nuevo en un rato.");
    } finally {
      setGenerando(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        type="button"
        onClick={descargar}
        disabled={generando}
        className="flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(20,24,90,0.2)] transition hover:brightness-110 disabled:opacity-60"
      >
        <svg viewBox="0 0 24 24" aria-hidden className="h-4 w-4 fill-none stroke-current" strokeWidth="2">
          <path d="M12 4v11m0 0-4-4m4 4 4-4M5 19h14" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {generando ? "Generando boletín..." : "Descargar boletín (PDF)"}
      </button>
      {error && (
        <p role="alert" className="text-sm text-rojo">
          {error}
        </p>
      )}
    </div>
  );
}
