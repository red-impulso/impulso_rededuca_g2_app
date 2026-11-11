"use client";

import type { ReactNode } from "react";
import type { Role } from "../../config/navigation";
import { useSession } from "../session/use-session";

// Muestra el contenido solo a admin y dirección, y le pasa la institución
// activa y el rol (por si alguna acción es solo de admin).
export function AdminDirectorOnly({
  children,
}: {
  children: (institutionId: string, role: Role) => ReactNode;
}) {
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

  return children(session.activeMembership!.institutionId, role);
}
