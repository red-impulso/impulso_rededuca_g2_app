"use client";

import { useState, type FormEvent } from "react";
import { ApiError, apiFetch } from "../../lib/api";
import type { Institution } from "./institution";

function mensajeDe(error: unknown): string {
  return error instanceof ApiError ? error.message : "No se pudo conectar. Probá de nuevo en un rato.";
}

// La API todavía no tiene GET /institution: los campos vacíos no se mandan,
// así no se pisan datos que no podemos leer.
export function InstitucionDatos({
  institutionId,
  nombreActual,
}: {
  institutionId: string;
  nombreActual: string;
}) {
  const [guardada, setGuardada] = useState<Institution | null>(null);
  const [nombre, setNombre] = useState(nombreActual);
  const [direccion, setDireccion] = useState("");
  const [niveles, setNiveles] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);

  async function guardar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setAviso(null);
    setGuardando(true);

    // Solo campos con contenido: la API pide "algo que cambiar".
    const cambios: Record<string, unknown> = {};
    if (nombre.trim()) cambios.name = nombre.trim();
    if (direccion.trim()) cambios.address = direccion.trim();
    const listaNiveles = niveles
      .split(",")
      .map((nivel) => nivel.trim())
      .filter(Boolean);
    if (listaNiveles.length > 0) cambios.levels = listaNiveles;

    try {
      if (Object.keys(cambios).length === 0) {
        setAviso("Escribí algo para cambiar.");
        return;
      }
      const actualizada = await apiFetch<Institution>("/institution", {
        method: "PATCH",
        institutionId,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cambios),
      });
      setGuardada(actualizada);
      setAviso("Guardado.");
      setDireccion("");
      setNiveles("");
    } catch (e) {
      setError(mensajeDe(e));
    } finally {
      setGuardando(false);
    }
  }

  return (
    <section className="flex flex-col gap-3 rounded border bg-white p-4">
      <h2 className="font-semibold">Datos de la escuela</h2>

      {guardada && (
        <dl className="text-sm">
          <dt className="font-medium">Nombre</dt>
          <dd className="mb-1">{guardada.name}</dd>
          <dt className="font-medium">Dirección</dt>
          <dd className="mb-1">{guardada.address ?? "—"}</dd>
          <dt className="font-medium">Niveles</dt>
          <dd>{guardada.levels.length > 0 ? guardada.levels.join(", ") : "—"}</dd>
        </dl>
      )}

      <form onSubmit={guardar} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm">
          Nombre
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="rounded border px-3 py-2"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Dirección
          <input
            type="text"
            value={direccion}
            onChange={(e) => setDireccion(e.target.value)}
            className="rounded border px-3 py-2"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Niveles (separados por coma)
          <input
            type="text"
            value={niveles}
            onChange={(e) => setNiveles(e.target.value)}
            placeholder="Inicial, Primario, Secundario"
            className="rounded border px-3 py-2"
          />
        </label>

        <p className="text-xs text-gray-500">Los campos vacíos no se modifican.</p>

        {aviso && <p className="text-sm text-green-700">{aviso}</p>}
        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={guardando}
          className="self-start rounded bg-accent px-4 py-2 font-medium text-white disabled:opacity-50"
        >
          {guardando ? "Guardando..." : "Guardar cambios"}
        </button>
      </form>
    </section>
  );
}
