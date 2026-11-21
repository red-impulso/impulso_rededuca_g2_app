"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getNavItems, ROLE_LABELS } from "../../../config/navigation";
import { useSession } from "../../../features/session/use-session";
import type { Announcement } from "../../../features/announcements/announcements-list";
import { ICONOS } from "../../../components/layout/panel-nav";
import { Alerta } from "../../../components/ui/alerta";
import { Cargando, Icono } from "../../../components/ui/estado";
import { apiFetch } from "../../../lib/api";

// Inicio (informe de diseño, "Dashboard"): saludo, tarjetas grandes a las
// secciones del rol (naranja, azul oscuro y blanca) y comunicados recientes.
const COLORES_TARJETA = [
  "bg-accent text-ink",
  "bg-ink text-white",
  "border border-white/80 bg-white text-ink [&_svg]:text-blue",
];
const MAX_TARJETAS = 3;
const MAX_COMUNICADOS = 3;

type Carga = { status: "loading" } | { status: "error" } | { status: "ready"; comunicados: Announcement[] };

const FORMATO_FECHA = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "America/Argentina/Jujuy",
});

function ComunicadosRecientes({ institutionId }: { institutionId: string }) {
  const [carga, setCarga] = useState<Carga>({ status: "loading" });
  const [intento, setIntento] = useState(0);

  useEffect(() => {
    let cancelado = false;

    apiFetch<Announcement[]>("/announcements", { institutionId })
      .then((comunicados) => {
        if (!cancelado) setCarga({ status: "ready", comunicados });
      })
      .catch(() => {
        if (!cancelado) setCarga({ status: "error" });
      });

    return () => {
      cancelado = true;
    };
  }, [institutionId, intento]);

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-white/80 bg-white p-6 shadow-[0_8px_30px_rgba(20,24,90,0.08)]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-bold text-ink">Comunicados recientes</h2>
        <Link
          href="/comunicados"
          aria-label="Ver todos los comunicados"
          className="rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:brightness-125"
        >
          Ver todos
        </Link>
      </div>

      {carga.status === "loading" && <p className="text-sm text-gray-600">Cargando comunicados...</p>}

      {carga.status === "error" && (
        <div className="flex flex-wrap items-center gap-3">
          <p role="alert" className="text-sm text-rojo">
            No pudimos cargar los comunicados.
          </p>
          <button
            type="button"
            onClick={() => {
              setCarga({ status: "loading" });
              setIntento((actual) => actual + 1);
            }}
            className="rounded-full border border-blue/30 px-4 py-1.5 text-sm font-medium text-blue"
          >
            Reintentar
          </button>
        </div>
      )}

      {carga.status === "ready" && carga.comunicados.length === 0 && (
        <p className="text-sm text-gray-600">Todavía no hay comunicados.</p>
      )}

      {carga.status === "ready" && carga.comunicados.length > 0 && (
        <ul aria-label="Comunicados recientes" className="divide-y divide-blue/10">
          {carga.comunicados.slice(0, MAX_COMUNICADOS).map((comunicado) => (
            <li key={comunicado.id} className="flex flex-col gap-0.5 py-3 first:pt-0 last:pb-0">
              <h3 className="font-semibold text-ink [overflow-wrap:anywhere]">{comunicado.title}</h3>
              <p className="text-xs text-gray-500">
                {comunicado.authorName ?? "Institución"} ·{" "}
                <time dateTime={comunicado.createdAt}>{FORMATO_FECHA.format(new Date(comunicado.createdAt))}</time>
              </p>
              <p className="line-clamp-2 text-sm text-gray-600 [overflow-wrap:anywhere]">{comunicado.body}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default function InicioPage() {
  const session = useSession();

  const membership = session.status === "ready" ? session.activeMembership : null;
  const variasEscuelas = session.status === "ready" && session.instituciones.length > 1;
  // Las primeras secciones del rol, sin Inicio (ya estamos acá).
  const tarjetas = membership
    ? getNavItems(membership.role, variasEscuelas)
        .filter((item) => item.href !== "/inicio")
        .slice(0, MAX_TARJETAS)
    : [];

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-8 max-md:pb-24">
      {session.status === "loading" && (
        <div className="flex flex-1 items-center justify-center">
          <Cargando bicolor />
        </div>
      )}

      {session.status === "error" && (
        <Alerta tipo="error">No se pudieron cargar tus datos. Probá de nuevo en un rato.</Alerta>
      )}

      {session.status === "ready" && (
        <>
          <header className="flex flex-col gap-1">
            <h1 className="text-3xl font-extrabold leading-tight text-ink sm:text-4xl">
              Hola, {session.profile.fullName ?? "sin nombre"}
            </h1>
            {membership ? (
              <p className="text-base text-gray-600">
                {ROLE_LABELS[membership.role] ?? membership.role}
                {" · "}
                {membership.institutionName}
              </p>
            ) : (
              <p className="text-base text-gray-600">Tu usuario todavía no tiene una institución asignada.</p>
            )}
          </header>

          {tarjetas.length > 0 && (
            <nav aria-label="Accesos directos" className="grid gap-4 sm:grid-cols-3">
              {tarjetas.map((item, indice) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex min-h-36 flex-col justify-end gap-3 rounded-2xl p-6 shadow-[0_8px_30px_rgba(20,24,90,0.1)] transition hover:-translate-y-0.5 ${COLORES_TARJETA[indice]}`}
                >
                  <Icono className="h-10 w-10">{ICONOS[item.href]}</Icono>
                  <span className="text-2xl font-extrabold leading-tight">{item.label}</span>
                </Link>
              ))}
            </nav>
          )}

          {membership && <ComunicadosRecientes institutionId={membership.institutionId} />}
        </>
      )}
    </main>
  );
}
