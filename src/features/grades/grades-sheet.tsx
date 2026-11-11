"use client";

import { useEffect, useState } from "react";
import { ApiError, apiFetch } from "../../lib/api";
import { Badge } from "../../components/ui/badge";
import { Toast } from "../../components/ui/alerta";

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
const AVISO_BORRAR = "Se borrará al guardar.";

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
      <p role="alert" className="text-rojo">
        {carga.message}
      </p>
    );
  }

  if (carga.rows.length === 0) return <p>Este curso todavía no tiene alumnos.</p>;

  const { rows } = carga;
  const textoDe = (row: GradeRow) => textos[row.student.id] ?? "";
  const estaVacio = (row: GradeRow) => textoDe(row).trim() === "";
  // Vaciar una nota guardada la borra; la API recibe value: null.
  const seBorro = (row: GradeRow) => estaVacio(row) && row.value !== null;
  const esInvalido = (row: GradeRow) => !estaVacio(row) && leerNota(textoDe(row)) === null;
  const cambio = (row: GradeRow) =>
    estaVacio(row) ? row.value !== null : leerNota(textoDe(row)) !== row.value;

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
            value: estaVacio(row) ? null : leerNota(textoDe(row)),
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
      {/* Tabla con encabezado azul y filas alternadas; scroll horizontal
          en celular (prototipo de calificaciones). */}
      <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-[0_8px_30px_rgba(20,24,90,0.06)]">
        <table className="w-full min-w-105 border-collapse text-left text-sm">
          <thead className="bg-primario text-white">
            <tr>
              <th className="px-4 py-3 font-semibold">Nº</th>
              <th className="px-4 py-3 font-semibold">Alumno</th>
              <th className="w-28 px-4 py-3 text-center font-semibold">Nota</th>
              <th className="w-32 px-4 py-3 font-semibold">Estado</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, indice) => {
              const invalido = esInvalido(row);
              const nota = leerNota(textoDe(row));
              return (
                <tr key={row.student.id} className="border-b border-gray-100 last:border-0 odd:bg-surface/60">
                  <td className="px-4 py-2.5 text-gray-500">{indice + 1}</td>
                  <td className="px-4 py-2.5">
                    {nombreDe(row)}
                    {seBorro(row) && <p className="text-xs text-blue">{AVISO_BORRAR}</p>}
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <input
                      type="text"
                      inputMode="decimal"
                      aria-label={`Nota de ${nombreDe(row)}`}
                      aria-invalid={invalido}
                      value={textoDe(row)}
                      onChange={(e) => escribir(row.student.id, e.target.value)}
                      className={`w-20 rounded-lg border border-gray-300 px-2 py-1.5 text-center transition focus:border-primario focus:outline-none focus:ring-2 focus:ring-primario/25 ${
                        invalido ? "border-rojo bg-rojo/10 text-rojo" : ""
                      }`}
                    />
                  </td>
                  <td className="px-4 py-2.5">
                    {/* Texto además del color, como piden los prototipos */}
                    {nota === null ? (
                      <span className="text-xs text-gray-400">Sin nota</span>
                    ) : nota >= 7 ? (
                      <Badge tono="verde">Aprobada</Badge>
                    ) : nota >= 4 ? (
                      <Badge tono="naranja">En riesgo</Badge>
                    ) : (
                      <Badge tono="rojo">Desaprobada</Badge>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {hayInvalidos && (
        <p className="text-sm text-rojo">Las notas van de 1 a 10, con hasta 2 decimales.</p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={guardar}
          disabled={!puedeGuardar}
          className="rounded-full bg-accent px-5 py-2.5 font-medium text-ink transition hover:brightness-95 disabled:opacity-50"
        >
          {guardando ? "Guardando..." : "Guardar"}
        </button>
        {guardado.status === "error" && (
          <p role="alert" className="text-sm text-rojo">
            {guardado.message}
          </p>
        )}
      </div>

      {guardado.status === "saved" && <Toast tipo="exito" onCerrar={() => setGuardado({ status: "idle" })}>¡Listo! Las notas se guardaron.</Toast>}
    </div>
  );
}
