"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ApiError, apiFetch } from "../../lib/api";
import { avisarCambioDeNotificaciones } from "./notifications-events";

// Lo que devuelve GET /notifications (ver README de la API).
interface Notification {
  id: string;
  type: "grade" | "attendance" | "announcement";
  title: string;
  body: string | null;
  readAt: string | null;
  createdAt: string;
}

type Carga =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; notifications: Notification[] };

// El aviso no dice de qué hijo es: notas e inasistencias van a la lista de hijos.
const DESTINOS: Record<Notification["type"], string> = {
  grade: "/hijos",
  attendance: "/hijos",
  announcement: "/comunicados",
};

function mensajeDe(error: unknown): string {
  return error instanceof ApiError ? error.message : "No se pudo conectar. Probá de nuevo en un rato.";
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

export function NotificationsInbox({ institutionId }: { institutionId: string }) {
  const router = useRouter();
  const [carga, setCarga] = useState<Carga>({ status: "loading" });
  const [marcando, setMarcando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;

    apiFetch<Notification[]>("/notifications", { institutionId })
      .then((notifications) => {
        if (!cancelado) setCarga({ status: "ready", notifications });
      })
      .catch((e) => {
        if (!cancelado) setCarga({ status: "error", message: mensajeDe(e) });
      });

    return () => {
      cancelado = true;
    };
  }, [institutionId]);

  if (carga.status === "loading") return <p>Cargando...</p>;

  if (carga.status === "error") {
    return (
      <p role="alert" className="text-red-600">
        {carga.message}
      </p>
    );
  }

  const { notifications } = carga;

  if (notifications.length === 0) return <p>No tenés notificaciones.</p>;

  const hayNoLeidas = notifications.some((notification) => !notification.readAt);

  async function abrir(notification: Notification) {
    if (!notification.readAt) {
      try {
        await apiFetch(`/notifications/${notification.id}/read`, { method: "POST", institutionId });
        avisarCambioDeNotificaciones();
      } catch {
        // Si no se pudo marcar, igual lleva a la pantalla: es lo que se pidió.
      }
    }
    router.push(DESTINOS[notification.type]);
  }

  async function marcarTodas() {
    setMarcando(true);
    setError(null);

    try {
      await apiFetch("/notifications/read-all", { method: "POST", institutionId });
      const ahora = new Date().toISOString();
      setCarga({
        status: "ready",
        notifications: notifications.map((n) => ({ ...n, readAt: n.readAt ?? ahora })),
      });
      avisarCambioDeNotificaciones();
    } catch (e) {
      setError(mensajeDe(e));
    } finally {
      setMarcando(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={marcarTodas}
        disabled={!hayNoLeidas || marcando}
        className="self-start rounded border px-4 py-2 text-sm disabled:opacity-50"
      >
        Marcar todas como leídas
      </button>

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      <ul className="flex flex-col gap-3">
        {notifications.map((notification) => (
          <li key={notification.id}>
            <button
              type="button"
              onClick={() => abrir(notification)}
              className={`relative block w-full overflow-hidden rounded-2xl border border-white/80 p-4 text-left shadow-[0_8px_30px_rgba(20,33,61,0.08)] backdrop-blur transition hover:shadow-[0_12px_36px_rgba(20,33,61,0.16)] motion-safe:hover:-translate-y-0.5 ${
                notification.readAt ? "bg-white/50" : "bg-white/80"
              }`}
            >
              {!notification.readAt && (
                <span
                  aria-hidden
                  className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-accent via-[#833dff] to-[#22c3e6]"
                />
              )}
              <span className="flex items-start justify-between gap-2">
                <span className={notification.readAt ? "" : "font-semibold"}>{notification.title}</span>
                {!notification.readAt && (
                  <span className="shrink-0 rounded-full bg-accent/15 px-2 py-0.5 text-xs font-medium">
                    Sin leer
                  </span>
                )}
              </span>
              {notification.body && <span className="mt-1 block text-sm">{notification.body}</span>}
              <span className="mt-1 block text-sm text-gray-600">{mostrarFecha(notification.createdAt)}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
