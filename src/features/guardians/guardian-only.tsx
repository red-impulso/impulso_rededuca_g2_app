"use client";

import type { ReactNode } from "react";
import { useSession } from "../session/use-session";

// Muestra el contenido solo a tutores y le pasa la institución activa.
export function GuardianOnly({ children }: { children: (institutionId: string) => ReactNode }) {
  const session = useSession();

  if (session.status === "loading") return <p>Cargando...</p>;

  if (session.status === "error") {
    return (
      <p role="alert" className="text-red-600">
        No se pudieron cargar tus datos. Probá de nuevo en un rato.
      </p>
    );
  }

  if (session.activeMembership?.role !== "guardian") return <p>Esta sección es para tutores.</p>;

  return children(session.activeMembership.institutionId);
}
