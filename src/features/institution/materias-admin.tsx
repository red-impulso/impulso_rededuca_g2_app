"use client";

import { useEffect, useState, type FormEvent } from "react";
import { ApiError, apiFetch } from "../../lib/api";
import {
  BotonNuevo,
  Buscador,
  CAMPO,
  EstadoActualizado,
  EstadoCargando,
  EstadoError,
  EstadoVacio,
  Insignia,
  MenuAcciones,
  Paginacion,
  POR_PAGINA,
  TARJETA,
} from "./admin-ui";
import { Icono } from "../../components/ui/estado";
import { etiquetaCurso, nombreCurso, type Course, type Subject, type Teacher } from "./institution";

function mensajeDe(error: unknown): string {
  return error instanceof ApiError ? error.message : "No se pudo conectar. Probá de nuevo en un rato.";
}

type Carga =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; materias: Subject[]; cursos: Course[]; docentes: Teacher[] };

export function MateriasAdmin({ institutionId }: { institutionId: string }) {
  const [carga, setCarga] = useState<Carga>({ status: "loading" });
  const [alta, setAlta] = useState<"closed" | "open">("closed");
  const [editando, setEditando] = useState<string | null>(null);
  const [confirmando, setConfirmando] = useState<string | null>(null);
  const [nombre, setNombre] = useState("");
  const [courseId, setCourseId] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [intento, setIntento] = useState(0);
  const [actualizado, setActualizado] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [pagina, setPagina] = useState(0);

  useEffect(() => {
    let cancelado = false;

    Promise.all([
      apiFetch<Subject[]>("/subjects", { institutionId }),
      apiFetch<Course[]>("/courses", { institutionId }),
      apiFetch<Teacher[]>("/teachers", { institutionId }),
    ])
      .then(([materias, cursos, docentes]) => {
        if (!cancelado) setCarga({ status: "ready", materias, cursos, docentes });
      })
      .catch(() => {
        if (!cancelado) setCarga({ status: "error" });
      });

    return () => {
      cancelado = true;
    };
  }, [institutionId, intento]);

  function actualizarMaterias(fn: (materias: Subject[]) => Subject[]) {
    setCarga((actual) => (actual.status === "ready" ? { ...actual, materias: fn(actual.materias) } : actual));
  }

  function limpiarFormulario() {
    setAlta("closed");
    setEditando(null);
    setNombre("");
    setCourseId("");
    setTeacherId("");
  }

  async function crear(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      const nueva = await apiFetch<Subject>("/subjects", {
        method: "POST",
        institutionId,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: nombre.trim(),
          courseId,
          ...(teacherId ? { teacherMembershipId: teacherId } : {}),
        }),
      });
      actualizarMaterias((materias) => [...materias, nueva]);
      limpiarFormulario();
      setActualizado(true);
    } catch (e) {
      setError(mensajeDe(e));
    } finally {
      setEnviando(false);
    }
  }

  async function guardarEdicion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editando) return;
    setEnviando(true);
    setError(null);
    try {
      const actualizada = await apiFetch<Subject>(`/subjects/${editando}`, {
        method: "PATCH",
        institutionId,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: nombre.trim(), courseId, teacherMembershipId: teacherId || null }),
      });
      actualizarMaterias((materias) =>
        materias.map((materia) => (materia.id === editando ? actualizada : materia))
      );
      limpiarFormulario();
      setActualizado(true);
    } catch (e) {
      setError(mensajeDe(e));
    } finally {
      setEnviando(false);
    }
  }

  async function eliminar(id: string) {
    // Primer toque pide confirmación; el segundo borra de verdad.
    if (confirmando !== id) {
      setConfirmando(id);
      return;
    }
    setConfirmando(null);
    setEnviando(true);
    setError(null);
    try {
      await apiFetch(`/subjects/${id}`, { method: "DELETE", institutionId });
      actualizarMaterias((materias) => materias.filter((materia) => materia.id !== id));
      setActualizado(true);
    } catch (e) {
      setError(mensajeDe(e));
    } finally {
      setEnviando(false);
    }
  }

  function empezarEdicion(materia: Subject) {
    setEditando(materia.id);
    setAlta("closed");
    setNombre(materia.name);
    setCourseId(materia.courseId);
    setTeacherId(materia.teacherMembershipId ?? "");
    setError(null);
    setConfirmando(null);
  }

  function abrirAlta() {
    setAlta("open");
    setNombre("");
    setCourseId("");
    setTeacherId("");
    setError(null);
  }

  if (carga.status === "loading") return <EstadoCargando titulo="Cargando materias..." />;

  if (carga.status === "error") {
    return (
      <EstadoError
        titulo="Error al cargar las materias"
        onReintentar={() => {
          setCarga({ status: "loading" });
          setIntento((actual) => actual + 1);
        }}
      />
    );
  }

  if (actualizado) {
    return (
      <EstadoActualizado
        titulo="¡Materias actualizadas!"
        boton="Ver materias"
        onClick={() => setActualizado(false)}
      />
    );
  }

  if (alta === "open" || editando) {
    return (
      <form onSubmit={editando ? guardarEdicion : crear} className={`flex flex-col gap-3 p-4 ${TARJETA}`}>
        <label className="flex flex-col gap-1 text-sm">
          Nombre
          <input type="text" required value={nombre} onChange={(e) => setNombre(e.target.value)} className={CAMPO} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Curso
          <select required value={courseId} onChange={(e) => setCourseId(e.target.value)} className={CAMPO}>
            <option value="">Elegí un curso</option>
            {carga.cursos.map((curso) => (
              <option key={curso.id} value={curso.id}>
                {etiquetaCurso(curso)} · {curso.schoolYear}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Docente
          <select value={teacherId} onChange={(e) => setTeacherId(e.target.value)} className={CAMPO}>
            <option value="">Sin asignar</option>
            {carga.docentes.map((docente) => (
              <option key={docente.id} value={docente.id}>
                {docente.fullName ?? "Sin nombre"}
              </option>
            ))}
          </select>
        </label>

        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={enviando}
            className="rounded-xl bg-blue px-4 py-2 font-medium text-white disabled:opacity-50"
          >
            {editando ? (enviando ? "Guardando..." : "Guardar") : enviando ? "Creando..." : "Crear materia"}
          </button>
          <button type="button" onClick={limpiarFormulario} className="rounded-xl border border-gray-300 px-4 py-2">
            Cancelar
          </button>
        </div>
      </form>
    );
  }

  if (carga.materias.length === 0) {
    return (
      <EstadoVacio
        titulo="No hay materias registradas"
        texto="Todavía no se agregaron materias."
        boton="Agregar materia"
        onClick={abrirAlta}
        ilustracion={<path d="M6 3h9l4 4v14H6zM14 3v5h5M9 12h6M9 16h6" />}
      />
    );
  }

  const cursosPorId = new Map(carga.cursos.map((curso) => [curso.id, curso]));
  const docentesPorId = new Map(carga.docentes.map((docente) => [docente.id, docente]));

  const docenteDe = (materia: Subject) =>
    materia.teacherMembershipId ? docentesPorId.get(materia.teacherMembershipId)?.fullName ?? "Sin nombre" : null;
  const cursoDe = (materia: Subject) => {
    const curso = cursosPorId.get(materia.courseId);
    return curso ? nombreCurso(curso) : "—";
  };

  const texto = busqueda.trim().toLowerCase();
  const filtradas = carga.materias.filter((materia) =>
    `${materia.name} ${cursoDe(materia)} ${docenteDe(materia) ?? ""}`.toLowerCase().includes(texto)
  );
  const visibles = filtradas.slice(pagina * POR_PAGINA, (pagina + 1) * POR_PAGINA);
  const celda = "hidden px-4 py-3 sm:table-cell";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <Buscador
          nombre="materia"
          valor={busqueda}
          onChange={(valor) => {
            setBusqueda(valor);
            setPagina(0);
          }}
        />
        <BotonNuevo texto="Nueva materia" onClick={abrirAlta} />
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      <div className={TARJETA}>
        <table className="w-full text-left">
          <thead>
            <tr className="bg-blue/5 text-sm">
              <th className="px-4 py-3 font-semibold">Materia</th>
              <th className={`${celda} font-semibold`}>Curso / Año</th>
              <th className={`${celda} font-semibold`}>Docente</th>
              <th className={`${celda} font-semibold`}>Estado</th>
              <th className="px-4 py-3 text-right font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {visibles.map((materia) => {
              const docente = docenteDe(materia);
              return (
                <tr key={materia.id}>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue/10 text-blue">
                        <Icono className="h-5 w-5">
                          <path d="M6 3h9l4 4v14H6zM14 3v5h5M9 12h6M9 16h6" />
                        </Icono>
                      </span>
                      <span>
                        <span className="block font-semibold">{materia.name}</span>
                        <span className="block text-sm text-gray-600 sm:hidden">
                          {cursoDe(materia)} · {docente ?? "Sin docente"}
                        </span>
                      </span>
                    </span>
                  </td>
                  <td className={celda}>{cursoDe(materia)}</td>
                  <td className={celda}>{docente ?? "—"}</td>
                  <td className={celda}>
                    <Insignia activa={docente !== null}>{docente ? "Activa" : "Sin docente"}</Insignia>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <MenuAcciones
                      nombre={materia.name}
                      confirmando={confirmando === materia.id}
                      onEditar={() => empezarEdicion(materia)}
                      onEliminar={() => eliminar(materia.id)}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <Paginacion total={filtradas.length} pagina={pagina} nombre="materias" onCambiar={setPagina} />
      </div>
    </div>
  );
}
