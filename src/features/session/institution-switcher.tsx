"use client";

import { useRouter } from "next/navigation";
import { Icono } from "../../components/ui/estado";
import type { Institucion } from "./session-provider";
import { useSession } from "./use-session";

export const ICONO_ESCUELA = (
  <path d="M3 21h18M5 21V11h14v10M3 11l9-5 9 5M12 6V2l3 1.5L12 5M9 21v-4a3 3 0 0 1 6 0v4M8 14h.01M16 14h.01" />
);

export function SelectorEscuela({
  instituciones,
  valor,
  grande,
  onCambiar,
}: {
  instituciones: Institucion[];
  valor: string;
  grande?: boolean;
  onCambiar: (institutionId: string) => void;
}) {
  return (
    <label
      className={`relative flex items-center rounded-xl border border-blue/20 bg-white text-ink ${
        grande ? "gap-4 px-4 py-3 shadow-sm" : "gap-2 px-3 py-1.5 text-sm"
      }`}
    >
      <Icono className={`shrink-0 text-blue ${grande ? "h-8 w-8" : "h-5 w-5"}`}>{ICONO_ESCUELA}</Icono>
      <select
        aria-label="Escuela activa"
        value={valor}
        onChange={(e) => onCambiar(e.target.value)}
        className="w-full min-w-0 appearance-none bg-transparent pr-6 font-medium outline-none"
      >
        {instituciones.map((escuela) => (
          <option key={escuela.id} value={escuela.id}>
            {escuela.name}
          </option>
        ))}
      </select>
      <Icono className="pointer-events-none absolute right-3 h-4 w-4 text-ink">
        <path d="m6 9 6 6 6-6" />
      </Icono>
    </label>
  );
}

// En el header, solo para quien trabaja en más de una escuela.
export function InstitutionSwitcher() {
  const session = useSession();
  const router = useRouter();

  if (session.status !== "ready" || session.instituciones.length < 2 || !session.activeMembership) {
    return null;
  }

  const { cambiarInstitucion, instituciones, activeMembership } = session;

  return (
    <div className="order-last w-full md:order-none md:w-72 md:shrink-0">
      <SelectorEscuela
        instituciones={instituciones}
        valor={activeMembership.institutionId}
        onCambiar={(id) => {
          cambiarInstitucion(id);
          // Lo que está en pantalla es de la otra escuela.
          router.push("/inicio");
        }}
      />
    </div>
  );
}
