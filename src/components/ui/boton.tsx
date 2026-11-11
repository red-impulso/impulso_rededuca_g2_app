import type { ButtonHTMLAttributes } from "react";

// Botón píldora de la identidad RedEduca (Prompt 0 / lámina "BOTONES").
// Variantes:
//  - primario:   azul de la marca, acciones principales.
//  - secundario: morado, acciones alternativas o de éxito.
//  - acento:     naranja, CTAs destacados (texto oscuro para cumplir AA).
//  - celeste:    celeste, enlaces/botones suaves.
//  - outline / outlineNaranja: borde sin relleno ("Más información").
//  - peligro:    rojo, acciones destructivas.
//  - suave:      fondo azul muy tenue, acciones terciarias.
const VARIANTES = {
  primario: "bg-primario text-white hover:brightness-110",
  secundario: "bg-secundario text-white hover:brightness-110",
  acento: "bg-naranja text-ink hover:brightness-95",
  celeste: "bg-celeste text-ink hover:brightness-95",
  outlineNaranja:
    "border-2 border-naranja bg-transparent text-blue hover:bg-naranja/15",
  outline: "border border-primario bg-transparent text-primario hover:bg-primario/10",
  peligro: "bg-rojo text-white hover:brightness-110",
  suave: "bg-primario/10 text-primario hover:bg-primario/15",
} as const;

const TAMANIOS = {
  sm: "px-4 py-1.5 text-sm",
  md: "px-6 py-2.5 text-sm",
  lg: "px-8 py-3 text-base",
} as const;

export function Boton({
  variante = "primario",
  tamanio = "md",
  className = "",
  type = "button",
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variante?: keyof typeof VARIANTES;
  tamanio?: keyof typeof TAMANIOS;
}) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 rounded-full font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario disabled:cursor-not-allowed disabled:opacity-50 ${VARIANTES[variante]} ${TAMANIOS[tamanio]} ${className}`}
      {...rest}
    />
  );
}
