import { expect, it } from 'vitest';
import { STUDENT_TABS } from './student-tabs';

it('la ficha del hijo tiene la pestaña Notas', () => {
  expect(STUDENT_TABS).toContainEqual({ label: 'Notas', segment: 'notas' });
});
