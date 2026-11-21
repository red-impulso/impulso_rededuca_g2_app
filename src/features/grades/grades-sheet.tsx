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

// Para buscar sin importar mayúsculas ni tildes: "perez" encuentra "Pérez".
function normalizar(texto: string): string {
  return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function promedioDe(notas: number[]): string {
  if (notas.length === 0) return "Sin notas";
  const promedio = notas.reduce((suma, nota) => suma + nota, 0) / notas.length;
  return mostrarNota(Math.round(promedio * 100) / 100);
}

// CSV con punto y coma y BOM: Excel en castellano lo abre con tildes y columnas.
function celdaCsv(texto: string): string {
  return /[;"\r\n]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
}

function descargarCsv(nombreArchivo: string, filas: string[][]) {
  const contenido = "\uFEFF" + filas.map((fila) => fila.map(celdaCsv).join(";") + "\r\n").join("");
  const url = URL.createObjectURL(new Blob([contenido], { type: "text/csv;charset=utf-8" }));
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = nombreArchivo;
  enlace.click();
  URL.revokeObjectURL(url);
}

export function GradesSheet({
  institutionId,
  subjectId,
  periodId,
  titulo,
}: {
  institutionId: string;
  subjectId: string;
  periodId: string;
  // Curso y materia, por ejemplo "4°A - Matemática" (encabezado del prototipo).
  titulo?: string;
}) {
  const [carga, setCarga] = useState<Carga>({ status: "loading" });
  const [textos, setTextos] = useState<Record<string, string>>({});
  const [guardado, setGuardado] = useState<Guardado>({ status: "idle" });
  const [busqueda, setBusqueda] = useState("");

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

  // La búsqueda solo oculta filas: lo escrito en las ocultas también se guarda.
  const buscado = normalizar(busqueda.trim());
  const visibles = rows
    .map((row, indice) => ({ row, numero: indice + 1 }))
    .filter(({ row }) => normalizar(nombreDe(row)).includes(buscado));
  const notas = rows.map((row) => leerNota(textoDe(row))).filter((nota): nota is number => nota !== null);

  function exportar() {
    descargarCsv(titulo ? `calificaciones ${titulo}.csv` : "calificaciones.csv", [
      ["Nº", "Alumno", "Nota"],
      ...rows.map((row, indice) => [String(indice + 1), nombreDe(row), mostrarNota(leerNota(textoDe(row)))]),
    ]);
  }

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
      {/* Encabezado "curso - materia" con Exportar, buscador y promedio
          (prototipo de calificaciones del informe de diseño). */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {titulo && <h2 className="text-xl font-bold text-ink">{titulo}</h2>}
        <button
          type="button"
          onClick={exportar}
          className="ml-auto inline-flex items-center gap-2 rounded-full border border-blue/30 bg-white px-4 py-2 text-sm font-medium text-blue transition hover:bg-blue/5"
        >
          <svg viewBox="0 0 24 24" aria-hidden className="h-4 w-4 fill-none stroke-current" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 15V3m0 0-4 4m4-4 4 4M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4" />
          </svg>
          Exportar
        </button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="search"
          aria-label="Buscar alumno"
          placeholder="Buscar alumno..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="flex-1 rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm transition focus:border-primario focus:outline-none focus:ring-2 focus:ring-primario/25"
        />
        <p className="flex items-center gap-2 rounded-xl bg-accent/20 px-4 py-2 text-sm text-ink">
          <span>Promedio del curso</span>
          <strong className="text-base">{promedioDe(notas)}</strong>
        </p>
      </div>

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
            {visibles.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-gray-600">
                  No hay alumnos con ese nombre.
                </td>
              </tr>
            )}
            {visibles.map(({ row, numero }) => {
              const invalido = esInvalido(row);
              const nota = leerNota(textoDe(row));
              return (
                <tr key={row.student.id} className="border-b border-gray-100 last:border-0 odd:bg-surface/60">
                  <td className="px-4 py-2.5 text-gray-500">{numero}</td>
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
