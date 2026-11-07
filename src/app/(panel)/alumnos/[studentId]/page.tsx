"use client";

import { useParams } from "next/navigation";
import { Suspense } from "react";
import { AdminDirectorOnly } from "../../../../features/institution/admin-director-only";
import { AlumnoFicha } from "../../../../features/students/alumno-ficha";

function Ficha() {
  const { studentId } = useParams<{ studentId: string }>();

  return (
    <AdminDirectorOnly>
      {(institutionId) => <AlumnoFicha institutionId={institutionId} studentId={studentId} />}
    </AdminDirectorOnly>
  );
}

// El id del alumno se conoce recién al abrir la página, por eso va en Suspense
// (lo pide Cache Components, activado en next.config.ts).
export default function FichaAlumnoPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 px-4 py-6">
      <Suspense fallback={<p>Cargando...</p>}>
        <Ficha />
      </Suspense>
    </main>
  );
}
