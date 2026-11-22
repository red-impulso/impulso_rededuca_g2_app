// Lo que lleva el QR del carnet: "rededuca:alumno:<id del alumno>".
// Solo el id: sin nombre ni DNI, así el QR no expone datos personales.
const PREFIJO = "rededuca:alumno:";

export function codigoAlumno(studentId: string): string {
  return `${PREFIJO}${studentId}`;
}

// El id del alumno, o null si el QR no es un carnet de RedEduca.
export function leerCodigoAlumno(texto: string): string | null {
  const limpio = texto.trim();
  if (!limpio.startsWith(PREFIJO)) return null;
  const id = limpio.slice(PREFIJO.length);
  return /^[A-Za-z0-9-]{1,64}$/.test(id) ? id : null;
}
