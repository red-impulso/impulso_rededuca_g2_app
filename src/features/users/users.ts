import type { Role } from "../../config/navigation";

// GET /users: el id es el de la membresía.
export interface Usuario {
  id: string;
  userId: string;
  email: string | null;
  fullName: string | null;
  role: Role;
  status: "active" | "inactive";
}

export const ETIQUETA_ROL: Record<Role, string> = {
  admin: "Administrador",
  director: "Director",
  teacher: "Docente",
  guardian: "Tutor",
  student: "Estudiante",
};

export const COLOR_ROL: Record<Role, string> = {
  admin: "bg-accent/15 text-naranja-fuerte",
  director: "bg-green/15 text-verde-fuerte",
  teacher: "bg-secundario/10 text-secundario",
  guardian: "bg-blue/10 text-blue",
  student: "bg-gray-200 text-gray-700",
};

// Los roles que se pueden dar desde esta pantalla.
export const ROLES_USUARIO: { value: Role; label: string }[] = (
  ["admin", "director", "teacher", "guardian"] as const
).map((value) => ({ value, label: ETIQUETA_ROL[value] }));
