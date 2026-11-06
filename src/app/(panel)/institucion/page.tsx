"use client";

import Link from "next/link";
import { Encabezado, TARJETA } from "../../../features/institution/admin-ui";
import { AdminDirectorOnly } from "../../../features/institution/admin-director-only";
import { InstitucionDatos } from "../../../features/institution/institucion-datos";

export default function InstitucionPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-10">
      <Encabezado
        titulo="Institución"
        subtitulo="Datos generales de la institución."
        fondo="bg-blue/10 text-blue"
        icono={<path d="M3 21h18M5 21V10m14 11V10M3 10l9-6 9 6M9 21v-6h6v6" />}
      />

      <AdminDirectorOnly>
        {(institutionId) => (
          <>
            <nav className="flex flex-wrap gap-3">
              <Link href="/institucion/cursos" className={`px-4 py-3 font-medium ${TARJETA}`}>
                Cursos →
              </Link>
              <Link href="/institucion/materias" className={`px-4 py-3 font-medium ${TARJETA}`}>
                Materias →
              </Link>
            </nav>
            <InstitucionDatos institutionId={institutionId} />
          </>
        )}
      </AdminDirectorOnly>
    </main>
  );
}
