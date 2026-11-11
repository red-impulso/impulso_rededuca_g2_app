"use client";

import type { ReactNode } from "react";
import { useSession } from "../session/use-session";

// Muestra el contenido solo a admin y dirección, y le pasa la institución activa.
export function AdminDirectorOnly({ children }: { children: (institutionId: string) => ReactNode }) {
  const session = useSession();

  if (session.status === "loading") return <p>Cargando...</p>;

  if (session.status === "error") {
    return (
      <p role="alert" className="text-rojo">
        No se pudieron cargar tus datos. Probá de nuevo en un rato.
      </p>
    );
  }

  const role = session.activeMembership?.role;
  if (role !== "admin" && role !== "director") {
    return <p>Esta sección es para la dirección.</p>;
  }

  return children(session.activeMembership!.institutionId);
}
