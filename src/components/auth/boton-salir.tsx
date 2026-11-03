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
    <button onClick={salir} className="rounded border px-4 py-2">
      Salir
    </button>
  );
}
