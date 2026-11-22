"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ApiError, apiFetch } from "../../lib/api";

// Lo que devuelve GET /alerts (alertas tempranas, ver README de la API).
type Motivo =
  | { type: "attendance"; percentage: number }
  | { type: "grade"; subject: { id: string; name: string }; average: number };

interface AlumnoEnRiesgo {
  student: { id: string; firstName: string | null; lastName: string | null };
  course: { id: string; year: number; division: string };
  reasons: Motivo[];
}

type Carga =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; alumnos: AlumnoEnRiesgo[] };

function conComa(valor: number): string {
  return String(valor).replace(".", ",");
}

function textoMotivo(motivo: Motivo): string {
  return motivo.type === "attendance"
    ? `Asistencia ${conComa(motivo.percentage)} %`
    : `${motivo.subject.name}: ${conComa(motivo.average)}`;
}

function nombre({ student }: AlumnoEnRiesgo): string {
  return [student.firstName, student.lastName].filter(Boolean).join(" ");
}

// Tarjeta "Alumnos en riesgo": para la dirección (con enlace a la ficha) y
// para el docente (solo sus cursos, sin enlace).
export function AlertasRiesgo({ institutionId, conEnlace = false }: { institutionId: string; conEnlace?: boolean }) {
  const [carga, setCarga] = useState<Carga>({ status: "loading" });
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    let cancelado = false;
    apiFetch<AlumnoEnRiesgo[]>("/alerts", { institutionId })
      .then((alumnos) => {
        if (!cancelado) setCarga({ status: "ready", alumnos });
      })
      .catch((error) => {
        if (cancelado) return;
        setCarga({
          status: "error",
          message: error instanceof ApiError && error.status < 500 ? error.message : "No pudimos cargar las alertas.",
        });
      });
    return () => {
      cancelado = true;
    };
  }, [institutionId, intento]);

  const cantidad = carga.status === "ready" ? carga.alumnos.length : null;

  return (
    <section
      aria-labelledby="alertas-riesgo"
      className="rounded-2xl border border-rojo/20 bg-white/90 p-4 shadow-[0_8px_30px_rgba(20,33,61,0.08)]"
    >
      <div className="mb-1 flex items-center gap-2">
        <span aria-hidden className="flex h-8 w-8 items-center justify-center rounded-full bg-rojo/10 text-rojo">
          <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="2">
            <path d="M12 3 22 20H2z" strokeLinejoin="round" />
            <path d="M12 10v4M12 17v.5" strokeLinecap="round" />
          </svg>
        </span>
        <h2 id="alertas-riesgo" className="text-lg font-semibold text-ink">
          Alumnos en riesgo
        </h2>
        {cantidad !== null && cantidad > 0 && (
          <span className="rounded-full bg-rojo px-2 py-0.5 text-xs font-bold text-white">{cantidad}</span>
        )}
      </div>
      <p className="mb-3 text-sm text-gray-600">
        Alerta temprana: menos del 75 % de asistencia o alguna materia con promedio menor a 6.
      </p>

      {carga.status === "loading" && <p className="text-sm text-gray-600">Cargando alertas...</p>}

      {carga.status === "error" && (
        <div role="alert" className="flex flex-wrap items-center gap-3 text-sm text-rojo">
          {carga.message}
          <button
            type="button"
            onClick={() => {
              setCarga({ status: "loading" });
              setIntento((n) => n + 1);
            }}
            className="rounded-full border border-rojo px-3 py-1 font-semibold"
          >
            Reintentar
          </button>
        </div>
      )}

      {carga.status === "ready" && carga.alumnos.length === 0 && (
        <p className="text-sm text-gray-600">Ningún alumno en riesgo por ahora.</p>
      )}

      {carga.status === "ready" && carga.alumnos.length > 0 && (
        <ul className="divide-y divide-gray-100">
          {carga.alumnos.map((alumno) => (
            <li
              key={alumno.student.id}
              aria-label={nombre(alumno)}
              className="flex flex-wrap items-center justify-between gap-2 py-2.5"
            >
              <span className="min-w-0">
                {conEnlace ? (
                  <Link href={`/alumnos/${alumno.student.id}`} className="font-medium text-ink hover:underline">
                    {nombre(alumno)}
                  </Link>
                ) : (
                  <span className="font-medium text-ink">{nombre(alumno)}</span>
                )}
                <span className="ml-2 text-sm text-gray-600">
                  {`${alumno.course.year}°${alumno.course.division}`}
                </span>
              </span>
              <span className="flex flex-wrap gap-1.5">
                {alumno.reasons.map((motivo) => (
                  <span
                    key={motivo.type === "attendance" ? "asistencia" : motivo.subject.id}
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      motivo.type === "attendance" ? "bg-accent/25 text-ink" : "bg-rojo/10 text-rojo"
                    }`}
                  >
                    {textoMotivo(motivo)}
                  </span>
                ))}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
