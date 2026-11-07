import { describe, expect, it } from 'vitest';
import { NAV_ITEMS, getBottomNavItems, getNavItems } from './navigation';

const soloDocentes = NAV_ITEMS.filter(
  (item) => item.roles.length === 1 && item.roles[0] === 'teacher'
);

describe('getNavItems', () => {
  it('hay ítems que son solo de docentes (si no, la prueba de abajo no prueba nada)', () => {
    expect(soloDocentes.length).toBeGreaterThan(0);
  });

  it("getNavItems('guardian') no incluye ítems solo de docentes", () => {
    const hrefs = getNavItems('guardian').map((item) => item.href);
    for (const item of soloDocentes) {
      expect(hrefs).not.toContain(item.href);
    }
  });

  it("getNavItems('teacher') sí incluye los ítems de docentes", () => {
    const hrefs = getNavItems('teacher').map((item) => item.href);
    for (const item of soloDocentes) {
      expect(hrefs).toContain(item.href);
    }
  });

  it('Calificaciones es solo para docentes', () => {
    const conCalificaciones = (['admin', 'director', 'teacher', 'guardian', 'student'] as const).filter(
      (role) => getNavItems(role).some((item) => item.href === '/calificaciones')
    );
    expect(conCalificaciones).toEqual(['teacher']);
  });

  it('Asistencia es para docentes y dirección', () => {
    const conAsistencia = (['admin', 'director', 'teacher', 'guardian', 'student'] as const).filter(
      (role) => getNavItems(role).some((item) => item.href === '/asistencia')
    );
    expect(conAsistencia).toEqual(['admin', 'director', 'teacher']);
  });

  it('Dirección es solo para admin y director', () => {
    const conTablero = (['admin', 'director', 'teacher', 'guardian', 'student'] as const).filter(
      (role) => getNavItems(role).some((item) => item.href === '/tablero')
    );
    expect(conTablero).toEqual(['admin', 'director']);
  });

  it('Docentes es solo para admin y director', () => {
    const conDocentes = (['admin', 'director', 'teacher', 'guardian', 'student'] as const).filter(
      (role) => getNavItems(role).some((item) => item.href === '/docentes')
    );
    expect(conDocentes).toEqual(['admin', 'director']);
  });

  it('Alumnos es solo para admin y director', () => {
    const conAlumnos = (['admin', 'director', 'teacher', 'guardian', 'student'] as const).filter(
      (role) => getNavItems(role).some((item) => item.href === '/alumnos')
    );
    expect(conAlumnos).toEqual(['admin', 'director']);
  });

  it('Institución es solo para admin y director', () => {
    const conInstitucion = (['admin', 'director', 'teacher', 'guardian', 'student'] as const).filter(
      (role) => getNavItems(role).some((item) => item.href === '/institucion')
    );
    expect(conInstitucion).toEqual(['admin', 'director']);
  });

  it('Mis hijos es solo para tutores', () => {
    const conHijos = (['admin', 'director', 'teacher', 'guardian', 'student'] as const).filter((role) =>
      getNavItems(role).some((item) => item.href === '/hijos')
    );
    expect(conHijos).toEqual(['guardian']);
  });

  it('todos los roles ven Inicio y Comunicados', () => {
    for (const role of ['admin', 'director', 'teacher', 'guardian', 'student'] as const) {
      const hrefs = getNavItems(role).map((item) => item.href);
      expect(hrefs).toContain('/inicio');
      expect(hrefs).toContain('/comunicados');
    }
  });
});

describe('Usuarios y Escuelas', () => {
  it('Usuarios es solo para admin', () => {
    const conUsuarios = (['admin', 'director', 'teacher', 'guardian', 'student'] as const).filter((role) =>
      getNavItems(role).some((item) => item.href === '/usuarios')
    );
    expect(conUsuarios).toEqual(['admin']);
  });

  it('Escuelas aparece para admin y para quien trabaja en varias escuelas', () => {
    const tieneEscuelas = (items: { href: string }[]) => items.some((item) => item.href === '/escuelas');

    expect(tieneEscuelas(getNavItems('admin'))).toBe(true);
    expect(tieneEscuelas(getNavItems('teacher'))).toBe(false);
    expect(tieneEscuelas(getNavItems('teacher', true))).toBe(true);
  });
});

describe('getBottomNavItems', () => {
  it('el último lugar de dirección muestra la sección abierta', () => {
    const ultimo = (role: 'admin' | 'director', pathname: string) =>
      getBottomNavItems(role, pathname).at(-1)?.href;

    expect(ultimo('admin', '/inicio')).toBe('/alumnos');
    expect(ultimo('admin', '/docentes')).toBe('/docentes');
    expect(ultimo('admin', '/usuarios')).toBe('/usuarios');
    expect(ultimo('director', '/usuarios')).toBe('/alumnos');
  });

  it.each(['admin', 'director'] as const)('%s ve la barra del diseño de UX/UI', (role) => {
    expect(getBottomNavItems(role).map((item) => item.label)).toEqual([
      'Inicio',
      'Institución',
      'Cursos',
      'Materias',
      'Alumnos',
    ]);
  });

  it('los demás roles ven sus primeras secciones, hasta 5', () => {
    expect(getBottomNavItems('guardian')).toEqual(getNavItems('guardian').slice(0, 5));
    expect(getBottomNavItems('teacher').length).toBeLessThanOrEqual(5);
  });
});
