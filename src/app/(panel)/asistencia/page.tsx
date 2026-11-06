"use client";

import { useEffect, useState } from "react";
import { AttendanceSheet, hoyLocal } from "../../../features/attendance/attendance-sheet";
import { useSession } from "../../../features/session/use-session";
import { ApiError, apiFetch } from "../../../lib/api";

// Lo que devuelve GET /me/courses.
interface Course {
  id: string;
  year: number;
  division: string;
  shift: string;
}

type Cursos =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; courses: Course[] };

const TURNOS: Record<string, string> = {
  morning: "Mañana",
  afternoon: "Tarde",
  evening: "Noche",
};

const ROLES_PERMITIDOS = ["teacher", "admin", "director"];

function Selectores({ institutionId }: { institutionId: string }) {
  const [cursos, setCursos] = useState<Cursos>({ status: "loading" });
  const [courseId, setCourseId] = useState("");
  const [hoy] = useState(hoyLocal);
  const [date, setDate] = useState(hoy);

  useEffect(() => {
    let cancelado = false;

    apiFetch<Course[]>("/me/courses", { institutionId })
      .then((courses) => {
        if (!cancelado) setCursos({ status: "ready", courses });
      })
      .catch((error) => {
        if (cancelado) return;
        setCursos({
          status: "error",
          message:
            error instanceof ApiError ? error.message : "No se pudo conectar. Probá de nuevo en un rato.",
        });
      });

    return () => {
      cancelado = true;
    };
  }, [institutionId]);

  if (cursos.status === "loading") return <p>Cargando...</p>;

  if (cursos.status === "error") {
    return (
      <p role="alert" className="text-red-600">
        {cursos.message}
      </p>
    );
  }

  if (cursos.courses.length === 0) return <p>Todavía no tenés cursos asignados.</p>;

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row">
        <label className="flex flex-1 flex-col gap-1 text-sm">
          Curso
          <select
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            className="rounded border px-3 py-2"
          >
            <option value="">Elegí un curso</option>
            {cursos.courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.year}°{course.division} · {TURNOS[course.shift] ?? course.shift}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-1 flex-col gap-1 text-sm">
          Fecha
          <input
            type="date"
            value={date}
            max={hoy}
            onChange={(e) => setDate(e.target.value)}
            className="rounded border px-3 py-2"
          />
        </label>
      </div>

      {courseId && date && (
        <AttendanceSheet
          key={`${courseId}-${date}`}
          institutionId={institutionId}
          courseId={courseId}
          date={date}
        />
      )}
    </>
  );
}

export default function AsistenciaPage() {
  const session = useSession();

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-10">
      <h1 className="text-2xl font-semibold">Asistencia</h1>

      {session.status === "loading" && <p>Cargando...</p>}

      {session.status === "error" && (
        <p role="alert" className="text-red-600">
          No se pudieron cargar tus datos. Probá de nuevo en un rato.
        </p>
      )}

      {session.status === "ready" &&
        (session.activeMembership && ROLES_PERMITIDOS.includes(session.activeMembership.role) ? (
          <Selectores institutionId={session.activeMembership.institutionId} />
        ) : (
          <p>Esta sección es para docentes y dirección.</p>
        ))}
    </main>
  );
}
