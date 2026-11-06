// @vitest-environment jsdom
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiError, apiFetch } from '../../lib/api';
import { ChildrenList } from './children-list';

vi.mock('../../lib/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../lib/api')>()),
  apiFetch: vi.fn(),
}));

const mockApi = vi.mocked(apiFetch);

const hijos = [
  { id: 'a1', firstName: 'Ana', lastName: 'Pérez', course: { id: 'c1', year: 1, division: 'A' } },
  { id: 'a2', firstName: 'Beto', lastName: 'Ruiz', course: { id: 'c2', year: 2, division: 'B' } },
];

const nota = (materia: string, value: number) => ({
  subject: { id: materia, name: materia },
  period: { id: 'p1', name: '1.er trimestre' },
  value,
});

function apiResponde(respuestas: Record<string, unknown>) {
  const responder = async (ruta: string) => {
    if (!(ruta in respuestas)) throw new Error(`sin respuesta para ${ruta}`);
    const respuesta = respuestas[ruta];
    if (respuesta instanceof Error) throw respuesta;
    return respuesta;
  };
  mockApi.mockImplementation(responder as unknown as typeof apiFetch);
}

const sinDatos = {
  '/students/a1/grades': [],
  '/students/a1/attendance': { records: [], summary: { percentage: null } },
  '/students/a2/grades': [],
  '/students/a2/attendance': { records: [], summary: { percentage: null } },
};

describe('ChildrenList', () => {
  beforeEach(() => {
    mockApi.mockReset();
  });
  afterEach(cleanup);

  it('muestra cada hijo con su curso y enlaza a sus notas', async () => {
    apiResponde({ '/me/students': hijos, ...sinDatos });

    render(<ChildrenList institutionId="esc-1" />);

    const ana = await screen.findByRole('link', { name: /Ana Pérez/ });
    expect(ana.getAttribute('href')).toBe('/hijos/a1/notas');
    expect(ana.textContent).toContain('1°A');
    expect(screen.getByRole('link', { name: /Beto Ruiz/ }).getAttribute('href')).toBe('/hijos/a2/notas');
    expect(mockApi).toHaveBeenCalledWith('/me/students', { institutionId: 'esc-1' });
  });

  it('muestra iniciales, últimas notas, promedio y asistencia de cada hijo', async () => {
    apiResponde({
      '/me/students': hijos,
      ...sinDatos,
      '/students/a1/grades': [nota('Matemática', 6.5), nota('Lengua', 8), nota('Historia', 9), nota('Arte', 10)],
      '/students/a1/attendance': { records: [], summary: { percentage: 90.5 } },
    });

    render(<ChildrenList institutionId="esc-1" />);

    const ana = within(await screen.findByRole('link', { name: /Ana Pérez/ }));
    expect(ana.getByText('AP')).toBeTruthy();
    expect(await ana.findByText('Mat')).toBeTruthy();
    expect(ana.getByText('6,5')).toBeTruthy();
    expect(ana.getByText('Len')).toBeTruthy();
    expect(ana.getByText('His')).toBeTruthy();
    expect(ana.queryByText('Art')).toBeNull();
    expect(ana.getByText('8,38')).toBeTruthy();
    expect(ana.getByText('90,5 %')).toBeTruthy();
  });

  it('sin notas ni asistencia lo dice, sin inventar datos', async () => {
    apiResponde({ '/me/students': [hijos[0]], ...sinDatos });

    render(<ChildrenList institutionId="esc-1" />);

    expect(await screen.findByText('Todavía sin notas')).toBeTruthy();
    expect(screen.getAllByText('—')).toHaveLength(2);
  });

  it('si falla el resumen de un hijo igual se ve la tarjeta', async () => {
    apiResponde({
      '/me/students': [hijos[0]],
      '/students/a1/grades': new ApiError(500, 'Hubo un problema'),
      '/students/a1/attendance': new ApiError(500, 'Hubo un problema'),
    });

    render(<ChildrenList institutionId="esc-1" />);

    expect(await screen.findByRole('link', { name: /Ana Pérez/ })).toBeTruthy();
    expect(await screen.findByText('Resumen no disponible')).toBeTruthy();
  });

  it('avisa si no tiene hijos y explica que los vincula la escuela', async () => {
    apiResponde({ '/me/students': [] });

    render(<ChildrenList institutionId="esc-1" />);

    expect(await screen.findByRole('heading', { name: 'Aún no hay hijos vinculados' })).toBeTruthy();
    expect(screen.getByText(/la escuela/)).toBeTruthy();
  });

  it('si falla muestra el error y Reintentar vuelve a pedir la lista', async () => {
    apiResponde({ '/me/students': new ApiError(500, 'Hubo un problema en el servidor.') });

    render(<ChildrenList institutionId="esc-1" />);

    expect(await screen.findByRole('heading', { name: 'Error al cargar los hijos' })).toBeTruthy();
    expect(screen.getByRole('alert').textContent).toContain('Hubo un problema en el servidor.');

    apiResponde({ '/me/students': hijos, ...sinDatos });
    await userEvent.click(screen.getByRole('button', { name: 'Reintentar' }));

    expect(await screen.findByRole('link', { name: /Ana Pérez/ })).toBeTruthy();
    expect(screen.queryByRole('alert')).toBeNull();
  });
});
