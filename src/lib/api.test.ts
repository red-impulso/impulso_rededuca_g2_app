import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, apiFetch } from './api';

vi.mock('./supabase/client', () => ({
  crearClienteSupabase: () => ({
    auth: { getSession: async () => ({ data: { session: null } }) },
  }),
}));

function respuesta(status: number, body: unknown) {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response(JSON.stringify(body), { status }))
  );
}

describe('apiFetch', () => {
  vi.stubEnv('NEXT_PUBLIC_API_URL', 'http://api.test');
  afterEach(() => vi.unstubAllGlobals());

  it('el error trae el mensaje que mandó la API', async () => {
    respuesta(400, { statusCode: 400, message: 'Falta elegir la materia y el período' });

    const error = (await apiFetch('/grades').catch((e: unknown) => e)) as ApiError;

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(400);
    expect(error.message).toBe('Falta elegir la materia y el período');
  });

  it('si el mensaje es una lista, los une', async () => {
    respuesta(400, { message: ['uno', 'dos'] });

    await expect(apiFetch('/x')).rejects.toThrow('uno. dos');
  });

  it('un error 500 no muestra el texto técnico', async () => {
    respuesta(500, { message: 'Internal server error' });

    await expect(apiFetch('/x')).rejects.toThrow(
      'Hubo un problema en el servidor. Probá de nuevo en un rato.'
    );
  });
});
