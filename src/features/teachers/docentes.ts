import type { StudentCourse } from "../students/students";

// GET /teachers: el id es el de la membresía.
export interface MateriaDocente {
  id: string;
  name: string;
  course: StudentCourse;
}

export interface Docente {
  id: string;
  fullName: string | null;
  status: "active" | "inactive";
  dni: string | null;
  subjects: MateriaDocente[];
}

// GET /teachers/:id suma los datos de la ficha.
export interface DocenteFicha extends Docente {
  email: string | null;
  phone: string | null;
  training: string | null;
  startYear: number | null;
  notes: string | null;
}

export const SIN_NOMBRE = "Sin nombre";
export const SIN_CARGAR = "Sin cargar";

const COLORES = [
  { chip: "bg-blue/10 text-blue", solido: "bg-blue" },
  { chip: "bg-secundario/10 text-secundario", solido: "bg-secundario" },
  { chip: "bg-green/15 text-verde-fuerte", solido: "bg-green" },
  { chip: "bg-accent/15 text-blue", solido: "bg-accent" },
  { chip: "bg-celeste/20 text-celeste-fuerte", solido: "bg-celeste" },
];

// Una misma materia siempre sale del mismo color, en la lista y en la ficha.
export function colorMateria(nombre: string) {
  const suma = [...nombre].reduce((total, letra) => total + letra.charCodeAt(0), 0);
  return COLORES[suma % COLORES.length];
}

// "5 años"
export function antiguedad(anioIngreso: number): string {
  const anios = new Date().getFullYear() - anioIngreso;
  if (anios < 1) return "Menos de 1 año";
  return anios === 1 ? "1 año" : `${anios} años`;
}
