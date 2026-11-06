"use client";

import { useState, type ReactNode } from "react";
import { Cargando, Estado, Icono } from "../../components/ui/estado";

export const POR_PAGINA = 10;

export const TARJETA =
  "rounded-2xl border border-white/80 bg-white/80 shadow-[0_8px_30px_rgba(20,33,61,0.08)] backdrop-blur";

export const CAMPO = "rounded-lg border border-gray-300 bg-white px-3 py-2";

export function EstadoCargando({ titulo }: { titulo: string }) {
  return <Estado ilustracion={<Cargando />} titulo={titulo} texto="Por favor, esperá un momento." />;
}

export function EstadoError({ titulo, onReintentar }: { titulo: string; onReintentar: () => void }) {
  return (
    <div role="alert">
      <Estado
        fondo="bg-red-50"
        ilustracion={
          <Icono className="h-14 w-14 text-red-600">
            <path d="M12 3 22.5 21h-21zM12 10v5M12 18v.5" />
          </Icono>
        }
        titulo={titulo}
        texto="Ocurrió un problema al obtener la información. Intentá nuevamente."
      >
        <button
          type="button"
          onClick={onReintentar}
          className="mt-1 rounded-full bg-red-600 px-8 py-2 font-medium text-white"
        >
          Reintentar
        </button>
      </Estado>
    </div>
  );
}

export function EstadoVacio({
  titulo,
  texto,
  boton,
  onClick,
  ilustracion,
}: {
  titulo: string;
  texto: string;
  boton: string;
  onClick: () => void;
  ilustracion: ReactNode;
}) {
  return (
    <Estado ilustracion={<Icono className="h-16 w-16 text-blue">{ilustracion}</Icono>} titulo={titulo} texto={texto}>
      <button type="button" onClick={onClick} className="mt-1 rounded-full bg-blue px-8 py-2 font-medium text-white">
        {boton}
      </button>
    </Estado>
  );
}

export function EstadoActualizado({
  titulo,
  boton,
  onClick,
}: {
  titulo: string;
  boton: string;
  onClick: () => void;
}) {
  return (
    <Estado
      fondo="bg-green/10"
      ilustracion={
        <Icono className="h-14 w-14 text-green">
          <circle cx="12" cy="12" r="9.5" />
          <path d="m8 12.5 2.5 2.5 5.5-5.5" />
        </Icono>
      }
      titulo={titulo}
      texto="La información se guardó correctamente."
    >
      <button type="button" onClick={onClick} className="mt-1 rounded-full bg-green px-8 py-2 font-medium text-white">
        {boton}
      </button>
    </Estado>
  );
}

export function Encabezado({
  titulo,
  subtitulo,
  fondo,
  icono,
}: {
  titulo: string;
  subtitulo: string;
  fondo: string;
  icono: ReactNode;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${fondo}`}>
        <Icono className="h-8 w-8">{icono}</Icono>
      </span>
      <div>
        <h1 className="text-2xl font-semibold">{titulo}</h1>
        <p className="text-gray-600">{subtitulo}</p>
      </div>
    </div>
  );
}

export function Buscador({
  nombre,
  valor,
  onChange,
}: {
  nombre: string;
  valor: string;
  onChange: (valor: string) => void;
}) {
  return (
    <label className={`flex flex-1 items-center gap-2 px-3 py-2 ${TARJETA}`}>
      <Icono className="h-5 w-5 shrink-0 text-gray-500">
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-4-4" />
      </Icono>
      <input
        type="search"
        aria-label={`Buscar ${nombre}`}
        placeholder={`Buscar ${nombre}...`}
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-transparent outline-none"
      />
    </label>
  );
}

export function BotonNuevo({ texto, onClick }: { texto: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center justify-center gap-2 rounded-2xl bg-blue px-5 py-3 font-medium text-white"
    >
      <Icono className="h-5 w-5">
        <path d="M12 5v14M5 12h14" />
      </Icono>
      {texto}
    </button>
  );
}

export function Paginacion({
  total,
  pagina,
  nombre,
  onCambiar,
}: {
  total: number;
  pagina: number;
  nombre: string;
  onCambiar: (pagina: number) => void;
}) {
  const paginas = Math.max(1, Math.ceil(total / POR_PAGINA));
  const desde = total === 0 ? 0 : pagina * POR_PAGINA + 1;
  const hasta = Math.min(total, (pagina + 1) * POR_PAGINA);
  const flecha = "h-9 w-9 rounded-lg border border-gray-200 bg-white disabled:opacity-40";

  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
      <p>
        Mostrando {desde} - {hasta} de {total} {nombre}
      </p>
      <div className="flex items-center gap-1">
        <button
          type="button"
          aria-label="Página anterior"
          disabled={pagina === 0}
          onClick={() => onCambiar(pagina - 1)}
          className={flecha}
        >
          ‹
        </button>
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue text-white">{pagina + 1}</span>
        <button
          type="button"
          aria-label="Página siguiente"
          disabled={pagina >= paginas - 1}
          onClick={() => onCambiar(pagina + 1)}
          className={flecha}
        >
          ›
        </button>
      </div>
    </div>
  );
}

export function MenuAcciones({
  nombre,
  confirmando,
  onEditar,
  onEliminar,
}: {
  nombre: string;
  confirmando: boolean;
  onEditar: () => void;
  onEliminar: () => void;
}) {
  const [abierto, setAbierto] = useState(false);

  return (
    <div className="relative inline-block">
      <button
        type="button"
        aria-label={`Acciones de ${nombre}`}
        aria-expanded={abierto}
        onClick={() => setAbierto((actual) => !actual)}
        className="h-9 w-9 rounded-full text-xl font-semibold text-blue hover:bg-blue/10"
      >
        ⋮
      </button>
      {abierto && (
        <div className="absolute right-0 z-10 flex w-52 flex-col rounded-xl border border-gray-200 bg-white py-1 text-left text-sm shadow-lg">
          <button type="button" onClick={onEditar} className="px-4 py-2 text-left hover:bg-gray-100">
            Editar
          </button>
          <button type="button" onClick={onEliminar} className="px-4 py-2 text-left text-red-700 hover:bg-red-50">
            {confirmando ? "¿Seguro? Tocá de nuevo" : "Eliminar"}
          </button>
        </div>
      )}
    </div>
  );
}

export function Insignia({ activa, children }: { activa: boolean; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
        activa ? "bg-green/15 text-green" : "bg-gray-200 text-gray-700"
      }`}
    >
      <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${activa ? "bg-green" : "bg-gray-500"}`} />
      {children}
    </span>
  );
}
