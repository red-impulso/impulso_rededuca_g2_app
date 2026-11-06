import { describe, expect, it } from 'vitest';
import { NAV_ITEMS, getNavItems } from './navigation';

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
