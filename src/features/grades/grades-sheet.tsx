"use client";

import { useEffect, useState } from "react";
import { ApiError, apiFetch } from "../../lib/api";
import { Badge } from "../../components/ui/badge";
import { Toast } from "../../components/ui/alerta";

// Instancias de nota del período, como en el prototipo de calificaciones.
const INSTANCIAS = [
  { kind: "tp1", etiqueta: "TP 1" },
  { kind: "tp2", etiqueta: "TP 2" },
  { kind: "parcial1", etiqueta: "Parcial 1" },
  { kind: "parcial2", etiqueta: "Parcial 2" },
  { kind: "final", etiqueta: "Final" },
] as const;

type Instancia = (typeof INSTANCIAS)[number]["kind"];
type Notas = Record<Instancia, number | null>;
type Textos = Record<Instancia, string>;

// Lo que devuelve GET /grades (ver README de la API). `value` es la nota del
// período: el promedio de las instancias, o una nota cargada antes de que
// existieran.
interface GradeRow {
  student: { id: string; firstName: string | null; lastName: string | null };
  value: number | null;
  items?: Partial<Notas>;
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

function mostrarNota(value: number | null | undefined): string {
  return value === null || value === undefined ? "" : String(value).replace(".", ",");
}

function nombreDe({ student }: GradeRow): string {
  return `${student.lastName ?? ""}, ${student.firstName ?? ""}`;
}

function guardada(row: GradeRow, kind: Instancia): number | null {
  return row.items?.[kind] ?? null;
}

function textosDe(row: GradeRow): Textos {
  return Object.fromEntries(INSTANCIAS.map(({ kind }) => [kind, mostrarNota(guardada(row, kind))])) as Textos;
}

// Para buscar sin importar mayúsculas ni tildes: "perez" encuentra "Pérez".
function normalizar(texto: string): string {
  return texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

// Promedio simple con 2 decimales, igual que la API.
function promediar(notas: number[]): number | null {
  if (notas.length === 0) return null;
  return Math.round((notas.reduce((suma, nota) => suma + nota, 0) / notas.length) * 100) / 100;
}

// CSV con punto y coma y BOM: Excel en castellano lo abre con tildes y columnas.
function celdaCsv(texto: string): string {
  return /[;"\r\n]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
}

function descargarCsv(nombreArchivo: string, filas: string[][]) {
  const contenido = "﻿" + filas.map((fila) => fila.map(celdaCsv).join(";") + "\r\n").join("");
  const url = URL.createObjectURL(new Blob([contenido], { type: "text/csv;charset=utf-8" }));
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = nombreArchivo;
  enlace.click();
  URL.revokeObjectURL(url);
}

function Estado({ nota }: { nota: number | null }) {
  // Texto además del color, como piden los prototipos.
  if (nota === null) return <span className="text-xs text-gray-400">Sin nota</span>;
  if (nota >= 7) return <Badge tono="verde">Aprobada</Badge>;
  if (nota >= 4) return <Badge tono="naranja">En riesgo</Badge>;
  return <Badge tono="rojo">Desaprobada</Badge>;
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
  const [textos, setTextos] = useState<Record<string, Textos>>({});
  const [guardado, setGuardado] = useState<Guardado>({ status: "idle" });
  const [busqueda, setBusqueda] = useState("");

  useEffect(() => {
    let cancelado = false;

    apiFetch<GradeRow[]>(`/grades?subjectId=${subjectId}&periodId=${periodId}`, { institutionId })
      .then((rows) => {
        if (cancelado) return;
        setTextos(Object.fromEntries(rows.map((row) => [row.student.id, textosDe(row)])));
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
  const textoDe = (row: GradeRow, kind: Instancia) => textos[row.student.id]?.[kind] ?? "";
  const estaVacio = (row: GradeRow, kind: Instancia) => textoDe(row, kind).trim() === "";
  const esInvalido = (row: GradeRow, kind: Instancia) =>
    !estaVacio(row, kind) && leerNota(textoDe(row, kind)) === null;
  // Vaciar una nota guardada la borra; la API recibe null en esa instancia.
  const seBorra = (row: GradeRow, kind: Instancia) => estaVacio(row, kind) && guardada(row, kind) !== null;
  const cambio = (row: GradeRow, kind: Instancia) =>
    estaVacio(row, kind) ? guardada(row, kind) !== null : leerNota(textoDe(row, kind)) !== guardada(row, kind);
  const cambios = (row: GradeRow) => INSTANCIAS.filter(({ kind }) => cambio(row, kind)).map(({ kind }) => kind);

  // Promedio del alumno con lo que está escrito. Sin instancias, la nota
  // cargada antes de que existieran.
  const promedioDe = (row: GradeRow): number | null => {
    const notas = INSTANCIAS.map(({ kind }) => leerNota(textoDe(row, kind))).filter(
      (nota): nota is number => nota !== null
    );
    if (notas.length > 0) return promediar(notas);
    const tieneInstancias = INSTANCIAS.some(({ kind }) => guardada(row, kind) !== null);
    return tieneInstancias ? null : row.value;
  };

  const hayInvalidos = rows.some((row) => INSTANCIAS.some(({ kind }) => esInvalido(row, kind)));
  const guardando = guardado.status === "saving";
  const puedeGuardar = !hayInvalidos && !guardando && rows.some((row) => cambios(row).length > 0);

  // La búsqueda solo oculta filas: lo escrito en las ocultas también se guarda.
  const buscado = normalizar(busqueda.trim());
  const visibles = rows
    .map((row, indice) => ({ row, numero: indice + 1 }))
    .filter(({ row }) => normalizar(nombreDe(row)).includes(buscado));
  const promedioCurso = promediar(rows.map(promedioDe).filter((nota): nota is number => nota !== null));

  function escribir(studentId: string, kind: Instancia, texto: string) {
    setTextos((actuales) => ({ ...actuales, [studentId]: { ...actuales[studentId], [kind]: texto } }));
    setGuardado({ status: "idle" });
  }

  function exportar() {
    descargarCsv(titulo ? `calificaciones ${titulo}.csv` : "calificaciones.csv", [
      ["Nº", "Alumno", ...INSTANCIAS.map(({ etiqueta }) => etiqueta), "Promedio"],
      ...rows.map((row, indice) => [
        String(indice + 1),
        nombreDe(row),
        ...INSTANCIAS.map(({ kind }) => mostrarNota(leerNota(textoDe(row, kind)))),
        mostrarNota(promedioDe(row)),
      ]),
    ]);
  }

  async function guardar() {
    const entries = rows.flatMap((row) => {
      const kinds = cambios(row);
      return kinds.length === 0
        ? []
        : [
            {
              studentId: row.student.id,
              items: Object.fromEntries(
                kinds.map((kind) => [kind, estaVacio(row, kind) ? null : leerNota(textoDe(row, kind))])
              ),
            },
          ];
    });
    setGuardado({ status: "saving" });

    try {
      await apiFetch("/grades", {
        method: "PUT",
        institutionId,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subjectId, periodId, entries }),
      });
      setCarga({
        status: "ready",
        rows: rows.map((row) => {
          if (cambios(row).length === 0) return row;
          const items = Object.fromEntries(
            INSTANCIAS.map(({ kind }) => [kind, leerNota(textoDe(row, kind))])
          ) as Notas;
          return { ...row, items, value: promediar(Object.values(items).filter((n): n is number => n !== null)) };
        }),
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
          <svg
            viewBox="0 0 24 24"
            aria-hidden
            className="h-4 w-4 fill-none stroke-current"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
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
          <strong className="text-base">{promedioCurso === null ? "Sin notas" : mostrarNota(promedioCurso)}</strong>
        </p>
      </div>

      {/* Tabla con encabezado azul, columnas de instancias alternando celeste
          y naranja, y scroll horizontal en celular (prototipo). */}
      <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-[0_8px_30px_rgba(20,24,90,0.06)]">
        <table className="w-full min-w-[56rem] border-collapse text-left text-sm">
          <thead className="text-white">
            <tr>
              <th className="bg-ink px-3 py-3 font-semibold">Nº</th>
              <th className="bg-primario px-3 py-3 font-semibold">Alumno</th>
              {INSTANCIAS.map(({ kind, etiqueta }, indice) => (
                <th
                  key={kind}
                  className={`px-2 py-3 text-center font-semibold ${
                    indice % 2 === 0 ? "bg-celeste-fuerte" : "bg-accent text-ink"
                  }`}
                >
                  {etiqueta}
                </th>
              ))}
              <th className="bg-primario px-3 py-3 text-center font-semibold">Promedio</th>
              <th className="bg-ink px-3 py-3 font-semibold">Estado</th>
            </tr>
          </thead>
          <tbody>
            {visibles.length === 0 && (
              <tr>
                <td colSpan={INSTANCIAS.length + 4} className="px-4 py-6 text-center text-gray-600">
                  No hay alumnos con ese nombre.
                </td>
              </tr>
            )}
            {visibles.map(({ row, numero }) => {
              const nombre = nombreDe(row);
              const promedio = promedioDe(row);
              const borra = INSTANCIAS.some(({ kind }) => seBorra(row, kind));
              return (
                <tr key={row.student.id} className="border-b border-gray-100 last:border-0 odd:bg-surface/60">
                  <td className="px-3 py-2.5 text-gray-500">{numero}</td>
                  <th scope="row" className="px-3 py-2.5 font-normal">
                    {nombre}
                    {borra && <p className="text-xs text-blue">{AVISO_BORRAR}</p>}
                  </th>
                  {INSTANCIAS.map(({ kind, etiqueta }) => {
                    const invalido = esInvalido(row, kind);
                    return (
                      <td key={kind} className="px-1.5 py-2.5 text-center">
                        <input
                          type="text"
                          inputMode="decimal"
                          aria-label={`${etiqueta} de ${nombre}`}
                          aria-invalid={invalido}
                          value={textoDe(row, kind)}
                          onChange={(e) => escribir(row.student.id, kind, e.target.value)}
                          className={`w-16 rounded-lg border border-gray-300 px-1.5 py-1.5 text-center transition focus:border-primario focus:outline-none focus:ring-2 focus:ring-primario/25 ${
                            invalido ? "border-rojo bg-rojo/10 text-rojo" : ""
                          }`}
                        />
                      </td>
                    );
                  })}
                  <td aria-label={`Promedio de ${nombre}`} className="px-3 py-2.5 text-center font-semibold text-ink">
                    {promedio === null ? "—" : mostrarNota(promedio)}
                  </td>
                  <td className="px-3 py-2.5">
                    <Estado nota={promedio} />
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

      {guardado.status === "saved" && (
        <Toast tipo="exito" onCerrar={() => setGuardado({ status: "idle" })}>
          ¡Listo! Las notas se guardaron.
        </Toast>
      )}
    </div>
  );
}
