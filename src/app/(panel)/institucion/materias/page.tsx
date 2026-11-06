"use client";

import Link from "next/link";
import { AdminDirectorOnly } from "../../../../features/institution/admin-director-only";
import { MateriasAdmin } from "../../../../features/institution/materias-admin";

export default function MateriasPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-10">
      <div>
        <Link href="/institucion" className="text-sm text-gray-600 hover:underline">
          ← Institución
        </Link>
        <h1 className="text-2xl font-semibold">Materias</h1>
        <p className="text-gray-600">Las materias de cada curso y su docente.</p>
      </div>

      <AdminDirectorOnly>{(institutionId) => <MateriasAdmin institutionId={institutionId} />}</AdminDirectorOnly>
    </main>
  );
}
