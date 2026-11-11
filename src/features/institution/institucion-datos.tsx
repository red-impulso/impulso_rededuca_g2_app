"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Icono } from "../../components/ui/estado";
import { ApiError, apiFetch } from "../../lib/api";
import {
  CAMPO,
  EstadoActualizado,
  EstadoCargando,
  EstadoError,
  EstadoVacio,
  Insignia,
  TARJETA,
} from "./admin-ui";
import type { Institution } from "./institution";

type Carga =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; institucion: Institution };

const CAMPOS = [
  { campo: "name", etiqueta: "Nombre" },
  { campo: "code", etiqueta: "Código institucional" },
  { campo: "address", etiqueta: "Dirección" },
  { campo: "phone", etiqueta: "Teléfono" },
  { campo: "email", etiqueta: "Correo electrónico" },
  { campo: "shift", etiqueta: "Turno" },
  { campo: "levels", etiqueta: "Nivel" },
  { campo: "modality", etiqueta: "Modalidad" },
] as const;

type Valores = Record<(typeof CAMPOS)[number]["campo"], string>;

function mensajeDe(error: unknown): string {
  return error instanceof ApiError ? error.message : "No se pudo conectar. Probá de nuevo en un rato.";
}

function valoresDe(institucion: Institution): Valores {
  return {
    name: institucion.name,
    code: institucion.code ?? "",
    address: institucion.address ?? "",
    phone: institucion.phone ?? "",
    email: institucion.email ?? "",
    shift: institucion.shift ?? "",
    levels: institucion.levels.join(", "),
    modality: institucion.modality ?? "",
  };
}

function sinDatos(institucion: Institution): boolean {
  const { address, code, phone, email, shift, modality, levels } = institucion;
  return levels.length === 0 && ![address, code, phone, email, shift, modality].some(Boolean);
}

function Fila({ icono, titulo, valor }: { icono: ReactNode; titulo: string; valor: string | null }) {
  return (
    <div className="flex items-start gap-3 py-3 sm:items-center">
      <Icono className="h-6 w-6 shrink-0 text-blue">{icono}</Icono>
      <dt className="text-gray-600 sm:w-48">{titulo}</dt>
      <dd className="min-w-0 break-words">{valor ?? "Sin cargar"}</dd>
    </div>
  );
}

function Adicional({ icono, titulo, valor }: { icono: ReactNode; titulo: string; valor: string | null }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-blue/5 p-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue/10 text-blue">
        <Icono className="h-5 w-5">{icono}</Icono>
      </span>
      <span className="min-w-0">
        <span className="block text-sm text-gray-600">{titulo}</span>
        <span className="block font-medium">{valor ?? "Sin cargar"}</span>
      </span>
    </div>
  );
}

export function InstitucionDatos({ institutionId }: { institutionId: string }) {
  const [carga, setCarga] = useState<Carga>({ status: "loading" });
  const [intento, setIntento] = useState(0);
  const [valores, setValores] = useState<Valores | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actualizado, setActualizado] = useState(false);

  useEffect(() => {
    let cancelado = false;

    apiFetch<Institution>("/institution", { institutionId })
      .then((institucion) => {
        if (!cancelado) setCarga({ status: "ready", institucion });
      })
      .catch(() => {
        if (!cancelado) setCarga({ status: "error" });
      });

    return () => {
      cancelado = true;
    };
  }, [institutionId, intento]);

  if (carga.status === "loading") return <EstadoCargando titulo="Cargando datos de la institución..." />;

  if (carga.status === "error") {
    return (
      <EstadoError
        titulo="Error al cargar los datos"
        onReintentar={() => {
          setCarga({ status: "loading" });
          setIntento((actual) => actual + 1);
        }}
      />
    );
  }

  const { institucion } = carga;

  async function guardar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!valores) return;
    setGuardando(true);
    setError(null);

    try {
      const actualizada = await apiFetch<Institution>("/institution", {
        method: "PATCH",
        institutionId,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...valores,
          levels: valores.levels
            .split(",")
            .map((nivel) => nivel.trim())
            .filter(Boolean),
        }),
      });
      setCarga({ status: "ready", institucion: actualizada });
      setValores(null);
      setActualizado(true);
    } catch (e) {
      setError(mensajeDe(e));
    } finally {
      setGuardando(false);
    }
  }

  if (actualizado) {
    return <EstadoActualizado titulo="¡Datos actualizados!" boton="Ver detalle" onClick={() => setActualizado(false)} />;
  }

  if (valores) {
    return (
      <form onSubmit={guardar} className={`grid gap-3 p-4 sm:grid-cols-2 ${TARJETA}`}>
        {CAMPOS.map(({ campo, etiqueta }) => (
          <label key={campo} className="flex flex-col gap-1 text-sm">
            {etiqueta}
            <input
              type={campo === "email" ? "email" : "text"}
              required={campo === "name"}
              value={valores[campo]}
              onChange={(e) => setValores({ ...valores, [campo]: e.target.value })}
              className={CAMPO}
            />
          </label>
        ))}

        {error && (
          <p role="alert" className="text-sm text-rojo sm:col-span-2">
            {error}
          </p>
        )}

        <div className="flex gap-2 sm:col-span-2">
          <button
            type="submit"
            disabled={guardando}
            className="rounded-full bg-blue px-5 py-2 font-medium text-white disabled:opacity-50"
          >
            {guardando ? "Guardando..." : "Guardar"}
          </button>
          <button
            type="button"
            onClick={() => {
              setValores(null);
              setError(null);
            }}
            className="rounded-xl border border-gray-300 px-4 py-2"
          >
            Cancelar
          </button>
        </div>
      </form>
    );
  }

  if (sinDatos(institucion)) {
    return (
      <EstadoVacio
        titulo="No hay datos de institución"
        texto="Todavía no se registró información de la institución."
        boton="Agregar datos"
        onClick={() => setValores(valoresDe(institucion))}
        ilustracion={<path d="M3 21h18M5 21V10m14 11V10M3 10l9-6 9 6M9 21v-6h6v6" />}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <section className={`p-4 ${TARJETA}`}>
        <div className="flex items-start gap-3">
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-blue text-white">
            <Icono className="h-9 w-9">
              <path d="M3 21h18M5 21V10m14 11V10M3 10l9-6 9 6M9 21v-6h6v6" />
            </Icono>
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold">{institucion.name}</h2>
            <Insignia activa>Activo</Insignia>
          </div>
          <button
            type="button"
            onClick={() => setValores(valoresDe(institucion))}
            className="rounded-xl border border-blue/40 px-4 py-2 text-sm text-blue"
          >
            Editar
          </button>
        </div>

        <dl className="mt-3 divide-y divide-gray-100">
          <Fila
            titulo="Código institucional"
            valor={institucion.code}
            icono={<path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" />}
          />
          <Fila
            titulo="Dirección"
            valor={institucion.address}
            icono={
              <>
                <path d="M12 21s7-6.5 7-12a7 7 0 1 0-14 0c0 5.5 7 12 7 12z" />
                <circle cx="12" cy="9" r="2.5" />
              </>
            }
          />
          <Fila
            titulo="Teléfono"
            valor={institucion.phone}
            icono={<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A15 15 0 0 1 3 6a2 2 0 0 1 2-2z" />}
          />
          <Fila
            titulo="Correo electrónico"
            valor={institucion.email}
            icono={
              <>
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path d="m3 7 9 6 9-6" />
              </>
            }
          />
        </dl>
      </section>

      <section className={`p-4 ${TARJETA}`}>
        <h2 className="mb-3 font-semibold">Datos adicionales</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <Adicional
            titulo="Turno"
            valor={institucion.shift}
            icono={
              <>
                <circle cx="12" cy="13" r="8" />
                <path d="M12 9v4l2.5 2M9 3h6" />
              </>
            }
          />
          <Adicional
            titulo="Nivel"
            valor={institucion.levels.length > 0 ? institucion.levels.join(", ") : null}
            icono={<path d="M12 4 3 20h18z" />}
          />
          <Adicional
            titulo="Modalidad"
            valor={institucion.modality}
            icono={
              <>
                <rect x="4" y="4" width="16" height="16" rx="2" />
                <path d="M9 9h2v2H9zM13 9h2v2h-2zM9 13h2v2H9zM13 13h2v2h-2z" />
              </>
            }
          />
        </div>
      </section>
    </div>
  );
}
