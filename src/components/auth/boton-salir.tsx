"use client";

import { useRouter } from "next/navigation";
import { crearClienteSupabase } from "../../lib/supabase/client";

export function BotonSalir() {
  const router = useRouter();

  async function salir() {
    await crearClienteSupabase().auth.signOut();
    router.replace("/ingresar");
    router.refresh();
  }

  return (
    <button
      onClick={salir}
      className="rounded-full border border-ink/20 px-4 py-2 font-medium text-ink transition hover:bg-ink/5"
    >
      Salir
    </button>
  );
}
