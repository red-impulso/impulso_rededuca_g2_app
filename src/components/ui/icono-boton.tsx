import type { ButtonHTMLAttributes } from "react";

// Botón circular solo con ícono (lápiz, ojo, más opciones...).
// Siempre poner `aria-label` porque no hay texto visible.
const TONOS = {
  neutro: "text-gray-600 hover:bg-gray-100 hover:text-ink",
  azul: "text-primario hover:bg-primario/10",
  naranja: "text-blue hover:bg-naranja/20",
  rojo: "text-rojo hover:bg-rojo/10",
} as const;

export function IconoBoton({
  tono = "neutro",
  className = "",
  type = "button",
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { tono?: keyof typeof TONOS }) {
  return (
    <button
      type={type}
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primario disabled:cursor-not-allowed disabled:opacity-40 ${TONOS[tono]} ${className}`}
      {...rest}
    />
  );
}
