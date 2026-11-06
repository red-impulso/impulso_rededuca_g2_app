"use client";

import { useEffect, useState } from "react";
import { ApiError, apiFetch } from "../../lib/api";

// Lo que devuelve GET /grades (ver README de la API).
interface GradeRow {
  student: { id: string; firstName: string | null; lastName: string | null };
  value: number | null;
}

type Carga =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; rows: GradeRow[] };

type Guardado =
  | { status: "idle" }
  | { status: "saving" }
  | { status: "saved" }
  | { status: "error"; message: string };

const ERROR_GENERICO = "No se pudo conectar. Probá de nuevo en un rato.";
const AVISO_BORRAR = "Por ahora no se puede borrar una nota.";

function mensajeDe(error: unknown): string {
  return error instanceof ApiError ? error.message : ERROR_GENERICO;
}

// Las mismas reglas que la API: de 1 a 10, con hasta 2 decimales.
// Devuelve null si el texto no es una nota válida.
function leerNota(texto: string): number | null {
  const normal = texto.trim().replace(",", ".");
  if (!/^\d{1,2}(\.\d{1,2})?$/.test(normal)) return null;
  const nota = Number(normal);
  return nota >= 1 && nota <= 10 ? nota : null;
}

function mostrarNota(value: number | null): string {
  return value === null ? "" : String(value).replace(".", ",");
}

function nombreDe({ student }: GradeRow): string {
  return `${student.lastName ?? ""}, ${student.firstName ?? ""}`;
}

export function GradesSheet({
  institutionId,
  subjectId,
  periodId,
}: {
  institutionId: string;
  subjectId: string;
  periodId: string;
}) {
  const [carga, setCarga] = useState<Carga>({ status: "loading" });
  const [textos, setTextos] = useState<Record<string, string>>({});
  const [guardado, setGuardado] = useState<Guardado>({ status: "idle" });

  useEffect(() => {
    let cancelado = false;

    apiFetch<GradeRow[]>(`/grades?subjectId=${subjectId}&periodId=${periodId}`, { institutionId })
      .then((rows) => {
        if (cancelado) return;
        setTextos(Object.fromEntries(rows.map((row) => [row.student.id, mostrarNota(row.value)])));
        setCarga({ status: "ready", rows });
      })
      .catch((error) => {
        if (!cancelado) setCarga({ status: "error", message: mensajeDe(error) });
      });

    return () => {
      cancelado = true;
    };
  }, [institutionId, subjectId, periodId]);

  if (carga.status === "loading") return <p>Cargando planilla...</p>;

  if (carga.status === "error") {
    return (
      <p role="alert" className="text-red-600">
        {carga.message}
      </p>
    );
  }

  if (carga.rows.length === 0) return <p>Este curso todavía no tiene alumnos.</p>;

  const { rows } = carga;
  const textoDe = (row: GradeRow) => textos[row.student.id] ?? "";
  const estaVacio = (row: GradeRow) => textoDe(row).trim() === "";
  // La API ignora los casilleros vacíos: una nota guardada no se puede borrar.
  const seBorro = (row: GradeRow) => estaVacio(row) && row.value !== null;
  const esInvalido = (row: GradeRow) =>
    seBorro(row) || (!estaVacio(row) && leerNota(textoDe(row)) === null);
  const cambio = (row: GradeRow) => !estaVacio(row) && leerNota(textoDe(row)) !== row.value;

  const hayInvalidos = rows.some(esInvalido);
  const guardando = guardado.status === "saving";
  const puedeGuardar = !hayInvalidos && !guardando && rows.some(cambio);

  function escribir(studentId: string, texto: string) {
    setTextos((actuales) => ({ ...actuales, [studentId]: texto }));
    setGuardado({ status: "idle" });
  }

  async function guardar() {
    const cambios = rows.filter(cambio);
    setGuardado({ status: "saving" });

    try {
      await apiFetch("/grades", {
        method: "PUT",
        institutionId,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjectId,
          periodId,
          entries: cambios.map((row) => ({
            studentId: row.student.id,
            value: leerNota(textoDe(row)),
          })),
        }),
      });
      setCarga({
        status: "ready",
        rows: rows.map((row) =>
          cambios.includes(row) ? { ...row, value: leerNota(textoDe(row)) } : row
        ),
      });
      setGuardado({ status: "saved" });
    } catch (error) {
      setGuardado({ status: "error", message: mensajeDe(error) });
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b text-sm text-gray-600">
            <th className="py-2 font-medium">Alumno</th>
            <th className="w-24 py-2 font-medium">Nota</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const invalido = esInvalido(row);
            return (
              <tr key={row.student.id} className="border-b">
                <td className="py-2 pr-2">
                  {nombreDe(row)}
                  {seBorro(row) && <p className="text-sm text-red-600">{AVISO_BORRAR}</p>}
                </td>
                <td className="py-2">
                  <input
                    type="text"
                    inputMode="decimal"
                    aria-label={`Nota de ${nombreDe(row)}`}
                    aria-invalid={invalido}
                    value={textoDe(row)}
                    onChange={(e) => escribir(row.student.id, e.target.value)}
                    className={`w-20 rounded border px-2 py-1 text-center ${
                      invalido ? "border-red-600 bg-red-50 text-red-700" : ""
                    }`}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {hayInvalidos && <p className="text-sm text-red-600">Las notas van de 1 a 10, con hasta 2 decimales.</p>}

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
