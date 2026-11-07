"use client";

import { Encabezado } from "../../../features/institution/admin-ui";
import { AdminDirectorOnly } from "../../../features/institution/admin-director-only";
import { DocentesAdmin } from "../../../features/teachers/docentes-admin";

export default function DocentesPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-6">
      <Encabezado
        titulo="Docentes"
        subtitulo="Docentes de la institución y las materias que dictan."
        fondo="bg-blue/10 text-blue"
        icono={
          <>
            <circle cx="12" cy="8" r="4" />
            <path d="M4 21c0-4.5 3.5-7 8-7s8 2.5 8 7" />
          </>
        }
      />

      <AdminDirectorOnly>{(institutionId) => <DocentesAdmin institutionId={institutionId} />}</AdminDirectorOnly>
    </main>
  );
}
