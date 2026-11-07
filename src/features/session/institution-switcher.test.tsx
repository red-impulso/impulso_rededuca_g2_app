// @vitest-environment jsdom
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EscuelasSelector } from './escuelas-selector';
import { InstitutionSwitcher } from './institution-switcher';
import { useSession } from './use-session';

vi.mock('./use-session', () => ({ useSession: vi.fn() }));

const push = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}));

const mockSession = vi.mocked(useSession);
const cambiarInstitucion = vi.fn();
const reintentar = vi.fn();

const dosEscuelas = [
  { id: 'a', name: 'Escuela N° 12' },
  { id: 'b', name: 'Escuela N° 8' },
];

function sesion(instituciones = dosEscuelas) {
  mockSession.mockReturnValue({
    status: 'ready',
    profile: { id: 'u1', fullName: 'Laura Gómez', phone: null },
    memberships: [],
    instituciones,
    activeMembership: instituciones[0]
      ? { id: 'm1', institutionId: instituciones[0].id, institutionName: instituciones[0].name, role: 'admin' }
      : null,
    cambiarInstitucion,
    reintentar,
  });
}

const selector = () => screen.getByRole('combobox', { name: 'Escuela activa' }) as HTMLSelectElement;

describe('InstitutionSwitcher', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  afterEach(cleanup);

  it('con una sola escuela no aparece', () => {
    sesion([dosEscuelas[0]]);
    render(<InstitutionSwitcher />);

    expect(screen.queryByRole('combobox')).toBeNull();
  });

  it('con varias escuelas muestra la activa', () => {
    sesion();
    render(<InstitutionSwitcher />);

    expect(selector().value).toBe('a');
    expect(screen.getByRole('option', { name: 'Escuela N° 8' })).toBeTruthy();
  });

  it('al cambiar de escuela la activa y vuelve al inicio', async () => {
    sesion();
    render(<InstitutionSwitcher />);

    await userEvent.selectOptions(selector(), 'b');

    expect(cambiarInstitucion).toHaveBeenCalledWith('b');
    expect(push).toHaveBeenCalledWith('/inicio');
  });
});

describe('EscuelasSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  afterEach(cleanup);

  it('mientras carga lo dice', () => {
    mockSession.mockReturnValue({ status: 'loading' });
    render(<EscuelasSelector />);

    expect(screen.getByRole('heading', { name: 'Cargando escuelas...' })).toBeTruthy();
  });

  it('si no se pudieron cargar deja reintentar', async () => {
    mockSession.mockReturnValue({ status: 'error', reintentar });
    render(<EscuelasSelector />);

    expect(screen.getByRole('heading', { name: 'No se pudieron cargar las escuelas' })).toBeTruthy();
    expect(screen.getByText('Revisá la conexión a Internet e intentá de nuevo.')).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(reintentar).toHaveBeenCalled();
  });

  it('sin escuelas avisa a quién consultar', async () => {
    sesion([]);
    render(<EscuelasSelector />);

    expect(screen.getByRole('heading', { name: 'No hay escuelas disponibles' })).toBeTruthy();
    expect(screen.getByText('Contactate con el administrador del sistema.')).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(reintentar).toHaveBeenCalled();
  });

  it('al elegir una escuela la activa y confirma', async () => {
    sesion();
    render(<EscuelasSelector />);

    await userEvent.selectOptions(selector(), 'b');

    expect(cambiarInstitucion).toHaveBeenCalledWith('b');
    expect(screen.getByRole('status').textContent).toContain('Escuela seleccionada correctamente');
    await userEvent.click(screen.getByRole('button', { name: 'Cerrar aviso' }));
    expect(screen.queryByRole('status')).toBeNull();
  });
});
