import type { ReactNode } from "react";

// Tabla de la identidad: encabezado azul de la marca, filas alternadas
// muy suaves y scroll horizontal en celular. El contenido se escribe con
// thead/tbody/tr/th/td comunes y los estilos se heredan solos.
export function Tabla({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-[0_8px_30px_rgba(20,24,90,0.06)]">
      <table
        className={`w-full min-w-160 border-collapse text-left text-sm [&_tbody_tr:nth-child(even)]:bg-surface/70 [&_td]:px-4 [&_td]:py-2.5 [&_th]:px-4 [&_th]:py-3 [&_th]:font-semibold [&_th]:whitespace-nowrap [&_thead]:bg-primario [&_thead]:text-white ${className}`}
      >
        {children}
      </table>
    </div>
  );
}
