"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { apiFetch } from "../../lib/api";
import { CAMBIO_DE_NOTIFICACIONES } from "./notifications-events";

export function NotificationBell({ institutionId }: { institutionId: string }) {
  const pathname = usePathname();
  const [sinLeer, setSinLeer] = useState(0);

  useEffect(() => {
    // Con mala señal las respuestas pueden llegar desordenadas: solo vale la
    // del último pedido. Cambiar de pantalla o desmontar también las invalida.
    let ultimoPedido = 0;

    function actualizar() {
      const pedido = ++ultimoPedido;
      apiFetch<{ count: number }>("/notifications/unread-count", { institutionId })
        .then(({ count }) => {
          if (pedido === ultimoPedido) setSinLeer(count);
        })
        // Si falla, queda el último número conocido: no vale romper el menú.
        .catch(() => {});
    }

    actualizar();
    window.addEventListener(CAMBIO_DE_NOTIFICACIONES, actualizar);

    return () => {
      ultimoPedido = -1;
      window.removeEventListener(CAMBIO_DE_NOTIFICACIONES, actualizar);
    };
  }, [institutionId, pathname]);

  return (
    <Link
      href="/notificaciones"
      aria-label={sinLeer > 0 ? `Notificaciones: ${sinLeer} sin leer` : "Notificaciones"}
      className="relative flex h-10 w-10 items-center justify-center rounded-full hover:bg-gray-100"
    >
      <svg
        viewBox="0 0 24 24"
        aria-hidden
        className="h-6 w-6 fill-none stroke-ink"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M6 9a6 6 0 0 1 12 0c0 6 2.5 7.5 2.5 7.5h-17S6 15 6 9" />
        <path d="M10 20a2.2 2.2 0 0 0 4 0" />
      </svg>
      {sinLeer > 0 && (
        <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-xs font-semibold text-white">
          {sinLeer > 99 ? "99+" : sinLeer}
        </span>
      )}
    </Link>
  );
}
