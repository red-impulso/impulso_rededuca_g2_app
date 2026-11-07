"use client";

import { useState } from "react";
import {
  Aviso,
  BOTON_ACCION,
  IconoReintentar,
  PantallaCargando,
  PantallaError,
  PantallaVacia,
} from "../../components/ui/pantalla-estado";
import { ICONO_ESCUELA, SelectorEscuela } from "./institution-switcher";
import { useSession } from "./use-session";

export function EscuelasSelector() {
  const session = useSession();
  const [elegida, setElegida] = useState(false);

  if (session.status === "loading") return <PantallaCargando titulo="Cargando escuelas..." />;

  if (session.status === "error") {
    return (
      <PantallaError
        titulo="No se pudieron cargar las escuelas"
        texto="Revisá la conexión a Internet e intentá de nuevo."
        tono="naranja"
        claseBoton={`${BOTON_ACCION} bg-blue`}
        onReintentar={session.reintentar}
      />
    );
  }

  if (!session.activeMembership) {
    return (
      <PantallaVacia
        titulo="No hay escuelas disponibles"
        texto="Contactate con el administrador del sistema."
        icono={ICONO_ESCUELA}
      >
        <button type="button" onClick={session.reintentar} className={`${BOTON_ACCION} bg-accent`}>
          <IconoReintentar />
          Reintentar
        </button>
      </PantallaVacia>
    );
  }

  return (
    <div className="flex max-w-xl flex-col gap-4">
      {elegida && <Aviso texto="Escuela seleccionada correctamente" onCerrar={() => setElegida(false)} />}
      <SelectorEscuela
        grande
        instituciones={session.instituciones}
        valor={session.activeMembership.institutionId}
        onCambiar={(id) => {
          session.cambiarInstitucion(id);
          setElegida(true);
        }}
      />
    </div>
  );
}
