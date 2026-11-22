import { expect, it } from 'vitest';
import { STUDENT_TABS } from './student-tabs';

it('la ficha del hijo tiene la pestaña Notas', () => {
  expect(STUDENT_TABS).toContainEqual({ label: 'Notas', segment: 'notas' });
});

it('la ficha del hijo tiene la pestaña Asistencia', () => {
  expect(STUDENT_TABS).toContainEqual({ label: 'Asistencia', segment: 'asistencia' });
});

it('la ficha del hijo tiene la pestaña Carnet (QR para la asistencia)', () => {
  expect(STUDENT_TABS).toContainEqual({ label: 'Carnet', segment: 'carnet' });
});
