"use client";

import { Icono } from "../../../components/ui/estado";
import { AdminDirectorOnly } from "../../../features/institution/admin-director-only";
import { DocentesAdmin } from "../../../features/teachers/docentes-admin";

export default function DocentesPage() {
  return (
    <main className="mx-auto flex w-full max-w-[100rem] flex-1 flex-col gap-4 px-4 py-6 pb-24 md:px-6 md:pb-8">
      <div className="flex items-center gap-3 text-ink">
        <Icono className="h-8 w-8 md:hidden">
          <circle cx="9" cy="8" r="3.5" />
          <path d="M2.5 20c0-4 3-6.5 6.5-6.5s6.5 2.5 6.5 6.5M16 5a3.5 3.5 0 0 1 0 6.5M18 14c2 .8 3.5 3 3.5 6" />
        </Icono>
        <h1 className="text-2xl font-semibold md:text-3xl">Docentes</h1>
      </div>

      <AdminDirectorOnly>{(institutionId) => <DocentesAdmin institutionId={institutionId} />}</AdminDirectorOnly>
    </main>
  );
}
