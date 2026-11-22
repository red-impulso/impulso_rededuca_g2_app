"use client";

import { useEffect, useRef, useState } from "react";
import { ApiError, apiFetch } from "../../lib/api";
import { Toast } from "../../components/ui/alerta";
import { leerCodigoAlumno } from "../qr/codigo-alumno";
import { EscanerQr } from "./escaner-qr";

type Status = "present" | "absent" | "late" | "justified";

// Lo que devuelve GET /attendance (ver README de la API).
interface AttendanceRow {
  student: { id: string; firstName: string | null; lastName: string | null };
  status: Status | null;
}

type Carga =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; rows: AttendanceRow[] };

type Guardado =
  | { status: "idle" }
  | { status: "saving" }
  | { status: "saved" }
  | { status: "error"; message: string };

const ESTADOS: { value: Status; letra: string; etiqueta: string; marcado: string }[] = [
  { value: "present", letra: "P", etiqueta: "Presente", marcado: "bg-green text-ink" },
  { value: "absent", letra: "A", etiqueta: "Ausente", marcado: "bg-rojo text-white" },
  { value: "late", letra: "T", etiqueta: "Tarde", marcado: "bg-accent text-ink" },
  { value: "justified", letra: "J", etiqueta: "Justificado", marcado: "bg-blue text-white" },
];

function mensajeDe(error: unknown): string {
  return error instanceof ApiError ? error.message : "No se pudo conectar. Probá de nuevo en un rato.";
}

// La fecha de hoy en la hora de la compu o el celular. toISOString() no sirve:
// da la hora universal, y después de las 21 h de Argentina ya sería mañana.
export function hoyLocal(): string {
  const ahora = new Date();
  const mes = `${ahora.getMonth() + 1}`.padStart(2, "0");
  const dia = `${ahora.getDate()}`.padStart(2, "0");
  return `${ahora.getFullYear()}-${mes}-${dia}`;
}

function nombreDe({ student }: AttendanceRow): string {
  return `${student.lastName ?? ""}, ${student.firstName ?? ""}`;
}

// Un "bip" corto al leer un carnet (si el navegador deja).
function pitido() {
  try {
    const Contexto =
      window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Contexto) return;
    const audio = new Contexto();
    const oscilador = audio.createOscillator();
    const volumen = audio.createGain();
    oscilador.frequency.value = 880;
    volumen.gain.value = 0.15;
    oscilador.connect(volumen).connect(audio.destination);
    oscilador.start();
    oscilador.stop(audio.currentTime + 0.12);
    oscilador.onended = () => void audio.close();
  } catch {
    // Sin sonido no pasa nada: el mensaje en pantalla alcanza.
  }
}

// La cámara lee el mismo QR muchas veces por segundo: se toma una vez cada 2,5 s.
const ESPERA_MISMO_QR = 2500;

export function AttendanceSheet({
  institutionId,
  courseId,
  date,
}: {
  institutionId: string;
  courseId: string;
  date: string;
}) {
  const [carga, setCarga] = useState<Carga>({ status: "loading" });
  const [marcas, setMarcas] = useState<Record<string, Status>>({});
  const [guardado, setGuardado] = useState<Guardado>({ status: "idle" });
  const [escaneando, setEscaneando] = useState(false);
  const [mensajeQr, setMensajeQr] = useState<string | null>(null);
  const ultimoQr = useRef({ texto: "", ms: 0 });

  useEffect(() => {
    let cancelado = false;

    apiFetch<AttendanceRow[]>(`/attendance?courseId=${courseId}&date=${date}`, { institutionId })
      .then((rows) => {
        if (cancelado) return;
        setMarcas(
          Object.fromEntries(
            rows.flatMap((row) => (row.status ? [[row.student.id, row.status]] : []))
          )
        );
        setCarga({ status: "ready", rows });
      })
      .catch((error) => {
        if (!cancelado) setCarga({ status: "error", message: mensajeDe(error) });
      });

    return () => {
      cancelado = true;
    };
  }, [institutionId, courseId, date]);

  if (carga.status === "loading") return <p>Cargando lista...</p>;

  if (carga.status === "error") {
    return (
      <p role="alert" className="text-rojo">
        {carga.message}
      </p>
    );
  }

  if (carga.rows.length === 0) return <p>Este curso todavía no tiene alumnos.</p>;

  const { rows } = carga;
  const faltan = rows.filter((row) => !marcas[row.student.id]).length;
  const cambio = (row: AttendanceRow) =>
    marcas[row.student.id] !== undefined && marcas[row.student.id] !== row.status;
  const guardando = guardado.status === "saving";
  const puedeGuardar = faltan === 0 && !guardando && rows.some(cambio);

  function marcar(studentId: string, status: Status) {
    setMarcas((actuales) => ({ ...actuales, [studentId]: status }));
    setGuardado({ status: "idle" });
  }

  // Solo completa a los que faltan: no pisa a quien ya se marcó ausente.
  function todosPresentes() {
    setMarcas((actuales) =>
      Object.fromEntries(
        rows.map((row) => [row.student.id, actuales[row.student.id] ?? ("present" as Status)])
      )
    );
    setGuardado({ status: "idle" });
  }

  function alLeerQr(texto: string) {
    const ahora = Date.now();
    if (texto === ultimoQr.current.texto && ahora - ultimoQr.current.ms < ESPERA_MISMO_QR) return;
    ultimoQr.current = { texto, ms: ahora };

    const studentId = leerCodigoAlumno(texto);
    if (!studentId) {
      setMensajeQr("Ese QR no es un carnet de RedEduca.");
      return;
    }
    const fila = rows.find((row) => row.student.id === studentId);
    if (!fila) {
      setMensajeQr("Ese alumno no es de este curso.");
      return;
    }
    marcar(studentId, "present");
    setMensajeQr(`✓ ${nombreDe(fila)}: presente`);
    pitido();
    navigator.vibrate?.(80);
  }

  async function guardar() {
    const cambios = rows.filter(cambio);
    setGuardado({ status: "saving" });

    try {
      await apiFetch("/attendance", {
        method: "PUT",
        institutionId,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId,
          date,
          entries: cambios.map((row) => ({
            studentId: row.student.id,
            status: marcas[row.student.id],
          })),
        }),
      });
      setCarga({
        status: "ready",
        rows: rows.map((row) => ({ ...row, status: marcas[row.student.id] ?? row.status })),
      });
      setGuardado({ status: "saved" });
    } catch (error) {
      setGuardado({ status: "error", message: mensajeDe(error) });
    }
  }

  const marcados = rows.length - faltan;
  const presentes = rows.filter((row) => marcas[row.student.id] === "present").length;
  const porcentaje = marcados === 0 ? 0 : Math.round((presentes / marcados) * 100);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={todosPresentes}
            className="rounded-full border border-primario px-4 py-2 text-sm font-semibold text-primario transition hover:bg-primario/10"
          >
            Todos presentes
          </button>
          {/* El alumno muestra el QR de su carnet y queda presente. */}
          <button
            type="button"
            onClick={() => {
              setMensajeQr(null);
              ultimoQr.current = { texto: "", ms: 0 };
              setEscaneando(true);
            }}
            className="flex items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110"
          >
            <svg viewBox="0 0 24 24" aria-hidden className="h-4 w-4 fill-none stroke-current" strokeWidth="2">
              <path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3M8 12h8" />
            </svg>
            Escanear QR
          </button>
        </div>

        {/* Resumen del día con barra de progreso (prototipo de asistencia) */}
        <div className="flex items-center gap-3 rounded-2xl border border-white/80 bg-white/80 px-4 py-2 text-sm shadow-[0_8px_30px_rgba(20,24,90,0.06)]">
          <span className="text-gray-600">
            Asistencia: <strong className="text-ink">{porcentaje}%</strong>
          </span>
          <span aria-hidden className="h-2 w-24 overflow-hidden rounded-full bg-green/15">
            <span className="block h-full rounded-full bg-green" style={{ width: `${porcentaje}%` }} />
          </span>
        </div>
      </div>

      {mensajeQr && (
        <p role="status" className="rounded-xl bg-green/15 px-3 py-2 text-sm font-semibold text-ink">
          {mensajeQr}
        </p>
      )}

      {escaneando && (
        <EscanerQr onCodigo={alLeerQr} onCerrar={() => setEscaneando(false)} mensaje={mensajeQr ?? undefined} />
      )}

      <ul className="flex flex-col divide-y divide-gray-100 rounded-2xl border border-gray-200 bg-white px-4 shadow-[0_8px_30px_rgba(20,24,90,0.06)]">
        {rows.map((row) => (
          <li key={row.student.id} className="py-2.5">
            <div
              role="group"
              aria-label={nombreDe(row)}
              className="flex flex-wrap items-center justify-between gap-2"
            >
              <span className="font-medium">{nombreDe(row)}</span>
              {/* Letra + color: el estado nunca depende solo del color */}
              <span className="flex gap-1.5">
                {ESTADOS.map((estado) => {
                  const activo = marcas[row.student.id] === estado.value;
                  return (
                    <button
                      key={estado.value}
                      type="button"
                      aria-label={estado.etiqueta}
                      title={estado.etiqueta}
                      aria-pressed={activo}
                      onClick={() => marcar(row.student.id, estado.value)}
                      className={`flex h-11 w-11 items-center justify-center rounded-xl border font-semibold transition ${
                        activo ? `${estado.marcado} border-transparent` : "border-gray-300 bg-white text-gray-500 hover:border-gray-400"
                      }`}
                    >
                      {estado.letra}
                    </button>
                  );
                })}
              </span>
            </div>
          </li>
        ))}
      </ul>

      {faltan > 0 && (
        <p className="text-sm text-gray-600">
          {faltan === 1 ? "Falta marcar 1 alumno." : `Faltan marcar ${faltan} alumnos.`}
        </p>
      )}

      {guardado.status === "error" && (
        <p role="alert" className="text-sm text-rojo">
          {guardado.message}
        </p>
      )}

      {/* En celular queda fijo abajo, encima del menú inferior */}
      <div className="sticky bottom-20 md:bottom-4">
        <button
          type="button"
          onClick={guardar}
          disabled={!puedeGuardar}
          className="w-full rounded-full bg-accent px-6 py-3 font-semibold text-ink shadow-[0_8px_20px_rgba(255,191,67,0.4)] transition hover:brightness-95 disabled:opacity-50 md:w-auto"
        >
          {guardando ? "Guardando..." : "Guardar asistencia"}
        </button>
      </div>

      {guardado.status === "saved" && (
        <Toast tipo="exito" onCerrar={() => setGuardado({ status: "idle" })}>
          ¡Listo! La asistencia se guardó.
        </Toast>
      )}
    </div>
  );
}
