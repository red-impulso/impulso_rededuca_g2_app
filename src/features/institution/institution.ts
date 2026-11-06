// Lo que devuelve la API de institución (ver src/modules/institution en la API).
export interface Institution {
  id: string;
  name: string;
  address: string | null;
  levels: string[];
}

export interface Course {
  id: string;
  year: number;
  division: string;
  shift: string;
  schoolYear: number;
}

export interface Subject {
  id: string;
  name: string;
  courseId: string;
  teacherMembershipId: string | null;
}

// GET /teachers devuelve más datos; acá solo importan id y nombre.
export interface Teacher {
  id: string;
  fullName: string | null;
}

export const TURNOS = [
  { value: "morning", label: "Mañana" },
  { value: "afternoon", label: "Tarde" },
  { value: "evening", label: "Noche" },
] as const;

export function etiquetaTurno(shift: string): string {
  return TURNOS.find((turno) => turno.value === shift)?.label ?? shift;
}

// "3° A · Turno mañana"
export function etiquetaCurso(curso: Pick<Course, "year" | "division" | "shift">): string {
  return `${curso.year}° ${curso.division} · Turno ${etiquetaTurno(curso.shift).toLowerCase()}`;
}
