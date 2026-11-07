// Lo que devuelve la API de alumnos (ver src/modules/students en la API).
export interface StudentCourse {
  id: string;
  year: number;
  division: string;
  shift: string;
}

export interface Student {
  id: string;
  firstName: string | null;
  lastName: string | null;
  dni: string | null;
  status: "active" | "inactive";
  course: StudentCourse | null;
}

// GET /students/:id suma los datos personales de la ficha.
export interface StudentFile extends Student {
  birthDate: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  updatedAt: string | null;
}

export interface Guardian {
  id: string;
  fullName: string | null;
}

// "Prueba, Ana"
export function nombreLista(alumno: Pick<Student, "firstName" | "lastName">): string {
  return [alumno.lastName, alumno.firstName].filter(Boolean).join(", ");
}

// "Ana Prueba"
export function nombreCompleto(alumno: Pick<Student, "firstName" | "lastName">): string {
  return [alumno.firstName, alumno.lastName].filter(Boolean).join(" ");
}

// "AP"
export function inicialesAlumno(alumno: Pick<Student, "firstName" | "lastName">): string {
  return [alumno.firstName, alumno.lastName].map((nombre) => nombre?.[0]?.toUpperCase() ?? "").join("");
}

// "1° Año A"
export function cursoAlumno(curso: Pick<StudentCourse, "year" | "division">): string {
  return `${curso.year}° Año ${curso.division}`;
}

// "42345678" -> "42.345.678". Si no son solo números, queda como está.
export function formatoDni(dni: string): string {
  return /^\d+$/.test(dni) ? dni.replace(/\B(?=(\d{3})+$)/g, ".") : dni;
}

// "2010-03-12" -> "12/03/2010". Sin new Date(): lo tomaría como medianoche en
// hora universal, y en Argentina se vería el día anterior.
export function formatoFecha(fecha: string): string {
  const [anio, mes, dia] = fecha.split("-");
  return `${dia}/${mes}/${anio}`;
}

// Sin mayúsculas ni tildes: "Tomás" se encuentra escribiendo "tomas".
export function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}
