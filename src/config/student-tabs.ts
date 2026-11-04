// Pestañas de la ficha de un estudiante. Vacío a propósito:
// cada módulo (M1 Calificaciones, etc.) agrega la suya.
export interface StudentTab {
  label: string;
  href: string;
}

export const STUDENT_TABS: StudentTab[] = [];
