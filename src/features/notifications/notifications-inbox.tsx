"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { ApiError, apiFetch } from "../../lib/api";
import { avisarCambioDeNotificaciones } from "./notifications-events";

type Tipo = "grade" | "attendance" | "announcement";

// Lo que devuelve GET /notifications (ver README de la API).
interface Notification {
  id: string;
  type: Tipo;
  title: string;
  body: string | null;
  readAt: string | null;
  createdAt: string;
}

type Carga =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; notifications: Notification[] };

const ZONA = "America/Argentina/Jujuy";
const VISIBLES = 4;

// El aviso no dice de qué hijo es: notas e inasistencias van a la lista de hijos.
const TIPOS: Record<Tipo, { destino: string; texto: string; color: string; icono: ReactNode }> = {
  grade: {
    destino: "/hijos",
    texto: "Tu hijo/a tiene una nueva nota.",
    color: "bg-[#833dff]",
    icono: (
      <>
        <circle cx="12" cy="9" r="5" />
        <path d="m9 13.5-1.5 7L12 18l4.5 2.5-1.5-7" />
      </>
    ),
  },
  attendance: {
    destino: "/hijos",
    texto: "Se registró la asistencia de tu hijo/a.",
    color: "bg-green",
    icono: (
      <>
        <rect x="5" y="4" width="14" height="17" rx="2" />
        <path d="m9 13 2 2 4-4" />
      </>
    ),
  },
  announcement: {
    destino: "/comunicados",
    texto: "Comunicación de la institución.",
    color: "bg-accent",
    icono: (
      <>
        <path d="M4 10v4h3l9 4V6l-9 4z" />
        <path d="M8 14.5 9.5 20M19 9.5v5" />
      </>
    ),
  },
};

const FILTROS: { nombre: string; icono: ReactNode; acepta: (n: Notification) => boolean }[] = [
  { nombre: "Todas", icono: null, acepta: () => true },
  {
    nombre: "Avisos",
    icono: <path d="M6 9a6 6 0 0 1 12 0c0 6 2.5 7.5 2.5 7.5h-17S6 15 6 9M10 20a2.2 2.2 0 0 0 4 0" />,
    acepta: (n) => !n.readAt,
  },
  {
    nombre: "Institución",
    icono: <path d="M3 21h18M5 21V10m14 11V10M3 10l9-6 9 6M9 21v-6h6v6" />,
    acepta: (n) => n.type === "announcement",
  },
  {
    nombre: "Familia",
    icono: (
      <>
        <circle cx="9" cy="8" r="3.5" />
        <path d="M2.5 20c0-4 3-6.5 6.5-6.5s6.5 2.5 6.5 6.5M16 5a3.5 3.5 0 0 1 0 6.5M18 14c2 .8 3.5 3 3.5 6" />
      </>
    ),
    acepta: (n) => n.type !== "announcement",
  },
];

function mensajeDe(error: unknown): string {
  return error instanceof ApiError ? error.message : "No se pudo conectar. Probá de nuevo en un rato.";
}

function diaDe(fecha: Date): string {
  return fecha.toLocaleDateString("en-CA", { timeZone: ZONA });
}

// Hoy: la hora. Ayer: "Ayer". Antes: la fecha. Siempre en hora de Argentina.
export function mostrarCuando(createdAt: string, ahora = new Date()): string {
  const fecha = new Date(createdAt);
  const ayer = new Date(ahora.getTime() - 24 * 60 * 60 * 1000);

  if (diaDe(fecha) === diaDe(ahora)) {
    return fecha.toLocaleTimeString("es-AR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: ZONA,
    });
  }
  if (diaDe(fecha) === diaDe(ayer)) return "Ayer";
  return fecha.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: ZONA,
  });
}

function Icono({ children, className }: { children: ReactNode; className: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className={`fill-none stroke-current ${className}`}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

function Estado({
  fondo = "bg-white/80",
  ilustracion,
  titulo,
  texto,
  children,
}: {
  fondo?: string;
  ilustracion: ReactNode;
  titulo: string;
  texto: string;
  children?: ReactNode;
}) {
  return (
    <div
      className={`flex flex-col items-center gap-3 rounded-2xl border border-white/80 px-6 py-10 text-center shadow-[0_8px_30px_rgba(20,33,61,0.08)] backdrop-blur ${fondo}`}
    >
      {ilustracion}
      <h2 className="text-xl font-semibold">{titulo}</h2>
      <p className="max-w-xs text-gray-600">{texto}</p>
      {children}
    </div>
  );
}

function Cargando() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden className="h-14 w-14 fill-blue motion-safe:animate-spin">
      {Array.from({ length: 12 }, (_, i) => (
        <circle
          key={i}
          cx="24"
          cy="5"
          r="3"
          opacity={0.25 + (i / 12) * 0.75}
          transform={`rotate(${i * 30} 24 24)`}
        />
      ))}
    </svg>
  );
}

export function NotificationsInbox({ institutionId }: { institutionId: string }) {
  const router = useRouter();
  const [carga, setCarga] = useState<Carga>({ status: "loading" });
  const [intento, setIntento] = useState(0);
  const [filtro, setFiltro] = useState(FILTROS[0]);
  const [verTodas, setVerTodas] = useState(false);
  const [marcando, setMarcando] = useState(false);
  const [todoAlDia, setTodoAlDia] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;

    apiFetch<Notification[]>("/notifications", { institutionId })
      .then((notifications) => {
        if (!cancelado) setCarga({ status: "ready", notifications });
      })
      .catch(() => {
        if (!cancelado) setCarga({ status: "error" });
      });

    return () => {
      cancelado = true;
    };
  }, [institutionId, intento]);

  function reintentar() {
    setCarga({ status: "loading" });
    setIntento((actual) => actual + 1);
  }

  const botonVolver = (color: string) => (
    <button
      type="button"
      onClick={() => router.push("/inicio")}
      className={`mt-1 rounded-full px-10 py-2 font-medium text-white ${color}`}
    >
      Volver
    </button>
  );

  if (carga.status === "loading") {
    return (
      <Estado ilustracion={<Cargando />} titulo="Cargando notificaciones..." texto="Un momento, por favor." />
    );
  }

  if (carga.status === "error") {
    return (
      <div role="alert">
        <Estado
          fondo="bg-red-50"
          ilustracion={
            <Icono className="h-14 w-14 text-red-600">
              <path d="M12 3 22.5 21h-21zM12 10v5M12 18v.5" />
            </Icono>
          }
          titulo="Error al cargar las notificaciones"
          texto="Ocurrió un problema al obtener los avisos. Intentá nuevamente."
        >
          <button
            type="button"
            onClick={reintentar}
            className="mt-1 rounded-full bg-red-600 px-8 py-2 font-medium text-white"
          >
            Reintentar
          </button>
        </Estado>
      </div>
    );
  }

  if (todoAlDia) {
    return (
      <Estado
        fondo="bg-green/10"
        ilustracion={
          <Icono className="h-14 w-14 text-green">
            <circle cx="12" cy="12" r="9.5" />
            <path d="m8 12.5 2.5 2.5 5.5-5.5" />
          </Icono>
        }
        titulo="¡Todo al día!"
        texto="No hay notificaciones nuevas en este momento."
      >
        {botonVolver("bg-green")}
      </Estado>
    );
  }

  const { notifications } = carga;

  if (notifications.length === 0) {
    return (
      <Estado
        ilustracion={
          <Icono className="h-16 w-16 text-blue">
            <path d="M6 9a6 6 0 0 1 12 0c0 6 2.5 7.5 2.5 7.5h-17S6 15 6 9M10 20a2.2 2.2 0 0 0 4 0" />
          </Icono>
        }
        titulo="No tenés notificaciones"
        texto="Cuando recibas novedades, las vas a ver acá."
      >
        {botonVolver("bg-blue")}
      </Estado>
    );
  }

  const hayNoLeidas = notifications.some((notification) => !notification.readAt);
  const filtradas = notifications.filter(filtro.acepta);
  const visibles = verTodas ? filtradas : filtradas.slice(0, VISIBLES);

  async function abrir(notification: Notification) {
    if (!notification.readAt) {
      try {
        await apiFetch(`/notifications/${notification.id}/read`, { method: "POST", institutionId });
        avisarCambioDeNotificaciones();
      } catch {
        // Si no se pudo marcar, igual lleva a la pantalla: es lo que se pidió.
      }
    }
    router.push(TIPOS[notification.type].destino);
  }

  async function marcarTodas() {
    setMarcando(true);
    setError(null);

    try {
      await apiFetch("/notifications/read-all", { method: "POST", institutionId });
      setTodoAlDia(true);
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
        className="flex items-center gap-2 self-end text-sm text-blue disabled:opacity-50"
      >
        <Icono className="h-4 w-4">
          <path d="m5 12.5 4.5 4.5L19 7.5" />
        </Icono>
        Marcar todas como leídas
      </button>

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      <div className="flex gap-1.5 overflow-x-auto pb-1 sm:gap-2">
        {FILTROS.map((opcion) => (
          <button
            key={opcion.nombre}
            type="button"
            aria-pressed={opcion === filtro}
            onClick={() => setFiltro(opcion)}
            className={`flex shrink-0 items-center gap-1 rounded-full border px-3 py-2 text-xs sm:gap-1.5 sm:px-4 sm:text-sm ${
              opcion === filtro ? "border-blue bg-blue text-white" : "border-white/80 bg-white/80"
            }`}
          >
            {opcion.icono && <Icono className="h-4 w-4">{opcion.icono}</Icono>}
            {opcion.nombre}
          </button>
        ))}
      </div>

      {filtradas.length === 0 ? (
        <p className="py-4 text-center text-gray-600">No hay notificaciones en este filtro.</p>
      ) : (
        <ul className="divide-y divide-gray-100 overflow-hidden rounded-2xl border border-white/80 bg-white/80 shadow-[0_8px_30px_rgba(20,33,61,0.08)] backdrop-blur">
          {visibles.map((notification) => {
            const tipo = TIPOS[notification.type];
            return (
              <li key={notification.id}>
                <button
                  type="button"
                  onClick={() => abrir(notification)}
                  className="flex w-full items-center gap-3 px-3 py-3 text-left hover:bg-blue/5"
                >
                  <span
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white ${tipo.color}`}
                  >
                    <Icono className="h-6 w-6">{tipo.icono}</Icono>
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className={`block ${notification.readAt ? "" : "font-semibold"}`}>
                      {notification.title}
                    </span>
                    <span className="block text-sm text-gray-600">{notification.body ?? tipo.texto}</span>
                  </span>
                  <span className="shrink-0 text-xs text-gray-600">{mostrarCuando(notification.createdAt)}</span>
                  <span
                    aria-hidden
                    className={`h-2 w-2 shrink-0 rounded-full ${notification.readAt ? "bg-gray-300" : "bg-blue"}`}
                  />
                  {!notification.readAt && <span className="sr-only">Sin leer</span>}
                  <span aria-hidden className="shrink-0 text-xl text-gray-400">
                    ›
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {!verTodas && filtradas.length > VISIBLES && (
        <button
          type="button"
          onClick={() => setVerTodas(true)}
          className="rounded-2xl bg-blue/10 px-4 py-3 text-sm font-medium text-blue"
        >
          Ver todas las notificaciones
        </button>
      )}
    </div>
  );
}
