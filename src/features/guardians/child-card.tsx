"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiFetch } from "../../lib/api";

// Lo que devuelve GET /me/students (ver README de la API).
export interface Child {
  id: string;
  firstName: string | null;
  lastName: string | null;
  course: { id: string; year: number; division: string };
}

interface Grade {
  subject: { id: string; name: string };
  value: number;
}

type Resumen =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; grades: Grade[]; percentage: number | null };

const COLORES_NOTA = ["bg-accent/15", "bg-blue/15", "bg-green/15"];
const NOTAS_VISIBLES = 3;

function conComa(valor: number): string {
  return String(valor).replace(".", ",");
}

function promedioDe(grades: Grade[]): number {
  const suma = grades.reduce((total, grade) => total + grade.value, 0);
  return Math.round((suma / grades.length) * 100) / 100;
}

function inicialesDe({ firstName, lastName }: Child): string {
  return `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase();
}

function Dato({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div className="flex-1 rounded-xl bg-ink/5 px-3 py-2 text-center">
      <p className="text-xs text-gray-600">{titulo}</p>
      <p className="text-lg font-semibold">{valor}</p>
    </div>
  );
}

export function ChildCard({ child, institutionId }: { child: Child; institutionId: string }) {
  const [resumen, setResumen] = useState<Resumen>({ status: "loading" });

  useEffect(() => {
    let cancelado = false;

    Promise.all([
      apiFetch<Grade[]>(`/students/${child.id}/grades`, { institutionId }),
      apiFetch<{ summary: { percentage: number | null } }>(`/students/${child.id}/attendance`, {
        institutionId,
      }),
    ])
      .then(([grades, attendance]) => {
        if (cancelado) return;
        setResumen({ status: "ready", grades, percentage: attendance.summary.percentage });
      })
      .catch(() => {
        if (!cancelado) setResumen({ status: "error" });
      });

    return () => {
      cancelado = true;
    };
  }, [child.id, institutionId]);

  return (
    <Link
      href={`/hijos/${child.id}/notas`}
      className="group relative block overflow-hidden rounded-2xl border border-white/80 bg-white/70 p-4 shadow-[0_8px_30px_rgba(20,33,61,0.08)] backdrop-blur transition hover:shadow-[0_12px_36px_rgba(20,33,61,0.16)] motion-safe:hover:-translate-y-0.5"
    >
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-accent via-purple to-celeste"
      />

      <div className="flex items-center gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-ink to-blue font-semibold text-white">
          {inicialesDe(child)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold">
            {child.firstName} {child.lastName}
          </span>
          <span className="block text-sm text-gray-600">
            {child.course.year}°{child.course.division}
          </span>
        </span>
        <span aria-hidden className="text-xl text-gray-600 motion-safe:transition group-hover:translate-x-0.5">
          ›
        </span>
      </div>

      {resumen.status === "loading" && <p className="mt-3 text-sm text-gray-600">Cargando resumen...</p>}

      {resumen.status === "error" && <p className="mt-3 text-sm text-gray-600">Resumen no disponible</p>}

      {resumen.status === "ready" && (
        <>
          {resumen.grades.length === 0 ? (
            <p className="mt-3 text-sm text-gray-600">Todavía sin notas</p>
          ) : (
            <div className="mt-3 flex flex-wrap gap-2">
              {resumen.grades.slice(0, NOTAS_VISIBLES).map((grade, i) => (
                <span
                  key={grade.subject.id}
                  className={`flex flex-col rounded-lg px-3 py-1 text-center ${COLORES_NOTA[i]}`}
                >
                  <span className="text-xs">{grade.subject.name.slice(0, 3)}</span>
                  <span className="font-semibold">{conComa(grade.value)}</span>
                </span>
              ))}
            </div>
          )}

          <div className="mt-3 flex gap-2">
            <Dato
              titulo="Promedio"
              valor={resumen.grades.length > 0 ? conComa(promedioDe(resumen.grades)) : "—"}
            />
            <Dato
              titulo="Asistencia"
              valor={resumen.percentage === null ? "—" : `${conComa(resumen.percentage)} %`}
            />
          </div>
        </>
      )}
    </Link>
  );
}
