import { type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";

// Campos de formulario de la identidad: fondo blanco, borde suave,
// foco azul de la marca con halo suave, estados disabled visibles.
const CLASE_CAMPO =
  "w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-ink transition placeholder:text-gray-400 focus:border-primario focus:outline-none focus:ring-2 focus:ring-primario/25 disabled:cursor-not-allowed disabled:bg-gray-100";

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  const { className = "", ...rest } = props;
  return <input className={`${CLASE_CAMPO} ${className}`} {...rest} />;
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  const { className = "", ...rest } = props;
  return <select className={`${CLASE_CAMPO} ${className}`} {...rest} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { className = "", ...rest } = props;
  return <textarea className={`${CLASE_CAMPO} ${className}`} {...rest} />;
}

// Etiqueta + campo + ayuda/error. `obligatorio` agrega el asterisco.
export function Campo({
  etiqueta,
  obligatorio,
  ayuda,
  error,
  children,
}: {
  etiqueta: string;
  obligatorio?: boolean;
  ayuda?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm font-medium text-ink">
      <span>
        {etiqueta}
        {obligatorio && (
          <span aria-hidden className="ml-0.5 text-rojo">
            (*)
          </span>
        )}
      </span>
      {children}
      {error ? (
        <span role="alert" className="text-xs font-medium text-rojo">
          {error}
        </span>
      ) : (
        ayuda && <span className="text-xs text-gray-500">{ayuda}</span>
      )}
    </label>
  );
}
