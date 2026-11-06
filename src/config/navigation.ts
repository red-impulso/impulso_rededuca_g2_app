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
];

export function getNavItems(role: Role): NavItem[] {
  return NAV_ITEMS.filter((item) => item.roles.includes(role));
}
