"use client";

import { useEffect, useState } from "react";
import { Icono } from "../../components/ui/estado";
import { Aviso, BOTON_ACCION, PantallaCargando, PantallaError, PantallaVacia } from "../../components/ui/pantalla-estado";
import { ApiError, apiFetch } from "../../lib/api";
import { Paginacion, POR_PAGINA, TARJETA } from "../institution/admin-ui";
import {
  COLOR_ESTADO,
  enlaceWhatsApp,
  ESTADOS,
  fechaPostulacion,
  type EstadoPostulacion,
  type Postulacion,
} from "./leads";

type Carga = { status: "loading" } | { status: "error" } | { status: "ready"; postulaciones: Postulacion[] };
type Filtro = EstadoPostulacion | "all";

// En computadora es una tabla; en celular, una tarjeta por postulación.
const COLUMNAS = "lg:grid lg:grid-cols-[2fr_1fr_1.8fr_0.8fr_auto] lg:items-start lg:gap-4";

const ICONO_POSTULACIONES = (
  <>
    <path d="M4 5h16v14H4zM4 7l8 6 8-6" />
  </>
);

// Qué botones ofrece cada estado: siempre los otros dos.
const ACCIONES: Record<EstadoPostulacion, { a: EstadoPostulacion; texto: string }[]> = {
  new: [
    { a: "contacted", texto: "Marcar como contactada" },
    { a: "discarded", texto: "Descartar" },
  ],
  contacted: [
    { a: "new", texto: "Volver a Nuevos" },
    { a: "discarded", texto: "Descartar" },
  ],
  discarded: [
    { a: "new", texto: "Volver a Nuevos" },
    { a: "contacted", texto: "Marcar como contactada" },
  ],
};

function filtroDe(value: EstadoPostulacion) {
  return ESTADOS.find((estado) => estado.value === value)!;
}

function Dato({ icono, children }: { icono: React.ReactNode; children: React.ReactNode }) {
  return (
    <p className="flex min-w-0 items-center gap-2 text-sm text-gray-600">
      <Icono className="h-4 w-4 shrink-0 text-blue">{icono}</Icono>
      <span className="min-w-0 [overflow-wrap:anywhere]">{children}</span>
    </p>
  );
}

function FilaPostulacion({
  postulacion,
  ocupada,
  onCambiar,
}: {
  postulacion: Postulacion;
  ocupada: boolean;
  onCambiar: (estado: EstadoPostulacion) => void;
}) {
  const alumnos = `${postulacion.studentCount} ${postulacion.studentCount === 1 ? "alumno" : "alumnos"}`;

  return (
    <li aria-label={postulacion.institutionName} className={`flex flex-col gap-3 px-4 py-4 ${COLUMNAS}`}>
      <div className="flex min-w-0 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="break-words font-semibold text-ink">{postulacion.institutionName}</h3>
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${COLOR_ESTADO[postulacion.status]}`}>
            {filtroDe(postulacion.status).etiqueta}
          </span>
        </div>
        <p className="text-sm text-gray-600">{postulacion.institutionType}</p>
        {postulacion.comment && (
          <p className="mt-1 rounded-lg bg-blue/5 px-3 py-2 text-sm text-ink [overflow-wrap:anywhere]">
            {postulacion.comment}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <Dato
          icono={
            <>
              <path d="M12 21s7-6 7-11a7 7 0 0 0-14 0c0 5 7 11 7 11z" />
              <circle cx="12" cy="10" r="2.5" />
            </>
          }
        >
          {postulacion.city}
        </Dato>
        <Dato
          icono={
            <>
              <circle cx="9" cy="8" r="3.5" />
              <path d="M2.5 20c0-4 3-6.5 6.5-6.5s6.5 2.5 6.5 6.5M16 5a3.5 3.5 0 0 1 0 6.5M18 14c2 .8 3.5 3 3.5 6" />
            </>
          }
        >
          {alumnos}
        </Dato>
      </div>

      <div className="flex min-w-0 flex-col gap-1">
        <p className="font-medium text-ink">{postulacion.contactName}</p>
        <a
          href={enlaceWhatsApp(postulacion.phone)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm text-blue hover:underline"
        >
          <Icono className="h-4 w-4 shrink-0">
            <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A15 15 0 0 1 3 6a2 2 0 0 1 2-2z" />
          </Icono>
          <span>
            {postulacion.phone} <span className="text-gray-500">(WhatsApp)</span>
          </span>
        </a>
        <a
          href={`mailto:${postulacion.email}`}
          className="flex min-w-0 items-center gap-2 text-sm text-blue hover:underline"
        >
          <Icono className="h-4 w-4 shrink-0">
            <path d="M3 6h18v13H3zM3 7l9 7 9-7" />
          </Icono>
          <span className="min-w-0 [overflow-wrap:anywhere]">{postulacion.email}</span>
        </a>
      </div>

      <p className="text-sm text-gray-600">
        <span className="lg:hidden">Postuló el </span>
        <time dateTime={postulacion.createdAt}>{fechaPostulacion(postulacion.createdAt)}</time>
      </p>

      <div className="flex flex-wrap gap-2 lg:w-44 lg:flex-col">
        {ACCIONES[postulacion.status].map(({ a, texto }) => (
          <button
            key={a}
            type="button"
            disabled={ocupada}
            onClick={() => onCambiar(a)}
            className={
              a === "contacted"
                ? "flex-1 rounded-xl bg-blue px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
                : "flex-1 rounded-xl border border-blue/30 px-3 py-2 text-sm font-medium text-blue disabled:opacity-50"
            }
          >
            {texto}
          </button>
        ))}
      </div>
    </li>
  );
}

export function InteresadosAdmin({ institutionId }: { institutionId: string }) {
  const [carga, setCarga] = useState<Carga>({ status: "loading" });
  const [intento, setIntento] = useState(0);
  const [filtro, setFiltro] = useState<Filtro>("new");
  const [pagina, setPagina] = useState(0);
  const [aviso, setAviso] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ocupada, setOcupada] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;

    apiFetch<Postulacion[]>("/leads", { institutionId })
      .then((postulaciones) => {
        if (!cancelado) setCarga({ status: "ready", postulaciones });
      })
      .catch(() => {
        if (!cancelado) setCarga({ status: "error" });
      });

    return () => {
      cancelado = true;
    };
  }, [institutionId, intento]);

  async function cambiar(postulacion: Postulacion, estado: EstadoPostulacion) {
    setError(null);
    setAviso(null);
    setOcupada(postulacion.id);
    try {
      const actualizada = await apiFetch<Postulacion>(`/leads/${postulacion.id}`, {
        method: "PATCH",
        institutionId,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: estado }),
      });
      setCarga((actual) =>
        actual.status === "ready"
          ? {
              ...actual,
              postulaciones: actual.postulaciones.map((otra) => (otra.id === actualizada.id ? actualizada : otra)),
            }
          : actual
      );
      setAviso(`${postulacion.institutionName} quedó en ${filtroDe(estado).filtro}`);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "No se pudo conectar. Probá de nuevo en un rato.");
    } finally {
      setOcupada(null);
    }
  }

  if (carga.status === "loading") return <PantallaCargando titulo="Cargando postulaciones..." />;

  if (carga.status === "error") {
    return (
      <PantallaError
        titulo="Ocurrió un error"
        texto="No pudimos cargar las postulaciones. Intentá de nuevo."
        tono="naranja"
        claseBoton={`${BOTON_ACCION} bg-blue`}
        onReintentar={() => {
          setCarga({ status: "loading" });
          setIntento((actual) => actual + 1);
        }}
      />
    );
  }

  if (carga.postulaciones.length === 0) {
    return (
      <PantallaVacia
        titulo="Todavía no hay postulaciones"
        texto="Cuando una institución se postule desde la landing, aparece acá."
        icono={ICONO_POSTULACIONES}
      />
    );
  }

  const { postulaciones } = carga;
  const cuantas = (value: Filtro) =>
    value === "all" ? postulaciones.length : postulaciones.filter((p) => p.status === value).length;
  const filtros: { value: Filtro; texto: string }[] = [
    ...ESTADOS.map((estado) => ({ value: estado.value, texto: estado.filtro })),
    { value: "all", texto: "Todos" },
  ];

  // Las más nuevas primero, como las manda la API.
  const filtradas = filtro === "all" ? postulaciones : postulaciones.filter((p) => p.status === filtro);
  const ultimaPagina = Math.max(0, Math.ceil(filtradas.length / POR_PAGINA) - 1);
  const paginaActual = Math.min(pagina, ultimaPagina);
  const visibles = filtradas.slice(paginaActual * POR_PAGINA, (paginaActual + 1) * POR_PAGINA);

  return (
    <div className="flex flex-col gap-4">
      {aviso && <Aviso texto={aviso} onCerrar={() => setAviso(null)} />}
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      <div role="tablist" aria-label="Filtrar por estado" className="flex flex-wrap gap-2">
        {filtros.map(({ value, texto }) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={filtro === value}
            onClick={() => {
              setFiltro(value);
              setPagina(0);
            }}
            className="rounded-xl bg-blue/5 px-4 py-2 text-sm font-medium text-ink aria-selected:bg-accent aria-selected:text-white"
          >
            {texto} ({cuantas(value)})
          </button>
        ))}
      </div>

      {filtradas.length === 0 ? (
        <p className={`p-6 text-center text-gray-600 ${TARJETA}`}>
          {filtro === "all" ? "No hay postulaciones." : filtroDe(filtro).vacio}
        </p>
      ) : (
        <div className={TARJETA}>
          <div
            aria-hidden
            className={`hidden rounded-t-2xl bg-blue/5 px-4 py-3 text-sm font-semibold text-ink ${COLUMNAS}`}
          >
            <span>Institución</span>
            <span>Localidad y alumnos</span>
            <span>Contacto</span>
            <span>Fecha</span>
            <span className="w-44 text-center">Estado</span>
          </div>
          <ul aria-label="Postulaciones" className="divide-y divide-blue/10">
            {visibles.map((postulacion) => (
              <FilaPostulacion
                key={postulacion.id}
                postulacion={postulacion}
                ocupada={ocupada === postulacion.id}
                onCambiar={(estado) => cambiar(postulacion, estado)}
              />
            ))}
          </ul>
          <Paginacion
            numerada
            total={filtradas.length}
            pagina={paginaActual}
            nombre="postulaciones"
            separador="–"
            onCambiar={setPagina}
          />
        </div>
      )}
    </div>
  );
}
