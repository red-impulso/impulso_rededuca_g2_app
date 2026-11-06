"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ApiError, apiFetch } from "../../lib/api";

// Lo que devuelve GET /me/students (ver README de la API).
export interface Child {
  id: string;
  firstName: string | null;
  lastName: string | null;
  course: { id: string; year: number; division: string };
}

type Carga =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; children: Child[] };

export function ChildrenList({ institutionId }: { institutionId: string }) {
  const [carga, setCarga] = useState<Carga>({ status: "loading" });

  useEffect(() => {
    let cancelado = false;

    apiFetch<Child[]>("/me/students", { institutionId })
      .then((children) => {
        if (!cancelado) setCarga({ status: "ready", children });
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

  if (carga.status === "loading") return <p>Cargando...</p>;

  if (carga.status === "error") {
    return (
      <p role="alert" className="text-red-600">
        {carga.message}
      </p>
    );
  }

  if (carga.children.length === 0) return <p>Todavía no tenés hijos vinculados.</p>;

  return (
    <ul className="flex flex-col gap-3">
      {carga.children.map((child) => (
        <li key={child.id}>
          <Link
            href={`/hijos/${child.id}/notas`}
            className="flex items-center justify-between rounded border bg-white px-4 py-3 hover:bg-gray-50"
          >
            <span className="font-medium">
              {child.firstName} {child.lastName}
            </span>
            <span className="text-sm text-gray-600">
              {child.course.year}°{child.course.division}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
