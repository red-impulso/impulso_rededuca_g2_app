"use client";

import { useEffect, useState } from "react";
import { ApiError, apiFetch } from "../../lib/api";

type Status = "present" | "absent" | "late" | "justified";

// Lo que devuelve GET /attendance (ver README de la API).
interface AttendanceRow {
  student: { id: string; firstName: string | null; lastName: string | null };
  status: Status | null;
}

type Carga =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; rows: AttendanceRow[] };

type Guardado =
  | { status: "idle" }
  | { status: "saving" }
  | { status: "saved" }
  | { status: "error"; message: string };

const ESTADOS: { value: Status; letra: string; etiqueta: string; marcado: string }[] = [
  { value: "present", letra: "P", etiqueta: "Presente", marcado: "bg-green text-white" },
  { value: "absent", letra: "A", etiqueta: "Ausente", marcado: "bg-red-600 text-white" },
  { value: "late", letra: "T", etiqueta: "Tarde", marcado: "bg-accent text-white" },
  { value: "justified", letra: "J", etiqueta: "Justificado", marcado: "bg-blue text-white" },
];

function mensajeDe(error: unknown): string {
  return error instanceof ApiError ? error.message : "No se pudo conectar. Probá de nuevo en un rato.";
}

// La fecha de hoy en la hora de la compu o el celular. toISOString() no sirve:
// da la hora universal, y después de las 21 h de Argentina ya sería mañana.
export function hoyLocal(): string {
  const ahora = new Date();
  const mes = `${ahora.getMonth() + 1}`.padStart(2, "0");
  const dia = `${ahora.getDate()}`.padStart(2, "0");
  return `${ahora.getFullYear()}-${mes}-${dia}`;
}

function nombreDe({ student }: AttendanceRow): string {
  return `${student.lastName ?? ""}, ${student.firstName ?? ""}`;
}

export function AttendanceSheet({
  institutionId,
  courseId,
  date,
}: {
  institutionId: string;
  courseId: string;
  date: string;
}) {
  const [carga, setCarga] = useState<Carga>({ status: "loading" });
  const [marcas, setMarcas] = useState<Record<string, Status>>({});
  const [guardado, setGuardado] = useState<Guardado>({ status: "idle" });

  useEffect(() => {
    let cancelado = false;

    apiFetch<AttendanceRow[]>(`/attendance?courseId=${courseId}&date=${date}`, { institutionId })
      .then((rows) => {
        if (cancelado) return;
        setMarcas(
          Object.fromEntries(
            rows.flatMap((row) => (row.status ? [[row.student.id, row.status]] : []))
          )
        );
        setCarga({ status: "ready", rows });
      })
      .catch((error) => {
        if (!cancelado) setCarga({ status: "error", message: mensajeDe(error) });
      });

    return () => {
      cancelado = true;
    };
  }, [institutionId, courseId, date]);

  if (carga.status === "loading") return <p>Cargando lista...</p>;

  if (carga.status === "error") {
    return (
      <p role="alert" className="text-red-600">
        {carga.message}
      </p>
    );
  }

  if (carga.rows.length === 0) return <p>Este curso todavía no tiene alumnos.</p>;

  const { rows } = carga;
  const faltan = rows.filter((row) => !marcas[row.student.id]).length;
  const cambio = (row: AttendanceRow) =>
    marcas[row.student.id] !== undefined && marcas[row.student.id] !== row.status;
  const guardando = guardado.status === "saving";
  const puedeGuardar = faltan === 0 && !guardando && rows.some(cambio);

  function marcar(studentId: string, status: Status) {
    setMarcas((actuales) => ({ ...actuales, [studentId]: status }));
    setGuardado({ status: "idle" });
  }

  // Solo completa a los que faltan: no pisa a quien ya se marcó ausente.
  function todosPresentes() {
    setMarcas((actuales) =>
      Object.fromEntries(
        rows.map((row) => [row.student.id, actuales[row.student.id] ?? ("present" as Status)])
      )
    );
    setGuardado({ status: "idle" });
  }

  async function guardar() {
    const cambios = rows.filter(cambio);
    setGuardado({ status: "saving" });

    try {
      await apiFetch("/attendance", {
        method: "PUT",
        institutionId,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId,
          date,
          entries: cambios.map((row) => ({
            studentId: row.student.id,
            status: marcas[row.student.id],
          })),
        }),
      });
      setCarga({
        status: "ready",
        rows: rows.map((row) => ({ ...row, status: marcas[row.student.id] ?? row.status })),
      });
      setGuardado({ status: "saved" });
    } catch (error) {
      setGuardado({ status: "error", message: mensajeDe(error) });
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <button type="button" onClick={todosPresentes} className="self-start rounded border px-4 py-2">
        Todos presentes
      </button>

      <ul className="flex flex-col">
        {rows.map((row) => (
          <li key={row.student.id} className="border-b py-2">
            <div
              role="group"
              aria-label={nombreDe(row)}
              className="flex flex-wrap items-center justify-between gap-2"
            >
              <span>{nombreDe(row)}</span>
              <span className="flex gap-1">
                {ESTADOS.map((estado) => {
                  const activo = marcas[row.student.id] === estado.value;
                  return (
                    <button
                      key={estado.value}
                      type="button"
                      aria-label={estado.etiqueta}
                      aria-pressed={activo}
                      onClick={() => marcar(row.student.id, estado.value)}
                      className={`h-11 w-11 rounded border font-semibold ${activo ? estado.marcado : ""}`}
                    >
                      {estado.letra}
                    </button>
                  );
                })}
              </span>
            </div>
          </li>
        ))}
      </ul>

      {faltan > 0 && (
        <p className="text-sm text-gray-600">
          {faltan === 1 ? "Falta marcar 1 alumno." : `Faltan marcar ${faltan} alumnos.`}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={guardar}
          disabled={!puedeGuardar}
          className="rounded bg-accent px-4 py-2 font-medium text-white disabled:opacity-50"
        >
          {guardando ? "Guardando..." : "Guardar"}
        </button>
        {guardado.status === "saved" && (
          <p role="status" className="text-green">
            Guardado
          </p>
        )}
        {guardado.status === "error" && (
          <p role="alert" className="text-red-600">
            {guardado.message}
          </p>
        )}
      </div>
    </div>
  );
}
