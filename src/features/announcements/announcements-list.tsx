"use client";

import { useState, type FormEvent } from "react";
import type { Role } from "../../config/navigation";
import { ApiError, apiFetch } from "../../lib/api";

// Lo que devuelve GET /announcements (ver README de la API).
export interface Announcement {
  id: string;
  // authorId lo necesita el docente para editar solo sus comunicados:
  // si la API no lo manda, solo admin/director ven los botones.
  authorId?: string | null;
  scope: "institution" | "course" | "student";
  courseLabel: string | null;
  title: string;
  body: string;
  createdAt: string;
  authorName: string | null;
}

interface ListProps {
  announcements: Announcement[];
  // Sin institutionId/role la lista es solo de lectura (familias y alumnos).
  institutionId?: string;
  role?: Role;
  profileId?: string;
  onActualizado?: (announcement: Announcement) => void;
  onEliminado?: (id: string) => void;
}

// Admin y directivo corrigen cualquier comunicado; el docente solo el suyo.
function puedeGestionar(role: Role | undefined, profileId: string | undefined, a: Announcement): boolean {
  if (role === "admin" || role === "director") return true;
  return a.authorId != null && a.authorId === profileId;
}

function mensajeDe(error: unknown): string {
  return error instanceof ApiError ? error.message : "No se pudo conectar. Probá de nuevo en un rato.";
}

function alcanceDe({ scope, courseLabel }: Announcement): string {
  if (scope === "institution") return "Toda la institución";
  if (scope === "student") return "Personal";
  return courseLabel ? `Curso ${courseLabel}` : "Un curso";
}

// createdAt es un instante exacto: se muestra siempre en hora de Argentina.
function mostrarFecha(createdAt: string): string {
  return new Date(createdAt).toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "America/Argentina/Jujuy",
  });
}

function Comunicado({
  announcement,
  institutionId,
  onActualizado,
  onEliminado,
}: {
  announcement: Announcement;
  institutionId?: string;
  onActualizado?: (announcement: Announcement) => void;
  onEliminado?: (id: string) => void;
}) {
  const [editando, setEditando] = useState(false);
  const [titulo, setTitulo] = useState(announcement.title);
  const [texto, setTexto] = useState(announcement.body);
  const [ocupado, setOcupado] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function guardar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setOcupado(true);
    setError(null);

    try {
      const actualizado = await apiFetch<Announcement>(`/announcements/${announcement.id}`, {
        method: "PATCH",
        institutionId,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: titulo.trim(), body: texto.trim() }),
      });
      onActualizado?.(actualizado);
      setEditando(false);
    } catch (e) {
      setError(mensajeDe(e));
    } finally {
      setOcupado(false);
    }
  }

  async function eliminar() {
    if (!window.confirm("¿Eliminar este comunicado? Las familias dejan de verlo.")) return;
    setOcupado(true);
    setError(null);

    try {
      await apiFetch(`/announcements/${announcement.id}`, { method: "DELETE", institutionId });
      onEliminado?.(announcement.id);
    } catch (e) {
      setError(mensajeDe(e));
      setOcupado(false);
    }
  }

  function cancelar() {
    setEditando(false);
    setTitulo(announcement.title);
    setTexto(announcement.body);
    setError(null);
  }

  if (editando) {
    return (
      <form onSubmit={guardar} className="flex flex-col gap-3 rounded border bg-white px-4 py-3">
        <label className="flex flex-col gap-1 text-sm">
          Título
          <input
            type="text"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            className="rounded border px-3 py-2"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Texto
          <textarea
            rows={4}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            className="rounded border px-3 py-2"
          />
        </label>

        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={ocupado || titulo.trim() === "" || texto.trim() === ""}
            className="rounded bg-accent px-4 py-2 font-medium text-white disabled:opacity-50"
          >
            {ocupado ? "Guardando..." : "Guardar"}
          </button>
          <button type="button" onClick={cancelar} className="rounded border px-4 py-2">
            Cancelar
          </button>
        </div>
      </form>
    );
  }

  return (
    <article className="rounded border bg-white px-4 py-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h2 className="font-semibold">{announcement.title}</h2>
        <span className="rounded bg-surface px-2 py-1 text-xs font-medium">
          {alcanceDe(announcement)}
        </span>
      </div>
      <p className="mt-1 text-sm text-gray-600">
        {announcement.authorName ?? "Institución"} · {mostrarFecha(announcement.createdAt)}
      </p>
      <p className="mt-2 whitespace-pre-line">{announcement.body}</p>

      {error && (
        <p role="alert" className="mt-2 text-sm text-red-600">
          {error}
        </p>
      )}

      {institutionId && (
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => setEditando(true)}
            className="rounded border px-3 py-1 text-sm"
          >
            Editar
          </button>
          <button
            type="button"
            onClick={eliminar}
            disabled={ocupado}
            className="rounded border border-red-200 px-3 py-1 text-sm text-red-600 disabled:opacity-50"
          >
            {ocupado ? "Eliminando..." : "Eliminar"}
          </button>
        </div>
      )}
    </article>
  );
}

export function AnnouncementsList({
  announcements,
  institutionId,
  role,
  profileId,
  onActualizado,
  onEliminado,
}: ListProps) {
  if (announcements.length === 0) return <p>Todavía no hay comunicados.</p>;

  return (
    <div className="flex flex-col gap-3">
      {announcements.map((announcement) => (
        <Comunicado
          key={announcement.id}
          announcement={announcement}
          institutionId={puedeGestionar(role, profileId, announcement) ? institutionId : undefined}
          onActualizado={onActualizado}
          onEliminado={onEliminado}
        />
      ))}
    </div>
  );
}
