"use client";

import Link from "next/link";
import { AdminDirectorOnly } from "../../../../features/institution/admin-director-only";
import { CursosAdmin } from "../../../../features/institution/cursos-admin";

export default function CursosPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-10">
      <div>
        <Link href="/institucion" className="text-sm text-gray-600 hover:underline">
          ← Institución
        </Link>
        <h1 className="text-2xl font-semibold">Cursos</h1>
        <p className="text-gray-600">Los cursos de la escuela por ciclo lectivo.</p>
      </div>

      <AdminDirectorOnly>{(institutionId) => <CursosAdmin institutionId={institutionId} />}</AdminDirectorOnly>
    </main>
  );
}
