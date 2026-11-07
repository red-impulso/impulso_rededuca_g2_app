"use client";

import { useState, type FormEvent } from "react";
import { BOTON_ACCION } from "../../components/ui/pantalla-estado";
import type { Role } from "../../config/navigation";
import { ApiError, apiFetch } from "../../lib/api";
import { CAMPO, TARJETA } from "../institution/admin-ui";
import { ETIQUETA_ROL, ROLES_USUARIO, type Usuario } from "./users";

function Campo({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-sm font-medium text-ink">
      {etiqueta}
      {children}
    </label>
  );
}

// Alta y edición. Editar no toca el correo ni la contraseña: son de la cuenta,
// y la cuenta puede estar en otras escuelas.
export function UsuarioForm({
  institutionId,
  usuario,
  onGuardado,
  onCancelar,
}: {
  institutionId: string;
  usuario: Usuario | null;
  onGuardado: (usuario: Usuario) => void;
  onCancelar: () => void;
}) {
  const [fullName, setFullName] = useState(usuario?.fullName ?? "");
  const [email, setEmail] = useState(usuario?.email ?? "");
  const [role, setRole] = useState<Role>(usuario?.role ?? "teacher");
  const [status, setStatus] = useState(usuario?.status ?? "active");
  const [clave, setClave] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function cuerpo(): Record<string, string> | null {
    const nombre = fullName.trim();
    if (!usuario) return { fullName: nombre, email: email.trim(), role, temporaryPassword: clave };

    const cambios: Record<string, string> = {
      ...(nombre !== (usuario.fullName ?? "") && { fullName: nombre }),
      ...(role !== usuario.role && { role }),
      ...(status !== usuario.status && { status }),
    };
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
      const guardado = await apiFetch<Usuario>(usuario ? `/memberships/${usuario.id}` : "/users", {
        method: usuario ? "PATCH" : "POST",
        institutionId,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datos),
      });
      onGuardado(guardado);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "No se pudo conectar. Probá de nuevo en un rato.");
      setEnviando(false);
    }
  }

  // Un estudiante no se da de alta acá, pero sí puede aparecer al editar.
  const roles =
    usuario?.role === "student"
      ? [...ROLES_USUARIO, { value: usuario.role, label: ETIQUETA_ROL.student }]
      : ROLES_USUARIO;

  return (
    <form onSubmit={guardar} className={`flex max-w-2xl flex-col gap-4 p-5 ${TARJETA}`}>
      <h2 className="text-lg font-semibold text-ink">{usuario ? "Editar usuario" : "Agregar usuario"}</h2>

      <Campo etiqueta="Nombre y apellido">
        <input required value={fullName} onChange={(e) => setFullName(e.target.value)} className={CAMPO} />
      </Campo>

      <Campo etiqueta="Correo electrónico">
        <input
          type="email"
          required
          disabled={usuario !== null}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={`${CAMPO} disabled:bg-gray-100 disabled:text-gray-500`}
        />
      </Campo>

      <Campo etiqueta="Rol">
        <select value={role} onChange={(e) => setRole(e.target.value as Role)} className={CAMPO}>
          {roles.map((opcion) => (
            <option key={opcion.value} value={opcion.value}>
              {opcion.label}
            </option>
          ))}
        </select>
      </Campo>

      {usuario ? (
        <Campo etiqueta="Estado">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as Usuario["status"])}
            className={CAMPO}
          >
            <option value="active">Activo</option>
            <option value="inactive">Inactivo</option>
          </select>
        </Campo>
      ) : (
        <div className="flex flex-col gap-1">
          <Campo etiqueta="Contraseña temporal">
            <input
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              aria-describedby="ayuda-clave"
              value={clave}
              onChange={(e) => setClave(e.target.value)}
              className={CAMPO}
            />
          </Campo>
          <p id="ayuda-clave" className="text-sm text-gray-600">
            Al menos 6 caracteres. Si el correo ya tiene cuenta en otra escuela, sigue usando su contraseña.
          </p>
        </div>
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
        <button type="submit" disabled={enviando} className={`${BOTON_ACCION} bg-blue`}>
          Guardar
        </button>
      </div>
    </form>
  );
}
