"use client";

import { useEffect, useState } from "react";
import { ApiError, apiFetch } from "../../lib/api";
import { TARJETA } from "../institution/admin-ui";

// Lo que devuelve GET /students/:studentId/grades (ver README de la API).
interface StudentGrade {
  subject: { id: string; name: string };
  period: { id: string; name: string };
  value: number;
}

type Carga =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; grades: StudentGrade[] };

function agruparPorMateria(grades: StudentGrade[]) {
  const materias = new Map<string, { name: string; grades: StudentGrade[] }>();
  for (const grade of grades) {
    const materia = materias.get(grade.subject.id) ?? { name: grade.subject.name, grades: [] };
    materia.grades.push(grade);
    materias.set(grade.subject.id, materia);
  }
  return [...materias.entries()];
}

export function StudentGrades({
  institutionId,
  studentId,
}: {
  institutionId: string;
  studentId: string;
}) {
  const [carga, setCarga] = useState<Carga>({ status: "loading" });

  useEffect(() => {
    let cancelado = false;

    apiFetch<StudentGrade[]>(`/students/${studentId}/grades`, { institutionId })
      .then((grades) => {
        if (!cancelado) setCarga({ status: "ready", grades });
      })
      .catch((error) => {
        if (cancelado) return;
        setCarga({
          status: "error",
          message:
            error instanceof ApiError ? error.message : "No se pudo conectar. Probá de nuevo en un rato.",
        });
      });

    return () => {
      cancelado = true;
    };
  }, [institutionId, studentId]);

  if (carga.status === "loading") return <p>Cargando notas...</p>;

  if (carga.status === "error") {
    return (
      <p role="alert" className="text-rojo">
        {carga.message}
      </p>
    );
  }

  if (carga.grades.length === 0) return <p>Todavía no tiene notas cargadas.</p>;

  return (
    <div className="flex flex-col gap-4">
      {agruparPorMateria(carga.grades).map(([id, materia]) => (
        <section
          key={id}
          aria-labelledby={`materia-${id}`}
          className={`${TARJETA} px-4 py-3`}
        >
          <h2 id={`materia-${id}`} className="mb-2 font-semibold text-ink">
            {materia.name}
          </h2>
          <dl className="flex flex-col gap-1">
            {materia.grades.map((grade) => (
              <div key={grade.period.id} className="flex items-center justify-between">
                <dt className="text-gray-600">{grade.period.name}</dt>
                <dd className="font-semibold text-ink">{String(grade.value).replace(".", ",")}</dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </div>
  );
}
