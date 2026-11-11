"use client";

import { useState, type FormEvent } from "react";
import type { Role } from "../../config/navigation";
import { ApiError, apiFetch } from "../../lib/api";
import { Badge } from "../../components/ui/badge";

// Comunicados leídos: no los marca la API, se recuerdan en este dispositivo.
const CLAVE_LEIDOS = "reeduca-comunicados-leidos";

function leerLeidos(): Set<string> {
  try {
    return new Set(JSON.parse(window.localStorage.getItem(CLAVE_LEIDOS) ?? "[]") as string[]);
  } catch {
    return new Set();
  }
}

function marcarLeido(id: string) {
  const leidos = leerLeidos();
  if (leidos.has(id)) return;
  leidos.add(id);
  window.localStorage.setItem(CLAVE_LEIDOS, JSON.stringify([...leidos]));
}

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

function alcanceDe({ scope, courseLabel }: Announcement): { texto: string; tono: "azul" | "celeste" | "naranja" } {
  if (scope === "institution") return { texto: "Toda la institución", tono: "azul" };
  if (scope === "student") return { texto: "Personal", tono: "naranja" };
  return { texto: courseLabel ? `Curso ${courseLabel}` : "Un curso", tono: "celeste" };
}

const LIMITE_VISTA_PREVIA = 180;

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
  const [expandido, setExpandido] = useState(false);
  const [leido, setLeido] = useState(() =>
    typeof window === "undefined" ? true : leerLeidos().has(announcement.id)
  );

  function abrirDetalle() {
    setExpandido((actual) => {
      const siguiente = !actual;
      if (siguiente) {
        marcarLeido(announcement.id);
        setLeido(true);
      }
      return siguiente;
    });
  }

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
      <form onSubmit={guardar} className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-4 shadow-[0_8px_30px_rgba(20,24,90,0.06)]">
        <label className="flex flex-col gap-1 text-sm font-medium">
          Título
          <input
            type="text"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            className="rounded-xl border border-gray-300 px-3 py-2 transition focus:border-primario focus:outline-none focus:ring-2 focus:ring-primario/25"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium">
          Texto
          <textarea
            rows={4}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            className="rounded-xl border border-gray-300 px-3 py-2 transition focus:border-primario focus:outline-none focus:ring-2 focus:ring-primario/25"
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
            disabled={ocupado || titulo.trim() === "" || texto.trim() === ""}
            className="rounded-full bg-primario px-5 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50"
          >
            {ocupado ? "Guardando..." : "Guardar"}
          </button>
          <button
            type="button"
            onClick={cancelar}
            className="rounded-full border border-gray-300 px-5 py-2 text-sm font-semibold text-ink transition hover:bg-gray-50"
          >
            Cancelar
          </button>
        </div>
      </form>
    );
  }

  const alcance = alcanceDe(announcement);
  const textoCorto = announcement.body.length > LIMITE_VISTA_PREVIA;
  const cuerpo = expandido || !textoCorto ? announcement.body : `${announcement.body.slice(0, LIMITE_VISTA_PREVIA)}…`;

  return (
    // El borde izquierdo morado marca el comunicado no leído.
    <article
      className={`rounded-2xl border bg-white px-4 py-4 shadow-[0_8px_30px_rgba(20,24,90,0.06)] transition ${
        leido ? "border-gray-200" : "border-l-4 border-l-secundario border-t-gray-200 border-r-gray-200 border-b-gray-200"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        {/* El punto va fuera del h2 para no ensuciar su nombre accesible. */}
        <div className="flex items-center gap-2">
          {!leido && (
            <span
              role="img"
              aria-label="Sin leer"
              title="Sin leer"
              className="h-2.5 w-2.5 shrink-0 rounded-full bg-secundario"
            />
          )}
          <h2 className="font-semibold text-ink">{announcement.title}</h2>
        </div>
        <Badge tono={alcance.tono}>{alcance.texto}</Badge>
      </div>
      <p className="mt-1 text-sm text-gray-600">
        {announcement.authorName ?? "Institución"} · {mostrarFecha(announcement.createdAt)}
      </p>

      {/* Vista de detalle con interlineado cómodo y ancho máximo */}
      <p className="mt-2 max-w-prose whitespace-pre-line leading-relaxed">{cuerpo}</p>
      {textoCorto && (
        <button
          type="button"
          onClick={abrirDetalle}
          aria-expanded={expandido}
          className="mt-1 text-sm font-semibold text-celeste-fuerte hover:underline"
        >
          {expandido ? "Ver menos" : "Ver más"}
        </button>
      )}

      {error && (
        <p role="alert" className="mt-2 text-sm text-rojo">
          {error}
        </p>
      )}

      {institutionId && (
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => setEditando(true)}
            className="rounded-full border border-gray-300 px-4 py-1.5 text-sm font-medium text-ink transition hover:bg-gray-50"
          >
            Editar
          </button>
          <button
            type="button"
            onClick={eliminar}
            disabled={ocupado}
            className="rounded-full border border-rojo/30 px-4 py-1.5 text-sm font-medium text-rojo transition hover:bg-rojo/10 disabled:opacity-50"
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
