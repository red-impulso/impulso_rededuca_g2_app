"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { crearClienteSupabase } from "../../lib/supabase/client";
import { LogoAnimado } from "../../components/brand/logo-animado";
import { Boton } from "../../components/ui/boton";
import { Alerta } from "../../components/ui/alerta";

// Pantalla de ingreso (prototipo "ingreso, inicio y menú"): tarjeta
// centrada con logo, foco azul en los campos, enlace celeste para
// recuperar la contraseña y mensaje de error claro.
const CLASE_CAMPO =
  "w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm transition placeholder:text-gray-400 focus:border-primario focus:outline-none focus:ring-2 focus:ring-primario/25";

export default function IngresarPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function ingresar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setCargando(true);

    try {
      const supabase = crearClienteSupabase();
      const { error } = await supabase.auth.signInWithPassword({ email, password });

      if (error) {
        setError("Email o contraseña incorrectos. Revisá los datos y probá de nuevo.");
        return;
      }

      router.replace("/inicio");
      router.refresh();
    } catch {
      setError("No se pudo conectar. Probá de nuevo en un rato.");
    } finally {
      setCargando(false);
    }
  }

  return (
    <main className="relative flex flex-1 items-center justify-center overflow-hidden px-4 py-16">
      {/* Círculos decorativos de la identidad */}
      <span aria-hidden className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-acento-suave/40" />
      <span aria-hidden className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-naranja/30" />

      <form
        onSubmit={ingresar}
        className="relative flex w-full max-w-sm flex-col gap-4 rounded-2xl border border-white/80 bg-white/90 p-8 shadow-[0_8px_30px_rgba(20,24,90,0.12)] backdrop-blur"
      >
        <div className="flex flex-col items-center gap-2 text-center">
          <LogoAnimado size={72} />
          <h1 className="text-2xl font-bold text-ink">Ingresar a RedEduca</h1>
          <p className="text-sm text-gray-600">Plataforma integral para tu comunidad educativa</p>
        </div>

        <label className="flex flex-col gap-1 text-sm font-medium">
          Email
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            placeholder="tu@correo.edu.ar"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={CLASE_CAMPO}
          />
        </label>

        <label className="flex flex-col gap-1 text-sm font-medium">
          Contraseña
          <input
            type="password"
            name="password"
            required
            autoComplete="current-password"
            placeholder="Tu contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={CLASE_CAMPO}
          />
        </label>

        {error && <Alerta tipo="error">{error}</Alerta>}

        <Boton type="submit" disabled={cargando} className="mt-1 w-full">
          {cargando ? "Ingresando..." : "Ingresar"}
        </Boton>

        <a href="mailto:soporte@reeduca.example?subject=Recuperar%20contraseña" className="text-center text-sm font-medium text-celeste-fuerte hover:underline">
          ¿Olvidaste tu contraseña?
        </a>
      </form>
    </main>
  );
}
