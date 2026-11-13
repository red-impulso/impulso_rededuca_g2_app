import { AuthApiError, AuthRetryableFetchError, AuthSessionMissingError } from '@supabase/supabase-js';
import { NextRequest } from 'next/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { proxy } from './proxy';

const getUser = vi.fn();
const signOut = vi.fn().mockResolvedValue({ error: null });

vi.mock('@supabase/ssr', () => ({
  createServerClient: () => ({ auth: { getUser, signOut } }),
}));

vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'http://supabase.test');
vi.stubEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', 'clave-de-prueba');

const pedir = (ruta: string) => proxy(new NextRequest(`http://localhost:3000${ruta}`));
const destino = (response: Response) => response.headers.get('location');

describe('proxy', () => {
  afterEach(() => getUser.mockReset());

  it('sin sesión manda a /ingresar', async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: new AuthSessionMissingError() });

    expect(destino(await pedir('/inicio'))).toBe('http://localhost:3000/ingresar');
  });

  it('la portada es pública: sin sesión deja pasar', async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: new AuthSessionMissingError() });

    expect(destino(await pedir('/'))).toBeNull();
  });

  it('con sesión deja pasar', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null });

    expect(destino(await pedir('/inicio'))).toBeNull();
  });

  it('si falla la conexión con Supabase no saca al usuario de la página', async () => {
    getUser.mockResolvedValue({
      data: { user: null },
      error: new AuthRetryableFetchError('fetch failed', 0),
    });

    expect(destino(await pedir('/calificaciones'))).toBeNull();
  });

  it('refresh token inválido: limpia la sesión y manda a /ingresar', async () => {
    getUser.mockRejectedValue(new AuthApiError('Invalid Refresh Token', 400, 'refresh_token_not_found'));

    expect(destino(await pedir('/inicio'))).toBe('http://localhost:3000/ingresar');
    expect(signOut).toHaveBeenCalledWith({ scope: 'local' });
  });

  it('refresh token inválido en la portada: deja pasar y limpia', async () => {
    getUser.mockRejectedValue(new AuthApiError('Invalid Refresh Token', 400, 'refresh_token_not_found'));

    expect(destino(await pedir('/'))).toBeNull();
    expect(signOut).toHaveBeenCalledWith({ scope: 'local' });
  });

  it('si falla la conexión en /ingresar, se queda ahí', async () => {
    getUser.mockResolvedValue({
      data: { user: null },
      error: new AuthRetryableFetchError('fetch failed', 0),
    });

    expect(destino(await pedir('/ingresar'))).toBeNull();
  });
});
