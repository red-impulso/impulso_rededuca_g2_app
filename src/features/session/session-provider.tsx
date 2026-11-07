"use client";

import { createContext, useEffect, useState, type ReactNode } from "react";
import { apiFetch } from "../../lib/api";
import type { Role } from "../../config/navigation";

// Lo que devuelve GET /me (ver README de la API).
export interface Membership {
  id: string;
  institutionId: string;
  institutionName: string;
  role: Role;
}

export interface MeResponse {
  profile: { id: string; fullName: string | null; phone: string | null };
  memberships: Membership[];
}

export interface Institucion {
  id: string;
  name: string;
}

export type SessionState =
  | { status: "loading" }
  | { status: "error"; reintentar: () => void }
  | {
      status: "ready";
      profile: MeResponse["profile"];
      memberships: Membership[];
      instituciones: Institucion[];
      // null si el usuario no tiene ninguna institución.
      activeMembership: Membership | null;
      cambiarInstitucion: (institutionId: string) => void;
      reintentar: () => void;
    };

type Carga = { status: "loading" } | { status: "error" } | { status: "ready"; me: MeResponse };

const CLAVE_INSTITUCION = "rededuca.institucion";

// El mismo orden que usa la API para elegir el rol en una institución.
const RANGO: Record<Role, number> = { admin: 5, director: 4, teacher: 3, guardian: 2, student: 1 };

// Si el navegador bloquea el guardado, la elección dura hasta recargar.
function leerInstitucion(): string | null {
  try {
    return window.localStorage.getItem(CLAVE_INSTITUCION);
  } catch {
    return null;
  }
}

function guardarInstitucion(institutionId: string) {
  try {
    window.localStorage.setItem(CLAVE_INSTITUCION, institutionId);
  } catch {
    // Sin guardado la app funciona igual.
  }
}

function institucionesDe(memberships: Membership[]): Institucion[] {
  const porId = new Map(memberships.map((m) => [m.institutionId, m.institutionName]));
  return [...porId].map(([id, name]) => ({ id, name }));
}

function membresiaActiva(memberships: Membership[], institutionId: string | null): Membership | null {
  const elegida = memberships.some((m) => m.institutionId === institutionId)
    ? institutionId
    : memberships[0]?.institutionId;

  return memberships
    .filter((m) => m.institutionId === elegida)
    .reduce<Membership | null>((mejor, m) => (mejor && RANGO[mejor.role] >= RANGO[m.role] ? mejor : m), null);
}

export const SessionContext = createContext<SessionState | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [carga, setCarga] = useState<Carga>({ status: "loading" });
  const [intento, setIntento] = useState(0);
  const [institutionId, setInstitutionId] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;

    apiFetch<MeResponse>("/me")
      .then((me) => {
        if (cancelado) return;
        setInstitutionId(leerInstitucion());
        setCarga({ status: "ready", me });
      })
      .catch(() => {
        if (!cancelado) setCarga({ status: "error" });
      });

    return () => {
      cancelado = true;
    };
  }, [intento]);

  function reintentar() {
    setCarga({ status: "loading" });
    setIntento((actual) => actual + 1);
  }

  function cambiarInstitucion(id: string) {
    guardarInstitucion(id);
    setInstitutionId(id);
  }

  let state: SessionState;
  if (carga.status === "ready") {
    state = {
      status: "ready",
      profile: carga.me.profile,
      memberships: carga.me.memberships,
      instituciones: institucionesDe(carga.me.memberships),
      activeMembership: membresiaActiva(carga.me.memberships, institutionId),
      cambiarInstitucion,
      reintentar,
    };
  } else if (carga.status === "error") {
    state = { status: "error", reintentar };
  } else {
    state = carga;
  }

  return <SessionContext.Provider value={state}>{children}</SessionContext.Provider>;
}
