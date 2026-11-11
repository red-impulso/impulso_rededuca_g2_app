"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { ApiError, apiFetch } from "../../lib/api";
import { CAMPO, TARJETA } from "../institution/admin-ui";
import type { Course } from "../institution/institution";
import type { Student, StudentFile } from "./students";
import { cursoAlumno } from "./students";

interface Valores {
  firstName: string;
  lastName: string;
  dni: string;
  email: string;
  courseId: string;
  birthDate: string;
  address: string;
  phone: string;
  status: string;
}

function valoresDe(alumno?: StudentFile): Valores {
  return {
    firstName: alumno?.firstName ?? "",
    lastName: alumno?.lastName ?? "",
    dni: alumno?.dni ?? "",
    email: alumno?.email ?? "",
    courseId: alumno?.course?.id ?? "",
    birthDate: alumno?.birthDate ?? "",
    address: alumno?.address ?? "",
    phone: alumno?.phone ?? "",
    status: alumno?.status ?? "active",
  };
}

// En el alta van los campos completos; al editar, solo lo que cambió (así un
// dato vacío borra y un alumno sin DNI cargado se puede guardar igual).
function cuerpo(valores: Valores, alumno?: StudentFile) {
  const inicial = valoresDe(alumno);
  const campos = Object.entries(valores).map(([campo, valor]) => [campo, valor.trim()]);

  if (alumno) {
    return Object.fromEntries(
      campos.filter(([campo, valor]) => campo !== "email" && valor !== inicial[campo as keyof Valores])
    );
  }
  return Object.fromEntries(campos.filter(([campo, valor]) => campo !== "status" && valor !== ""));
}

export function AlumnoForm({
  institutionId,
  cursos,
  alumno,
  onGuardado,
  onCancelar,
}: {
  institutionId: string;
  cursos: Course[];
  alumno?: StudentFile;
  onGuardado: (id: string) => void;
  onCancelar: () => void;
}) {
  const [valores, setValores] = useState<Valores>(() => valoresDe(alumno));
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function campo(nombre: keyof Valores) {
    return {
      value: valores[nombre],
      onChange: (e: { target: { value: string } }) => setValores({ ...valores, [nombre]: e.target.value }),
      className: CAMPO,
    };
  }

  async function guardar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      const guardado = await apiFetch<Student>(alumno ? `/students/${alumno.id}` : "/students", {
        method: alumno ? "PATCH" : "POST",
        institutionId,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cuerpo(valores, alumno)),
      });
      onGuardado(guardado.id);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "No se pudo conectar. Probá de nuevo en un rato.");
      setEnviando(false);
    }
  }

  if (cursos.length === 0) {
    return (
      <div className={`flex flex-col items-start gap-3 p-4 ${TARJETA}`}>
        <p>Para cargar un alumno primero tiene que existir su curso.</p>
        <Link href="/institucion/cursos" className="font-medium text-blue hover:underline">
          Crear un curso
        </Link>
        <button type="button" onClick={onCancelar} className="rounded-xl border border-gray-300 px-4 py-2">
          Cancelar
        </button>
      </div>
    );
  }

  const etiqueta = "flex flex-col gap-1 text-sm";

  return (
    <form onSubmit={guardar} className={`flex flex-col gap-3 p-4 ${TARJETA}`}>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className={etiqueta}>
          Nombre
          <input type="text" required {...campo("firstName")} />
        </label>
        <label className={etiqueta}>
          Apellido
          <input type="text" required {...campo("lastName")} />
        </label>
        <label className={etiqueta}>
          DNI
          <input type="text" inputMode="numeric" required={!alumno || !!alumno.dni} {...campo("dni")} />
        </label>
        {!alumno && (
          <label className={etiqueta}>
            Correo electrónico
            <input type="email" required {...campo("email")} />
          </label>
        )}
        <label className={etiqueta}>
          Curso
          <select required {...campo("courseId")}>
            <option value="">Elegí un curso</option>
            {cursos.map((curso) => (
              <option key={curso.id} value={curso.id}>
                {cursoAlumno(curso)} · {curso.schoolYear}
              </option>
            ))}
          </select>
        </label>
        <label className={etiqueta}>
          Fecha de nacimiento
          <input type="date" {...campo("birthDate")} />
        </label>
        <label className={etiqueta}>
          Dirección
          <input type="text" {...campo("address")} />
        </label>
        <label className={etiqueta}>
          Teléfono
          <input type="text" inputMode="tel" {...campo("phone")} />
        </label>
        {alumno && (
          <label className={etiqueta}>
            Estado
            <select {...campo("status")}>
              <option value="active">Activo</option>
              <option value="inactive">Inactivo</option>
            </select>
          </label>
        )}
      </div>

      {error && (
        <p role="alert" className="text-sm text-rojo">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={enviando}
          className="rounded-full bg-accent px-5 py-2 font-medium text-ink disabled:opacity-50"
        >
          {enviando ? "Guardando..." : "Guardar"}
        </button>
        <button type="button" onClick={onCancelar} className="rounded-xl border border-gray-300 px-4 py-2">
          Cancelar
        </button>
      </div>
    </form>
  );
}
