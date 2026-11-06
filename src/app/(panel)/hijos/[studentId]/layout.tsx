import { Suspense, type ReactNode } from "react";
import { StudentTabsNav } from "../../../../features/guardians/student-tabs-nav";

// El id del hijo se conoce recién al abrir la página, por eso va en Suspense
// (lo pide Cache Components, activado en next.config.ts).
export default function FichaHijoLayout({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-10">
      <Suspense fallback={<p>Cargando...</p>}>
        <StudentTabsNav />
        {children}
      </Suspense>
    </main>
  );
}
