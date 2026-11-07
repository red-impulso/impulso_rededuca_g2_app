"use client";

import { EscuelasSelector } from "../../../features/session/escuelas-selector";

export default function EscuelasPage() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-6 pb-24 md:px-8 md:pb-8">
      <div>
        <h1 className="text-2xl font-semibold text-ink md:text-3xl">Seleccioná una escuela</h1>
        <p className="mt-1 text-blue/80">
          Elegí la escuela con la que querés trabajar. Podés cambiarla en cualquier momento.
        </p>
      </div>

      <EscuelasSelector />
    </main>
  );
}
