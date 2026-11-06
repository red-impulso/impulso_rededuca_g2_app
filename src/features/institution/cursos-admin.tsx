"use client";

import { useEffect, useState, type FormEvent } from "react";
import { ApiError, apiFetch } from "../../lib/api";
import { etiquetaCurso, TURNOS, type Course } from "./institution";

function mensajeDe(error: unknown): string {
  return error instanceof ApiError ? error.message : "No se pudo conectar. Probá de nuevo en un rato.";
}

type Carga =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; cursos: Course[] };

interface CursoFormValores {
  year: string;
  division: string;
  shift: string;
  schoolYear: string;
}

const cicloActual = String(new Date().getFullYear());

const valoresVacios: CursoFormValores = { year: "", division: "", shift: "morning", schoolYear: cicloActual };

function valoresDe(curso: Course): CursoFormValores {
  return {
    year: String(curso.year),
    division: curso.division,
    shift: curso.shift,
    schoolYear: String(curso.schoolYear),
  };
}

// Campos del alta y la edición: año, división, turno y ciclo lectivo.
function FormularioCurso({
  valores,
  setValores,
  onSubmit,
  enviando,
  error,
  submitLabel,
  onCancel,
}: {
  valores: CursoFormValores;
  setValores: (valores: CursoFormValores) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  enviando: boolean;
  error: string | null;
  submitLabel: string;
  onCancel?: () => void;
}) {
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3 rounded border bg-white p-4">
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-sm">
          Año
          <input
            type="number"
            min={1}
            required
            value={valores.year}
            onChange={(e) => setValores({ ...valores, year: e.target.value })}
            className="rounded border px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          División
          <input
            type="text"
            required
            value={valores.division}
            onChange={(e) => setValores({ ...valores, division: e.target.value })}
            className="rounded border px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Turno
          <select
            value={valores.shift}
            onChange={(e) => setValores({ ...valores, shift: e.target.value })}
            className="rounded border px-3 py-2"
          >
            {TURNOS.map((turno) => (
              <option key={turno.value} value={turno.value}>
                {turno.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Ciclo lectivo
          <input
            type="number"
            min={2000}
            max={2100}
            required
            value={valores.schoolYear}
            onChange={(e) => setValores({ ...valores, schoolYear: e.target.value })}
            className="rounded border px-3 py-2"
          />
        </label>
      </div>

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
          {submitLabel}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="rounded border px-4 py-2">
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}

export function CursosAdmin({ institutionId }: { institutionId: string }) {
  const [carga, setCarga] = useState<Carga>({ status: "loading" });
  const [alta, setAlta] = useState<"closed" | "open">("closed");
  const [editando, setEditando] = useState<string | null>(null);
  const [confirmando, setConfirmando] = useState<string | null>(null);
  const [valores, setValores] = useState<CursoFormValores>(valoresVacios);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;

    apiFetch<Course[]>("/courses", { institutionId })
      .then((cursos) => {
        if (!cancelado) setCarga({ status: "ready", cursos });
      })
      .catch((e) => {
        if (!cancelado) setCarga({ status: "error", message: mensajeDe(e) });
      });

    return () => {
      cancelado = true;
    };
  }, [institutionId]);

  function valoresAJson() {
    return {
      year: Number(valores.year),
      division: valores.division.trim(),
      shift: valores.shift,
      schoolYear: Number(valores.schoolYear),
    };
  }

  function actualizarLista(fn: (cursos: Course[]) => Course[]) {
    setCarga((actual) => (actual.status === "ready" ? { status: "ready", cursos: fn(actual.cursos) } : actual));
  }

  async function crear(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      const nuevo = await apiFetch<Course>("/courses", {
        method: "POST",
        institutionId,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(valoresAJson()),
      });
      actualizarLista((cursos) => [...cursos, nuevo]);
      setAlta("closed");
      setValores(valoresVacios);
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
      const actualizado = await apiFetch<Course>(`/courses/${editando}`, {
        method: "PATCH",
        institutionId,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(valoresAJson()),
      });
      actualizarLista((cursos) => cursos.map((curso) => (curso.id === editando ? actualizado : curso)));
      setEditando(null);
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
      await apiFetch(`/courses/${id}`, { method: "DELETE", institutionId });
      actualizarLista((cursos) => cursos.filter((curso) => curso.id !== id));
    } catch (e) {
      setError(mensajeDe(e));
    } finally {
      setEnviando(false);
    }
  }

  function empezarEdicion(curso: Course) {
    setEditando(curso.id);
    setValores(valoresDe(curso));
    setError(null);
    setConfirmando(null);
  }

  if (carga.status === "loading") return <p>Cargando cursos...</p>;

  if (carga.status === "error") {
    return (
      <p role="alert" className="text-red-600">
        {carga.message}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {alta === "closed" ? (
        <button
          type="button"
          onClick={() => {
            setAlta("open");
            setValores(valoresVacios);
            setError(null);
          }}
          className="self-start rounded bg-accent px-4 py-2 font-medium text-white"
        >
          Nuevo curso
        </button>
      ) : (
        <FormularioCurso
          valores={valores}
          setValores={setValores}
          onSubmit={crear}
          enviando={enviando}
          error={error}
          submitLabel={enviando ? "Creando..." : "Crear curso"}
          onCancel={() => setAlta("closed")}
        />
      )}

      {carga.cursos.length === 0 && <p>Todavía no hay cursos.</p>}

      <ul className="flex flex-col gap-3">
        {carga.cursos.map((curso) => (
          <li key={curso.id}>
            {editando === curso.id ? (
              <FormularioCurso
                valores={valores}
                setValores={setValores}
                onSubmit={guardarEdicion}
                enviando={enviando}
                error={error}
                submitLabel={enviando ? "Guardando..." : "Guardar"}
                onCancel={() => setEditando(null)}
              />
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-2 rounded border bg-white px-4 py-3">
                <p>
                  <span className="font-semibold">{etiquetaCurso(curso)}</span>
                  <span className="text-sm text-gray-600"> · Ciclo {curso.schoolYear}</span>
                </p>
                <div className="flex gap-2">
                  <button type="button" onClick={() => empezarEdicion(curso)} className="rounded border px-3 py-1 text-sm">
                    Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => eliminar(curso.id)}
                    className="rounded border border-red-300 px-3 py-1 text-sm text-red-700"
                  >
                    {confirmando === curso.id ? "¿Seguro? Tocá de nuevo" : "Eliminar"}
                  </button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>

      {error && !editando && alta === "closed" && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
