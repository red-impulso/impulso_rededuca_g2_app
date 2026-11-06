// Lo que devuelve la API de institución (ver src/modules/institution en la API).
export interface Institution {
  id: string;
  name: string;
  address: string | null;
  levels: string[];
  code: string | null;
  phone: string | null;
  email: string | null;
  shift: string | null;
  modality: string | null;
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

const NIVELES = ["Primer", "Segundo", "Tercer", "Cuarto", "Quinto", "Sexto", "Séptimo"];

// "3° A"
export function nombreCurso(curso: Pick<Course, "year" | "division">): string {
  return `${curso.year}° ${curso.division}`;
}

// "Tercer año"
export function nivelCurso(year: number): string {
  return `${NIVELES[year - 1] ?? `${year}°`} año`;
}

// La API no guarda un estado: un curso está activo en su ciclo lectivo.
export function cursoActivo(curso: Pick<Course, "schoolYear">): boolean {
  return curso.schoolYear >= new Date().getFullYear();
}

// "3° A · Turno mañana"
export function etiquetaCurso(curso: Pick<Course, "year" | "division" | "shift">): string {
  return `${curso.year}° ${curso.division} · Turno ${etiquetaTurno(curso.shift).toLowerCase()}`;
}
