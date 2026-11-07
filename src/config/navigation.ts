// Roles tal como los devuelve la API en GET /me (memberships[].role).
export type Role = 'admin' | 'director' | 'teacher' | 'guardian' | 'student';

export interface NavItem {
  label: string;
  href: string;
  roles: Role[];
}

export const ROLE_LABELS: Record<Role, string> = {
  admin: 'Administrador',
  director: 'Directivo',
  teacher: 'Docente',
  guardian: 'Tutor',
  student: 'Estudiante',
};

// Menú del panel. Cada ítem dice qué roles lo ven.
// Las páginas de cada ítem (salvo Inicio) llegan con sus módulos.
export const NAV_ITEMS: NavItem[] = [
  {
    label: 'Inicio',
    href: '/inicio',
    roles: ['admin', 'director', 'teacher', 'guardian', 'student'],
  },
  {
    label: 'Comunicados',
    href: '/comunicados',
    roles: ['admin', 'director', 'teacher', 'guardian', 'student'],
  },
  { label: 'Calificaciones', href: '/calificaciones', roles: ['teacher'] },
  { label: 'Asistencia', href: '/asistencia', roles: ['teacher', 'admin', 'director'] },
  { label: 'Mis hijos', href: '/hijos', roles: ['guardian'] },
  { label: 'Dirección', href: '/tablero', roles: ['admin', 'director'] },
  { label: 'Institución', href: '/institucion', roles: ['admin', 'director'] },
  { label: 'Cursos', href: '/institucion/cursos', roles: ['admin', 'director'] },
  { label: 'Materias', href: '/institucion/materias', roles: ['admin', 'director'] },
  { label: 'Alumnos', href: '/alumnos', roles: ['admin', 'director'] },
  { label: 'Docentes', href: '/docentes', roles: ['admin', 'director'] },
  { label: 'Usuarios', href: '/usuarios', roles: ['admin'] },
  { label: 'Escuelas', href: '/escuelas', roles: ['admin'] },
];

const MAX_ITEMS_ABAJO = 5;
const ROLES_DIRECCION: Role[] = ['admin', 'director'];

// Barra inferior del celular para dirección, tal como la dibujó UX/UI.
// El resto de las secciones queda en el menú ☰.
const HREFS_ABAJO_DIRECCION = ['/inicio', '/institucion', '/institucion/cursos', '/institucion/materias'];

// Quien trabaja en varias escuelas ve Escuelas aunque no sea admin.
export function getNavItems(role: Role, variasEscuelas = false): NavItem[] {
  return NAV_ITEMS.filter((item) => item.roles.includes(role) || (variasEscuelas && item.href === '/escuelas'));
}

// El último lugar de dirección es la sección abierta, si es una de las que no
// entran en la barra; si no, Alumnos.
export function getBottomNavItems(role: Role, pathname = ''): NavItem[] {
  const items = getNavItems(role);
  if (!ROLES_DIRECCION.includes(role)) return items.slice(0, MAX_ITEMS_ABAJO);

  const fijos = items.filter((item) => HREFS_ABAJO_DIRECCION.includes(item.href));
  const resto = items.filter((item) => ['/alumnos', '/docentes', '/usuarios', '/escuelas'].includes(item.href));
  const ultimo = resto.find((item) => pathname.startsWith(item.href)) ?? resto[0];
  return [...fijos, ultimo];
}
