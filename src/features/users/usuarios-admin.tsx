"use client";

import { useEffect, useState } from "react";
import { Icono } from "../../components/ui/estado";
import {
  Aviso,
  Avatar,
  BOTON_ACCION,
  inicialesDe,
  PantallaCargando,
  PantallaError,
  PantallaVacia,
} from "../../components/ui/pantalla-estado";
import { ApiError, apiFetch } from "../../lib/api";
import { Buscador, CAMPO, Insignia, MenuAcciones, Paginacion, POR_PAGINA, TARJETA } from "../institution/admin-ui";
import { normalizar } from "../students/students";
import { UsuarioForm } from "./usuario-form";
import { COLOR_ROL, ETIQUETA_ROL, type Usuario } from "./users";
import type { Role } from "../../config/navigation";

type Carga = { status: "loading" } | { status: "error" } | { status: "ready"; usuarios: Usuario[] };

// null: la lista. Si no, el formulario: "nuevo" o el usuario que se edita.
type Formulario = "nuevo" | Usuario | null;

const SIN_NOMBRE = "Sin nombre";
const COLUMNAS = "md:grid md:grid-cols-[2.2fr_1.6fr_1.1fr_1.2fr_0.8fr_auto] md:items-center md:gap-3";

const ICONO_USUARIOS = (
  <>
    <circle cx="9" cy="8" r="3.5" />
    <path d="M2.5 20c0-4 3-6.5 6.5-6.5s6.5 2.5 6.5 6.5M16 5a3.5 3.5 0 0 1 0 6.5M18 14c2 .8 3.5 3 3.5 6" />
  </>
);

function ordenar(usuarios: Usuario[]): Usuario[] {
  return [...usuarios].sort((a, b) => (a.fullName ?? "").localeCompare(b.fullName ?? "", "es"));
}

function BotonAgregar({ color, onClick }: { color: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={`${BOTON_ACCION} ${color}`}>
      <Icono className="h-5 w-5">
        <path d="M12 5v14M5 12h14" />
      </Icono>
      Agregar usuario
    </button>
  );
}

function FilaUsuario({
  usuario,
  escuela,
  confirmando,
  onEditar,
  onCambiarEstado,
  onEliminar,
}: {
  usuario: Usuario;
  escuela: string;
  confirmando: boolean;
  onEditar: () => void;
  onCambiarEstado: () => void;
  onEliminar: () => void;
}) {
  const nombre = usuario.fullName ?? SIN_NOMBRE;
  const pildora = `rounded-full px-2.5 py-1 text-center text-xs font-medium md:px-3 md:text-sm ${COLOR_ROL[usuario.role]}`;

  return (
    <li aria-label={nombre} className={`flex items-center gap-3 px-4 py-3 ${COLUMNAS}`}>
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <Avatar iniciales={inicialesDe(usuario.fullName)} />
        <div className="min-w-0">
          <p className="break-words font-semibold text-ink md:truncate">{nombre}</p>
          <p className="truncate text-sm text-gray-600">{usuario.email}</p>
        </div>
      </div>
      <p className="hidden truncate text-sm text-gray-600 md:block">{usuario.email}</p>
      <p className="shrink-0 md:justify-self-start">
        <span className={pildora}>{ETIQUETA_ROL[usuario.role]}</span>
      </p>
      <p className="hidden truncate text-sm text-gray-600 md:block">{escuela}</p>
      <p className="hidden md:block">
        <Insignia activa={usuario.status === "active"}>{usuario.status === "active" ? "Activo" : "Inactivo"}</Insignia>
      </p>
      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          aria-label={`Editar a ${nombre}`}
          onClick={onEditar}
          className="hidden h-9 w-9 items-center justify-center rounded-full text-blue hover:bg-blue/10 md:flex"
        >
          <Icono className="h-5 w-5">
            <path d="m4 20 1-4L16 5l3 3L8 19zM14 7l3 3" />
          </Icono>
        </button>
        <MenuAcciones
          nombre={nombre}
          confirmando={confirmando}
          puntosEnCelular
          onEditar={onEditar}
          onEliminar={onEliminar}
          extra={{
            texto: usuario.status === "active" ? "Desactivar" : "Activar",
            onClick: onCambiarEstado,
          }}
        />
      </div>
    </li>
  );
}

export function UsuariosAdmin({ institutionId, institutionName }: { institutionId: string; institutionName: string }) {
  const [carga, setCarga] = useState<Carga>({ status: "loading" });
  const [intento, setIntento] = useState(0);
  const [formulario, setFormulario] = useState<Formulario>(null);
  const [busqueda, setBusqueda] = useState("");
  const [rolFiltro, setRolFiltro] = useState<Role | "todos">("todos");
  const [estadoFiltro, setEstadoFiltro] = useState<Usuario["status"] | "todos">("todos");
  const [pagina, setPagina] = useState(0);
  const [aviso, setAviso] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmando, setConfirmando] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;

    apiFetch<Usuario[]>("/users", { institutionId })
      .then((usuarios) => {
        if (!cancelado) setCarga({ status: "ready", usuarios });
      })
      .catch(() => {
        if (!cancelado) setCarga({ status: "error" });
      });

    return () => {
      cancelado = true;
    };
  }, [institutionId, intento]);

  function actualizar(fn: (usuarios: Usuario[]) => Usuario[]) {
    setCarga((actual) => (actual.status === "ready" ? { ...actual, usuarios: ordenar(fn(actual.usuarios)) } : actual));
  }

  function guardado(usuario: Usuario) {
    const esNuevo = formulario === "nuevo";
    actualizar((usuarios) => [...usuarios.filter((otro) => otro.id !== usuario.id), usuario]);
    setFormulario(null);
    setAviso(esNuevo ? "Usuario agregado correctamente" : "Usuario actualizado correctamente");
  }

  async function enviar(accion: () => Promise<void>) {
    setError(null);
    setAviso(null);
    try {
      await accion();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "No se pudo conectar. Probá de nuevo en un rato.");
    }
  }

  function cambiarEstado(usuario: Usuario) {
    return enviar(async () => {
      const actualizado = await apiFetch<Usuario>(`/memberships/${usuario.id}`, {
        method: "PATCH",
        institutionId,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: usuario.status === "active" ? "inactive" : "active" }),
      });
      actualizar((usuarios) => usuarios.map((otro) => (otro.id === actualizado.id ? actualizado : otro)));
    });
  }

  function eliminar(usuario: Usuario) {
    // Primer toque pide confirmación; el segundo borra de verdad.
    if (confirmando !== usuario.id) {
      setConfirmando(usuario.id);
      return;
    }
    setConfirmando(null);
    return enviar(async () => {
      await apiFetch(`/memberships/${usuario.id}`, { method: "DELETE", institutionId });
      actualizar((usuarios) => usuarios.filter((otro) => otro.id !== usuario.id));
      setAviso("Usuario eliminado correctamente");
    });
  }

  if (carga.status === "loading") return <PantallaCargando titulo="Cargando usuarios..." />;

  if (carga.status === "error") {
    return (
      <PantallaError
        titulo="Ocurrió un error"
        texto="No pudimos cargar los usuarios. Intentá de nuevo."
        tono="naranja"
        claseBoton={`${BOTON_ACCION} bg-blue text-white`}
        onReintentar={() => {
          setCarga({ status: "loading" });
          setIntento((actual) => actual + 1);
        }}
      />
    );
  }

  if (formulario) {
    return (
      <UsuarioForm
        institutionId={institutionId}
        usuario={formulario === "nuevo" ? null : formulario}
        onGuardado={guardado}
        onCancelar={() => setFormulario(null)}
      />
    );
  }

  if (carga.usuarios.length === 0) {
    return (
      <PantallaVacia
        titulo="No hay usuarios cargados"
        texto="Agregá el primer usuario para comenzar."
        icono={ICONO_USUARIOS}
      >
        <BotonAgregar color="bg-accent text-ink" onClick={() => setFormulario("nuevo")} />
      </PantallaVacia>
    );
  }

  const buscado = normalizar(busqueda.trim());
  const filtrados = carga.usuarios.filter(
    (usuario) =>
      (rolFiltro === "todos" || usuario.role === rolFiltro) &&
      (estadoFiltro === "todos" || usuario.status === estadoFiltro) &&
      normalizar([usuario.fullName, usuario.email, ETIQUETA_ROL[usuario.role]].filter(Boolean).join(" ")).includes(
        buscado
      )
  );
  const ultimaPagina = Math.max(0, Math.ceil(filtrados.length / POR_PAGINA) - 1);
  const paginaActual = Math.min(pagina, ultimaPagina);
  const visibles = filtrados.slice(paginaActual * POR_PAGINA, (paginaActual + 1) * POR_PAGINA);

  return (
    <div className="flex flex-col gap-4">
      {aviso && <Aviso texto={aviso} onCerrar={() => setAviso(null)} />}
      {error && (
        <p role="alert" className="text-sm text-rojo">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-3 md:flex-row">
        <Buscador
          nombre="por nombre, usuario o rol"
          valor={busqueda}
          onChange={(valor) => {
            setBusqueda(valor);
            setPagina(0);
          }}
        />
        <BotonAgregar color="bg-blue text-white" onClick={() => setFormulario("nuevo")} />
      </div>

      {/* Filtros por rol y estado (Prompt 11 del informe de diseño). */}
      <div className="flex flex-col gap-2 sm:flex-row">
        <label className="flex flex-1 items-center gap-2">
          <span className="shrink-0 text-sm font-medium text-ink">Rol</span>
          <select
            value={rolFiltro}
            onChange={(e) => {
              setRolFiltro(e.target.value as Role | "todos");
              setPagina(0);
            }}
            className={`${CAMPO} flex-1`}
          >
            <option value="todos">Todos</option>
            {(Object.keys(ETIQUETA_ROL) as Role[]).map((rol) => (
              <option key={rol} value={rol}>
                {ETIQUETA_ROL[rol]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-1 items-center gap-2">
          <span className="shrink-0 text-sm font-medium text-ink">Estado</span>
          <select
            value={estadoFiltro}
            onChange={(e) => {
              setEstadoFiltro(e.target.value as Usuario["status"] | "todos");
              setPagina(0);
            }}
            className={`${CAMPO} flex-1`}
          >
            <option value="todos">Todos</option>
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
          </select>
        </label>
      </div>

      {filtrados.length === 0 ? (
        <p className={`p-6 text-center text-gray-600 ${TARJETA}`}>No se encontraron usuarios con esa búsqueda.</p>
      ) : (
        <div className={TARJETA}>
          <div
            aria-hidden
            className={`hidden rounded-t-2xl bg-blue/5 px-4 py-3 text-sm font-semibold text-ink ${COLUMNAS}`}
          >
            <span>Nombre</span>
            <span>Usuario</span>
            <span>Rol</span>
            <span>Escuela</span>
            <span>Estado</span>
            <span className="w-[4.75rem] text-center">Acciones</span>
          </div>
          <ul aria-label="Usuarios" className="divide-y divide-blue/10">
            {visibles.map((usuario) => (
              <FilaUsuario
                key={usuario.id}
                usuario={usuario}
                escuela={institutionName}
                confirmando={confirmando === usuario.id}
                onEditar={() => setFormulario(usuario)}
                onCambiarEstado={() => cambiarEstado(usuario)}
                onEliminar={() => eliminar(usuario)}
              />
            ))}
          </ul>
          <Paginacion
            numerada
            total={filtrados.length}
            pagina={paginaActual}
            nombre="usuarios"
            separador="–"
            onCambiar={setPagina}
          />
        </div>
      )}
    </div>
  );
}
