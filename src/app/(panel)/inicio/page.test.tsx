// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useSession } from '../../../features/session/use-session';
import { apiFetch } from '../../../lib/api';
import InicioPage from './page';

vi.mock('../../../features/session/use-session', () => ({ useSession: vi.fn() }));
vi.mock('../../../lib/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../../lib/api')>()),
  apiFetch: vi.fn(),
}));

const mockSession = vi.mocked(useSession);
const mockApi = vi.mocked(apiFetch);

function sesion(role: string) {
  mockSession.mockReturnValue({
    status: 'ready',
    profile: { id: 'u1', fullName: 'Laura Gómez', phone: null },
    memberships: [],
    instituciones: [{ id: 'esc-1', name: 'Escuela Demo' }],
    activeMembership: { id: 'm1', institutionId: 'esc-1', institutionName: 'Escuela Demo', role },
    cambiarInstitucion: vi.fn(),
    reintentar: vi.fn(),
  } as ReturnType<typeof useSession>);
}

function comunicado(n: number) {
  return {
    id: `a${n}`,
    scope: 'institution',
    courseLabel: null,
    title: `Comunicado ${n}`,
    body: 'Texto',
    createdAt: `2026-11-${10 + n}T12:00:00Z`,
    authorName: 'Natalia',
  };
}

const accesos = () => within(screen.getByRole('navigation', { name: 'Accesos directos' }));

describe('Inicio', () => {
  beforeEach(() => mockApi.mockReset());
  afterEach(cleanup);

  it('el docente ve tarjetas grandes a sus secciones, como el dashboard del informe', async () => {
    sesion('teacher');
    mockApi.mockResolvedValue([]);
    render(<InicioPage />);

    expect(screen.getByRole('heading', { name: 'Hola, Laura Gómez' })).toBeTruthy();
    const links = accesos().getAllByRole('link');
    expect(links.map((l) => l.textContent)).toEqual([
      expect.stringContaining('Comunicados'),
      expect.stringContaining('Calificaciones'),
      expect.stringContaining('Asistencia'),
    ]);
    expect(links.map((l) => l.getAttribute('href'))).toEqual(['/comunicados', '/calificaciones', '/asistencia']);
  });

  it('el tutor ve sus propias secciones', async () => {
    sesion('guardian');
    mockApi.mockResolvedValue([]);
    render(<InicioPage />);

    const hrefs = accesos()
      .getAllByRole('link')
      .map((l) => l.getAttribute('href'));
    expect(hrefs).toEqual(['/comunicados', '/hijos']);
  });

  it('muestra los 3 comunicados más recientes y un enlace a todos', async () => {
    sesion('teacher');
    mockApi.mockResolvedValue([comunicado(4), comunicado(3), comunicado(2), comunicado(1)]);
    render(<InicioPage />);

    const lista = await screen.findByRole('list', { name: 'Comunicados recientes' });
    expect(within(lista).getAllByRole('listitem').map((li) => li.querySelector('h3')?.textContent)).toEqual([
      'Comunicado 4',
      'Comunicado 3',
      'Comunicado 2',
    ]);
    expect(mockApi).toHaveBeenCalledWith('/announcements', { institutionId: 'esc-1' });
    expect(screen.getByRole('link', { name: 'Ver todos los comunicados' }).getAttribute('href')).toBe('/comunicados');
  });

  it('sin comunicados lo dice', async () => {
    sesion('teacher');
    mockApi.mockResolvedValue([]);
    render(<InicioPage />);

    expect(await screen.findByText('Todavía no hay comunicados.')).toBeTruthy();
  });

  it('si fallan los comunicados avisa y deja reintentar', async () => {
    sesion('teacher');
    mockApi.mockRejectedValueOnce(new Error('caída')).mockResolvedValueOnce([comunicado(1)]);
    render(<InicioPage />);

    expect(await screen.findByText('No pudimos cargar los comunicados.')).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    expect(await screen.findByText('Comunicado 1')).toBeTruthy();
  });
});
