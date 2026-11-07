"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Icono } from "../../components/ui/estado";
import {
  Avatar,
  BOTON_NARANJA,
  PantallaCargando,
  PantallaError,
  PantallaGuardada,
} from "../../components/ui/pantalla-estado";
import { ApiError, apiFetch } from "../../lib/api";
import { StudentAttendance } from "../guardians/student-attendance";
import { StudentGrades } from "../guardians/student-grades";
import { StudentGuardians } from "../guardians/student-guardians";
import { Insignia, TARJETA } from "../institution/admin-ui";
import { etiquetaTurno, type Course } from "../institution/institution";
import { AlumnoForm } from "./alumno-form";
import { TituloAlumnos } from "./alumnos-ui";
import {
  cursoAlumno,
  formatoDni,
  formatoFecha,
  inicialesAlumno,
  nombreCompleto,
  type StudentFile,
} from "./students";

type Carga =
  | { status: "loading" }
  | { status: "error"; mensaje?: string }
  | { status: "ready"; alumno: StudentFile; cursos: Course[] };

const PESTANAS = ["Datos personales", "Académica", "Familia"] as const;
type Pestana = (typeof PESTANAS)[number];

const VOLVER = { href: "/alumnos", nombre: "Volver a la lista" };

function fechaDe(momento: string): string {
  return new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(
    new Date(momento)
  );
}

function Seccion({ titulo, icono, children }: { titulo: string; icono: ReactNode; children: ReactNode }) {
  return (
    <section className={TARJETA}>
      <h3 className="flex items-center gap-3 border-b border-blue/10 px-4 py-3 font-semibold text-ink">
        <Icono className="h-6 w-6">{icono}</Icono>
        {titulo}
      </h3>
      {children}
    </section>
  );
}

function Dato({ etiqueta, valor, icono }: { etiqueta: string; valor: string | null; icono: ReactNode }) {
  return (
    <div className="flex items-center gap-3 px-4 py-2.5">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue/5 text-ink">
        <Icono className="h-5 w-5">{icono}</Icono>
      </span>
      <div className="min-w-0">
        <p className="text-sm text-gray-600">{etiqueta}</p>
        <p className="break-words text-ink">{valor ?? "Sin cargar"}</p>
      </div>
    </div>
  );
}

function DatosPersonales({ alumno }: { alumno: StudentFile }) {
  const activo = alumno.status === "active";
  const columna = "px-4 py-3";

  return (
    <div className="flex flex-col gap-4">
      <Seccion
        titulo="Datos personales"
        icono={
          <>
            <circle cx="12" cy="8" r="4" />
            <path d="M4 21c0-4.5 3.5-7 8-7s8 2.5 8 7" />
          </>
        }
      >
        <div className="py-1">
          <Dato
            etiqueta="Fecha de nacimiento"
            valor={alumno.birthDate && formatoFecha(alumno.birthDate)}
            icono={<path d="M5 5h14v15H5zM5 10h14M9 3v4M15 3v4" />}
          />
          <Dato
            etiqueta="Dirección"
            valor={alumno.address}
            icono={
              <>
                <path d="M12 21s7-6 7-11a7 7 0 0 0-14 0c0 5 7 11 7 11z" />
                <circle cx="12" cy="10" r="2.5" />
              </>
            }
          />
          <Dato
            etiqueta="Teléfono"
            valor={alumno.phone}
            icono={<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A15 15 0 0 1 3 6a2 2 0 0 1 2-2z" />}
          />
          <Dato
            etiqueta="Correo electrónico"
            valor={alumno.email}
            icono={<path d="M3 6h18v13H3zM3 7l9 7 9-7" />}
          />
        </div>
      </Seccion>

      <Seccion
        titulo="Información del alumno"
        icono={<path d="M6 3h8l4 4v14H6zM14 3v4h4M9 12h6M9 16h6" />}
      >
        <dl className="grid grid-cols-3 divide-x divide-blue/10 text-sm">
          <div className={columna}>
            <dt className="font-medium text-ink">Turno</dt>
            <dd className="text-ink">{alumno.course ? etiquetaTurno(alumno.course.shift) : "—"}</dd>
          </div>
          <div className={columna}>
            <dt className="font-medium text-ink">Curso</dt>
            <dd className="text-ink">{alumno.course ? cursoAlumno(alumno.course) : "—"}</dd>
          </div>
          <div className={columna}>
            <dt className="font-medium text-ink">Estado</dt>
            <dd>
              <Insignia activa={activo}>{activo ? "Activo" : "Inactivo"}</Insignia>
            </dd>
          </div>
        </dl>
      </Seccion>

      {alumno.updatedAt && (
        <div className="flex items-center gap-3 rounded-xl border border-accent/20 bg-accent/10 px-4 py-2.5 text-accent">
          <Icono className="h-6 w-6 shrink-0">
            <circle cx="12" cy="12" r="9.5" />
            <path d="M12 11v5M12 8v.5" />
          </Icono>
          <div>
            <p className="text-sm font-medium">Última actualización: {fechaDe(alumno.updatedAt)}</p>
            <p className="text-xs">Los datos del alumno se mantienen actualizados.</p>
          </div>
        </div>
      )}
    </div>
  );
}

export function AlumnoFicha({ institutionId, studentId }: { institutionId: string; studentId: string }) {
  const [carga, setCarga] = useState<Carga>({ status: "loading" });
  const [intento, setIntento] = useState(0);
  const [pestana, setPestana] = useState<Pestana>("Datos personales");
  const [editando, setEditando] = useState(false);
  const [guardado, setGuardado] = useState(false);

  useEffect(() => {
    let cancelado = false;

    Promise.all([
      apiFetch<StudentFile>(`/students/${studentId}`, { institutionId }),
      apiFetch<Course[]>("/courses", { institutionId }),
    ])
      .then(([alumno, cursos]) => {
        if (!cancelado) setCarga({ status: "ready", alumno, cursos });
      })
      .catch((error) => {
        if (cancelado) return;
        setCarga({ status: "error", mensaje: error instanceof ApiError ? error.message : undefined });
      });

    return () => {
      cancelado = true;
    };
  }, [institutionId, studentId, intento]);

  function recargar() {
    setCarga({ status: "loading" });
    setIntento((actual) => actual + 1);
  }

  const titulo = <TituloAlumnos titulo="Ficha del alumno" volver={VOLVER} />;

  if (carga.status === "loading") {
    return (
      <>
        {titulo}
        <PantallaCargando titulo="Cargando alumno..." />
      </>
    );
  }

  if (carga.status === "error") {
    return (
      <>
        {titulo}
        <PantallaError titulo="Error al cargar la ficha del alumno" texto={carga.mensaje} onReintentar={recargar} />
      </>
    );
  }

  if (guardado) {
    return (
      <>
        {titulo}
        <PantallaGuardada>
          <button
            type="button"
            onClick={() => {
              setGuardado(false);
              recargar();
            }}
            className={BOTON_NARANJA}
          >
            Ver alumno
          </button>
        </PantallaGuardada>
      </>
    );
  }

  const { alumno, cursos } = carga;

  if (editando) {
    return (
      <>
        <TituloAlumnos titulo="Editar alumno" volver={VOLVER} />
        <AlumnoForm
          institutionId={institutionId}
          cursos={cursos}
          alumno={alumno}
          onGuardado={() => {
            setEditando(false);
            setGuardado(true);
          }}
          onCancelar={() => setEditando(false)}
        />
      </>
    );
  }

  const activo = alumno.status === "active";
  const ciclo = cursos.find((curso) => curso.id === alumno.course?.id)?.schoolYear;

  return (
    <>
      {titulo}

      <section className={`flex flex-col gap-4 p-4 ${TARJETA}`}>
        <div className="flex flex-wrap items-center gap-4">
          <Avatar iniciales={inicialesAlumno(alumno)} grande />
          <div className="min-w-0 flex-1 basis-44">
            <h2 className="break-words text-xl font-semibold text-ink">{nombreCompleto(alumno)}</h2>
            {alumno.dni && <p className="text-ink">DNI: {formatoDni(alumno.dni)}</p>}
            <p className="flex flex-wrap gap-x-3 text-sm text-ink">
              {alumno.course && <span>Curso: {cursoAlumno(alumno.course)}</span>}
              {ciclo !== undefined && <span>Año: {ciclo}</span>}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2 max-sm:w-full max-sm:justify-end sm:flex-col sm:items-end">
            <Insignia activa={activo}>{activo ? "Activo" : "Inactivo"}</Insignia>
            <button
              type="button"
              onClick={() => setEditando(true)}
              className="flex items-center gap-1.5 rounded-full border border-accent px-3 py-1 text-sm font-medium text-accent"
            >
              <Icono className="h-4 w-4">
                <path d="m4 20 1-4L16 5l3 3L8 19zM14 7l3 3" />
              </Icono>
              Editar
            </button>
          </div>
        </div>

        <div role="tablist" aria-label="Secciones de la ficha" className="grid grid-cols-[1.5fr_1fr_1fr] gap-2">
          {PESTANAS.map((nombre) => (
            <button
              key={nombre}
              type="button"
              role="tab"
              aria-selected={pestana === nombre}
              onClick={() => setPestana(nombre)}
              className="rounded-xl bg-blue/5 px-1 py-2.5 text-sm font-medium text-ink aria-selected:bg-accent aria-selected:text-white"
            >
              {nombre}
            </button>
          ))}
        </div>
      </section>

      <div role="tabpanel" aria-label={pestana}>
        {pestana === "Datos personales" && <DatosPersonales alumno={alumno} />}
        {pestana === "Académica" && (
          <div className="flex flex-col gap-4">
            <StudentGrades institutionId={institutionId} studentId={studentId} />
            <StudentAttendance institutionId={institutionId} studentId={studentId} />
          </div>
        )}
        {pestana === "Familia" && <StudentGuardians institutionId={institutionId} studentId={studentId} />}
      </div>
    </>
  );
}
