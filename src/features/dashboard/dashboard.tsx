"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";
import { Cargando, Estado, Icono } from "../../components/ui/estado";
import { apiFetch } from "../../lib/api";

interface Course {
  year: number;
  division: string;
}

// Lo que devuelve GET /dashboard (ver README de la API).
interface DashboardData {
  students: number;
  courses: number;
  teachers: number;
  attendanceAverage: number | null;
  lowAttendance: {
    student: { id: string; firstName: string | null; lastName: string | null };
    course: Course;
    percentage: number;
  }[];
  gradeAverages: {
    subject: { id: string; name: string };
    course: Course;
    average: number | null;
  }[];
}

interface Novedad {
  id: string;
  title: string;
  body: string;
  createdAt: string;
}

type Carga =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; data: DashboardData; novedades: Novedad[] | null };

const ZONA = "America/Argentina/Jujuy";
const NOVEDADES_VISIBLES = 4;

function conComa(valor: number): string {
  return String(valor).replace(".", ",");
}

function mostrarCurso({ year, division }: Course): string {
  return `${year}°${division}`;
}

export function mostrarHoy(ahora = new Date()): string {
  const fecha = ahora.toLocaleDateString("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: ZONA,
  });
  return `Hoy, ${fecha}`;
}

// Sin el año, es-AR no agrega el cero ("5/11"): se pide completa y se corta.
function diaYMes(createdAt: string): string {
  return new Date(createdAt)
    .toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone: ZONA,
    })
    .slice(0, 5);
}

function Numero({
  titulo,
  valor,
  color,
  icono,
}: {
  titulo: string;
  valor: string;
  color: string;
  icono: ReactNode;
}) {
  return (
    <div
      role="group"
      aria-label={titulo}
      className="flex flex-col gap-2 rounded-2xl border border-white/80 bg-white/80 p-4 shadow-[0_8px_30px_rgba(20,33,61,0.08)] backdrop-blur sm:flex-row sm:items-center sm:gap-3"
    >
      <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-white ${color}`}>
        <Icono className="h-6 w-6">{icono}</Icono>
      </span>
      <span className="min-w-0">
        <span className="block text-sm text-gray-600">{titulo}</span>
        <span className="block text-2xl font-semibold">{valor}</span>
      </span>
    </div>
  );
}

function Seccion({
  id,
  titulo,
  accion,
  children,
}: {
  id: string;
  titulo: string;
  accion?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section
      aria-labelledby={id}
      className="rounded-2xl border border-white/80 bg-white/80 p-4 shadow-[0_8px_30px_rgba(20,33,61,0.08)] backdrop-blur"
    >
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 id={id} className="text-lg font-semibold">
          {titulo}
        </h2>
        {accion}
      </div>
      {children}
    </section>
  );
}

export function Dashboard({ institutionId }: { institutionId: string }) {
  const [carga, setCarga] = useState<Carga>({ status: "loading" });
  const [intento, setIntento] = useState(0);
  const [confirmar, setConfirmar] = useState(false);

  useEffect(() => {
    let cancelado = false;

    Promise.all([
      apiFetch<DashboardData>("/dashboard", { institutionId }),
      // Las novedades son un extra: si fallan, el tablero se ve igual.
      apiFetch<Novedad[]>("/announcements", { institutionId }).catch(() => null),
    ])
      .then(([data, novedades]) => {
        if (!cancelado) setCarga({ status: "ready", data, novedades });
      })
      .catch(() => {
        if (!cancelado) setCarga({ status: "error" });
      });

    return () => {
      cancelado = true;
    };
  }, [institutionId, intento]);

  function reintentar() {
    setCarga({ status: "loading" });
    setConfirmar(true);
    setIntento((actual) => actual + 1);
  }

  const botonReintentar = (color: string) => (
    <button
      type="button"
      onClick={reintentar}
      className={`mt-1 rounded-full px-8 py-2 font-medium text-white ${color}`}
    >
      Reintentar
    </button>
  );

  if (carga.status === "loading") {
    return (
      <Estado
        ilustracion={<Cargando />}
        titulo="Cargando datos del tablero..."
        texto="Por favor, esperá un momento."
      />
    );
  }

  if (carga.status === "error") {
    return (
      <div role="alert">
        <Estado
          fondo="bg-red-50"
          ilustracion={
            <Icono className="h-14 w-14 text-red-600">
              <path d="M12 3 22.5 21h-21zM12 10v5M12 18v.5" />
            </Icono>
          }
          titulo="Error al cargar la información"
          texto="Ocurrió un problema al obtener los datos. Intentá nuevamente."
        >
          {botonReintentar("bg-red-600")}
        </Estado>
      </div>
    );
  }

  const { data, novedades } = carga;

  if (data.students === 0 && data.courses === 0) {
    return (
      <Estado
        ilustracion={
          <Icono className="h-16 w-16 text-blue">
            <rect x="5" y="4" width="12" height="16" rx="2" />
            <path d="M8 9h6M8 13h3" />
            <circle cx="16" cy="15" r="3.5" />
            <path d="m18.5 17.5 3 3" />
          </Icono>
        }
        titulo="No hay datos disponibles"
        texto="Todavía no se registraron datos en la institución."
      >
        {botonReintentar("bg-blue")}
      </Estado>
    );
  }

  if (confirmar) {
    return (
      <Estado
        fondo="bg-green/10"
        ilustracion={
          <Icono className="h-14 w-14 text-green">
            <circle cx="12" cy="12" r="9.5" />
            <path d="m8 12.5 2.5 2.5 5.5-5.5" />
          </Icono>
        }
        titulo="¡Datos actualizados!"
        texto="La información se cargó correctamente."
      >
        <button
          type="button"
          onClick={() => setConfirmar(false)}
          className="mt-1 rounded-full bg-green px-8 py-2 font-medium text-white"
        >
          Ver tablero
        </button>
      </Estado>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="flex items-center gap-2 self-start rounded-xl border border-white/80 bg-white/80 px-4 py-2 text-sm">
        <Icono className="h-5 w-5 text-blue">
          <rect x="4" y="5" width="16" height="15" rx="2" />
          <path d="M4 10h16M8 3v4M16 3v4" />
        </Icono>
        {mostrarHoy()}
      </p>

      <div className="grid grid-cols-2 gap-3">
        <Numero
          titulo="Total de estudiantes"
          valor={String(data.students)}
          color="bg-blue"
          icono={
            <>
              <circle cx="9" cy="8" r="3.5" />
              <path d="M2.5 20c0-4 3-6.5 6.5-6.5s6.5 2.5 6.5 6.5M16 5a3.5 3.5 0 0 1 0 6.5M18 14c2 .8 3.5 3 3.5 6" />
            </>
          }
        />
        <Numero
          titulo="Cursos activos"
          valor={String(data.courses)}
          color="bg-[#833dff]"
          icono={<path d="M12 6c-2-1.5-5-2-8-2v14c3 0 6 .5 8 2 2-1.5 5-2 8-2V4c-3 0-6 .5-8 2zM12 6v14" />}
        />
        <Numero
          titulo="Docentes"
          valor={String(data.teachers)}
          color="bg-green"
          icono={
            <>
              <circle cx="12" cy="8" r="4" />
              <path d="M4.5 20.5c0-4 3.4-6.5 7.5-6.5s7.5 2.5 7.5 6.5" />
            </>
          }
        />
        <Numero
          titulo="Asistencia promedio"
          valor={data.attendanceAverage === null ? "—" : `${conComa(data.attendanceAverage)} %`}
          color="bg-accent"
          icono={
            <>
              <rect x="4" y="5" width="16" height="15" rx="2" />
              <path d="M4 10h16M8 3v4M16 3v4M9 15l2 2 4-4" />
            </>
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Seccion id="tablero-baja-asistencia" titulo="Alumnos con baja asistencia">
          {data.lowAttendance.length === 0 ? (
            <p className="text-gray-600">Nadie por debajo del 85 %.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {data.lowAttendance.map(({ student, course, percentage }) => (
                <li key={student.id} className="flex items-center justify-between gap-2 py-2">
                  <span className="min-w-0">
                    <span className="block font-medium">
                      {student.firstName} {student.lastName}
                    </span>
                    <span className="block text-sm text-gray-600">{mostrarCurso(course)}</span>
                  </span>
                  <span className="shrink-0 font-semibold">{conComa(percentage)} %</span>
                </li>
              ))}
            </ul>
          )}
        </Seccion>

        <Seccion id="tablero-promedios" titulo="Promedios por materia">
          {data.gradeAverages.length === 0 ? (
            <p className="text-gray-600">Todavía no hay materias.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {data.gradeAverages.map(({ subject, course, average }) => (
                <li key={subject.id}>
                  <span className="flex items-center justify-between gap-2 text-sm">
                    <span>
                      {subject.name} · {mostrarCurso(course)}
                    </span>
                    {average === null ? (
                      <span className="text-gray-600">Sin notas</span>
                    ) : (
                      <span className="font-semibold">{conComa(average)}</span>
                    )}
                  </span>
                  <span aria-hidden className="mt-1 block h-2 overflow-hidden rounded-full bg-blue/10">
                    <span
                      className="block h-full rounded-full bg-blue"
                      style={{ width: `${(average ?? 0) * 10}%` }}
                    />
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Seccion>
      </div>

      <Seccion
        id="tablero-novedades"
        titulo="Últimas novedades"
        accion={
          <Link href="/comunicados" className="text-sm text-blue">
            Ver todas
          </Link>
        }
      >
        {novedades === null && <p className="text-gray-600">No se pudieron cargar las novedades.</p>}
        {novedades?.length === 0 && <p className="text-gray-600">Todavía no hay novedades.</p>}
        {novedades && novedades.length > 0 && (
          <ul className="divide-y divide-gray-100">
            {novedades.slice(0, NOVEDADES_VISIBLES).map((novedad) => (
              <li key={novedad.id} className="flex items-center justify-between gap-3 py-2">
                <span className="min-w-0">
                  <span className="block font-medium">{novedad.title}</span>
                  <span className="block truncate text-sm text-gray-600">{novedad.body}</span>
                </span>
                <span className="shrink-0 text-xs text-gray-600">{diaYMes(novedad.createdAt)}</span>
              </li>
            ))}
          </ul>
        )}
      </Seccion>
    </div>
  );
}
