import Image from "next/image";
import Link from "next/link";
import { LogoAnimado } from "../components/brand/logo-animado";

// Portada pública de RedEduca (landing del prototipo de UX/UI).
// Las rutas del panel siguen pidiendo sesión: eso lo maneja src/proxy.ts.
export default function Home() {
  return (
    <main className="flex flex-1 flex-col bg-gradient-to-b from-[#c9edf8] via-[#dcf3fa] to-surface">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <LogoAnimado size={44} conTexto />
        <Link
          href="/ingresar"
          className="rounded-lg bg-blue px-5 py-2 text-sm font-semibold text-white transition hover:brightness-110"
        >
          Postular
        </Link>
      </header>

      <section className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-10 px-6 py-10 md:grid-cols-2">
        <div className="flex flex-col items-start gap-5">
          <p className="rounded-full border border-ink/15 bg-white/70 px-4 py-1 text-xs font-semibold text-ink">
            Conectamos educación y familias
          </p>
          <h1 className="text-4xl font-extrabold leading-tight text-ink md:text-5xl">
            Una plataforma para una comunidad más unida
          </h1>
          <p className="max-w-md text-base text-ink/75">
            RedEduca simplifica la comunicación, la organización y el seguimiento
            educativo entre instituciones, docentes, estudiantes y familias.
          </p>
          <Link
            href="/ingresar"
            className="rounded-lg bg-blue px-6 py-3 font-semibold text-white transition hover:brightness-110"
          >
            Postular a Piloto →
          </Link>
        </div>

        <div className="flex justify-center md:justify-end">
          <Image
            src="/familia.png"
            alt="Familia reunida frente a una notebook"
            width={470}
            height={480}
            priority
            className="h-auto w-full max-w-md rounded-3xl"
          />
        </div>
      </section>
    </main>
  );
}
