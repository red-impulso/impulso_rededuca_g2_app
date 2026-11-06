"use client";

import { useEffect, useState } from "react";
import { ApiError, apiFetch } from "../../lib/api";
import { ChildCard, type Child } from "./child-card";

type Carga =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; children: Child[] };

const PANEL =
  "flex flex-col items-center gap-3 rounded-2xl border border-white/80 bg-white/70 px-6 py-10 text-center shadow-[0_8px_30px_rgba(20,33,61,0.08)] backdrop-blur";

function IlustracionFamilia() {
  return (
    <svg viewBox="0 0 120 80" aria-hidden className="h-24 w-36">
      <circle cx="38" cy="24" r="13" className="fill-ink" />
      <path d="M16 72c0-16 10-28 22-28s22 12 22 28z" className="fill-blue" />
      <circle cx="84" cy="24" r="13" className="fill-ink" />
      <path d="M62 72c0-16 10-28 22-28s22 12 22 28z" className="fill-accent" />
      <circle cx="60" cy="44" r="10" className="fill-white stroke-ink" strokeWidth="3" />
      <path d="M44 74c0-11 7-18 16-18s16 7 16 18z" className="fill-green" />
    </svg>
  );
}

function IconoAlerta() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden className="h-14 w-14 fill-none stroke-accent" strokeWidth="3">
      <path d="M24 6 45 42H3z" strokeLinejoin="round" />
      <path d="M24 19v11M24 35v1" strokeLinecap="round" />
    </svg>
  );
}

export function ChildrenList({ institutionId }: { institutionId: string }) {
  const [carga, setCarga] = useState<Carga>({ status: "loading" });
  const [intento, setIntento] = useState(0);

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
  }, [institutionId, intento]);

  function reintentar() {
    setCarga({ status: "loading" });
    setIntento((actual) => actual + 1);
  }

  if (carga.status === "loading") return <p>Cargando...</p>;

  if (carga.status === "error") {
    return (
      <div role="alert" className={PANEL}>
        <IconoAlerta />
        <h2 className="text-xl font-semibold">Error al cargar los hijos</h2>
        <p className="text-gray-600">{carga.message}</p>
        <button
          type="button"
          onClick={reintentar}
          className="mt-1 rounded-full bg-gradient-to-r from-ink to-blue px-6 py-2 font-medium text-white"
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (carga.children.length === 0) {
    return (
      <div className={PANEL}>
        <IlustracionFamilia />
        <h2 className="text-xl font-semibold">Aún no hay hijos vinculados</h2>
        <p className="text-gray-600">
          Los vincula la escuela. Si falta alguno, consultá en la institución.
        </p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-4">
      {carga.children.map((child) => (
        <li key={child.id}>
          <ChildCard child={child} institutionId={institutionId} />
        </li>
      ))}
    </ul>
  );
}
