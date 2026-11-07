"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Icono } from "../../components/ui/estado";
import {
  Avatar,
  BOTON_ACCION,
  BOTON_NARANJA,
  inicialesDe,
  PantallaCargando,
  PantallaError,
  PantallaVacia,
} from "../../components/ui/pantalla-estado";
import { ApiError, apiFetch } from "../../lib/api";
import { CAMPO, MenuAcciones, TARJETA } from "../institution/admin-ui";
import { etiquetaParentesco, PARENTESCOS, type Tutor, type TutorVinculado } from "./tutores";

type Carga =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; vinculados: TutorVinculado[]; todos: Tutor[] };

const SIN_NOMBRE = "Sin nombre";
const JSON_HEADERS = { "Content-Type": "application/json" };

const COLOR_PARENTESCO: Record<string, string> = {
  madre: "bg-blue/10 text-blue",
  padre: "bg-violet-100 text-violet-700",
  tutor: "bg-green/15 text-green",
  otro: "bg-gray-200 text-gray-700",
};

function ordenar(tutores: TutorVinculado[]): TutorVinculado[] {
  return [...tutores].sort((a, b) => (a.fullName ?? "").localeCompare(b.fullName ?? "", "es"));
}

function Contacto({ icono, children }: { icono: ReactNode; children: ReactNode }) {
  return (
    <p className="flex min-w-0 items-center gap-2 text-sm text-gray-600">
      <Icono className="h-4 w-4 shrink-0 text-blue">{icono}</Icono>
      <span className="min-w-0 [overflow-wrap:anywhere]">{children}</span>
    </p>
  );
}

// Si el correo no entra en una línea, que corte después de la arroba.
function Correo({ email }: { email: string }) {
  const arroba = email.indexOf("@") + 1;

  return (
    <>
      {email.slice(0, arroba)}
      <wbr />
      {email.slice(arroba)}
    </>
  );
}

function CamposContacto({
  parentesco,
  telefono,
  onParentesco,
  onTelefono,
}: {
  parentesco: string;
  telefono: string;
  onParentesco: (valor: string) => void;
  onTelefono: (valor: string) => void;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      <label className="flex flex-col gap-1 text-sm font-medium text-ink">
        Parentesco
        <select value={parentesco} onChange={(e) => onParentesco(e.target.value)} className={CAMPO}>
          <option value="">Sin indicar</option>
          {PARENTESCOS.map((opcion) => (
            <option key={opcion.value} value={opcion.value}>
              {opcion.label}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm font-medium text-ink">
        Teléfono
        <input value={telefono} onChange={(e) => onTelefono(e.target.value)} className={CAMPO} />
      </label>
    </div>
  );
}

function BotonCancelar({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="rounded-xl border border-gray-300 px-6 py-2.5 text-ink">
      Cancelar
    </button>
  );
}

function EditarTutor({
  tutor,
  enviando,
  onGuardar,
  onCancelar,
}: {
  tutor: TutorVinculado;
  enviando: boolean;
  onGuardar: (cambios: { relationship?: string | null; phone?: string }) => void;
  onCancelar: () => void;
}) {
  const [parentesco, setParentesco] = useState(tutor.relationship ?? "");
  const [telefono, setTelefono] = useState(tutor.phone ?? "");

  function guardar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cambios = {
      ...(parentesco !== (tutor.relationship ?? "") && { relationship: parentesco || null }),
      ...(telefono !== (tutor.phone ?? "") && { phone: telefono }),
    };
    if (Object.keys(cambios).length === 0) onCancelar();
    else onGuardar(cambios);
  }

  return (
    <form onSubmit={guardar} className="flex flex-col gap-3 pt-3">
      <CamposContacto
        parentesco={parentesco}
        telefono={telefono}
        onParentesco={setParentesco}
        onTelefono={setTelefono}
      />
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <BotonCancelar onClick={onCancelar} />
        <button type="submit" disabled={enviando} className={`${BOTON_ACCION} bg-accent`}>
          Guardar
        </button>
      </div>
    </form>
  );
}

function AgregarTutor({
  disponibles,
  enviando,
  onVincular,
  onCancelar,
}: {
  disponibles: Tutor[];
  enviando: boolean;
  onVincular: (datos: { guardianMembershipId: string; relationship?: string; phone?: string }) => void;
  onCancelar: () => void;
}) {
  const [elegido, setElegido] = useState("");
  const [parentesco, setParentesco] = useState("");
  const [telefono, setTelefono] = useState("");

  if (disponibles.length === 0) {
    return (
      <div className="flex flex-col items-start gap-2 rounded-xl border border-blue/10 bg-blue/5 p-3 text-sm text-gray-600">
        <p>No hay más tutores para vincular. Para sumar uno nuevo, un administrador lo carga en Usuarios.</p>
        <BotonCancelar onClick={onCancelar} />
      </div>
    );
  }

  function vincular(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onVincular({
      guardianMembershipId: elegido,
      ...(parentesco && { relationship: parentesco }),
      ...(telefono.trim() && { phone: telefono }),
    });
  }

  return (
    <form onSubmit={vincular} className="flex flex-col gap-3 rounded-xl border border-blue/10 bg-blue/5 p-3">
      <label className="flex flex-col gap-1 text-sm font-medium text-ink">
        Tutor para vincular
        <select value={elegido} onChange={(e) => setElegido(e.target.value)} className={CAMPO}>
          <option value="">Elegí un tutor</option>
          {disponibles.map((tutor) => (
            <option key={tutor.id} value={tutor.id}>
              {tutor.fullName ?? SIN_NOMBRE}
            </option>
          ))}
        </select>
      </label>
      <CamposContacto
        parentesco={parentesco}
        telefono={telefono}
        onParentesco={setParentesco}
        onTelefono={setTelefono}
      />
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <BotonCancelar onClick={onCancelar} />
        <button type="submit" disabled={!elegido || enviando} className={`${BOTON_ACCION} bg-accent`}>
          Vincular
        </button>
      </div>
    </form>
  );
}

function TarjetaTutor({
  tutor,
  confirmando,
  onEditar,
  onQuitar,
  children,
}: {
  tutor: TutorVinculado;
  confirmando: boolean;
  onEditar: () => void;
  onQuitar: () => void;
  children?: ReactNode;
}) {
  const nombre = tutor.fullName ?? SIN_NOMBRE;

  return (
    <li aria-label={nombre} className="rounded-xl border border-blue/10 bg-white p-3">
      <div className="flex items-start gap-3">
        <Avatar iniciales={inicialesDe(tutor.fullName)} />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="break-words font-semibold text-ink">{nombre}</h4>
            {tutor.relationship && (
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${COLOR_PARENTESCO[tutor.relationship]}`}>
                {etiquetaParentesco(tutor.relationship)}
              </span>
            )}
          </div>
          <Contacto
            icono={
              <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A15 15 0 0 1 3 6a2 2 0 0 1 2-2z" />
            }
          >
            {tutor.phone ?? "Sin teléfono"}
          </Contacto>
          <Contacto icono={<path d="M3 6h18v13H3zM3 7l9 7 9-7" />}>
            {tutor.email ? <Correo email={tutor.email} /> : "Sin correo"}
          </Contacto>
        </div>
        <div className="flex shrink-0 items-center">
          <button
            type="button"
            aria-label={`Editar a ${nombre}`}
            onClick={onEditar}
            className="flex h-9 w-9 items-center justify-center rounded-full text-blue hover:bg-blue/10"
          >
            <Icono className="h-5 w-5">
              <path d="m4 20 1-4L16 5l3 3L8 19zM14 7l3 3" />
            </Icono>
          </button>
          <MenuAcciones
            nombre={nombre}
            confirmando={confirmando}
            textoEliminar="Quitar"
            onEditar={onEditar}
            onEliminar={onQuitar}
          />
        </div>
      </div>
      {children}
    </li>
  );
}

// Pestaña Tutores de la ficha del alumno: quién está vinculado y cómo cambiarlo.
// Quien queda vinculado ve las notas y la asistencia del alumno.
export function StudentGuardians({ institutionId, studentId }: { institutionId: string; studentId: string }) {
  const [carga, setCarga] = useState<Carga>({ status: "loading" });
  const [intento, setIntento] = useState(0);
  const [agregando, setAgregando] = useState(false);
  const [editando, setEditando] = useState<string | null>(null);
  const [confirmando, setConfirmando] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;

    Promise.all([
      apiFetch<TutorVinculado[]>(`/students/${studentId}/guardians`, { institutionId }),
      apiFetch<Tutor[]>("/guardians", { institutionId }),
    ])
      .then(([vinculados, todos]) => {
        if (!cancelado) setCarga({ status: "ready", vinculados, todos });
      })
      .catch(() => {
        if (!cancelado) setCarga({ status: "error" });
      });

    return () => {
      cancelado = true;
    };
  }, [institutionId, studentId, intento]);

  function actualizar(fn: (vinculados: TutorVinculado[]) => TutorVinculado[]) {
    setCarga((actual) =>
      actual.status === "ready" ? { ...actual, vinculados: ordenar(fn(actual.vinculados)) } : actual
    );
  }

  async function enviar(accion: () => Promise<void>) {
    setEnviando(true);
    setError(null);
    try {
      await accion();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "No se pudo conectar. Probá de nuevo en un rato.");
    } finally {
      setEnviando(false);
    }
  }

  function vincular(datos: { guardianMembershipId: string; relationship?: string; phone?: string }) {
    return enviar(async () => {
      const tutor = await apiFetch<TutorVinculado>(`/students/${studentId}/guardians`, {
        method: "POST",
        institutionId,
        headers: JSON_HEADERS,
        body: JSON.stringify(datos),
      });
      actualizar((vinculados) => [...vinculados, tutor]);
      setAgregando(false);
    });
  }

  function guardar(id: string, cambios: { relationship?: string | null; phone?: string }) {
    return enviar(async () => {
      const tutor = await apiFetch<TutorVinculado>(`/students/${studentId}/guardians/${id}`, {
        method: "PATCH",
        institutionId,
        headers: JSON_HEADERS,
        body: JSON.stringify(cambios),
      });
      actualizar((vinculados) => vinculados.map((otro) => (otro.id === id ? tutor : otro)));
      setEditando(null);
    });
  }

  function quitar(id: string) {
    // Primer toque pide confirmación; el segundo desvincula de verdad.
    if (confirmando !== id) {
      setConfirmando(id);
      return;
    }
    setConfirmando(null);
    return enviar(async () => {
      await apiFetch(`/students/${studentId}/guardians/${id}`, { method: "DELETE", institutionId });
      actualizar((vinculados) => vinculados.filter((tutor) => tutor.id !== id));
    });
  }

  const listo = carga.status === "ready";
  const botonAgregar = (
    <button
      type="button"
      disabled={!listo}
      aria-expanded={agregando}
      onClick={() => setAgregando((actual) => !actual)}
      className="flex shrink-0 items-center gap-2 rounded-xl border border-blue/30 bg-white px-3 py-1.5 text-sm font-medium text-ink disabled:opacity-50"
    >
      <Icono className="h-4 w-4">
        <path d="M12 5v14M5 12h14" />
      </Icono>
      Agregar tutor
    </button>
  );

  let contenido: ReactNode;
  if (carga.status === "loading") {
    contenido = <PantallaCargando titulo="Cargando tutores..." />;
  } else if (carga.status === "error") {
    contenido = (
      <PantallaError
        titulo="Error al cargar los tutores"
        claseBoton={`${BOTON_NARANJA} inline-flex items-center gap-2`}
        onReintentar={() => {
          setCarga({ status: "loading" });
          setIntento((actual) => actual + 1);
        }}
      />
    );
  } else if (carga.vinculados.length === 0 && !agregando) {
    contenido = (
      <PantallaVacia
        titulo="No hay tutores registrados"
        texto="Aún no se han agregado tutores para este alumno."
        icono={
          <>
            <circle cx="9" cy="8" r="3.5" />
            <path d="M2.5 20c0-4 3-6.5 6.5-6.5s6.5 2.5 6.5 6.5M16 5a3.5 3.5 0 0 1 0 6.5M18 14c2 .8 3.5 3 3.5 6" />
          </>
        }
      >
        <button
          type="button"
          onClick={() => setAgregando(true)}
          className={`inline-flex items-center gap-2 ${BOTON_NARANJA}`}
        >
          <Icono className="h-5 w-5">
            <path d="M12 5v14M5 12h14" />
          </Icono>
          Agregar tutor
        </button>
      </PantallaVacia>
    );
  } else {
    contenido = (
      <ul aria-label="Tutores vinculados" className="flex flex-col gap-3">
        {carga.vinculados.map((tutor) => (
          <TarjetaTutor
            key={tutor.id}
            tutor={tutor}
            confirmando={confirmando === tutor.id}
            onEditar={() => setEditando(tutor.id)}
            onQuitar={() => quitar(tutor.id)}
          >
            {editando === tutor.id && (
              <EditarTutor
                tutor={tutor}
                enviando={enviando}
                onGuardar={(cambios) => guardar(tutor.id, cambios)}
                onCancelar={() => setEditando(null)}
              />
            )}
          </TarjetaTutor>
        ))}
      </ul>
    );
  }

  const idsVinculados = new Set(listo ? carga.vinculados.map((tutor) => tutor.id) : []);
  const disponibles = listo ? carga.todos.filter((tutor) => !idsVinculados.has(tutor.id)) : [];

  return (
    <section className={`flex flex-col gap-3 p-4 ${TARJETA}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-xl font-semibold text-ink">Tutores{listo ? ` (${carga.vinculados.length})` : ""}</h3>
        {botonAgregar}
      </div>

      {agregando && listo && (
        <AgregarTutor
          disponibles={disponibles}
          enviando={enviando}
          onVincular={vincular}
          onCancelar={() => setAgregando(false)}
        />
      )}

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      {contenido}
    </section>
  );
}
