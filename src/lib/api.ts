import { crearClienteSupabase } from "./supabase/client";

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

type ApiFetchOptions = RequestInit & {
  // Escuela activa: la API la pide en el header X-Institution-Id.
  institutionId?: string;
};

// NestJS manda { message } como texto o como lista. Un error 5xx no explica
// nada útil para quien usa la página, así que ahí va un texto propio.
async function leerMensajeDeError(response: Response, path: string): Promise<string> {
  if (response.status >= 500) {
    return "Hubo un problema en el servidor. Probá de nuevo en un rato.";
  }
  const body = (await response.json().catch(() => null)) as { message?: string | string[] } | null;
  const message = Array.isArray(body?.message) ? body.message.join(". ") : body?.message;
  return message || `La API respondió ${response.status} en ${path}`;
}

// Llama a la API de RedEduca agregando el token de Supabase
// (Authorization: Bearer ...) y, si se pasa, la escuela activa.
export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!baseUrl) {
    throw new Error("Falta NEXT_PUBLIC_API_URL (ver .env.example)");
  }

  const { institutionId, headers, ...rest } = options;
  const { data } = await crearClienteSupabase().auth.getSession();

  const finalHeaders = new Headers(headers);
  if (data.session) {
    finalHeaders.set("Authorization", `Bearer ${data.session.access_token}`);
  }
  if (institutionId) {
    finalHeaders.set("X-Institution-Id", institutionId);
  }

  const response = await fetch(`${baseUrl}${path}`, { ...rest, headers: finalHeaders });
  if (!response.ok) {
    throw new ApiError(response.status, await leerMensajeDeError(response, path));
  }
  return (await response.json()) as T;
}
