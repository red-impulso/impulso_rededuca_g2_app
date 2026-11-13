import Link from "next/link";

// Pie del grupo: va en el layout raíz, fuera de <main>, así queda con rol
// contentinfo en todas las páginas (landing, /ingresar, 404, panel).
export function SiteFooter() {
  return (
    <footer className="bg-lnd-primary text-lnd-bg">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-3 px-6 py-8 text-center text-sm">
        <span className="font-semibold">RedEduca</span>
        <nav
          aria-label="Enlaces del pie"
          className="flex flex-wrap justify-center gap-x-6 gap-y-1"
        >
          <Link href="/#por-que" className="hover:underline">
            ¿Por qué nace?
          </Link>
          <Link href="/#postular" className="hover:underline">
            Postulación piloto
          </Link>
          <Link href="/ingresar" className="hover:underline">
            Ingresar
          </Link>
        </nav>
        <p className="text-lnd-bg/70">
          Creado por alumnos de IES Nº 6 de Perico, Jujuy, Argentina
        </p>
      </div>
    </footer>
  );
}
