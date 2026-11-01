import { BotonSalir } from "../../components/auth/boton-salir";

// Página mínima: las próximas tareas le agregan contenido.
export default function InicioPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-16">
      <h1 className="text-2xl font-semibold">Inicio</h1>
      <BotonSalir />
    </main>
  );
}
