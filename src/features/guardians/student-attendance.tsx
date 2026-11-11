"use client";

import { useEffect, useState } from "react";
import { ApiError, apiFetch } from "../../lib/api";
import { TARJETA } from "../institution/admin-ui";

type Status = "present" | "absent" | "late" | "justified";

// Lo que devuelve GET /students/:studentId/attendance (ver README de la API).
interface StudentAttendanceResponse {
  records: { date: string; status: Status }[];
  summary: { percentage: number | null };
}

type Carga =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; data: StudentAttendanceResponse };

const ESTADOS: Record<Status, { etiqueta: string; color: string }> = {
  present: { etiqueta: "Presente", color: "text-verde-fuerte" },
  absent: { etiqueta: "Ausente", color: "text-rojo" },
  late: { etiqueta: "Tarde", color: "text-blue" },
  justified: { etiqueta: "Justificado", color: "text-blue" },
};

// "2026-11-06" -> "06/11/2026". Sin new Date(): lo tomaría como medianoche en
// hora universal, y en Argentina se vería el día anterior.
function mostrarFecha(fecha: string): string {
  const [anio, mes, dia] = fecha.split("-");
  return `${dia}/${mes}/${anio}`;
}

function titulo({ records, summary }: StudentAttendanceResponse): string {
  if (summary.percentage !== null) return `${String(summary.percentage).replace(".", ",")} %`;
  // Hay registros pero sin porcentaje: los días justificados no cuentan.
  return records.length > 0 ? "Sin porcentaje todavía" : "Sin registros";
}

export function StudentAttendance({
  institutionId,
  studentId,
}: {
  institutionId: string;
  studentId: string;
}) {
  const [carga, setCarga] = useState<Carga>({ status: "loading" });

  useEffect(() => {
    let cancelado = false;

    apiFetch<StudentAttendanceResponse>(`/students/${studentId}/attendance`, { institutionId })
      .then((data) => {
        if (!cancelado) setCarga({ status: "ready", data });
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

  if (carga.status === "loading") return <p>Cargando asistencia...</p>;

  if (carga.status === "error") {
    return (
      <p role="alert" className="text-rojo">
        {carga.message}
      </p>
    );
  }

  const { data } = carga;

  return (
    <div className="flex flex-col gap-4">
      <div className={`${TARJETA} px-4 py-6 text-center`}>
        <h2 className="text-4xl font-semibold text-ink">{titulo(data)}</h2>
        <p className="mt-1 text-sm text-gray-600">Asistencia</p>
      </div>

      {data.records.length > 0 && (
        <ul className={`${TARJETA} flex flex-col px-4`}>
          {data.records.map((record) => (
            <li
              key={record.date}
              className="flex items-center justify-between border-b border-ink/10 py-2 last:border-b-0"
            >
              <span>{mostrarFecha(record.date)}</span>
              <span className={`font-medium ${ESTADOS[record.status].color}`}>
                {ESTADOS[record.status].etiqueta}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
