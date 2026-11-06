// Pestañas de la ficha de un hijo (/hijos/{id}/{segment}).
// Cada módulo agrega la suya.
export interface StudentTab {
  label: string;
  segment: string;
}

export const STUDENT_TABS: StudentTab[] = [{ label: 'Notas', segment: 'notas' }];
