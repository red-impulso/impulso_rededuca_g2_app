// Pestañas de la ficha de un hijo (/hijos/{id}/{segment}).
// Cada módulo agrega la suya.
export interface StudentTab {
  label: string;
  segment: string;
}

export const STUDENT_TABS: StudentTab[] = [
  { label: 'Notas', segment: 'notas' },
  { label: 'Asistencia', segment: 'asistencia' },
  // Carnet digital con el QR que el docente escanea para dar el presente.
  { label: 'Carnet', segment: 'carnet' },
];
