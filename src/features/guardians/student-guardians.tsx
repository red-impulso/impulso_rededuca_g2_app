"use client";

import { useEffect, useState } from "react";
import { Icono } from "../../components/ui/estado";
import { ApiError, apiFetch } from "../../lib/api";
import { CAMPO, TARJETA } from "../institution/admin-ui";

// GET /students/:id/guardians y GET /guardians: el id es el de la membresía.
interface Tutor {
  id: string;
  fullName: string | null;
}

type Carga =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; vinculados: Tutor[]; todos: Tutor[] };

const SIN_NOMBRE = "Sin nombre";

function ordenar(tutores: Tutor[]): Tutor[] {
  return [...tutores].sort((a, b) => (a.fullName ?? "").localeCompare(b.fullName ?? "", "es"));
}

// Sección Tutores de la ficha del alumno: quién está vinculado y cómo cambiarlo.
// Quien queda vinculado ve las notas y la asistencia del alumno.
export function StudentGuardians({ institutionId, studentId }: { institutionId: string; studentId: string }) {
  const [carga, setCarga] = useState<Carga>({ status: "loading" });
  const [intento, setIntento] = useState(0);
  const [elegido, setElegido] = useState("");
  const [confirmando, setConfirmando] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;

    Promise.all([
      apiFetch<Tutor[]>(`/students/${studentId}/guardians`, { institutionId }),
      apiFetch<Tutor[]>("/guardians", { institutionId }),
    ])
      .then(([vinculados, todos]) => {
        if (!cancelado) setCarga({ status: "ready", vinculados, todos });
      })
      .catch(() => {
        if (!cancelado) setCarga({ status: "error" });
      });

    return () => {
      cancelado = true;
    };
  }, [institutionId, studentId, intento]);

  function actualizar(fn: (vinculados: Tutor[]) => Tutor[]) {
    setCarga((actual) =>
      actual.status === "ready" ? { ...actual, vinculados: ordenar(fn(actual.vinculados)) } : actual
    );
  }

  async function enviar(accion: () => Promise<void>) {
    setEnviando(true);
    setError(null);
    try {
      await accion();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "No se pudo conectar. Probá de nuevo en un rato.");
    } finally {
      setEnviando(false);
    }
  }

  function vincular() {
    return enviar(async () => {
      const tutor = await apiFetch<Tutor>(`/students/${studentId}/guardians`, {
        method: "POST",
        institutionId,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guardianMembershipId: elegido }),
      });
      actualizar((vinculados) => [...vinculados, tutor]);
      setElegido("");
    });
  }

  function quitar(id: string) {
    // Primer toque pide confirmación; el segundo desvincula de verdad.
    if (confirmando !== id) {
      setConfirmando(id);
      return;
    }
    setConfirmando(null);
    return enviar(async () => {
      await apiFetch(`/students/${studentId}/guardians/${id}`, { method: "DELETE", institutionId });
      actualizar((vinculados) => vinculados.filter((tutor) => tutor.id !== id));
    });
  }

  if (carga.status === "loading") return <p>Cargando tutores...</p>;

  if (carga.status === "error") {
    return (
      <div className="flex flex-col items-start gap-2">
        <p role="alert" className="text-red-600">
          No se pudieron cargar los tutores. Probá de nuevo en un rato.
        </p>
        <button
          type="button"
          onClick={() => {
            setCarga({ status: "loading" });
            setIntento((actual) => actual + 1);
          }}
          className="rounded-xl border border-gray-300 px-4 py-2"
        >
          Reintentar
        </button>
      </div>
    );
  }

  const idsVinculados = new Set(carga.vinculados.map((tutor) => tutor.id));
  const disponibles = carga.todos.filter((tutor) => !idsVinculados.has(tutor.id));

  return (
    <section className={TARJETA}>
      <h3 className="flex items-center gap-3 border-b border-blue/10 px-4 py-3 font-semibold text-ink">
        <Icono className="h-6 w-6">
          <circle cx="9" cy="8" r="3.5" />
          <path d="M2.5 20c0-4 3-6.5 6.5-6.5s6.5 2.5 6.5 6.5M16 5a3.5 3.5 0 0 1 0 6.5M18 14c2 .8 3.5 3 3.5 6" />
        </Icono>
        Tutores
      </h3>

      {carga.vinculados.length === 0 ? (
        <p className="px-4 py-3 text-gray-600">No hay tutores vinculados.</p>
      ) : (
        <ul aria-label="Tutores vinculados" className="divide-y divide-blue/10">
          {carga.vinculados.map((tutor) => {
            const nombre = tutor.fullName ?? SIN_NOMBRE;
            const seguro = confirmando === tutor.id;
            return (
              <li key={tutor.id} className="flex items-center justify-between gap-3 px-4 py-3 text-ink">
                <span className="min-w-0 break-words">{nombre}</span>
                <button
                  type="button"
                  aria-label={seguro ? `¿Seguro? Quitar a ${nombre}` : `Quitar a ${nombre}`}
                  disabled={enviando}
                  onClick={() => quitar(tutor.id)}
                  className="shrink-0 rounded-full border border-red-200 px-3 py-1 text-sm text-red-700 hover:bg-red-50 disabled:opacity-50"
                >
                  {seguro ? "¿Seguro? Tocá de nuevo" : "Quitar"}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <div className="border-t border-blue/10 p-4">
        {disponibles.length === 0 ? (
          <p className="text-sm text-gray-600">No hay más tutores para vincular.</p>
        ) : (
          <div className="flex flex-col gap-2 sm:flex-row">
            <select
              aria-label="Tutor para vincular"
              value={elegido}
              onChange={(e) => setElegido(e.target.value)}
              className={`min-w-0 flex-1 ${CAMPO}`}
            >
              <option value="">Elegí un tutor</option>
              {disponibles.map((tutor) => (
                <option key={tutor.id} value={tutor.id}>
                  {tutor.fullName ?? SIN_NOMBRE}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={!elegido || enviando}
              onClick={vincular}
              className="rounded-xl bg-accent px-4 py-2 font-medium text-white disabled:opacity-50"
            >
              Vincular
            </button>
          </div>
        )}

        {error && (
          <p role="alert" className="mt-2 text-sm text-red-600">
            {error}
          </p>
        )}
      </div>
    </section>
  );
}
