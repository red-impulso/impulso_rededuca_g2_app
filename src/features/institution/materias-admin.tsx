"use client";

import { useEffect, useState, type FormEvent } from "react";
import { ApiError, apiFetch } from "../../lib/api";
import { etiquetaCurso, type Course, type Subject, type Teacher } from "./institution";

function mensajeDe(error: unknown): string {
  return error instanceof ApiError ? error.message : "No se pudo conectar. Probá de nuevo en un rato.";
}

type Carga =
  | { status: "loading" }
  | { status: "error"; message: string }
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
  const [asignando, setAsignando] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
      .catch((e) => {
        if (!cancelado) setCarga({ status: "error", message: mensajeDe(e) });
      });

    return () => {
      cancelado = true;
    };
  }, [institutionId]);

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
        body: JSON.stringify({ name: nombre.trim(), courseId }),
      });
      actualizarMaterias((materias) =>
        materias.map((materia) => (materia.id === editando ? actualizada : materia))
      );
      limpiarFormulario();
    } catch (e) {
      setError(mensajeDe(e));
    } finally {
      setEnviando(false);
    }
  }

  async function asignar(materiaId: string, teacherMembershipId: string) {
    setAsignando(materiaId);
    setError(null);
    try {
      const actualizada = await apiFetch<Subject>(`/subjects/${materiaId}/teacher`, {
        method: "PUT",
        institutionId,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teacherMembershipId: teacherMembershipId || null }),
      });
      actualizarMaterias((materias) =>
        materias.map((materia) => (materia.id === materiaId ? actualizada : materia))
      );
    } catch (e) {
      setError(mensajeDe(e));
    } finally {
      setAsignando(null);
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
    setError(null);
    setConfirmando(null);
  }

  if (carga.status === "loading") return <p>Cargando materias...</p>;

  if (carga.status === "error") {
    return (
      <p role="alert" className="text-red-600">
        {carga.message}
      </p>
    );
  }

  const cursosPorId = new Map(carga.cursos.map((curso) => [curso.id, curso]));
  const docentesPorId = new Map(carga.docentes.map((docente) => [docente.id, docente]));

  const formulario = (
    <form onSubmit={editando ? guardarEdicion : crear} className="flex flex-col gap-3 rounded border bg-white p-4">
      <label className="flex flex-col gap-1 text-sm">
        Nombre
        <input
          type="text"
          required
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className="rounded border px-3 py-2"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Curso
        <select
          required
          value={courseId}
          onChange={(e) => setCourseId(e.target.value)}
          className="rounded border px-3 py-2"
        >
          <option value="">Elegí un curso</option>
          {carga.cursos.map((curso) => (
            <option key={curso.id} value={curso.id}>
              {etiquetaCurso(curso)} · {curso.schoolYear}
            </option>
          ))}
        </select>
      </label>
      {!editando && (
        <label className="flex flex-col gap-1 text-sm">
          Docente (opcional)
          <select
            value={teacherId}
            onChange={(e) => setTeacherId(e.target.value)}
            className="rounded border px-3 py-2"
          >
            <option value="">Sin asignar</option>
            {carga.docentes.map((docente) => (
              <option key={docente.id} value={docente.id}>
                {docente.fullName ?? "Sin nombre"}
              </option>
            ))}
          </select>
        </label>
      )}

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={enviando}
          className="rounded bg-accent px-4 py-2 font-medium text-white disabled:opacity-50"
        >
          {editando ? (enviando ? "Guardando..." : "Guardar") : enviando ? "Creando..." : "Crear materia"}
        </button>
        <button type="button" onClick={limpiarFormulario} className="rounded border px-4 py-2">
          Cancelar
        </button>
      </div>
    </form>
  );

  return (
    <div className="flex flex-col gap-4">
      {alta === "closed" && !editando ? (
        <button
          type="button"
          onClick={() => {
            setAlta("open");
            setNombre("");
            setCourseId("");
            setTeacherId("");
            setError(null);
          }}
          className="self-start rounded bg-accent px-4 py-2 font-medium text-white"
        >
          Nueva materia
        </button>
      ) : (
        !editando && formulario
      )}

      {carga.materias.length === 0 && <p>Todavía no hay materias.</p>}

      <ul className="flex flex-col gap-3">
        {carga.materias.map((materia) => {
          const curso = cursosPorId.get(materia.courseId);
          return (
            <li key={materia.id}>
              {editando === materia.id ? (
                formulario
              ) : (
                <div className="flex flex-col gap-2 rounded border bg-white px-4 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p>
                      <span className="font-semibold">{materia.name}</span>
                      {curso && <span className="text-sm text-gray-600"> · {etiquetaCurso(curso)}</span>}
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => empezarEdicion(materia)}
                        className="rounded border px-3 py-1 text-sm"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => eliminar(materia.id)}
                        className="rounded border border-red-300 px-3 py-1 text-sm text-red-700"
                      >
                        {confirmando === materia.id ? "¿Seguro? Tocá de nuevo" : "Eliminar"}
                      </button>
                    </div>
                  </div>
                  <label className="flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:gap-2">
                    Docente
                    <select
                      value={materia.teacherMembershipId ?? ""}
                      disabled={asignando === materia.id}
                      onChange={(e) => asignar(materia.id, e.target.value)}
                      className="rounded border px-3 py-2 sm:max-w-xs"
                    >
                      <option value="">Sin asignar</option>
                      {carga.docentes.map((docente) => (
                        <option key={docente.id} value={docente.id}>
                          {docente.fullName ?? "Sin nombre"}
                        </option>
                      ))}
                      {materia.teacherMembershipId && !docentesPorId.has(materia.teacherMembershipId) && (
                        <option value={materia.teacherMembershipId}>Docente actual</option>
                      )}
                    </select>
                  </label>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {error && !editando && alta === "closed" && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
