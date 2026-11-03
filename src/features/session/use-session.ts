"use client";

import { useContext } from "react";
import { SessionContext, type SessionState } from "./session-provider";

// Datos del usuario que entró: nombre, membresías y la activa.
export function useSession(): SessionState {
  const session = useContext(SessionContext);
  if (!session) {
    throw new Error("useSession tiene que usarse dentro de <SessionProvider>");
  }
  return session;
}
