"use client";

import { AlumnosLista } from "../../../features/students/alumnos-lista";
import { AdminDirectorOnly } from "../../../features/institution/admin-director-only";

export default function AlumnosPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 px-4 py-6">
      <AdminDirectorOnly>{(institutionId) => <AlumnosLista institutionId={institutionId} />}</AdminDirectorOnly>
    </main>
  );
}
