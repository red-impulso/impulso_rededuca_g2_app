"use client";

import Link from "next/link";
import { Encabezado } from "../../../../features/institution/admin-ui";
import { AdminDirectorOnly } from "../../../../features/institution/admin-director-only";
import { CursosAdmin } from "../../../../features/institution/cursos-admin";

export default function CursosPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-10">
      <div>
        <Link href="/institucion" className="mb-2 block text-sm text-gray-600 hover:underline">
          ← Institución
        </Link>
        <Encabezado titulo="Cursos" subtitulo="Listado de cursos de la institución." fondo="bg-accent/15 text-blue" icono={<path d="M12 6c-2-1.5-5-2-8-2v14c3 0 6 .5 8 2 2-1.5 5-2 8-2V4c-3 0-6 .5-8 2zM12 6v14" />} />
      </div>

      <AdminDirectorOnly>{(institutionId) => <CursosAdmin institutionId={institutionId} />}</AdminDirectorOnly>
    </main>
  );
}
