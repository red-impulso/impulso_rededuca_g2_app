"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getNavItems } from "../../config/navigation";
import { useSession } from "../../features/session/use-session";
import { BotonSalir } from "../auth/boton-salir";

export function PanelNav() {
  const session = useSession();
  const pathname = usePathname();

  const role = session.status === "ready" ? session.activeMembership?.role : undefined;
  const items = role ? getNavItems(role) : [];

  return (
    <header className="border-b">
      <nav className="mx-auto flex max-w-3xl flex-wrap items-center gap-2 px-4 py-3">
        <span className="mr-2 font-semibold">RedEduca</span>
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
        <div className="ml-auto">
          <BotonSalir />
        </div>
      </nav>
    </header>
  );
}
