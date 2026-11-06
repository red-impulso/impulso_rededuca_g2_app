"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getNavItems } from "../../config/navigation";
import { NotificationBell } from "../../features/notifications/notification-bell";
import { useSession } from "../../features/session/use-session";
import { BotonSalir } from "../auth/boton-salir";
import { LogoAnimado } from "../brand/logo-animado";

export function PanelNav() {
  const session = useSession();
  const pathname = usePathname();

  const membership = session.status === "ready" ? session.activeMembership : null;
  const items = membership ? getNavItems(membership.role) : [];

  return (
    <header className="border-b">
      <nav className="mx-auto flex max-w-3xl flex-wrap items-center gap-2 px-4 py-3">
        <span className="mr-2">
          <LogoAnimado size={40} conTexto />
        </span>
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={pathname === item.href ? "page" : undefined}
            className="rounded px-3 py-2 text-sm hover:bg-gray-100 aria-[current=page]:bg-gray-200"
          >
            {item.label}
          </Link>
        ))}
        <div className="ml-auto flex items-center gap-2">
          {membership && <NotificationBell institutionId={membership.institutionId} />}
          <BotonSalir />
        </div>
      </nav>
    </header>
  );
}
