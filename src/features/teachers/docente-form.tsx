"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { BOTON_ACCION } from "../../components/ui/pantalla-estado";
import { ApiError, apiFetch } from "../../lib/api";
import { CAMPO, TARJETA } from "../institution/admin-ui";
import type { DocenteFicha } from "./docentes";

function Campo({ etiqueta, children }: { etiqueta: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-sm font-medium text-ink">
      {etiqueta}
      {children}
    </label>
  );
}

// Un campo vacío se manda como null: la API lo borra.
function texto(valor: string): string | null {
  return valor.trim() || null;
}

export function DocenteForm({
  institutionId,
  docente,
  onGuardado,
  onCancelar,
}: {
  institutionId: string;
  docente: DocenteFicha | null;
  onGuardado: (id: string) => void;
  onCancelar: () => void;
}) {
  const [fullName, setFullName] = useState(docente?.fullName ?? "");
  const [dni, setDni] = useState(docente?.dni ?? "");
  const [email, setEmail] = useState("");
  const [clave, setClave] = useState("");
  const [phone, setPhone] = useState(docente?.phone ?? "");
  const [training, setTraining] = useState(docente?.training ?? "");
  const [startYear, setStartYear] = useState(docente?.startYear?.toString() ?? "");
  const [notes, setNotes] = useState(docente?.notes ?? "");
  const [status, setStatus] = useState(docente?.status ?? "active");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const anio = startYear ? Number(startYear) : null;

  function cuerpo(): Record<string, unknown> | null {
    const datos = {
      fullName: fullName.trim(),
      dni: texto(dni),
      phone: texto(phone),
      training: texto(training),
      startYear: anio,
      notes: texto(notes),
    };
    if (!docente) return { ...datos, email: email.trim(), temporaryPassword: clave };

    const cambios: Record<string, unknown> = Object.fromEntries(
      Object.entries(datos).filter(([campo, valor]) => valor !== (docente[campo as keyof typeof datos] ?? null))
    );
    if (status !== docente.status) cambios.status = status;
    return Object.keys(cambios).length > 0 ? cambios : null;
  }

  async function guardar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const datos = cuerpo();
    if (!datos) {
      onCancelar();
      return;
    }

    setEnviando(true);
    setError(null);
    try {
      const guardado = await apiFetch<{ id: string }>(docente ? `/teachers/${docente.id}` : "/teachers", {
        method: docente ? "PATCH" : "POST",
        institutionId,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datos),
      });
      onGuardado(docente?.id ?? guardado.id);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "No se pudo conectar. Probá de nuevo en un rato.");
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={guardar} className={`flex flex-col gap-4 p-5 ${TARJETA}`}>
      <h2 className="text-lg font-semibold text-ink">{docente ? "Editar docente" : "Nuevo docente"}</h2>

      <Campo etiqueta="Nombre y apellido">
        <input required value={fullName} onChange={(e) => setFullName(e.target.value)} className={CAMPO} />
      </Campo>

      <div className="grid gap-4 sm:grid-cols-2">
        <Campo etiqueta="DNI">
          <input value={dni} onChange={(e) => setDni(e.target.value)} className={CAMPO} />
        </Campo>
        <Campo etiqueta="Teléfono">
          <input value={phone} onChange={(e) => setPhone(e.target.value)} className={CAMPO} />
        </Campo>
      </div>

      {!docente && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Campo etiqueta="Correo electrónico">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={CAMPO}
            />
          </Campo>
          <Campo etiqueta="Contraseña temporal">
            <input
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              value={clave}
              onChange={(e) => setClave(e.target.value)}
              className={CAMPO}
            />
          </Campo>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Campo etiqueta="Formación">
          <input value={training} onChange={(e) => setTraining(e.target.value)} className={CAMPO} />
        </Campo>
        <Campo etiqueta="Año de ingreso">
          <input
            type="number"
            min={1950}
            max={new Date().getFullYear()}
            value={startYear}
            onChange={(e) => setStartYear(e.target.value)}
            className={CAMPO}
          />
        </Campo>
      </div>

      <Campo etiqueta="Observaciones">
        <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} className={CAMPO} />
      </Campo>

      {docente && (
        <Campo etiqueta="Estado">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as DocenteFicha["status"])}
            className={CAMPO}
          >
            <option value="active">Activo</option>
            <option value="inactive">Inactivo</option>
          </select>
        </Campo>
      )}

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button type="button" onClick={onCancelar} className="rounded-xl border border-gray-300 px-6 py-2.5 text-ink">
          Cancelar
        </button>
        <button type="submit" disabled={enviando} className={`${BOTON_ACCION} bg-accent`}>
          Guardar
        </button>
      </div>
    </form>
  );
}
