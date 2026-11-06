"use client";

import { useEffect, useState } from "react";
import { AnnouncementForm } from "../../../features/announcements/announcement-form";
import { AnnouncementsList, type Announcement } from "../../../features/announcements/announcements-list";
import { useSession } from "../../../features/session/use-session";
import { ApiError, apiFetch } from "../../../lib/api";
import type { Role } from "../../../config/navigation";

type Carga =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; announcements: Announcement[] };

function Comunicados({ institutionId, role }: { institutionId: string; role: Role }) {
  const [carga, setCarga] = useState<Carga>({ status: "loading" });

  useEffect(() => {
    let cancelado = false;

    apiFetch<Announcement[]>("/announcements", { institutionId })
      .then((announcements) => {
        if (!cancelado) setCarga({ status: "ready", announcements });
      })
      .catch((error) => {
        if (cancelado) return;
        setCarga({
          status: "error",
          message:
            error instanceof ApiError ? error.message : "No se pudo conectar. Probá de nuevo en un rato.",
        });
      });

    return () => {
      cancelado = true;
    };
  }, [institutionId]);

  function agregar(nuevo: Announcement) {
    setCarga((actual) =>
      actual.status === "ready"
        ? { status: "ready", announcements: [nuevo, ...actual.announcements] }
        : actual
    );
  }

  return (
    <>
      {(role === "admin" || role === "director" || role === "teacher") && (
        <AnnouncementForm institutionId={institutionId} role={role} onPublicado={agregar} />
      )}

      {carga.status === "loading" && <p>Cargando comunicados...</p>}

      {carga.status === "error" && (
        <p role="alert" className="text-red-600">
          {carga.message}
        </p>
      )}

      {carga.status === "ready" && <AnnouncementsList announcements={carga.announcements} />}
    </>
  );
}

export default function ComunicadosPage() {
  const session = useSession();

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-10">
      <h1 className="text-2xl font-semibold">Comunicados</h1>

      {session.status === "loading" && <p>Cargando...</p>}

      {session.status === "error" && (
        <p role="alert" className="text-red-600">
          No se pudieron cargar tus datos. Probá de nuevo en un rato.
        </p>
      )}

      {session.status === "ready" &&
        (session.activeMembership ? (
          <Comunicados
            institutionId={session.activeMembership.institutionId}
            role={session.activeMembership.role}
          />
        ) : (
          <p>Tu usuario todavía no tiene una institución asignada.</p>
        ))}
    </main>
  );
}
