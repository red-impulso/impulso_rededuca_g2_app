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

  it('todos los roles ven Inicio', () => {
    for (const role of ['admin', 'director', 'teacher', 'guardian', 'student'] as const) {
      expect(getNavItems(role).map((item) => item.href)).toContain('/inicio');
    }
  });
});
