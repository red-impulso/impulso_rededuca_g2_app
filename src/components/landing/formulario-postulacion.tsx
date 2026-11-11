"use client";

import { useState, type FormEvent } from "react";
import { Alerta } from "../ui/alerta";

// Formulario público "Postulá a tu institución para el piloto" (prototipo
// de la landing). Manda la postulación a POST /leads de la API; los campos
// coinciden con el tipo Postulacion de features/leads/leads.ts.
// Estilo: brief de la landing (borde #D8D8D8, foco teal, asteriscos naranja).

const CLASE_CAMPO =
  "w-full rounded-lg border border-lnd-border bg-white px-3 py-2 text-sm text-lnd-text transition placeholder:text-lnd-muted/60 focus:border-lnd-secondary focus:outline-none focus:ring-2 focus:ring-lnd-secondary/25";

function Etiqueta({ texto, obligatorio }: { texto: string; obligatorio?: boolean }) {
  return (
    <span className="text-sm font-medium text-lnd-text">
      {texto}
      {obligatorio && (
        <span aria-hidden className="ml-0.5 text-lnd-accent-dark">
          (*)
        </span>
      )}
    </span>
  );
}

export function FormularioPostulacion() {
  const [enviando, setEnviando] = useState(false);
  const [aviso, setAviso] = useState<{ tipo: "exito" | "error"; texto: string } | null>(null);

  async function enviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const datos = new FormData(form);
    setEnviando(true);
    setAviso(null);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!baseUrl) throw new Error("sin api");

      const response = await fetch(`${baseUrl}/leads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          institutionName: String(datos.get("institucion") ?? ""),
          institutionType: String(datos.get("tipo") ?? ""),
          city: `${datos.get("localidad") ?? ""}, ${datos.get("provincia") ?? ""}`,
          contactName: String(datos.get("contacto") ?? ""),
          phone: String(datos.get("telefono") ?? ""),
          email: String(datos.get("correo") ?? ""),
          comment: String(datos.get("mensaje") ?? "") || null,
        }),
      });
      if (!response.ok) throw new Error("api");

      form.reset();
      setAviso({ tipo: "exito", texto: "¡Listo! Recibimos tu postulación. Te vamos a contactar pronto." });
    } catch {
      setAviso({ tipo: "error", texto: "No se pudo enviar la postulación. Probá de nuevo en un rato." });
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form
      onSubmit={enviar}
      className="flex flex-col gap-4 rounded-2xl border border-lnd-border bg-white p-6 shadow-[0_8px_30px_rgba(10,61,98,0.10)]"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 sm:col-span-2">
          <Etiqueta texto="Nombre de la institución" obligatorio />
          <input name="institucion" required placeholder="Ej.: Escuela Nº 12" className={CLASE_CAMPO} />
        </label>
        <label className="flex flex-col gap-1">
          <Etiqueta texto="Tipo de institución" obligatorio />
          <select name="tipo" required className={CLASE_CAMPO} defaultValue="">
            <option value="" disabled>
              Elegí una opción
            </option>
            <option value="primaria">Primaria</option>
            <option value="secundaria">Secundaria</option>
            <option value="terciaria">Terciaria</option>
            <option value="otra">Otra</option>
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <Etiqueta texto="Teléfono de contacto" />
          <input name="telefono" type="tel" placeholder="Ej.: 388 400-0000" className={CLASE_CAMPO} />
        </label>
        <label className="flex flex-col gap-1">
          <Etiqueta texto="Localidad" obligatorio />
          <input name="localidad" required placeholder="Ej.: Perico" className={CLASE_CAMPO} />
        </label>
        <label className="flex flex-col gap-1">
          <Etiqueta texto="Provincia" obligatorio />
          <input name="provincia" required placeholder="Ej.: Jujuy" className={CLASE_CAMPO} />
        </label>
        <label className="flex flex-col gap-1">
          <Etiqueta texto="Nombre del contacto" obligatorio />
          <input name="contacto" required placeholder="Ej.: María Gómez, directiva" className={CLASE_CAMPO} />
        </label>
        <label className="flex flex-col gap-1">
          <Etiqueta texto="Correo de contacto" obligatorio />
          <input name="correo" type="email" required placeholder="Ej.: contacto@escuela.edu.ar" className={CLASE_CAMPO} />
        </label>
        <label className="flex flex-col gap-1 sm:col-span-2">
          <Etiqueta texto="Mensaje / consulta (opcional)" />
          <textarea name="mensaje" rows={4} placeholder="Contanos qué necesita tu institución." className={CLASE_CAMPO} />
        </label>
      </div>

      {aviso && <Alerta tipo={aviso.tipo}>{aviso.texto}</Alerta>}

      <button
        type="submit"
        disabled={enviando}
        className="cta-landing mt-1 rounded-xl px-6 py-3 font-semibold text-white shadow-[0_4px_14px_rgba(255,144,40,0.35)] transition hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(255,144,40,0.4)] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {enviando ? "Enviando..." : "Enviar postulación"}
      </button>
    </form>
  );
}
