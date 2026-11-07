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
  { label: 'Alumnos', href: '/alumnos', roles: ['admin', 'director'] },
  { label: 'Docentes', href: '/docentes', roles: ['admin', 'director'] },
];

const MAX_ITEMS_ABAJO = 5;
const ROLES_DIRECCION: Role[] = ['admin', 'director'];

// Barra inferior del celular para dirección, tal como la dibujó UX/UI.
// El resto de las secciones queda en el menú ☰.
const ITEMS_ABAJO_DIRECCION: NavItem[] = [
  { label: 'Inicio', href: '/inicio', roles: ROLES_DIRECCION },
  { label: 'Institución', href: '/institucion', roles: ROLES_DIRECCION },
  { label: 'Cursos', href: '/institucion/cursos', roles: ROLES_DIRECCION },
  { label: 'Materias', href: '/institucion/materias', roles: ROLES_DIRECCION },
  { label: 'Alumnos', href: '/alumnos', roles: ROLES_DIRECCION },
];

export function getNavItems(role: Role): NavItem[] {
  return NAV_ITEMS.filter((item) => item.roles.includes(role));
}

export function getBottomNavItems(role: Role): NavItem[] {
  return ROLES_DIRECCION.includes(role) ? ITEMS_ABAJO_DIRECCION : getNavItems(role).slice(0, MAX_ITEMS_ABAJO);
}
