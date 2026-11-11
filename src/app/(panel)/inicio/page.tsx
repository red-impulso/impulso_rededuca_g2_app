"use client";

import Link from "next/link";
import { getNavItems, ROLE_LABELS } from "../../../config/navigation";
import { useSession } from "../../../features/session/use-session";
import { Alerta } from "../../../components/ui/alerta";
import { Cargando } from "../../../components/ui/estado";

// Inicio (prototipo "ingreso, inicio y menú"): hero con título grande,
// subtítulo con rol e institución, y accesos directos.
export default function InicioPage() {
  const session = useSession();

  // "Comenzar" va a la primera sección que el rol puede ver.
  const membership = session.status === "ready" ? session.activeMembership : null;
  const variasEscuelas = session.status === "ready" && session.instituciones.length > 1;
  const destino =
    (membership ? getNavItems(membership.role, variasEscuelas)[1]?.href : null) ?? "/comunicados";

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-10 max-md:pb-24">
      {session.status === "loading" && (
        <div className="flex flex-1 items-center justify-center">
          <Cargando bicolor />
        </div>
      )}

      {session.status === "error" && (
        <Alerta tipo="error">No se pudieron cargar tus datos. Probá de nuevo en un rato.</Alerta>
      )}

      {session.status === "ready" && (
        <section className="relative flex flex-col items-start gap-5 overflow-hidden rounded-2xl border border-white/80 bg-white/85 p-8 shadow-[0_8px_30px_rgba(20,24,90,0.08)] backdrop-blur sm:p-12">
          {/* Círculos decorativos de la identidad */}
          <span aria-hidden className="absolute -right-14 -top-14 h-40 w-40 rounded-full bg-acento-suave/50" />
          <span aria-hidden className="absolute -bottom-16 -left-16 h-44 w-44 rounded-full bg-naranja/30" />

          <div className="relative flex flex-col gap-3">
            <h1 className="text-3xl font-extrabold leading-tight text-ink sm:text-4xl">
              Hola, {session.profile.fullName ?? "sin nombre"}
            </h1>
            {session.activeMembership ? (
              <p className="text-base text-gray-600">
                {ROLE_LABELS[session.activeMembership.role] ?? session.activeMembership.role}
                {" · "}
                {session.activeMembership.institutionName}
              </p>
            ) : (
              <p className="text-base text-gray-600">
                Tu usuario todavía no tiene una institución asignada.
              </p>
            )}
          </div>

          <div className="relative flex flex-wrap gap-3">
            <Link
              href={destino}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-primario px-6 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
            >
              Comenzar
            </Link>
            <Link
              href="/comunicados"
              className="inline-flex items-center justify-center gap-2 rounded-full border-2 border-naranja bg-transparent px-6 py-2.5 text-sm font-semibold text-naranja-fuerte transition hover:bg-naranja/15"
            >
              Más información
            </Link>
          </div>
        </section>
      )}
    </main>
  );
}
