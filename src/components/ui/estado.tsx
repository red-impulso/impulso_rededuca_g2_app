import type { ReactNode } from "react";

// Piezas comunes de los estados de pantalla (cargando, vacío, error, listo).

export function Icono({ children, className }: { children: ReactNode; className: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className={`fill-none stroke-current ${className}`}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

export function Estado({
  fondo = "bg-white/80",
  ilustracion,
  titulo,
  texto,
  children,
}: {
  fondo?: string;
  ilustracion: ReactNode;
  titulo: string;
  texto: string;
  children?: ReactNode;
}) {
  return (
    <div
      className={`flex flex-col items-center gap-3 rounded-2xl border border-white/80 px-6 py-10 text-center shadow-[0_8px_30px_rgba(20,33,61,0.08)] backdrop-blur ${fondo}`}
    >
      {ilustracion}
      <h2 className="text-xl font-semibold">{titulo}</h2>
      <p className="max-w-xs text-gray-600">{texto}</p>
      {children}
    </div>
  );
}

export function Cargando() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden className="h-14 w-14 fill-blue motion-safe:animate-spin">
      {Array.from({ length: 12 }, (_, i) => (
        <circle
          key={i}
          cx="24"
          cy="5"
          r="3"
          opacity={0.25 + (i / 12) * 0.75}
          transform={`rotate(${i * 30} 24 24)`}
        />
      ))}
    </svg>
  );
}
