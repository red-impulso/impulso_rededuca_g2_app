"use client";

import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";

const institutionTypes = [
  "Institución educativa pública",
  "Institución educativa privada",
  "Institución de gestión social o cooperativa",
  "Otra",
];

const requiredMessages: Record<string, string> = {
  institucion: "El nombre de la institución es obligatorio.",
  tipo: "Seleccioná el tipo de institución.",
  localidad: "La localidad es obligatoria.",
  alumnos: "La cantidad de estudiantes es obligatoria.",
  referente: "El nombre de contacto es obligatorio.",
  telefono: "El teléfono es obligatorio.",
  correo: "El correo de contacto es obligatorio.",
};

const MAX_ALUMNOS = 100000;

// La API de Render gratis se duerme: el primer envío puede tardar un minuto.
const TIEMPO_MAXIMO_MS = 90000;

const MENSAJE_FALLA =
  "No pudimos enviar tu postulación. Tus datos siguen en pantalla: probá de nuevo en un rato.";

const namePattern = /^[\p{L}\s.'-]+$/u;
const institutionPattern = /^[\p{L}\d\s.,'&()°ºª-]+$/u;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const phonePattern = /^\+?[\d\s()-]+$/;

type EstadoFormulario = "empty" | "error" | "sending" | "failed" | "sent";

interface Campo {
  name: string;
  value: string;
  required: boolean;
}

function getError(field: Campo): string {
  const value = field.value.trim();
  const { name, required } = field;

  if (!value)
    return required ? requiredMessages[name] ?? "Este campo es obligatorio." : "";

  if (name === "institucion" && !institutionPattern.test(value)) {
    return "El nombre contiene caracteres no válidos.";
  }
  if ((name === "localidad" || name === "referente") && !namePattern.test(value)) {
    return "Usá solo letras, sin números ni símbolos.";
  }
  if (name === "alumnos") {
    if (!/^\d+$/.test(value) || Number(value) < 1) {
      return "Ingresá un número entero mayor que 0.";
    }
    if (Number(value) > MAX_ALUMNOS) {
      return "Ingresá un número entre 1 y 100000.";
    }
  }
  if (name === "telefono") {
    const digits = value.replace(/\D/g, "");
    if (!phonePattern.test(value) || digits.length < 8 || digits.length > 15) {
      return "Ingresá un teléfono válido, solo números (entre 8 y 15 dígitos).";
    }
  }
  if (name === "correo" && !emailPattern.test(value)) {
    return "Ingresá un correo válido, por ejemplo nombre@dominio.com.";
  }

  return "";
}

function campo(
  form: HTMLFormElement,
  name: string,
): HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null {
  const el = form.elements.namedItem(name);
  if (
    el instanceof HTMLInputElement ||
    el instanceof HTMLSelectElement ||
    el instanceof HTMLTextAreaElement
  ) {
    return el;
  }
  return null;
}

// Los nombres de los campos del formulario, traducidos a los de POST /leads.
function datosParaLaApi(form: HTMLFormElement) {
  const valor = (name: string) => campo(form, name)?.value.trim() ?? "";

  return {
    institutionName: valor("institucion"),
    institutionType: valor("tipo"),
    city: valor("localidad"),
    studentCount: Number(valor("alumnos")),
    contactName: valor("referente"),
    phone: valor("telefono"),
    email: valor("correo"),
    comment: valor("mensaje"),
    website: campo(form, "website")?.value ?? "",
  };
}

// Un 400 trae el motivo; cualquier otra falla usa el mensaje general.
async function motivoDelRechazo(response: Response): Promise<string> {
  if (response.status !== 400) return MENSAJE_FALLA;

  const body = (await response.json().catch(() => null)) as {
    message?: string | string[];
  } | null;
  const message = Array.isArray(body?.message)
    ? body.message.join(". ")
    : body?.message;
  return message || MENSAJE_FALLA;
}

async function enviarPostulacion(datos: ReturnType<typeof datosParaLaApi>) {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!apiUrl) return MENSAJE_FALLA;

  try {
    const response = await fetch(`${apiUrl}/leads`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datos),
      signal: AbortSignal.timeout(TIEMPO_MAXIMO_MS),
    });
    return response.ok ? null : await motivoDelRechazo(response);
  } catch {
    // Sin conexión, o la API no respondió a tiempo.
    return MENSAJE_FALLA;
  }
}

function Field({
  name,
  label,
  required,
  optional,
  wide,
  error,
  children,
}: {
  name: string;
  label: string;
  required?: boolean;
  optional?: boolean;
  wide?: boolean;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className={wide ? "field-wide" : undefined}>
      {label}{" "}
      {required && <span aria-hidden="true">*</span>}
      {optional && <small>(opcional)</small>}
      {children}
      {error ? (
        <em className="field-error" id={`${name}-error`}>
          {error}
        </em>
      ) : (
        <em
          className={`field-hint${required ? " field-hint-required" : ""}`}
          id={`${name}-hint`}
        >
          {required ? "Campo obligatorio" : "Campo opcional"}
        </em>
      )}
    </label>
  );
}

export function PilotForm() {
  const [status, setStatus] = useState<EstadoFormulario>("empty");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [failure, setFailure] = useState("");
  const submitting = useRef(false);
  const failureRef = useRef<HTMLParagraphElement>(null);
  const successRef = useRef<HTMLHeadingElement>(null);

  // El resultado del envío recibe el foco para que se lea enseguida.
  useEffect(() => {
    if (status === "failed") failureRef.current?.focus();
    if (status === "sent") successRef.current?.focus();
  }, [status]);

  function fieldProps(name: string, required = false) {
    return {
      name,
      required,
      "aria-required": required || undefined,
      "aria-invalid": errors[name] ? true : undefined,
      "aria-describedby": errors[name] ? `${name}-error` : `${name}-hint`,
    };
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submitting.current) return;

    const form = event.currentTarget;
    const nextErrors: Record<string, string> = {};

    Array.from(form.elements).forEach((el) => {
      if (
        !(
          el instanceof HTMLInputElement ||
          el instanceof HTMLSelectElement ||
          el instanceof HTMLTextAreaElement
        ) ||
        !el.name
      ) {
        return;
      }

      const message = getError(el);
      if (message) nextErrors[el.name] = message;
    });

    setErrors(nextErrors);

    const primerError = Object.keys(nextErrors)[0];
    if (primerError) {
      setStatus("error");
      campo(form, primerError)?.focus();
      return;
    }

    submitting.current = true;
    setStatus("sending");
    const motivo = await enviarPostulacion(datosParaLaApi(form));
    submitting.current = false;

    if (motivo) {
      setFailure(motivo);
      setStatus("failed");
    } else {
      setStatus("sent");
    }
  }

  function handleChange(event: FormEvent<HTMLFormElement>) {
    const field = event.target;

    if (
      !(
        field instanceof HTMLInputElement ||
        field instanceof HTMLSelectElement ||
        field instanceof HTMLTextAreaElement
      ) ||
      !field.name ||
      !errors[field.name]
    ) {
      return;
    }

    const message = getError(field);
    const nextErrors = { ...errors };

    if (message) {
      nextErrors[field.name] = message;
    } else {
      delete nextErrors[field.name];
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length === 0) {
      setStatus("empty");
    }
  }

  if (status === "sent") {
    return (
      <div className="form-success" aria-live="polite">
        <span className="success-mark" aria-hidden="true">✓</span>
        <h2 ref={successRef} tabIndex={-1}>
          ¡Gracias por postular a tu institución!
        </h2>
        <p>
          Recibimos tus datos. Nos vamos a poner en contacto para conocer las
          necesidades de tu comunidad.
        </p>
        <button
          className="form-reset-button"
          type="button"
          onClick={() => setStatus("empty")}
        >
          Completar otra postulación
        </button>
      </div>
    );
  }

  return (
    <form
      className="pilot-form"
      onSubmit={handleSubmit}
      onChange={handleChange}
      noValidate
      aria-busy={status === "sending"}
    >
      {status === "error" && (
        <p className="form-feedback form-feedback-error field-wide" role="alert">
          <span aria-hidden="true">!</span>
          Revisá los campos marcados: faltan datos obligatorios o tienen un
          formato incorrecto.
        </p>
      )}
      {status === "failed" && (
        <p
          ref={failureRef}
          tabIndex={-1}
          className="form-feedback form-feedback-error field-wide"
          role="alert"
        >
          <span aria-hidden="true">!</span>
          {failure}
        </p>
      )}
      <Field name="institucion" label="Nombre de la institución" required error={errors.institucion}>
        <input type="text" autoComplete="organization" maxLength={120} {...fieldProps("institucion", true)} />
      </Field>
      <Field name="tipo" label="Tipo de institución" required error={errors.tipo}>
        <select defaultValue="" {...fieldProps("tipo", true)}>
          <option value="" disabled>Seleccioná una opción</option>
          {institutionTypes.map((type) => (
            <option key={type}>{type}</option>
          ))}
        </select>
      </Field>
      <Field name="localidad" label="Localidad" required error={errors.localidad}>
        <input type="text" autoComplete="address-level2" maxLength={100} {...fieldProps("localidad", true)} />
      </Field>
      <Field name="alumnos" label="Cantidad de estudiantes" required error={errors.alumnos}>
        <input
          type="number"
          min="1"
          max={MAX_ALUMNOS}
          inputMode="numeric"
          placeholder="Ej.: 450"
          {...fieldProps("alumnos", true)}
        />
      </Field>
      <Field name="referente" label="Nombre de contacto" required error={errors.referente}>
        <input type="text" autoComplete="name" maxLength={100} {...fieldProps("referente", true)} />
      </Field>
      <Field name="telefono" label="Teléfono / WhatsApp" required error={errors.telefono}>
        <input type="tel" autoComplete="tel" maxLength={30} {...fieldProps("telefono", true)} />
      </Field>
      <Field name="correo" label="Correo de contacto" required error={errors.correo}>
        <input type="email" autoComplete="email" maxLength={254} {...fieldProps("correo", true)} />
      </Field>
      <Field name="mensaje" label="Mensaje o consulta" optional wide error={errors.mensaje}>
        <textarea
          rows={3}
          maxLength={600}
          placeholder="¿Qué desafío les gustaría abordar?"
          {...fieldProps("mensaje")}
        />
      </Field>
      {/* Trampa para robots: una persona no lo ve ni llega con el teclado. */}
      <input
        className="form-trap"
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        defaultValue=""
      />
      <button
        className="primary-button field-wide"
        type="submit"
        disabled={status === "sending"}
      >
        {status === "sending" ? (
          <>
            <span className="form-spinner" aria-hidden="true" />
            Enviando...
          </>
        ) : (
          "Enviar postulación"
        )}
      </button>
      {status === "sending" && (
        <p className="form-feedback form-feedback-sending field-wide" role="status">
          Puede tardar hasta un minuto.
        </p>
      )}
      <p className="form-note field-wide">
        No incluyas datos personales ni información sensible de estudiantes.
      </p>
    </form>
  );
}
