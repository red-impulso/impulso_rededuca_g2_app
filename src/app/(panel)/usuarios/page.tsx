"use client";

import { Icono } from "../../../components/ui/estado";
import { useSession } from "../../../features/session/use-session";
import { UsuariosAdmin } from "../../../features/users/usuarios-admin";

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

  return <UsuariosAdmin institutionId={membership.institutionId} institutionName={membership.institutionName} />;
}

export default function UsuariosPage() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6 pb-24 md:px-8 md:pb-8">
      <div className="flex items-start gap-3 text-ink">
        <Icono className="mt-1 hidden h-8 w-8 shrink-0 text-blue md:block">
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21c0-4.5 3.5-7 8-7s8 2.5 8 7" />
        </Icono>
        <div>
          <h1 className="text-2xl font-semibold md:text-3xl">Usuarios y roles</h1>
          <p className="mt-1 text-blue/80">Gestioná los usuarios que tienen acceso al sistema y asignales un rol.</p>
        </div>
      </div>

      <Contenido />
    </main>
  );
}
