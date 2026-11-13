import Image from "next/image";
import Link from "next/link";
import { LogoAnimado } from "../components/brand/logo-animado";
import { Icono } from "../components/ui/estado";
import { FormularioPostulacion } from "../components/landing/formulario-postulacion";

// Portada pública de RedEduca (landing del prototipo de UX/UI).
// Usa su propia paleta (lnd-*): el panel interno lleva la paleta de marca.
// Regla 85/10/5: neutros de fondo, azul marino para estructura, naranja
// solo en los botones de acción.
// Las rutas del panel siguen pidiendo sesión: eso lo maneja src/proxy.ts.

const PROBLEMAS = [
  {
    titulo: "Demoras",
    texto: "Los avisos tardan en llegar y la información se pierde en el camino.",
    icono: (
      <>
        <circle cx="12" cy="13" r="8" />
        <path d="M12 9v4l2.5 2.5M9 2h6" />
      </>
    ),
  },
  {
    titulo: "Dispersión",
    texto: "Cada canal dice algo distinto: grupos, papeles y mensajes sueltos.",
    icono: (
      <>
        <circle cx="6" cy="6" r="2.5" />
        <circle cx="18" cy="6" r="2.5" />
        <circle cx="12" cy="18" r="2.5" />
        <path d="m8 7.5 3 8M16 7.5l-3 8M8.5 6h7" />
      </>
    ),
  },
  {
    titulo: "Desconexión",
    texto: "Familias, docentes e institución no comparten un mismo espacio.",
    icono: (
      <>
        <path d="m5 8 5 5M14 8l5-5M9 19l5-5" />
        <path d="M3 3v5h5M21 3v5h-5M3 21v-5h5M21 21v-5h-5" />
      </>
    ),
  },
] as const;

export default function Home() {
  return (
    <main className="flex flex-1 flex-col bg-lnd-bg text-lnd-text">
      {/* Encabezado: logo a la izquierda, CTA a la derecha */}
      <header className="sticky top-0 z-20 border-b border-lnd-border bg-lnd-bg/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <LogoAnimado size={44} conTexto />
          <div className="flex items-center gap-3">
            {/* Ingresar: botón secundario (borde primary, sin relleno) */}
            <Link
              href="/ingresar"
              className="rounded-xl border border-lnd-primary bg-transparent px-5 py-2 text-sm font-semibold text-lnd-primary transition hover:bg-lnd-primary/5"
            >
              Ingresar
            </Link>
            <a
              href="#postular"
              className="cta-landing rounded-xl px-5 py-2 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(255,144,40,0.35)] transition hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(255,144,40,0.4)]"
            >
              Postular
            </a>
          </div>
        </div>
      </header>

      {/* Hero: 85% neutro, una sola acción destacada en naranja */}
      <section className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-10 px-6 py-14 md:grid-cols-2 md:py-20">
        <div className="flex flex-col items-start gap-5">
          <p className="rounded-full border border-lnd-border bg-white px-4 py-1 text-xs font-semibold text-lnd-secondary">
            Conectamos educación y familias
          </p>
          <h1 className="text-4xl font-extrabold leading-tight text-lnd-primary md:text-5xl">
            Una plataforma para una comunidad más unida
          </h1>
          <p className="max-w-md text-base text-lnd-muted">
            RedEduca simplifica la comunicación, la organización y el seguimiento
            educativo entre instituciones, docentes, estudiantes y familias.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="#postular"
              className="cta-landing rounded-xl px-6 py-3 font-semibold text-white shadow-[0_4px_14px_rgba(255,144,40,0.35)] transition hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(255,144,40,0.4)]"
            >
              Postular a Piloto →
            </Link>
            <a
              href="#por-que"
              className="rounded-xl border border-lnd-primary bg-transparent px-6 py-3 font-semibold text-lnd-primary transition hover:bg-lnd-primary/5"
            >
              Más información
            </a>
          </div>
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

      {/* Sección alternada: los tres problemas que resuelve RedEduca */}
      <section id="por-que" className="bg-lnd-bg-alt">
        <div className="mx-auto w-full max-w-6xl px-6 py-16">
          <h2 className="text-3xl font-bold text-lnd-primary">¿Por qué nace RedEduca?</h2>
          <p className="mt-2 max-w-2xl text-lnd-muted">
            Porque hoy la comunicación escolar está partida en mil canales.
          </p>
          <div className="mt-8 grid gap-5 sm:grid-cols-3">
            {PROBLEMAS.map((problema) => (
              <article
                key={problema.titulo}
                className="flex flex-col items-start gap-3 rounded-2xl bg-lnd-primary p-6 text-white shadow-[0_8px_30px_rgba(10,61,98,0.15)]"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-lnd-secondary">
                  <Icono className="h-6 w-6">{problema.icono}</Icono>
                </span>
                <h3 className="text-xl font-bold">{problema.titulo}</h3>
                <p className="text-sm text-white/85">{problema.texto}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Sección de cierre destacada (verde lima suave): formulario piloto */}
      <section id="postular" className="bg-lnd-bg-soft">
        <div className="mx-auto grid w-full max-w-6xl items-start gap-10 px-6 py-16 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          <div className="flex flex-col gap-3">
            <h2 className="text-3xl font-bold text-lnd-primary">
              Postulá a tu institución para el piloto
            </h2>
            <p className="text-lnd-muted">
              Completá el formulario y nos ponemos en contacto para sumar tu
              escuela al programa piloto de RedEduca.
            </p>
          </div>
          <FormularioPostulacion />
        </div>
      </section>

    </main>
  );
}
