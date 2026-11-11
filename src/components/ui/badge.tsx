import type { ReactNode } from "react";

// Insignia de estado. Los tonos "fuerte" son las variantes oscuras de la
// paleta para que el texto siempre pase contraste AA sobre el fondo tenue.
const TONOS = {
  verde: "border-verde/30 bg-verde/15 text-verde-fuerte",
  naranja: "border-naranja/40 bg-naranja/20 text-blue",
  rojo: "border-rojo/30 bg-rojo/10 text-rojo",
  azul: "border-primario/30 bg-primario/10 text-primario",
  morado: "border-secundario/30 bg-secundario/10 text-secundario",
  celeste: "border-celeste/50 bg-celeste/20 text-celeste-fuerte",
  neutro: "border-gray-300 bg-gray-100 text-gray-700",
} as const;

export function Badge({
  tono = "neutro",
  children,
  className = "",
}: {
  tono?: keyof typeof TONOS;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${TONOS[tono]} ${className}`}
    >
      {children}
    </span>
  );
}
