// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useSession } from '../../features/session/use-session';
import { PanelNav } from './panel-nav';

vi.mock('../../features/session/use-session', () => ({ useSession: vi.fn() }));
vi.mock('../../lib/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../lib/api')>()),
  apiFetch: vi.fn(async () => ({ count: 0 })),
}));

const push = vi.fn();
let pathname = '/inicio';
vi.mock('next/navigation', () => ({
  usePathname: () => pathname,
  useRouter: () => ({ push, replace: vi.fn(), refresh: vi.fn() }),
}));

const mockSession = vi.mocked(useSession);

function sesion(role: string) {
  mockSession.mockReturnValue({
    status: 'ready',
    profile: { id: 'u1', fullName: 'Laura Gómez', phone: null },
    memberships: [],
    activeMembership: { id: 'm1', institutionId: 'esc-1', institutionName: 'Escuela', role },
  } as ReturnType<typeof useSession>);
}

const lateral = () => within(screen.getByRole('navigation', { name: 'Menú principal' }));
const inferior = () => within(screen.getByRole('navigation', { name: 'Menú inferior' }));

describe('PanelNav', () => {
  beforeEach(() => {
    push.mockReset();
    pathname = '/inicio';
  });
  afterEach(cleanup);

  it('la barra lateral y la inferior muestran los ítems del rol', () => {
    sesion('admin');
    render(<PanelNav>contenido</PanelNav>);

    expect(lateral().getByRole('link', { name: 'Dirección' }).getAttribute('href')).toBe('/tablero');
    expect(inferior().getByRole('link', { name: 'Institución' }).getAttribute('href')).toBe('/institucion');
    expect(lateral().queryByRole('link', { name: 'Mis hijos' })).toBeNull();
    expect(screen.getByText('contenido')).toBeTruthy();
  });

  it('marca la sección actual, también en sus subpáginas', () => {
    sesion('admin');
    pathname = '/institucion/cursos';
    render(<PanelNav>contenido</PanelNav>);

    expect(lateral().getByRole('link', { name: 'Institución' }).getAttribute('aria-current')).toBe('page');
    expect(lateral().getByRole('link', { name: 'Inicio' }).getAttribute('aria-current')).toBeNull();
  });

  it('muestra las iniciales y el rol, y el menú del usuario tiene Salir', async () => {
    sesion('teacher');
    render(<PanelNav>contenido</PanelNav>);

    const usuario = screen.getByRole('button', { name: 'Menú de Laura Gómez' });
    expect(usuario.textContent).toContain('LG');
    expect(usuario.textContent).toContain('Docente');
    expect(screen.queryByRole('button', { name: 'Salir' })).toBeNull();

    await userEvent.click(usuario);

    expect(screen.getByRole('button', { name: 'Salir' })).toBeTruthy();
  });

  it('el botón de menú abre y cierra la barra lateral en el celular', async () => {
    sesion('admin');
    render(<PanelNav>contenido</PanelNav>);

    const boton = screen.getByRole('button', { name: 'Abrir menú' });
    expect(boton.getAttribute('aria-expanded')).toBe('false');

    await userEvent.click(boton);

    expect(screen.getByRole('button', { name: 'Cerrar menú' }).getAttribute('aria-expanded')).toBe('true');
  });

  it('el buscador encuentra secciones y Enter lleva a la primera', async () => {
    sesion('admin');
    render(<PanelNav>contenido</PanelNav>);

    await userEvent.type(screen.getByRole('searchbox', { name: 'Buscar en la plataforma' }), 'asist');

    const resultados = within(screen.getByRole('list', { name: 'Resultados de la búsqueda' }));
    expect(resultados.getByRole('link', { name: 'Asistencia' })).toBeTruthy();
    expect(resultados.queryByRole('link', { name: 'Inicio' })).toBeNull();

    await userEvent.keyboard('{Enter}');

    expect(push).toHaveBeenCalledWith('/asistencia');
  });

  it('una búsqueda sin resultados lo dice', async () => {
    sesion('admin');
    render(<PanelNav>contenido</PanelNav>);

    await userEvent.type(screen.getByRole('searchbox', { name: 'Buscar en la plataforma' }), 'zzz');

    expect(screen.getByText('No se encontró ninguna sección.')).toBeTruthy();
  });

  it('mientras carga la sesión no muestra ítems ni usuario', () => {
    mockSession.mockReturnValue({ status: 'loading' });
    render(<PanelNav>contenido</PanelNav>);

    expect(lateral().queryByRole('link')).toBeNull();
    expect(screen.queryByRole('button', { name: /Menú de/ })).toBeNull();
    expect(screen.getByText('contenido')).toBeTruthy();
  });
});
