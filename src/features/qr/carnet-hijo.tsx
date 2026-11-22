"use client";

import { useContext, useEffect, useState } from "react";
import { ApiError, apiFetch } from "../../lib/api";
import { SessionContext } from "../session/session-provider";
import { CarnetQr } from "./carnet-qr";

// Lo que devuelve GET /me/students.
interface Hijo {
  id: string;
  firstName: string | null;
  lastName: string | null;
  course: { year: number; division: string } | null;
}

type Carga =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; hijo: Hijo | undefined };

// Carnet del hijo para el tutor (Mis hijos → Carnet).
export function CarnetHijo({ institutionId, studentId }: { institutionId: string; studentId: string }) {
  const session = useContext(SessionContext);
  const [carga, setCarga] = useState<Carga>({ status: "loading" });

  useEffect(() => {
    let cancelado = false;
    apiFetch<Hijo[]>("/me/students", { institutionId })
      .then((hijos) => {
        if (!cancelado) setCarga({ status: "ready", hijo: hijos.find((h) => h.id === studentId) });
      })
      .catch((error) => {
        if (cancelado) return;
        setCarga({
          status: "error",
          message: error instanceof ApiError ? error.message : "No se pudo conectar. Probá de nuevo en un rato.",
        });
      });
    return () => {
      cancelado = true;
    };
  }, [institutionId, studentId]);

  if (carga.status === "loading") return <p>Cargando carnet...</p>;

  if (carga.status === "error") {
    return (
      <p role="alert" className="text-rojo">
        {carga.message}
      </p>
    );
  }

  const { hijo } = carga;
  if (!hijo) return <p>No encontramos a este alumno entre tus hijos.</p>;

  return (
    <CarnetQr
      studentId={hijo.id}
      nombre={`${hijo.lastName ?? ""}, ${hijo.firstName ?? ""}`}
      curso={hijo.course ? `${hijo.course.year}° Año ${hijo.course.division}` : "—"}
      escuela={session?.status === "ready" ? session.activeMembership?.institutionName : undefined}
    />
  );
}
