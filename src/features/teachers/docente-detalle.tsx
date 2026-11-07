"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { Icono } from "../../components/ui/estado";
import {
  Avatar,
  BOTON_ACCION,
  BOTON_NARANJA,
  inicialesDe,
  PantallaCargando,
  PantallaError,
} from "../../components/ui/pantalla-estado";
import { ApiError, apiFetch } from "../../lib/api";
import { CAMPO, Insignia, TARJETA } from "../institution/admin-ui";
import { etiquetaTurno, nombreCurso, type Course, type Subject } from "../institution/institution";
import { cursoAlumno, formatoDni } from "../students/students";
import {
  antiguedad,
  colorMateria,
  SIN_CARGAR,
  SIN_NOMBRE,
  type Docente,
  type DocenteFicha,
  type MateriaDocente,
} from "./docentes";

const PESTANAS = ["Materias asignadas", "Datos personales", "Cursos"] as const;
type Pestana = (typeof PESTANAS)[number];

type Carga = { status: "loading" } | { status: "error" } | { status: "ready"; docente: DocenteFicha };

function Dato({ titulo, valor, icono }: { titulo: string; valor: string; icono: ReactNode }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue/10 text-blue">
        <Icono className="h-5 w-5">{icono}</Icono>
      </span>
      <div className="min-w-0 text-sm">
        <p className="text-gray-600">{titulo}</p>
        <p className="break-words text-ink">{valor}</p>
      </div>
    </div>
  );
}

function TarjetaMateria({
  materia,
  seguro,
  enviando,
  onQuitar,
}: {
  materia: MateriaDocente;
  seguro: boolean;
  enviando: boolean;
  onQuitar: () => void;
}) {
  return (
    <li className="flex items-center gap-3 rounded-xl border border-blue/10 bg-white p-3">
      <span
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-white ${colorMateria(materia.name).solido}`}
      >
        <Icono className="h-6 w-6">
          <path d="M12 6c-2-1.5-5-2-8-2v14c3 0 6 .5 8 2 2-1.5 5-2 8-2V4c-3 0-6 .5-8 2zM12 6v14" />
        </Icono>
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-ink">{materia.name}</p>
        <p className="flex flex-wrap gap-x-3 text-sm text-gray-600">
          <span>Curso: {cursoAlumno(materia.course)}</span>
          <span>Turno: {etiquetaTurno(materia.course.shift)}</span>
        </p>
      </div>
      <button
        type="button"
        aria-label={seguro ? `¿Seguro? Quitar ${materia.name}` : `Quitar ${materia.name}`}
        disabled={enviando}
        onClick={onQuitar}
        className="flex shrink-0 items-center gap-1 rounded-full p-2 text-sm text-ink hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
      >
        {seguro && <span className="text-red-700">¿Seguro?</span>}
        <Icono className="h-5 w-5">
          <path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6" />
        </Icono>
      </button>
    </li>
  );
}

function InformacionAdicional({ docente }: { docente: DocenteFicha }) {
  return (
    <section className="rounded-xl border border-blue/10 bg-white">
      <h3 className="flex items-center gap-3 border-b border-blue/10 px-4 py-3 font-semibold text-ink">
        <Icono className="h-5 w-5 text-blue">
          <path d="M5 4h14v16H5zM9 12l2 2 4-4" />
        </Icono>
        Información adicional
      </h3>
      <div className="grid gap-4 p-4 sm:grid-cols-3">
        <Dato
          titulo="Formación"
          valor={docente.training ?? SIN_CARGAR}
          icono={<path d="m2 9 10-4 10 4-10 4zM6 11v5c3 2 9 2 12 0v-5" />}
        />
        <Dato
          titulo="Antigüedad"
          valor={docente.startYear ? antiguedad(docente.startYear) : SIN_CARGAR}
          icono={
            <>
              <circle cx="12" cy="12" r="9" />
              <path d="M12 7v5l3 2" />
            </>
          }
        />
        <Dato
          titulo="Observaciones"
          valor={docente.notes ?? "Sin observaciones"}
          icono={<path d="M5 4h14v12l-4 4H5zM9 9h6M9 13h4" />}
        />
      </div>
    </section>
  );
}

function DatosPersonales({ docente }: { docente: DocenteFicha }) {
  const filas: [string, string][] = [
    ["Nombre y apellido", docente.fullName ?? SIN_NOMBRE],
    ["DNI", docente.dni ? formatoDni(docente.dni) : SIN_CARGAR],
    ["Teléfono", docente.phone ?? SIN_CARGAR],
    ["Correo electrónico", docente.email ?? SIN_CARGAR],
    ["Formación", docente.training ?? SIN_CARGAR],
    ["Año de ingreso", docente.startYear?.toString() ?? SIN_CARGAR],
    ["Observaciones", docente.notes ?? "Sin observaciones"],
  ];

  return (
    <dl className="divide-y divide-blue/10 rounded-xl border border-blue/10 bg-white">
      {filas.map(([titulo, valor]) => (
        <div key={titulo} className="flex flex-col gap-0.5 px-4 py-3 sm:flex-row sm:justify-between sm:gap-4">
          <dt className="text-sm text-gray-600">{titulo}</dt>
          <dd className="break-words text-ink sm:text-right">{valor}</dd>
        </div>
      ))}
    </dl>
  );
}

function Cursos({ docente }: { docente: DocenteFicha }) {
  const porCurso = new Map<string, MateriaDocente[]>();
  for (const materia of docente.subjects) {
    porCurso.set(materia.course.id, [...(porCurso.get(materia.course.id) ?? []), materia]);
  }

  if (porCurso.size === 0) return <p className="text-gray-600">Este docente todavía no tiene cursos.</p>;

  return (
    <ul className="flex flex-col gap-3">
      {[...porCurso.values()].map((materias) => (
        <li key={materias[0].course.id} className="rounded-xl border border-blue/10 bg-white p-3">
          <h3 className="font-semibold text-ink">{cursoAlumno(materias[0].course)}</h3>
          <p className="text-sm text-gray-600">Turno: {etiquetaTurno(materias[0].course.shift)}</p>
          <p className="mt-1 text-sm text-ink">{materias.map((materia) => materia.name).join(", ")}</p>
        </li>
      ))}
    </ul>
  );
}

export function DocenteDetalle({
  institutionId,
  docenteId,
  version,
  materias,
  cursos,
  docentes,
  onVolver,
  onEditar,
  onAsignada,
  onQuitada,
}: {
  institutionId: string;
  docenteId: string;
  version: number;
  materias: Subject[];
  cursos: Course[];
  docentes: Docente[];
  onVolver: () => void;
  onEditar: (docente: DocenteFicha) => void;
  onAsignada: () => void;
  onQuitada: () => void;
}) {
  const [carga, setCarga] = useState<Carga>({ status: "loading" });
  const [intento, setIntento] = useState(0);
  const [pestana, setPestana] = useState<Pestana>("Materias asignadas");
  const [asignando, setAsignando] = useState(false);
  const [elegida, setElegida] = useState("");
  const [confirmando, setConfirmando] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;

    apiFetch<DocenteFicha>(`/teachers/${docenteId}`, { institutionId })
      .then((docente) => {
        if (!cancelado) setCarga({ status: "ready", docente });
      })
      .catch(() => {
        if (!cancelado) setCarga({ status: "error" });
      });

    return () => {
      cancelado = true;
    };
  }, [institutionId, docenteId, version, intento]);

  // Una materia tiene un solo docente: asignarla la saca de quien la tenía.
  async function asignar(materiaId: string, teacherMembershipId: string | null, listo: () => void) {
    setEnviando(true);
    setError(null);
    try {
      await apiFetch(`/subjects/${materiaId}/teacher`, {
        method: "PUT",
        institutionId,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teacherMembershipId }),
      });
      listo();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "No se pudo conectar. Probá de nuevo en un rato.");
    } finally {
      setEnviando(false);
    }
  }

  function quitar(materiaId: string) {
    // Primer toque pide confirmación; el segundo quita de verdad.
    if (confirmando !== materiaId) {
      setConfirmando(materiaId);
      return;
    }
    setConfirmando(null);
    return asignar(materiaId, null, onQuitada);
  }

  const volver = (
    <button type="button" onClick={onVolver} className="flex items-center gap-2 text-sm font-medium text-ink">
      <Icono className="h-5 w-5">
        <path d="M20 12H4M11 5l-7 7 7 7" />
      </Icono>
      Volver a la lista
    </button>
  );

  if (carga.status === "loading") {
    return (
      <div className="flex flex-col gap-3">
        {volver}
        <PantallaCargando titulo="Cargando docente..." />
      </div>
    );
  }

  if (carga.status === "error") {
    return (
      <div className="flex flex-col gap-3">
        {volver}
        <PantallaError
          titulo="Error al cargar el docente"
          claseBoton={`${BOTON_NARANJA} inline-flex items-center gap-2`}
          onReintentar={() => {
            setCarga({ status: "loading" });
            setIntento((actual) => actual + 1);
          }}
        />
      </div>
    );
  }

  const { docente } = carga;
  const nombre = docente.fullName ?? SIN_NOMBRE;
  const cursoPorId = new Map(cursos.map((curso) => [curso.id, curso]));
  const nombrePorId = new Map(docentes.map((otro) => [otro.id, otro.fullName ?? SIN_NOMBRE]));
  const opciones = materias
    .filter((materia) => materia.teacherMembershipId !== docente.id)
    .map((materia) => {
      const curso = cursoPorId.get(materia.courseId);
      const actual = materia.teacherMembershipId && nombrePorId.get(materia.teacherMembershipId);
      return {
        value: materia.id,
        label: `${materia.name}${curso ? ` · ${nombreCurso(curso)}` : ""}${actual ? ` (hoy: ${actual})` : ""}`,
      };
    });

  return (
    <section aria-label={`Ficha de ${nombre}`} className={`flex flex-col gap-4 p-4 ${TARJETA}`}>
      {volver}

      <div className="flex flex-wrap items-start gap-4">
        <Avatar iniciales={inicialesDe(docente.fullName)} grande />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="break-words text-2xl font-semibold text-ink">{nombre}</h2>
            <Insignia activa={docente.status === "active"}>{docente.status === "active" ? "Activo" : "Inactivo"}</Insignia>
          </div>
          <p className="mt-1 text-sm text-gray-600">DNI: {docente.dni ? formatoDni(docente.dni) : SIN_CARGAR}</p>
          <p className="flex flex-wrap gap-x-4 text-sm text-gray-600">
            <span>Tel: {docente.phone ?? SIN_CARGAR}</span>
            <span className="break-all">Email: {docente.email ?? SIN_CARGAR}</span>
          </p>
        </div>
        <button
          type="button"
          onClick={() => onEditar(docente)}
          className="order-last flex w-full items-center justify-center gap-2 rounded-xl border border-blue px-4 py-2 font-medium text-blue sm:order-none sm:w-auto"
        >
          <Icono className="h-5 w-5">
            <path d="m4 20 1-4L16 5l3 3L8 19zM14 7l3 3" />
          </Icono>
          Editar
        </button>
      </div>

      <div role="tablist" aria-label="Secciones del docente" className="grid grid-cols-3 gap-2">
        {PESTANAS.map((opcion) => (
          <button
            key={opcion}
            type="button"
            role="tab"
            aria-selected={pestana === opcion}
            onClick={() => setPestana(opcion)}
            className="rounded-xl bg-blue/5 px-1 py-2.5 text-sm font-medium text-ink aria-selected:bg-accent aria-selected:text-white"
          >
            {opcion}
          </button>
        ))}
      </div>

      <div role="tabpanel" aria-label={pestana} className="flex flex-col gap-4">
        {pestana === "Materias asignadas" && (
          <>
            <section className="flex flex-col gap-3 rounded-xl border border-blue/10 bg-blue/5 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-semibold text-ink">Materias asignadas ({docente.subjects.length})</h3>
                <button
                  type="button"
                  aria-expanded={asignando}
                  onClick={() => setAsignando((actual) => !actual)}
                  className="flex items-center gap-2 rounded-lg border border-blue/20 bg-white px-3 py-1.5 text-sm font-medium text-ink"
                >
                  <Icono className="h-4 w-4">
                    <path d="M12 5v14M5 12h14" />
                  </Icono>
                  Asignar materia
                </button>
              </div>

              {asignando &&
                (materias.length === 0 ? (
                  <p className="text-sm text-gray-600">
                    Todavía no hay materias para asignar.{" "}
                    <Link href="/institucion/materias" className="font-medium text-blue hover:underline">
                      Crear una materia
                    </Link>
                  </p>
                ) : (
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <select
                      aria-label="Materia para asignar"
                      value={elegida}
                      onChange={(e) => setElegida(e.target.value)}
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
                      disabled={!elegida || enviando}
                      onClick={() => asignar(elegida, docente.id, onAsignada)}
                      className={`${BOTON_ACCION} bg-accent`}
                    >
                      Asignar
                    </button>
                  </div>
                ))}

              {error && (
                <p role="alert" className="text-sm text-red-600">
                  {error}
                </p>
              )}

              {docente.subjects.length === 0 ? (
                <p className="text-sm text-gray-600">Este docente todavía no tiene materias.</p>
              ) : (
                <ul aria-label="Materias del docente" className="flex flex-col gap-2">
                  {docente.subjects.map((materia) => (
                    <TarjetaMateria
                      key={materia.id}
                      materia={materia}
                      seguro={confirmando === materia.id}
                      enviando={enviando}
                      onQuitar={() => quitar(materia.id)}
                    />
                  ))}
                </ul>
              )}
            </section>
            <InformacionAdicional docente={docente} />
          </>
        )}
        {pestana === "Datos personales" && <DatosPersonales docente={docente} />}
        {pestana === "Cursos" && <Cursos docente={docente} />}
      </div>
    </section>
  );
}
