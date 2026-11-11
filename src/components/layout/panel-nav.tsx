"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";
import { getBottomNavItems, getNavItems, ROLE_LABELS, type NavItem } from "../../config/navigation";
import { NotificationBell } from "../../features/notifications/notification-bell";
import { ICONO_ESCUELA, InstitutionSwitcher } from "../../features/session/institution-switcher";
import { useSession } from "../../features/session/use-session";
import { BotonSalir } from "../auth/boton-salir";
import { LogoAnimado } from "../brand/logo-animado";
import { Icono } from "../ui/estado";

const ICONOS: Record<string, ReactNode> = {
  "/inicio": <path d="m3 11 9-8 9 8M5 10v10h5v-6h4v6h5V10" />,
  "/comunicados": <path d="M4 10v4h3l9 4V6l-9 4zM8 14.5 9.5 20M19 9.5v5" />,
  "/calificaciones": <path d="M12 6c-2-1.5-5-2-8-2v14c3 0 6 .5 8 2 2-1.5 5-2 8-2V4c-3 0-6 .5-8 2zM12 6v14" />,
  "/asistencia": <path d="M5 4h14v17H5zM9 13l2 2 4-4M9 2v4M15 2v4" />,
  "/hijos": (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20c0-4 3-6.5 6.5-6.5s6.5 2.5 6.5 6.5M16 5a3.5 3.5 0 0 1 0 6.5M18 14c2 .8 3.5 3 3.5 6" />
    </>
  ),
  "/tablero": <path d="M4 20V10M10 20V4M16 20v-7M21 20H3" />,
  "/institucion": <path d="M3 21h18M5 21V10m14 11V10M3 10l9-6 9 6M9 21v-6h6v6" />,
  "/docentes": <path d="m2 9 10-4 10 4-10 4zM6 11v5c3 2 9 2 12 0v-5" />,
  "/institucion/cursos": <path d="M5 4h14v16H5zM9 8h6" />,
  "/institucion/materias": <path d="M12 6c-2-1.5-5-2-8-2v14c3 0 6 .5 8 2 2-1.5 5-2 8-2V4c-3 0-6 .5-8 2zM12 6v14" />,
  "/alumnos": (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4.5 3.5-7 8-7s8 2.5 8 7" />
    </>
  ),
  "/usuarios": (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20c0-4 3-6.5 6.5-6.5s6.5 2.5 6.5 6.5M16 5a3.5 3.5 0 0 1 0 6.5M18 14c2 .8 3.5 3 3.5 6" />
    </>
  ),
  "/interesados": <path d="M4 5h16v14H4zM4 7l8 6 8-6" />,
  "/escuelas": ICONO_ESCUELA,
};

function iniciales(nombre: string | null): string {
  const palabras = (nombre ?? "").split(" ").filter(Boolean);
  return palabras
    .slice(0, 2)
    .map((palabra) => palabra[0].toUpperCase())
    .join("");
}

function esActual(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

// La sección más precisa: en /institucion/cursos gana Cursos, no Institución.
function hrefActual(pathname: string, items: NavItem[]): string | undefined {
  return items
    .map((item) => item.href)
    .filter((href) => esActual(pathname, href))
    .sort((a, b) => b.length - a.length)[0];
}

function Enlace({
  item,
  actual,
  className,
  onClick,
}: {
  item: NavItem;
  actual: boolean;
  className: string;
  onClick?: () => void;
}) {
  return (
    <Link href={item.href} aria-current={actual ? "page" : undefined} onClick={onClick} className={className}>
      <Icono className="h-5 w-5 shrink-0">{ICONOS[item.href]}</Icono>
      {item.label}
    </Link>
  );
}

function Buscador({ items }: { items: NavItem[] }) {
  const router = useRouter();
  const [texto, setTexto] = useState("");

  const buscado = texto.trim().toLowerCase();
  const resultados = buscado ? items.filter((item) => item.label.toLowerCase().includes(buscado)) : [];

  function ir(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (resultados[0]) {
      router.push(resultados[0].href);
      setTexto("");
    }
  }

  return (
    <form onSubmit={ir} className="relative hidden max-w-md flex-1 md:block">
      <label className="flex items-center gap-2 rounded-full border border-blue/20 bg-blue/5 px-4 py-2">
        <Icono className="h-5 w-5 shrink-0 text-blue">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-4-4" />
        </Icono>
        <input
          type="search"
          aria-label="Buscar en la plataforma"
          placeholder="Buscar en la plataforma..."
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          className="w-full bg-transparent text-sm outline-none"
        />
      </label>

      {buscado && (
        <div className="absolute inset-x-0 top-full z-30 mt-1 rounded-xl border border-gray-200 bg-white py-1 text-sm shadow-lg">
          {resultados.length === 0 ? (
            <p className="px-4 py-2 text-gray-600">No se encontró ninguna sección.</p>
          ) : (
            <ul aria-label="Resultados de la búsqueda">
              {resultados.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} onClick={() => setTexto("")} className="block px-4 py-2 hover:bg-gray-100">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </form>
  );
}

function MenuUsuario({ nombre, rol }: { nombre: string | null; rol: string }) {
  const [abierto, setAbierto] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        aria-label={`Menú de ${nombre ?? "usuario"}`}
        aria-expanded={abierto}
        onClick={() => setAbierto((actual) => !actual)}
        className="flex items-center gap-2"
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-ink to-blue text-sm font-semibold text-white">
          {iniciales(nombre)}
        </span>
        <span className="hidden text-left leading-tight md:block">
          <span className="block max-w-40 truncate text-sm font-semibold text-ink">{nombre}</span>
          <span className="block text-xs text-gray-600">{rol}</span>
        </span>
        <span aria-hidden className="hidden text-xs md:block">
          ▾
        </span>
      </button>
      {abierto && (
        <div className="absolute right-0 z-30 mt-2 flex w-48 flex-col gap-2 rounded-xl border border-gray-200 bg-white p-3 shadow-lg">
          <p className="truncate text-sm font-medium">{nombre}</p>
          <BotonSalir />
        </div>
      )}
    </div>
  );
}

export function PanelNav({ children }: { children: ReactNode }) {
  const session = useSession();
  const pathname = usePathname();
  const [menuAbierto, setMenuAbierto] = useState(false);

  const membership = session.status === "ready" ? session.activeMembership : null;
  const nombre = session.status === "ready" ? session.profile.fullName : null;
  const variasEscuelas = session.status === "ready" && session.instituciones.length > 1;
  const items = membership ? getNavItems(membership.role, variasEscuelas) : [];
  const itemsAbajo = membership ? getBottomNavItems(membership.role, pathname) : [];
  const actual = hrefActual(pathname, items);
  const actualAbajo = hrefActual(pathname, itemsAbajo);

  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/90 backdrop-blur">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2 md:flex-nowrap">
          <LogoAnimado size={40} conTexto />
          <Buscador items={items} />
          <InstitutionSwitcher />
          <div className="ml-auto flex items-center gap-3">
            {membership && <NotificationBell institutionId={membership.institutionId} />}
            {membership && <MenuUsuario nombre={nombre} rol={ROLE_LABELS[membership.role]} />}
            <button
              type="button"
              aria-label={menuAbierto ? "Cerrar menú" : "Abrir menú"}
              aria-expanded={menuAbierto}
              onClick={() => setMenuAbierto((actual) => !actual)}
              className="text-blue md:hidden"
            >
              <Icono className="h-7 w-7">
                <path d="M4 7h16M4 12h16M4 17h16" />
              </Icono>
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        <aside
          className={`relative w-56 shrink-0 overflow-hidden bg-ink text-white max-md:fixed max-md:inset-y-0 max-md:left-0 max-md:z-30 md:block ${
            menuAbierto ? "block" : "hidden"
          }`}
        >
          <nav aria-label="Menú principal" className="relative z-10 flex flex-col gap-1 p-3">
            {items.map((item) => (
              <Enlace
                key={item.href}
                item={item}
                actual={item.href === actual}
                onClick={() => setMenuAbierto(false)}
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm hover:bg-white/10 aria-[current=page]:bg-accent aria-[current=page]:font-semibold aria-[current=page]:text-ink"
              />
            ))}
          </nav>
          <span aria-hidden className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-accent/60" />
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">{children}</div>
      </div>

      <nav
        aria-label="Menú inferior"
        className="fixed inset-x-2 bottom-2 z-20 flex justify-around overflow-hidden rounded-2xl bg-ink text-white shadow-lg md:hidden"
      >
        {itemsAbajo.map((item) => (
          <Enlace
            key={item.href}
            item={item}
            actual={item.href === actualAbajo}
            className="flex min-w-0 flex-1 flex-col items-center gap-0.5 px-1 py-2 text-[11px] aria-[current=page]:bg-accent aria-[current=page]:font-semibold aria-[current=page]:text-ink"
          />
        ))}
      </nav>
    </div>
  );
}
