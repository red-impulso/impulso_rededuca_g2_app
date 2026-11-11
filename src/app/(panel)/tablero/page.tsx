"use client";

import { Dashboard } from "../../../features/dashboard/dashboard";
import { useSession } from "../../../features/session/use-session";

export default function TableroPage() {
  const session = useSession();
  const membership = session.status === "ready" ? session.activeMembership : null;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-10">
      <div>
        <h1 className="text-2xl font-semibold">Dirección</h1>
        <p className="text-gray-600">Vista general del funcionamiento institucional.</p>
      </div>

      {session.status === "loading" && <p>Cargando...</p>}

      {session.status === "error" && (
        <p role="alert" className="text-rojo">
          No se pudieron cargar tus datos. Probá de nuevo en un rato.
        </p>
      )}

      {session.status === "ready" &&
        (membership?.role === "admin" || membership?.role === "director" ? (
          <Dashboard institutionId={membership.institutionId} />
        ) : (
          <p>Esta sección es para la dirección.</p>
        ))}
    </main>
  );
}
