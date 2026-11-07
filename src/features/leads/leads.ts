// GET /leads: postulaciones de la landing del grupo 2.
export type EstadoPostulacion = "new" | "contacted" | "discarded";

export interface Postulacion {
  id: string;
  institutionName: string;
  institutionType: string;
  city: string;
  studentCount: number;
  contactName: string;
  phone: string;
  email: string;
  comment: string | null;
  status: EstadoPostulacion;
  createdAt: string;
}

// Orden de los filtros: arranca en Nuevos.
export const ESTADOS: { value: EstadoPostulacion; filtro: string; etiqueta: string; vacio: string }[] = [
  { value: "new", filtro: "Nuevos", etiqueta: "Nuevo", vacio: "No hay postulaciones nuevas." },
  { value: "contacted", filtro: "Contactados", etiqueta: "Contactado", vacio: "No hay postulaciones contactadas." },
  { value: "discarded", filtro: "Descartados", etiqueta: "Descartado", vacio: "No hay postulaciones descartadas." },
];

export const COLOR_ESTADO: Record<EstadoPostulacion, string> = {
  new: "bg-accent/15 text-accent",
  contacted: "bg-green/15 text-green",
  discarded: "bg-gray-200 text-gray-700",
};

// WhatsApp pide el número con 549 adelante (Argentina, celular), sin el 0.
// "388 400-0000" -> https://wa.me/5493884000000
export function enlaceWhatsApp(telefono: string): string {
  let digitos = telefono.replace(/\D/g, "");
  if (digitos.startsWith("549")) return `https://wa.me/${digitos}`;
  if (digitos.startsWith("54")) digitos = digitos.slice(2);
  return `https://wa.me/549${digitos.replace(/^0/, "")}`;
}

const FORMATO_FECHA = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "America/Argentina/Jujuy",
});

export function fechaPostulacion(iso: string): string {
  return FORMATO_FECHA.format(new Date(iso));
}
