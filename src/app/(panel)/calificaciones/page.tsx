"use client";

import { useEffect, useState } from "react";
import { GradesSheet } from "../../../features/grades/grades-sheet";
import { useSession } from "../../../features/session/use-session";
import { ApiError, apiFetch } from "../../../lib/api";

// Lo que devuelven GET /me/subjects y GET /grading-periods.
interface Subject {
  id: string;
  name: string;
  course: { year: number; division: string };
}

interface Period {
  id: string;
  name: string;
}

type Opciones =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; subjects: Subject[]; periods: Period[] };

function Selectores({ institutionId }: { institutionId: string }) {
  const [opciones, setOpciones] = useState<Opciones>({ status: "loading" });
  const [subjectId, setSubjectId] = useState("");
  const [periodElegido, setPeriodElegido] = useState("");

  useEffect(() => {
    let cancelado = false;

    Promise.all([
      apiFetch<Subject[]>("/me/subjects", { institutionId }),
      apiFetch<Period[]>("/grading-periods", { institutionId }),
    ])
      .then(([subjects, periods]) => {
        if (!cancelado) setOpciones({ status: "ready", subjects, periods });
      })
      .catch((error) => {
        if (cancelado) return;
        setOpciones({
          status: "error",
          message:
            error instanceof ApiError ? error.message : "No se pudo conectar. Probá de nuevo en un rato.",
        });
      });

    return () => {
      cancelado = true;
    };
  }, [institutionId]);

  if (opciones.status === "loading") return <p>Cargando...</p>;

  if (opciones.status === "error") {
    return (
      <p role="alert" className="text-red-600">
        {opciones.message}
      </p>
    );
  }

  const { subjects, periods } = opciones;

  if (subjects.length === 0) return <p>Todavía no tenés materias asignadas.</p>;
  if (periods.length === 0) return <p>La institución todavía no cargó los períodos.</p>;

  // Si hay un solo período, ya queda elegido.
  const periodId = periodElegido || (periods.length === 1 ? periods[0].id : "");

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row">
        <label className="flex flex-1 flex-col gap-1 text-sm">
          Materia
          <select
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
            className="rounded border px-3 py-2"
          >
            <option value="">Elegí una materia</option>
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name} · {subject.course.year}°{subject.course.division}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-1 flex-col gap-1 text-sm">
          Período
          <select
            value={periodId}
            onChange={(e) => setPeriodElegido(e.target.value)}
            className="rounded border px-3 py-2"
          >
            <option value="">Elegí un período</option>
            {periods.map((period) => (
              <option key={period.id} value={period.id}>
                {period.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {subjectId && periodId && (
        <GradesSheet
          key={`${subjectId}-${periodId}`}
          institutionId={institutionId}
          subjectId={subjectId}
          periodId={periodId}
        />
      )}
    </>
  );
}

export default function CalificacionesPage() {
  const session = useSession();

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-10">
      <h1 className="text-2xl font-semibold">Calificaciones</h1>

      {session.status === "loading" && <p>Cargando...</p>}

      {session.status === "error" && (
        <p role="alert" className="text-red-600">
          No se pudieron cargar tus datos. Probá de nuevo en un rato.
        </p>
      )}

      {session.status === "ready" &&
        (session.activeMembership?.role === "teacher" ? (
          <Selectores institutionId={session.activeMembership.institutionId} />
        ) : (
          <p>Esta sección es para docentes.</p>
        ))}
    </main>
  );
}
