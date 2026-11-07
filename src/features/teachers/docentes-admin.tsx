"use client";

import { useEffect, useState } from "react";
import { Icono } from "../../components/ui/estado";
import {
  Avatar,
  BOTON_ACCION,
  BOTON_NARANJA,
  inicialesDe,
  PantallaCargando,
  PantallaError,
  PantallaGuardada,
  PantallaVacia,
} from "../../components/ui/pantalla-estado";
import { ApiError, apiFetch } from "../../lib/api";
import { Buscador, CAMPO, Insignia, MenuAcciones, Paginacion, POR_PAGINA, TARJETA } from "../institution/admin-ui";
import { nombreCurso, type Course, type Subject } from "../institution/institution";
import { formatoDni, normalizar } from "../students/students";
import { DocenteDetalle } from "./docente-detalle";
import { DocenteForm } from "./docente-form";
import { colorMateria, SIN_NOMBRE, type Docente, type DocenteFicha } from "./docentes";

type Carga =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; docentes: Docente[]; materias: Subject[]; cursos: Course[] };

// Lo que ocupa el panel de la derecha; en pantallas chicas reemplaza a la lista.
type Panel =
  | { tipo: "ficha"; id: string }
  | { tipo: "nuevo" }
  | { tipo: "editar"; docente: DocenteFicha }
  | { tipo: "guardado"; id: string; texto: string };

const COLUMNAS = "md:grid md:grid-cols-[2.5rem_1.5fr_0.9fr_1.8fr_0.8fr_7rem] md:items-center md:gap-3";

const ICONO_PERSONA = (
  <>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21c0-4.5 3.5-7 8-7 1 0 2 .1 3 .4M16 16l5 5M21 16l-5 5" />
  </>
);

function BotonNuevo({ redondo, onClick }: { redondo?: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={redondo ? `inline-flex items-center gap-2 ${BOTON_NARANJA}` : `${BOTON_ACCION} shrink-0 bg-accent max-md:px-4 max-md:text-sm`}
    >
      <Icono className="h-5 w-5">
        <path d="M12 5v14M5 12h14" />
      </Icono>
      Nuevo docente
    </button>
  );
}

function FilaDocente({
  docente,
  abierto,
  onVer,
  onEditar,
  onCambiarEstado,
}: {
  docente: Docente;
  abierto: boolean;
  onVer: () => void;
  onEditar: () => void;
  onCambiarEstado: () => void;
}) {
  const nombre = docente.fullName ?? SIN_NOMBRE;
  const activo = docente.status === "active";

  return (
    <li
      aria-label={nombre}
      className={`relative flex items-start gap-3 rounded-xl border border-blue/10 p-3 md:rounded-none md:border-0 md:border-b md:px-3 md:py-2 ${COLUMNAS} ${
        abierto ? "bg-blue/5" : ""
      }`}
    >
      <Avatar iniciales={inicialesDe(docente.fullName)} mediano />

      <div className="min-w-0 flex-1 md:contents">
        <p className="break-words font-semibold text-ink md:text-sm md:font-medium">{nombre}</p>
        <p className="text-sm text-gray-600">{docente.dni ? formatoDni(docente.dni) : "Sin DNI"}</p>
        <div className="mt-1 flex flex-wrap gap-1.5 md:mt-0">
          {docente.subjects.length === 0 ? (
            <span className="text-sm text-gray-500">Sin materias</span>
          ) : (
            [...new Set(docente.subjects.map((materia) => materia.name))].map((materia) => (
              <span key={materia} className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${colorMateria(materia).chip}`}>
                {materia}
              </span>
            ))
          )}
        </div>
      </div>

      <p className="shrink-0">
        <Insignia activa={activo}>{activo ? "Activo" : "Inactivo"}</Insignia>
      </p>

      <div className="flex shrink-0 items-center self-center md:justify-end">
        <button
          type="button"
          aria-label={`Ver a ${nombre}`}
          onClick={onVer}
          className="flex h-9 w-7 items-center justify-center rounded-full text-blue after:absolute after:inset-0 hover:bg-blue/10 md:w-9 md:after:hidden"
        >
          <Icono className="hidden h-5 w-5 md:block">
            <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
            <circle cx="12" cy="12" r="3" />
          </Icono>
          <Icono className="h-5 w-5 md:hidden">
            <path d="m9 6 6 6-6 6" />
          </Icono>
        </button>
        <button
          type="button"
          aria-label={`Editar a ${nombre}`}
          onClick={onEditar}
          className="hidden h-9 w-9 items-center justify-center rounded-full text-blue hover:bg-blue/10 md:flex"
        >
          <Icono className="h-5 w-5">
            <path d="m4 20 1-4L16 5l3 3L8 19zM14 7l3 3" />
          </Icono>
        </button>
        <div className="hidden md:block">
          <MenuAcciones
            nombre={nombre}
            confirmando={false}
            onEditar={onEditar}
            extra={{ texto: activo ? "Desactivar" : "Activar", onClick: onCambiarEstado }}
          />
        </div>
      </div>
    </li>
  );
}

export function DocentesAdmin({ institutionId }: { institutionId: string }) {
  const [carga, setCarga] = useState<Carga>({ status: "loading" });
  const [intento, setIntento] = useState(0);
  const [busqueda, setBusqueda] = useState("");
  const [cursoId, setCursoId] = useState("");
  const [pagina, setPagina] = useState(0);
  const [panel, setPanel] = useState<Panel | null>(null);
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

  function recargar() {
    setIntento((actual) => actual + 1);
  }

  async function cambiarEstado(docente: Docente) {
    setError(null);
    try {
      await apiFetch(`/teachers/${docente.id}`, {
        method: "PATCH",
        institutionId,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: docente.status === "active" ? "inactive" : "active" }),
      });
      recargar();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "No se pudo conectar. Probá de nuevo en un rato.");
    }
  }

  async function editar(id: string) {
    setError(null);
    try {
      const docente = await apiFetch<DocenteFicha>(`/teachers/${id}`, { institutionId });
      setPanel({ tipo: "editar", docente });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "No se pudo conectar. Probá de nuevo en un rato.");
    }
  }

  if (carga.status === "loading") return <PantallaCargando titulo="Cargando docentes..." />;

  if (carga.status === "error") {
    return (
      <PantallaError
        titulo="Error al cargar los docentes"
        claseBoton={`${BOTON_NARANJA} inline-flex items-center gap-2`}
        onReintentar={() => {
          setCarga({ status: "loading" });
          recargar();
        }}
      />
    );
  }

  const { docentes, materias, cursos } = carga;
  const buscado = normalizar(busqueda.trim());
  const filtrados = docentes.filter(
    (docente) =>
      (!cursoId || docente.subjects.some((materia) => materia.course.id === cursoId)) &&
      normalizar(
        [docente.fullName, docente.dni, ...docente.subjects.map((materia) => materia.name)].filter(Boolean).join(" ")
      ).includes(buscado)
  );
  const ultimaPagina = Math.max(0, Math.ceil(filtrados.length / POR_PAGINA) - 1);
  const paginaActual = Math.min(pagina, ultimaPagina);
  const visibles = filtrados.slice(paginaActual * POR_PAGINA, (paginaActual + 1) * POR_PAGINA);
  const fichaAbierta = panel?.tipo === "ficha" ? panel.id : null;

  function cambiarFiltro(aplicar: () => void) {
    aplicar();
    setPagina(0);
  }

  function guardado(id: string, texto = "La información se actualizó correctamente.") {
    recargar();
    setPanel({ tipo: "guardado", id, texto });
  }

  const lista = (
    <div className="flex min-w-0 flex-col gap-4">
      <div className={`flex flex-col gap-3 p-3 md:flex-row ${TARJETA}`}>
        <Buscador
          nombre="por nombre, DNI o materia"
          valor={busqueda}
          onChange={(valor) => cambiarFiltro(() => setBusqueda(valor))}
        />
        <div className="flex gap-3">
          <select
            aria-label="Filtrar por curso"
            value={cursoId}
            onChange={(e) => cambiarFiltro(() => setCursoId(e.target.value))}
            className={`min-w-0 flex-1 text-sm md:w-44 md:flex-none md:text-base ${CAMPO}`}
          >
            <option value="">Todos los cursos</option>
            {cursos.map((curso) => (
              <option key={curso.id} value={curso.id}>
                {nombreCurso(curso)}
              </option>
            ))}
          </select>
          <BotonNuevo onClick={() => setPanel({ tipo: "nuevo" })} />
        </div>
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      {docentes.length === 0 ? (
        <PantallaVacia
          titulo="No hay docentes registrados"
          texto="Agregá el primer docente para comenzar."
          icono={ICONO_PERSONA}
        />
      ) : filtrados.length === 0 ? (
        <PantallaVacia
          titulo="No se encontraron docentes"
          texto="Probá con otro nombre o ajustá los filtros de búsqueda."
          icono={ICONO_PERSONA}
        >
          <BotonNuevo redondo onClick={() => setPanel({ tipo: "nuevo" })} />
        </PantallaVacia>
      ) : (
        <section className={`p-3 md:p-4 ${TARJETA}`}>
          <h2 className="mb-3 px-1 text-lg font-semibold text-ink">Lista de docentes ({filtrados.length})</h2>
          <div
            aria-hidden
            className={`hidden rounded-lg bg-blue/5 px-3 py-2 text-sm font-semibold text-ink ${COLUMNAS}`}
          >
            <span className="col-span-2">Nombre y apellido</span>
            <span>DNI</span>
            <span>Materias asignadas</span>
            <span>Estado</span>
            <span className="text-center">Acciones</span>
          </div>
          <ul aria-label="Docentes" className="flex flex-col gap-2 md:gap-0">
            {visibles.map((docente) => (
              <FilaDocente
                key={docente.id}
                docente={docente}
                abierto={docente.id === fichaAbierta}
                onVer={() => setPanel({ tipo: "ficha", id: docente.id })}
                onEditar={() => editar(docente.id)}
                onCambiarEstado={() => cambiarEstado(docente)}
              />
            ))}
          </ul>
          <Paginacion
            numerada
            total={filtrados.length}
            pagina={paginaActual}
            nombre="docentes"
            colorActual="bg-accent"
            onCambiar={setPagina}
          />
        </section>
      )}
    </div>
  );

  return (
    <div className={`grid items-start gap-6 ${panel ? "2xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]" : ""}`}>
      <div className={panel ? "hidden 2xl:block" : ""}>{lista}</div>

      {panel?.tipo === "ficha" && (
        <DocenteDetalle
          key={panel.id}
          institutionId={institutionId}
          docenteId={panel.id}
          version={intento}
          materias={materias}
          cursos={cursos}
          docentes={docentes}
          onVolver={() => setPanel(null)}
          onEditar={(docente) => setPanel({ tipo: "editar", docente })}
          onAsignada={() => guardado(panel.id, "La asignación de materias se actualizó correctamente.")}
          onQuitada={recargar}
        />
      )}

      {(panel?.tipo === "nuevo" || panel?.tipo === "editar") && (
        <DocenteForm
          key={panel.tipo === "editar" ? panel.docente.id : "nuevo"}
          institutionId={institutionId}
          docente={panel.tipo === "editar" ? panel.docente : null}
          onGuardado={(id) => guardado(id)}
          onCancelar={() => setPanel(panel.tipo === "editar" ? { tipo: "ficha", id: panel.docente.id } : null)}
        />
      )}

      {panel?.tipo === "guardado" && (
        <PantallaGuardada texto={panel.texto}>
          <button type="button" onClick={() => setPanel({ tipo: "ficha", id: panel.id })} className={BOTON_NARANJA}>
            Ver docente
          </button>
        </PantallaGuardada>
      )}
    </div>
  );
}
