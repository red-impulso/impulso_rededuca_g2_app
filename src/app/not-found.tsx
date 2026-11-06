import Link from "next/link";
import { LogoAnimado } from "../components/brand/logo-animado";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <LogoAnimado size={64} />
      <h1 className="text-2xl font-semibold">Página no encontrada</h1>
      <p className="text-gray-600">
        Esta sección no existe o todavía está en construcción.
      </p>
      <Link href="/inicio" className="rounded bg-accent px-4 py-2 font-medium text-white">
        Volver al inicio
      </Link>
    </main>
  );
}
