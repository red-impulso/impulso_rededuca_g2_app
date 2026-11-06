"use client";

import Link from "next/link";
import { Encabezado } from "../../../../features/institution/admin-ui";
import { AdminDirectorOnly } from "../../../../features/institution/admin-director-only";
import { MateriasAdmin } from "../../../../features/institution/materias-admin";

export default function MateriasPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-10">
      <div>
        <Link href="/institucion" className="mb-2 block text-sm text-gray-600 hover:underline">
          ← Institución
        </Link>
        <Encabezado titulo="Materias" subtitulo="Listado de materias de la institución." fondo="bg-blue/10 text-blue" icono={<path d="M6 3h9l4 4v14H6zM14 3v5h5M9 12h6M9 16h6" />} />
      </div>

      <AdminDirectorOnly>{(institutionId) => <MateriasAdmin institutionId={institutionId} />}</AdminDirectorOnly>
    </main>
  );
}
