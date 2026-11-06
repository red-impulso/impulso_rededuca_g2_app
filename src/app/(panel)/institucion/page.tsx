"use client";

import Link from "next/link";
import { AdminDirectorOnly } from "../../../features/institution/admin-director-only";
import { InstitucionDatos } from "../../../features/institution/institucion-datos";
import { useSession } from "../../../features/session/use-session";

export default function InstitucionPage() {
  const session = useSession();
  const nombreInstitucion = session.status === "ready" ? session.activeMembership?.institutionName : undefined;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-10">
      <div>
        <h1 className="text-2xl font-semibold">Institución</h1>
        <p className="text-gray-600">Datos de la escuela y su oferta.</p>
      </div>

      <AdminDirectorOnly>
        {(institutionId) => (
          <>
            <nav className="flex flex-wrap gap-3">
              <Link href="/institucion/cursos" className="rounded border bg-white px-4 py-3 font-medium">
                Cursos →
              </Link>
              <Link href="/institucion/materias" className="rounded border bg-white px-4 py-3 font-medium">
                Materias →
              </Link>
            </nav>
            <InstitucionDatos institutionId={institutionId} nombreActual={nombreInstitucion ?? ""} />
          </>
        )}
      </AdminDirectorOnly>
    </main>
  );
}
