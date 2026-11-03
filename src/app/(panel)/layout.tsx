import { SessionProvider } from "../../features/session/session-provider";
import { PanelNav } from "../../components/layout/panel-nav";

// Páginas internas (con sesión): menú por rol arriba y la página abajo.
export default function PanelLayout({ children }: LayoutProps<"/">) {
  return (
    <SessionProvider>
      <PanelNav />
      {children}
    </SessionProvider>
  );
}
