import { Suspense } from "react";
import { SessionProvider } from "../../features/session/session-provider";
import { PanelNav } from "../../components/layout/panel-nav";

// Páginas internas (con sesión): menú por rol arriba y la página abajo.
// PanelNav lee la dirección actual: en rutas con parámetros (/hijos/{id}) eso
// se conoce al abrir la página, por eso va en Suspense (Cache Components).
export default function PanelLayout({ children }: LayoutProps<"/">) {
  return (
    <SessionProvider>
      <Suspense fallback={<div className="h-16 border-b" />}>
        <PanelNav />
      </Suspense>
      {children}
    </SessionProvider>
  );
}
