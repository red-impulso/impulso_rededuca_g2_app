// GET /guardians: el id es el de la membresía.
export interface Tutor {
  id: string;
  fullName: string | null;
}

// GET /students/:id/guardians suma lo que muestra la ficha del alumno.
export interface TutorVinculado extends Tutor {
  relationship: string | null;
  phone: string | null;
  email: string | null;
}

export const PARENTESCOS = [
  { value: "madre", label: "Madre" },
  { value: "padre", label: "Padre" },
  { value: "tutor", label: "Tutor" },
  { value: "otro", label: "Otro" },
] as const;

export function etiquetaParentesco(valor: string): string {
  return PARENTESCOS.find((opcion) => opcion.value === valor)?.label ?? valor;
}
