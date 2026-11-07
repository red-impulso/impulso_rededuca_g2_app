// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { apiFetch } from '../../lib/api';
import { SessionProvider, type Membership } from './session-provider';
import { useSession } from './use-session';

vi.mock('../../lib/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../lib/api')>()),
  apiFetch: vi.fn(),
}));

const mockApi = vi.mocked(apiFetch);
const CLAVE = 'rededuca.institucion';

const membresia = (id: string, institutionId: string, role: Membership['role']): Membership => ({
  id,
  institutionId,
  institutionName: `Escuela ${institutionId}`,
  role,
});

function Mostrar() {
  const session = useSession();
  if (session.status === 'loading') return <p>cargando</p>;
  if (session.status === 'error') {
    return (
      <button type="button" onClick={session.reintentar}>
        reintentar
      </button>
    );
  }
  return (
    <>
      <p>activa: {session.activeMembership?.id ?? 'ninguna'}</p>
      <p>escuelas: {session.instituciones.map((escuela) => escuela.name).join(', ')}</p>
      <button type="button" onClick={() => session.cambiarInstitucion('b')}>
        cambiar
      </button>
    </>
  );
}

function abrir(memberships: Membership[]) {
  mockApi.mockResolvedValue({
    profile: { id: 'u1', fullName: 'Laura Gómez', phone: null },
    memberships,
  } as never);
  render(
    <SessionProvider>
      <Mostrar />
    </SessionProvider>
  );
}

describe('SessionProvider', () => {
  beforeEach(() => {
    mockApi.mockReset();
    window.localStorage.clear();
  });
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('sin nada guardado usa la primera escuela', async () => {
    abrir([membresia('m1', 'a', 'teacher'), membresia('m2', 'b', 'admin')]);

    expect(await screen.findByText('activa: m1')).toBeTruthy();
    expect(screen.getByText('escuelas: Escuela a, Escuela b')).toBeTruthy();
  });

  it('con dos roles en la misma escuela usa el de mayor rango y la lista una sola vez', async () => {
    abrir([membresia('m1', 'a', 'guardian'), membresia('m2', 'a', 'director')]);

    expect(await screen.findByText('activa: m2')).toBeTruthy();
    expect(screen.getByText('escuelas: Escuela a')).toBeTruthy();
  });

  it('recuerda la escuela elegida la vez anterior', async () => {
    window.localStorage.setItem(CLAVE, 'b');

    abrir([membresia('m1', 'a', 'teacher'), membresia('m2', 'b', 'admin')]);

    expect(await screen.findByText('activa: m2')).toBeTruthy();
  });

  it('si la escuela guardada ya no es suya usa la primera', async () => {
    window.localStorage.setItem(CLAVE, 'otra');

    abrir([membresia('m1', 'a', 'teacher')]);

    expect(await screen.findByText('activa: m1')).toBeTruthy();
  });

  it('cambiar de escuela cambia la membresía activa y la recuerda', async () => {
    abrir([membresia('m1', 'a', 'teacher'), membresia('m2', 'b', 'admin')]);
    await screen.findByText('activa: m1');

    await userEvent.click(screen.getByRole('button', { name: 'cambiar' }));

    expect(screen.getByText('activa: m2')).toBeTruthy();
    expect(window.localStorage.getItem(CLAVE)).toBe('b');
  });

  it('funciona aunque el navegador no deje guardar', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('bloqueado');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('bloqueado');
    });

    abrir([membresia('m1', 'a', 'teacher'), membresia('m2', 'b', 'admin')]);
    await screen.findByText('activa: m1');
    await userEvent.click(screen.getByRole('button', { name: 'cambiar' }));

    expect(screen.getByText('activa: m2')).toBeTruthy();
  });

  it('sin escuelas no hay membresía activa', async () => {
    abrir([]);

    expect(await screen.findByText('activa: ninguna')).toBeTruthy();
  });

  it('si falla, reintentar vuelve a pedir los datos', async () => {
    mockApi.mockRejectedValueOnce(new Error('caída'));
    render(
      <SessionProvider>
        <Mostrar />
      </SessionProvider>
    );
    const boton = await screen.findByRole('button', { name: 'reintentar' });
    mockApi.mockResolvedValue({
      profile: { id: 'u1', fullName: null, phone: null },
      memberships: [membresia('m1', 'a', 'teacher')],
    } as never);

    await userEvent.click(boton);

    expect(await screen.findByText('activa: m1')).toBeTruthy();
  });
});
