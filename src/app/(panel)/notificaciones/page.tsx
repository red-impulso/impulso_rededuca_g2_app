"use client";

import { NotificationsInbox } from "../../../features/notifications/notifications-inbox";
import { useSession } from "../../../features/session/use-session";

export default function NotificacionesPage() {
  const session = useSession();

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-10 max-md:pb-24">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-ink">Notificaciones</h1>
        <p className="text-sm text-gray-600">Revisá tus avisos y mantenete informado.</p>
      </header>

      {session.status === "loading" && <p>Cargando...</p>}

      {session.status === "error" && (
        <p role="alert" className="text-rojo">
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
