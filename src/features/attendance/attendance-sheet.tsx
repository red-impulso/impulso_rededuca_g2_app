"use client";

import { useEffect, useState } from "react";
import { ApiError, apiFetch } from "../../lib/api";
import { Toast } from "../../components/ui/alerta";

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
  { value: "present", letra: "P", etiqueta: "Presente", marcado: "bg-green text-ink" },
  { value: "absent", letra: "A", etiqueta: "Ausente", marcado: "bg-rojo text-white" },
  { value: "late", letra: "T", etiqueta: "Tarde", marcado: "bg-accent text-ink" },
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
      <p role="alert" className="text-rojo">
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

  const marcados = rows.length - faltan;
  const presentes = rows.filter((row) => marcas[row.student.id] === "present").length;
  const porcentaje = marcados === 0 ? 0 : Math.round((presentes / marcados) * 100);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={todosPresentes}
          className="rounded-full border border-primario px-4 py-2 text-sm font-semibold text-primario transition hover:bg-primario/10"
        >
          Todos presentes
        </button>

        {/* Resumen del día con barra de progreso (prototipo de asistencia) */}
        <div className="flex items-center gap-3 rounded-2xl border border-white/80 bg-white/80 px-4 py-2 text-sm shadow-[0_8px_30px_rgba(20,24,90,0.06)]">
          <span className="text-gray-600">
            Asistencia: <strong className="text-ink">{porcentaje}%</strong>
          </span>
          <span aria-hidden className="h-2 w-24 overflow-hidden rounded-full bg-green/15">
            <span className="block h-full rounded-full bg-green" style={{ width: `${porcentaje}%` }} />
          </span>
        </div>
      </div>

      <ul className="flex flex-col divide-y divide-gray-100 rounded-2xl border border-gray-200 bg-white px-4 shadow-[0_8px_30px_rgba(20,24,90,0.06)]">
        {rows.map((row) => (
          <li key={row.student.id} className="py-2.5">
            <div
              role="group"
              aria-label={nombreDe(row)}
              className="flex flex-wrap items-center justify-between gap-2"
            >
              <span className="font-medium">{nombreDe(row)}</span>
              {/* Letra + color: el estado nunca depende solo del color */}
              <span className="flex gap-1.5">
                {ESTADOS.map((estado) => {
                  const activo = marcas[row.student.id] === estado.value;
                  return (
                    <button
                      key={estado.value}
                      type="button"
                      aria-label={estado.etiqueta}
                      title={estado.etiqueta}
                      aria-pressed={activo}
                      onClick={() => marcar(row.student.id, estado.value)}
                      className={`flex h-11 w-11 items-center justify-center rounded-xl border font-semibold transition ${
                        activo ? `${estado.marcado} border-transparent` : "border-gray-300 bg-white text-gray-500 hover:border-gray-400"
                      }`}
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

      {guardado.status === "error" && (
        <p role="alert" className="text-sm text-rojo">
          {guardado.message}
        </p>
      )}

      {/* En celular queda fijo abajo, encima del menú inferior */}
      <div className="sticky bottom-20 md:bottom-4">
        <button
          type="button"
          onClick={guardar}
          disabled={!puedeGuardar}
          className="w-full rounded-full bg-accent px-6 py-3 font-semibold text-ink shadow-[0_8px_20px_rgba(255,191,67,0.4)] transition hover:brightness-95 disabled:opacity-50 md:w-auto"
        >
          {guardando ? "Guardando..." : "Guardar asistencia"}
        </button>
      </div>

      {guardado.status === "saved" && (
        <Toast tipo="exito" onCerrar={() => setGuardado({ status: "idle" })}>
          ¡Listo! La asistencia se guardó.
        </Toast>
      )}
    </div>
  );
}
