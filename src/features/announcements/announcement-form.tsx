"use client";

import { useState, type FormEvent } from "react";
import { ApiError, apiFetch } from "../../lib/api";
import type { Announcement } from "./announcements-list";

// Lo que devuelve GET /me/courses.
interface Course {
  id: string;
  year: number;
  division: string;
}

type Cursos =
  | { status: "closed" }
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; courses: Course[] };

type Alcance = "institution" | "course";

function mensajeDe(error: unknown): string {
  return error instanceof ApiError ? error.message : "No se pudo conectar. Probá de nuevo en un rato.";
}

export function AnnouncementForm({
  institutionId,
  role,
  onPublicado,
}: {
  institutionId: string;
  role: "admin" | "director" | "teacher";
  onPublicado: (announcement: Announcement) => void;
}) {
  // Un docente solo puede publicar para los cursos en los que da clases.
  const esDocente = role === "teacher";
  const alcanceInicial: Alcance = esDocente ? "course" : "institution";

  const [cursos, setCursos] = useState<Cursos>({ status: "closed" });
  const [alcance, setAlcance] = useState<Alcance>(alcanceInicial);
  const [courseId, setCourseId] = useState("");
  const [titulo, setTitulo] = useState("");
  const [texto, setTexto] = useState("");
  const [publicando, setPublicando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function abrir() {
    setCursos({ status: "loading" });
    try {
      const courses = await apiFetch<Course[]>("/me/courses", { institutionId });
      setCursos({ status: "ready", courses });
    } catch (e) {
      setCursos({ status: "error", message: mensajeDe(e) });
    }
  }

  function cerrar() {
    setCursos({ status: "closed" });
    setAlcance(alcanceInicial);
    setCourseId("");
    setTitulo("");
    setTexto("");
    setError(null);
  }

  async function publicar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPublicando(true);
    setError(null);

    try {
      const nuevo = await apiFetch<Announcement>("/announcements", {
        method: "POST",
        institutionId,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scope: alcance,
          ...(alcance === "course" ? { courseId } : {}),
          title: titulo.trim(),
          body: texto.trim(),
        }),
      });
      onPublicado(nuevo);
      cerrar();
    } catch (e) {
      setError(mensajeDe(e));
    } finally {
      setPublicando(false);
    }
  }

  if (cursos.status === "closed") {
    return (
      <button
        type="button"
        onClick={abrir}
        className="self-start rounded-full bg-accent px-5 py-2.5 font-semibold text-ink transition hover:brightness-95"
      >
        + Nuevo comunicado
      </button>
    );
  }

  if (cursos.status === "loading") return <p>Cargando...</p>;

  if (cursos.status === "error") {
    return (
      <p role="alert" className="text-rojo">
        {cursos.message}
      </p>
    );
  }

  const puedePublicar =
    !publicando &&
    titulo.trim() !== "" &&
    texto.trim() !== "" &&
    (alcance === "institution" || courseId !== "");

  return (
    <form onSubmit={publicar} className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-5 shadow-[0_8px_30px_rgba(20,24,90,0.06)]">
      <label className="flex flex-col gap-1 text-sm font-medium">
        Alcance
        <select
          value={alcance}
          onChange={(e) => setAlcance(e.target.value as Alcance)}
          className="rounded-xl border border-gray-300 bg-white px-3 py-2 transition focus:border-primario focus:outline-none focus:ring-2 focus:ring-primario/25"
        >
          {!esDocente && <option value="institution">Toda la institución</option>}
          <option value="course">Un curso</option>
        </select>
      </label>

      {alcance === "course" && (
        <label className="flex flex-col gap-1 text-sm font-medium">
          Curso
          <select
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            className="rounded-xl border border-gray-300 bg-white px-3 py-2 transition focus:border-primario focus:outline-none focus:ring-2 focus:ring-primario/25"
          >
            <option value="">Elegí un curso</option>
            {cursos.courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.year}°{course.division}
              </option>
            ))}
          </select>
        </label>
      )}

      <label className="flex flex-col gap-1 text-sm font-medium">
        Título
        <input
          type="text"
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          className="rounded-xl border border-gray-300 bg-white px-3 py-2 transition focus:border-primario focus:outline-none focus:ring-2 focus:ring-primario/25"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm font-medium">
        Texto
        <textarea
          rows={4}
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          className="rounded-xl border border-gray-300 bg-white px-3 py-2 transition focus:border-primario focus:outline-none focus:ring-2 focus:ring-primario/25"
        />
      </label>

      {error && (
        <p role="alert" className="text-sm text-rojo">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={!puedePublicar}
          className="rounded-full bg-primario px-5 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
        >
          {publicando ? "Publicando..." : "Publicar"}
        </button>
        <button
          type="button"
          onClick={cerrar}
          className="rounded-full border border-gray-300 px-5 py-2 text-sm font-semibold text-ink transition hover:bg-gray-50"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
