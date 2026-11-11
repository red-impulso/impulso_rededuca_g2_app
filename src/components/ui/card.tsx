import type { ReactNode } from "react";

// Tarjeta blanca de la identidad: bordes redondeados y sombra suave.
// `relleno` permite quitar el padding cuando el contenido ya lo maneja
// (por ejemplo, una tabla con scroll propio).
export function Card({
  children,
  className = "",
  relleno = true,
}: {
  children: ReactNode;
  className?: string;
  relleno?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border border-white/80 bg-white shadow-[0_8px_30px_rgba(20,24,90,0.08)] ${relleno ? "p-5" : ""} ${className}`}
    >
      {children}
    </div>
  );
}
