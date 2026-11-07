"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Estado, Icono } from "../../components/ui/estado";
import { ApiError, apiFetch } from "../../lib/api";
import { Buscador, CAMPO, EstadoCargando, EstadoError, TARJETA } from "../institution/admin-ui";
import { nombreCurso, type Course, type Subject, type Teacher } from "../institution/institution";
import { Avatar } from "../../components/ui/pantalla-estado";
import { normalizar } from "../students/students";

// GET /teachers: cada docente trae las materias que dicta, con su curso.
interface Docente extends Teacher {
  subjects: { id: string; name: string; course: Pick<Course, "year" | "division"> }[];
}

type Carga =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; docentes: Docente[]; materias: Subject[]; cursos: Course[] };

const SIN_NOMBRE = "Sin nombre";

function iniciales(nombre: string | null): string {
  return (nombre ?? "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((palabra) => palabra[0].toUpperCase())
    .join("");
}

function TarjetaDocente({
  docente,
  opciones,
  elegida,
  enviando,
  onElegir,
  onAsignar,
  onQuitar,
}: {
  docente: Docente;
  opciones: { value: string; label: string }[] | null;
  elegida: string;
  enviando: boolean;
  onElegir: (materiaId: string) => void;
  onAsignar: () => void;
  onQuitar: (materiaId: string) => void;
}) {
  const nombre = docente.fullName ?? SIN_NOMBRE;

  return (
    <li aria-label={nombre} className={`flex flex-col gap-3 p-4 ${TARJETA}`}>
      <div className="flex items-center gap-3">
        <Avatar iniciales={iniciales(docente.fullName)} />
        <h2 className="min-w-0 break-words font-semibold text-ink">{nombre}</h2>
      </div>

      {docente.subjects.length === 0 ? (
        <p className="text-sm text-gray-600">Sin materias asignadas.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {docente.subjects.map((materia) => {
            const etiqueta = `${materia.name} · ${nombreCurso(materia.course)}`;
            return (
              <span
                key={materia.id}
                className="flex items-center gap-1 rounded-full bg-blue/10 py-1 pl-3 pr-1 text-sm text-ink"
              >
                <span>{etiqueta}</span>
                <button
                  type="button"
                  aria-label={`Quitar ${etiqueta} a ${nombre}`}
                  disabled={enviando}
                  onClick={() => onQuitar(materia.id)}
                  className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-blue/20 disabled:opacity-50"
                >
                  <Icono className="h-3.5 w-3.5">
                    <path d="M6 6l12 12M18 6 6 18" />
                  </Icono>
                </button>
              </span>
            );
          })}
        </div>
      )}

      {opciones && opciones.length > 0 && (
        <div className="flex flex-col gap-2 sm:flex-row">
          <select
            aria-label={`Materia para ${nombre}`}
            value={elegida}
            onChange={(e) => onElegir(e.target.value)}
            className={`min-w-0 flex-1 ${CAMPO}`}
          >
            <option value="">Elegí una materia</option>
            {opciones.map((opcion) => (
              <option key={opcion.value} value={opcion.value}>
                {opcion.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            aria-label={`Asignar a ${nombre}`}
            disabled={!elegida || enviando}
            onClick={onAsignar}
            className="rounded-xl bg-blue px-4 py-2 font-medium text-white disabled:opacity-50"
          >
            Asignar
          </button>
        </div>
      )}
    </li>
  );
}

export function DocentesAdmin({ institutionId }: { institutionId: string }) {
  const [carga, setCarga] = useState<Carga>({ status: "loading" });
  const [intento, setIntento] = useState(0);
  const [busqueda, setBusqueda] = useState("");
  const [elegidas, setElegidas] = useState<Record<string, string>>({});
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;

    Promise.all([
      apiFetch<Docente[]>("/teachers", { institutionId }),
      apiFetch<Subject[]>("/subjects", { institutionId }),
      apiFetch<Course[]>("/courses", { institutionId }),
    ])
      .then(([docentes, materias, cursos]) => {
        if (!cancelado) setCarga({ status: "ready", docentes, materias, cursos });
      })
      .catch(() => {
        if (!cancelado) setCarga({ status: "error" });
      });

    return () => {
      cancelado = true;
    };
  }, [institutionId, intento]);

  // Una materia tiene un solo docente: asignarla la saca de quien la tenía.
  async function asignar(materiaId: string, docenteId: string | null) {
    setEnviando(true);
    setError(null);
    try {
      await apiFetch(`/subjects/${materiaId}/teacher`, {
        method: "PUT",
        institutionId,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teacherMembershipId: docenteId }),
      });
      setElegidas({});
      setIntento((actual) => actual + 1);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "No se pudo conectar. Probá de nuevo en un rato.");
    } finally {
      setEnviando(false);
    }
  }

  if (carga.status === "loading") return <EstadoCargando titulo="Cargando docentes..." />;

  if (carga.status === "error") {
    return (
      <EstadoError
        titulo="Error al cargar los docentes"
        onReintentar={() => {
          setCarga({ status: "loading" });
          setIntento((actual) => actual + 1);
        }}
      />
    );
  }

  if (carga.docentes.length === 0) {
    return (
      <Estado
        ilustracion={
          <Icono className="h-16 w-16 text-blue">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 21c0-4.5 3.5-7 8-7s8 2.5 8 7" />
          </Icono>
        }
        titulo="No hay docentes registrados"
        texto="Cuando la institución sume docentes van a aparecer acá."
      />
    );
  }

  const { docentes, materias, cursos } = carga;
  const cursoPorId = new Map(cursos.map((curso) => [curso.id, curso]));
  const nombrePorId = new Map(docentes.map((docente) => [docente.id, docente.fullName ?? SIN_NOMBRE]));

  function opcionesPara(docente: Docente) {
    return materias
      .filter((materia) => materia.teacherMembershipId !== docente.id)
      .map((materia) => {
        const curso = cursoPorId.get(materia.courseId);
        const actual = materia.teacherMembershipId && nombrePorId.get(materia.teacherMembershipId);
        return {
          value: materia.id,
          label: `${materia.name}${curso ? ` · ${nombreCurso(curso)}` : ""}${actual ? ` (hoy: ${actual})` : ""}`,
        };
      });
  }

  const buscado = normalizar(busqueda.trim());
  const filtrados = docentes.filter((docente) =>
    normalizar(
      [docente.fullName, ...docente.subjects.map((materia) => materia.name)].filter(Boolean).join(" ")
    ).includes(buscado)
  );

  return (
    <div className="flex flex-col gap-4">
      <Buscador nombre="docente o materia" valor={busqueda} onChange={setBusqueda} />

      {materias.length === 0 && (
        <p className={`p-4 text-sm ${TARJETA}`}>
          Todavía no hay materias para asignar.{" "}
          <Link href="/institucion/materias" className="font-medium text-blue hover:underline">
            Crear una materia
          </Link>
        </p>
      )}

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      {filtrados.length === 0 ? (
        <p className={`p-6 text-center text-gray-600 ${TARJETA}`}>No se encontraron docentes con esa búsqueda.</p>
      ) : (
        <ul aria-label="Docentes" className="flex flex-col gap-3">
          {filtrados.map((docente) => (
            <TarjetaDocente
              key={docente.id}
              docente={docente}
              opciones={opcionesPara(docente)}
              elegida={elegidas[docente.id] ?? ""}
              enviando={enviando}
              onElegir={(materiaId) => setElegidas({ ...elegidas, [docente.id]: materiaId })}
              onAsignar={() => asignar(elegidas[docente.id], docente.id)}
              onQuitar={(materiaId) => asignar(materiaId, null)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
