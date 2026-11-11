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
import { cursoActivo, etiquetaTurno, nivelCurso, nombreCurso, TURNOS, type Course } from "./institution";

function mensajeDe(error: unknown): string {
  return error instanceof ApiError ? error.message : "No se pudo conectar. Probá de nuevo en un rato.";
}

type Carga =
  | { status: "loading" }
  | { status: "error" }
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
    <form onSubmit={onSubmit} className={`flex flex-col gap-3 p-4 ${TARJETA}`}>
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-sm">
          Año
          <input
            type="number"
            min={1}
            required
            value={valores.year}
            onChange={(e) => setValores({ ...valores, year: e.target.value })}
            className={CAMPO}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          División
          <input
            type="text"
            required
            value={valores.division}
            onChange={(e) => setValores({ ...valores, division: e.target.value })}
            className={CAMPO}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Turno
          <select
            value={valores.shift}
            onChange={(e) => setValores({ ...valores, shift: e.target.value })}
            className={CAMPO}
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
            className={CAMPO}
          />
        </label>
      </div>

      {error && (
        <p role="alert" className="text-sm text-rojo">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={enviando}
          className="rounded-full bg-blue px-5 py-2 font-medium text-white disabled:opacity-50"
        >
          {submitLabel}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="rounded-xl border border-gray-300 px-4 py-2">
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
  const [intento, setIntento] = useState(0);
  const [actualizado, setActualizado] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [pagina, setPagina] = useState(0);

  useEffect(() => {
    let cancelado = false;

    apiFetch<Course[]>("/courses", { institutionId })
      .then((cursos) => {
        if (!cancelado) setCarga({ status: "ready", cursos });
      })
      .catch(() => {
        if (!cancelado) setCarga({ status: "error" });
      });

    return () => {
      cancelado = true;
    };
  }, [institutionId, intento]);

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
      const actualizado = await apiFetch<Course>(`/courses/${editando}`, {
        method: "PATCH",
        institutionId,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(valoresAJson()),
      });
      actualizarLista((cursos) => cursos.map((curso) => (curso.id === editando ? actualizado : curso)));
      setEditando(null);
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
      await apiFetch(`/courses/${id}`, { method: "DELETE", institutionId });
      actualizarLista((cursos) => cursos.filter((curso) => curso.id !== id));
      setActualizado(true);
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

  function abrirAlta() {
    setAlta("open");
    setValores(valoresVacios);
    setError(null);
  }

  if (carga.status === "loading") return <EstadoCargando titulo="Cargando cursos..." />;

  if (carga.status === "error") {
    return (
      <EstadoError
        titulo="Error al cargar los cursos"
        onReintentar={() => {
          setCarga({ status: "loading" });
          setIntento((actual) => actual + 1);
        }}
      />
    );
  }

  if (actualizado) {
    return (
      <EstadoActualizado titulo="¡Cursos actualizados!" boton="Ver cursos" onClick={() => setActualizado(false)} />
    );
  }

  if (alta === "open" || editando) {
    return (
      <FormularioCurso
        valores={valores}
        setValores={setValores}
        onSubmit={editando ? guardarEdicion : crear}
        enviando={enviando}
        error={error}
        submitLabel={editando ? (enviando ? "Guardando..." : "Guardar") : enviando ? "Creando..." : "Crear curso"}
        onCancel={() => {
          setAlta("closed");
          setEditando(null);
          setError(null);
        }}
      />
    );
  }

  if (carga.cursos.length === 0) {
    return (
      <EstadoVacio
        titulo="No hay cursos registrados"
        texto="Todavía no se agregaron cursos."
        boton="Agregar curso"
        onClick={abrirAlta}
        ilustracion={<path d="M12 6c-2-1.5-5-2-8-2v14c3 0 6 .5 8 2 2-1.5 5-2 8-2V4c-3 0-6 .5-8 2zM12 6v14" />}
      />
    );
  }

  const texto = busqueda.trim().toLowerCase();
  const filtrados = carga.cursos.filter((curso) =>
    `${nombreCurso(curso)} ${nivelCurso(curso.year)} ${etiquetaTurno(curso.shift)}`.toLowerCase().includes(texto)
  );
  const visibles = filtrados.slice(pagina * POR_PAGINA, (pagina + 1) * POR_PAGINA);
  const celda = "hidden px-4 py-3 sm:table-cell";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <Buscador
          nombre="curso"
          valor={busqueda}
          onChange={(valor) => {
            setBusqueda(valor);
            setPagina(0);
          }}
        />
        <BotonNuevo texto="Nuevo curso" onClick={abrirAlta} />
      </div>

      {error && (
        <p role="alert" className="text-sm text-rojo">
          {error}
        </p>
      )}

      <div className={TARJETA}>
        <table className="w-full text-left">
          <thead>
            <tr className="bg-blue/5 text-sm">
              <th className="px-4 py-3 font-semibold">Nombre del curso</th>
              <th className={`${celda} font-semibold`}>Nivel</th>
              <th className={`${celda} font-semibold`}>Turno</th>
              <th className={`${celda} font-semibold`}>Estado</th>
              <th className="px-4 py-3 text-right font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {visibles.map((curso) => {
              const activo = cursoActivo(curso);
              return (
                <tr key={curso.id}>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue/10 text-blue">
                        <Icono className="h-5 w-5">
                          <path d="m2 9 10-4 10 4-10 4zM6 11v5c3 2 9 2 12 0v-5" />
                        </Icono>
                      </span>
                      <span>
                        <span className="block font-semibold">{nombreCurso(curso)}</span>
                        <span className="block text-sm text-gray-600">Ciclo {curso.schoolYear}</span>
                      </span>
                    </span>
                  </td>
                  <td className={celda}>{nivelCurso(curso.year)}</td>
                  <td className={celda}>{etiquetaTurno(curso.shift)}</td>
                  <td className={celda}>
                    <Insignia activa={activo}>{activo ? "Activo" : "Finalizado"}</Insignia>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <MenuAcciones
                      nombre={nombreCurso(curso)}
                      confirmando={confirmando === curso.id}
                      onEditar={() => empezarEdicion(curso)}
                      onEliminar={() => eliminar(curso.id)}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <Paginacion total={filtrados.length} pagina={pagina} nombre="cursos" onCambiar={setPagina} />
      </div>
    </div>
  );
}
