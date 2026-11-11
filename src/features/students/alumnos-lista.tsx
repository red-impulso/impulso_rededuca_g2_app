"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Icono } from "../../components/ui/estado";
import {
  Avatar,
  BOTON_NARANJA,
  PantallaCargando,
  PantallaError,
  PantallaGuardada,
} from "../../components/ui/pantalla-estado";
import { apiFetch } from "../../lib/api";
import { Buscador, Insignia, POR_PAGINA, TARJETA } from "../institution/admin-ui";
import type { Course } from "../institution/institution";
import { AlumnoForm } from "./alumno-form";
import { AlumnosVacio, TituloAlumnos } from "./alumnos-ui";
import {
  cursoAlumno,
  formatoDni,
  inicialesAlumno,
  nombreCompleto,
  nombreLista,
  normalizar,
  type Student,
} from "./students";

type Carga =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; alumnos: Student[]; cursos: Course[] };

const SIN_FILTROS = { curso: "", anio: "", estado: "" };

function textoDeBusqueda(alumno: Student): string {
  return normalizar(
    [
      nombreLista(alumno),
      nombreCompleto(alumno),
      alumno.dni,
      alumno.dni && formatoDni(alumno.dni),
      alumno.course && cursoAlumno(alumno.course),
    ].join(" ")
  );
}

function Filtro({
  nombre,
  valor,
  opciones,
  onChange,
}: {
  nombre: string;
  valor: string;
  opciones: { value: string; label: string }[];
  onChange: (valor: string) => void;
}) {
  return (
    <label className={`flex min-w-0 flex-col px-3 py-1.5 text-xs text-ink ${TARJETA}`}>
      {nombre}
      <select
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-transparent text-sm outline-none"
      >
        <option value="">Todos</option>
        {opciones.map((opcion) => (
          <option key={opcion.value} value={opcion.value}>
            {opcion.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function FilaAlumno({ alumno }: { alumno: Student }) {
  const activo = alumno.status === "active";
  const detalle = [alumno.dni && formatoDni(alumno.dni), alumno.course && cursoAlumno(alumno.course)]
    .filter(Boolean)
    .join(" • ");

  return (
    <li>
      <Link href={`/alumnos/${alumno.id}`} className={`flex items-center gap-3 p-3 hover:bg-white ${TARJETA}`}>
        <Avatar iniciales={inicialesAlumno(alumno)} />
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold text-ink">{nombreLista(alumno)}</span>
          <span className="block truncate text-sm text-gray-600">{detalle}</span>
        </span>
        <Insignia activa={activo}>{activo ? "Activo" : "Inactivo"}</Insignia>
        <Icono className="h-5 w-5 shrink-0 text-ink">
          <path d="m9 5 7 7-7 7" />
        </Icono>
      </Link>
    </li>
  );
}

export function AlumnosLista({ institutionId }: { institutionId: string }) {
  const [carga, setCarga] = useState<Carga>({ status: "loading" });
  const [intento, setIntento] = useState(0);
  const [alta, setAlta] = useState(false);
  const [guardado, setGuardado] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [filtros, setFiltros] = useState(SIN_FILTROS);
  const [cantidad, setCantidad] = useState(POR_PAGINA);

  useEffect(() => {
    let cancelado = false;

    Promise.all([
      apiFetch<Student[]>("/students", { institutionId }),
      apiFetch<Course[]>("/courses", { institutionId }),
    ])
      .then(([alumnos, cursos]) => {
        if (!cancelado) setCarga({ status: "ready", alumnos, cursos });
      })
      .catch(() => {
        if (!cancelado) setCarga({ status: "error" });
      });

    return () => {
      cancelado = true;
    };
  }, [institutionId, intento]);

  const titulo = <TituloAlumnos titulo="Lista de alumnos" />;

  if (carga.status === "loading") {
    return (
      <>
        {titulo}
        <PantallaCargando titulo="Cargando alumnos..." />
      </>
    );
  }

  if (carga.status === "error") {
    return (
      <>
        {titulo}
        <PantallaError
          titulo="Error al cargar la lista de alumnos"
          onReintentar={() => {
            setCarga({ status: "loading" });
            setIntento((actual) => actual + 1);
          }}
        />
      </>
    );
  }

  if (guardado) {
    return (
      <>
        {titulo}
        <PantallaGuardada>
          <Link href={`/alumnos/${guardado}`} className={`inline-block ${BOTON_NARANJA}`}>
            Ver alumno
          </Link>
        </PantallaGuardada>
      </>
    );
  }

  if (alta) {
    return (
      <>
        <TituloAlumnos titulo="Nuevo alumno" />
        <AlumnoForm
          institutionId={institutionId}
          cursos={carga.cursos}
          onGuardado={setGuardado}
          onCancelar={() => setAlta(false)}
        />
      </>
    );
  }

  if (carga.alumnos.length === 0) {
    return (
      <>
        {titulo}
        <AlumnosVacio onNuevo={() => setAlta(true)} />
      </>
    );
  }

  const cicloDe = new Map(carga.cursos.map((curso) => [curso.id, String(curso.schoolYear)]));
  const ciclos = [...new Set(cicloDe.values())].sort().reverse();

  const buscado = normalizar(busqueda.trim());
  const filtrados = carga.alumnos.filter(
    (alumno) =>
      textoDeBusqueda(alumno).includes(buscado) &&
      (!filtros.curso || alumno.course?.id === filtros.curso) &&
      (!filtros.anio || (alumno.course && cicloDe.get(alumno.course.id) === filtros.anio)) &&
      (!filtros.estado || alumno.status === filtros.estado)
  );
  const visibles = filtrados.slice(0, cantidad);

  function filtrar(cambio: Partial<typeof SIN_FILTROS>) {
    setFiltros({ ...filtros, ...cambio });
    setCantidad(POR_PAGINA);
  }

  return (
    <>
      <TituloAlumnos titulo="Lista de alumnos" volver={{ href: "/inicio", nombre: "Volver al inicio" }} />

      <div className="flex flex-col gap-3">
        <Buscador
          nombre="alumno por nombre, DNI o curso"
          valor={busqueda}
          onChange={(valor) => {
            setBusqueda(valor);
            setCantidad(POR_PAGINA);
          }}
        />
        <div className="grid grid-cols-3 gap-2">
          <Filtro
            nombre="Curso"
            valor={filtros.curso}
            opciones={carga.cursos.map((curso) => ({
              value: curso.id,
              label: `${cursoAlumno(curso)} · ${curso.schoolYear}`,
            }))}
            onChange={(curso) => filtrar({ curso })}
          />
          <Filtro
            nombre="Año"
            valor={filtros.anio}
            opciones={ciclos.map((ciclo) => ({ value: ciclo, label: ciclo }))}
            onChange={(anio) => filtrar({ anio })}
          />
          <Filtro
            nombre="Estado"
            valor={filtros.estado}
            opciones={[
              { value: "active", label: "Activo" },
              { value: "inactive", label: "Inactivo" },
            ]}
            onChange={(estado) => filtrar({ estado })}
          />
        </div>
        <button
          type="button"
          onClick={() => setAlta(true)}
          className="flex items-center justify-center gap-2 rounded-full bg-accent px-6 py-3 font-medium text-ink"
        >
          <Icono className="h-5 w-5">
            <path d="M12 5v14M5 12h14" />
          </Icono>
          Nuevo alumno
        </button>
      </div>

      {filtrados.length === 0 ? (
        <p className={`p-6 text-center text-gray-600 ${TARJETA}`}>No se encontraron alumnos con esa búsqueda.</p>
      ) : (
        <>
          <ul aria-label="Alumnos" className="flex flex-col gap-2">
            {visibles.map((alumno) => (
              <FilaAlumno key={alumno.id} alumno={alumno} />
            ))}
          </ul>
          <div className="flex items-center justify-between gap-3 text-sm text-ink">
            <p>
              Mostrando {visibles.length} de {filtrados.length} alumnos
            </p>
            {visibles.length < filtrados.length && (
              <button
                type="button"
                onClick={() => setCantidad((actual) => actual + POR_PAGINA)}
                className="font-medium text-blue hover:underline"
              >
                Ver más
              </button>
            )}
          </div>
        </>
      )}
    </>
  );
}
