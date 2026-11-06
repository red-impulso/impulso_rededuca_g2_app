"use client";

import { NotificationsInbox } from "../../../features/notifications/notifications-inbox";
import { useSession } from "../../../features/session/use-session";

export default function NotificacionesPage() {
  const session = useSession();

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-10">
      <div>
        <h1 className="text-2xl font-semibold">Notificaciones</h1>
        <p className="text-gray-600">Revisá tus avisos y mantenete informado.</p>
      </div>

      {session.status === "loading" && <p>Cargando...</p>}

      {session.status === "error" && (
        <p role="alert" className="text-red-600">
          No se pudieron cargar tus datos. Probá de nuevo en un rato.
        </p>
      )}

      {session.status === "ready" &&
        (session.activeMembership ? (
          <NotificationsInbox institutionId={session.activeMembership.institutionId} />
        ) : (
          <p>Tu usuario todavía no tiene una institución asignada.</p>
        ))}
    </main>
  );
}
