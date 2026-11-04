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

export type SessionState =
  | { status: "loading" }
  | { status: "error" }
  | {
      status: "ready";
      profile: MeResponse["profile"];
      memberships: Membership[];
      // null si el usuario no tiene ninguna institución.
      activeMembership: Membership | null;
    };

export const SessionContext = createContext<SessionState | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SessionState>({ status: "loading" });

  useEffect(() => {
    let cancelado = false;

    apiFetch<MeResponse>("/me")
      .then((me) => {
        if (cancelado) return;
        setState({
          status: "ready",
          profile: me.profile,
          memberships: me.memberships,
          // Si hay una membresía, esa; si hay varias, la primera
          // (el selector de institución llega en M10-2).
          activeMembership: me.memberships[0] ?? null,
        });
      })
      .catch(() => {
        if (!cancelado) setState({ status: "error" });
      });

    return () => {
      cancelado = true;
    };
  }, []);

  return <SessionContext.Provider value={state}>{children}</SessionContext.Provider>;
}
