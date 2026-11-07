"use client";

import { Icono } from "../../../components/ui/estado";
import { InteresadosAdmin } from "../../../features/leads/interesados-admin";
import { useSession } from "../../../features/session/use-session";

function Contenido() {
  const session = useSession();

  if (session.status === "loading") return <p>Cargando...</p>;

  if (session.status === "error") {
    return (
      <p role="alert" className="text-red-600">
        No se pudieron cargar tus datos. Probá de nuevo en un rato.
      </p>
    );
  }

  const membership = session.activeMembership;
  if (membership?.role !== "admin") return <p>Esta sección es para la administración.</p>;

  return <InteresadosAdmin institutionId={membership.institutionId} />;
}

export default function InteresadosPage() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6 pb-24 md:px-8 md:pb-8">
      <div className="flex items-start gap-3 text-ink">
        <Icono className="mt-1 hidden h-8 w-8 shrink-0 text-blue md:block">
          <path d="M4 5h16v14H4zM4 7l8 6 8-6" />
        </Icono>
        <div>
          <h1 className="text-2xl font-semibold md:text-3xl">Interesados</h1>
          <p className="mt-1 text-blue/80">
            Instituciones que se postularon desde la landing. Marcá a cuáles ya contactaste.
          </p>
        </div>
      </div>

      <Contenido />
    </main>
  );
}
