"use client";

import { ROLE_LABELS } from "../../../config/navigation";
import { useSession } from "../../../features/session/use-session";

export default function InicioPage() {
  const session = useSession();

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-2 px-4 py-10">
      {session.status === "loading" && <p>Cargando...</p>}

      {session.status === "error" && (
        <p role="alert" className="text-red-600">
          No se pudieron cargar tus datos. Probá de nuevo en un rato.
        </p>
      )}

      {session.status === "ready" && (
        <>
          <h1 className="text-2xl font-semibold">
            Hola, {session.profile.fullName ?? "sin nombre"}
          </h1>
          {session.activeMembership ? (
            <p className="text-gray-600">
              {ROLE_LABELS[session.activeMembership.role] ?? session.activeMembership.role}
              {" · "}
              {session.activeMembership.institutionName}
            </p>
          ) : (
            <p className="text-gray-600">Tu usuario todavía no tiene una institución asignada.</p>
          )}
        </>
      )}
    </main>
  );
}
