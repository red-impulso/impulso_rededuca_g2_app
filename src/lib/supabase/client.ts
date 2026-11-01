import { createBrowserClient } from "@supabase/ssr";

// Conexión a Supabase desde el navegador.
// Guarda la sesión en cookies para que src/proxy.ts la pueda leer.
export function crearClienteSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_ANON_KEY (ver .env.example)"
    );
  }

  return createBrowserClient(url, anonKey);
}
